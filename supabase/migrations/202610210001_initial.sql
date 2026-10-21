-- Friendly Foodies V1 — PREMIERE MIGRATION DE DEVELOPPEMENT
-- A relire en revue de sécurité avant toute ouverture publique.
-- Choix provisoires : grades C=1/B=2/A=3/S=4 ; notes publiques = posts publics.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema extensions;

create type public.post_visibility as enum ('public', 'friends');
create type public.food_grade as enum ('C', 'B', 'A', 'S');
create type public.visit_precision as enum ('none', 'month', 'day');
create type public.friend_status as enum ('pending', 'accepted', 'declined');
create type public.reaction_kind as enum ('validate', 'not_for_me');
create type public.notification_kind as enum ('friend_request', 'reaction');
create type public.report_status as enum ('pending', 'reviewed', 'dismissed', 'removed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null check (handle ~ '^[A-Za-z0-9_]{3,24}$'),
  avatar_path text,
  handle_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create unique index profiles_handle_unique on public.profiles(lower(handle));

create function public.enforce_handle_cooldown()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.handle is distinct from old.handle and now() < old.handle_changed_at + interval '21 days' then
    raise exception 'Handle may be changed once every 21 days';
  end if;
  if new.handle is distinct from old.handle then
    new.handle_changed_at := now();
  else
    new.handle_changed_at := old.handle_changed_at;
  end if;
  return new;
end;
$$;
create trigger profiles_handle_cooldown before update on public.profiles
for each row execute function public.enforce_handle_cooldown();

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status public.friend_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> recipient_id)
);
-- Aucune seconde relation entre la même paire, même en inversant les IDs.
create unique index friend_pair_unique on public.friend_requests (
  least(requester_id, recipient_id), greatest(requester_id, recipient_id)
);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- N'expose pas arbitrairement l'amitié de deux tiers : l'appelant doit être membre de la paire.
create function public.are_friends(left_id uuid, right_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null
    and auth.uid() in (left_id, right_id)
    and exists (
      select 1 from public.friend_requests fr
      where fr.status = 'accepted' and
        ((fr.requester_id = left_id and fr.recipient_id = right_id)
         or (fr.requester_id = right_id and fr.recipient_id = left_id))
    )
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = left_id and b.blocked_id = right_id)
         or (b.blocker_id = right_id and b.blocked_id = left_id)
    );
$$;

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  description text,
  address text,
  longitude double precision not null check (longitude between -180 and 180),
  latitude double precision not null check (latitude between -90 and 90),
  location extensions.geography(point, 4326)
    generated always as (extensions.ST_SetSRID(extensions.ST_MakePoint(longitude, latitude), 4326)::extensions.geography) stored,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index places_location_gist on public.places using gist(location);
create index places_name_search on public.places using gin(to_tsvector('simple', name));

create table public.categories (
  id bigint generated always as identity primary key,
  name text not null unique
);
insert into public.categories(name) values
  ('Restaurant'),('Café'),('Boulangerie'),('Pâtisserie'),('Food truck'),
  ('Bar'),('Salon de thé'),('Marché alimentaire'),('Street-food'),('Autre');

create table public.place_categories (
  place_id uuid not null references public.places(id) on delete cascade,
  category_id bigint not null references public.categories(id),
  other_label text,
  primary key (place_id, category_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  content text not null default '' check (char_length(content) <= 5000),
  grade public.food_grade not null,
  visibility public.post_visibility not null default 'friends',
  visit_precision public.visit_precision not null default 'none',
  visit_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (visit_precision = 'none' and visit_date is null) or
    (visit_precision = 'month' and visit_date is not null and extract(day from visit_date) = 1) or
    (visit_precision = 'day' and visit_date is not null)
  )
);
create index posts_place_created on public.posts(place_id, created_at desc);
create index posts_author_created on public.posts(author_id, created_at desc);
create index posts_visibility_place on public.posts(visibility, place_id);

create function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger post_updated_at before update on public.posts
for each row execute function public.set_updated_at();

-- Fonction lisible par tous ; les relations d'amitié sont vérifiées côté serveur.
create function public.can_view_post(target_post_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.posts p
    where p.id = target_post_id
      and (p.visibility = 'public'
        or (auth.uid() is not null and (
            p.author_id = auth.uid() or public.are_friends(p.author_id, auth.uid())
        )))
  );
$$;

create table public.post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  position smallint not null check (position between 1 and 5),
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  unique(post_id, position)
);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  kind public.reaction_kind not null,
  created_at timestamptz not null default now(),
  unique(post_id, author_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  kind public.notification_kind not null,
  source_id uuid not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_recipient_created on public.notifications(recipient_id, created_at desc);

create table public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create function public.is_app_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.app_admins where user_id = auth.uid());
$$;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  post_id uuid references public.posts(id) on delete set null,
  reason text not null check (char_length(reason) between 3 and 100),
  details text check (char_length(details) <= 2000),
  status public.report_status not null default 'pending',
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.blocks enable row level security;
alter table public.places enable row level security;
alter table public.categories enable row level security;
alter table public.place_categories enable row level security;
alter table public.posts enable row level security;
alter table public.post_photos enable row level security;
alter table public.reactions enable row level security;
alter table public.notifications enable row level security;
alter table public.app_admins enable row level security;
alter table public.reports enable row level security;

create policy "Public profile fields readable" on public.profiles for select to anon,authenticated using (true);
create policy "Create own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "Update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Requests visible to participants" on public.friend_requests for select to authenticated
using (auth.uid() in (requester_id, recipient_id));
create policy "Member can request friendship" on public.friend_requests for insert to authenticated
with check (requester_id = auth.uid() and status = 'pending' and not exists (
  select 1 from public.blocks b where (b.blocker_id = requester_id and b.blocked_id = recipient_id)
                              or (b.blocker_id = recipient_id and b.blocked_id = requester_id)
));
-- Acceptation/refus via RPC, pas de mise à jour libre des colonnes.

create function public.respond_friend_request(request_id uuid, accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.friend_requests
  set status = case when accept then 'accepted'::public.friend_status else 'declined'::public.friend_status end,
      responded_at = now()
  where id = request_id and recipient_id = auth.uid() and status = 'pending';
  if not found then raise exception 'Request does not exist or is not yours'; end if;
end;
$$;
revoke all on function public.respond_friend_request(uuid,boolean) from public;
grant execute on function public.respond_friend_request(uuid,boolean) to authenticated;

create policy "My blocked list visible" on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy "Block member" on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "Unblock member" on public.blocks for delete to authenticated using (blocker_id = auth.uid());

create policy "Places public" on public.places for select to anon,authenticated using (true);
create policy "Signed-in members add places" on public.places for insert to authenticated with check (created_by = auth.uid());
create policy "Categories visible" on public.categories for select to anon,authenticated using (true);
create policy "Place categories visible" on public.place_categories for select to anon,authenticated using (true);
create policy "Author can assign categories" on public.place_categories for insert to authenticated with check (
  exists (select 1 from public.places p where p.id = place_id and p.created_by = auth.uid())
);

create policy "View public own or mutual friend posts" on public.posts for select to anon,authenticated
using (visibility = 'public' or (auth.uid() is not null and (author_id = auth.uid() or public.are_friends(author_id,auth.uid()))));
create policy "Write own posts" on public.posts for insert to authenticated with check (author_id = auth.uid());
create policy "Edit own posts" on public.posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "Delete own posts" on public.posts for delete to authenticated using (author_id = auth.uid());

create policy "Visible post photos" on public.post_photos for select to anon,authenticated
using (public.can_view_post(post_id));
create policy "Create own post photos" on public.post_photos for insert to authenticated
with check (exists(select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  and split_part(storage_path,'/',1) = auth.uid()::text);
create policy "Delete own post photos" on public.post_photos for delete to authenticated
using (exists(select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

create policy "Visible reactions" on public.reactions for select to anon,authenticated
using (public.can_view_post(post_id));
create policy "React once to accessible post" on public.reactions for insert to authenticated
with check (author_id = auth.uid() and public.can_view_post(post_id));
create policy "Change own reaction" on public.reactions for update to authenticated
using (author_id = auth.uid()) with check (author_id = auth.uid() and public.can_view_post(post_id));
create policy "Remove own reaction" on public.reactions for delete to authenticated using (author_id = auth.uid());

create policy "Recipient reads notifications" on public.notifications for select to authenticated using (recipient_id = auth.uid());
create policy "Recipient marks read" on public.notifications for update to authenticated
using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create policy "Admins can read membership" on public.app_admins for select to authenticated using (user_id = auth.uid());
create policy "Reporter sees own reports" on public.reports for select to authenticated
using (reporter_id = auth.uid() or public.is_app_admin());
create policy "Accessible post can be reported" on public.reports for insert to authenticated
with check (reporter_id = auth.uid() and post_id is not null and public.can_view_post(post_id)
 and status = 'pending' and handled_by is null and handled_at is null);
create policy "Admins can review reports" on public.reports for update to authenticated
using (public.is_app_admin()) with check (public.is_app_admin());

-- Notifications : aucun INSERT client. Uniquement les événements explicitement validés.
create function public.notify_friend_request()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'pending' then
    insert into public.notifications(recipient_id, actor_id, kind, source_id)
    values (new.recipient_id, new.requester_id, 'friend_request', new.id);
  end if;
  return new;
end;
$$;
create trigger new_friend_request_notification after insert on public.friend_requests
for each row execute function public.notify_friend_request();

create function public.notify_reaction()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner_id uuid;
begin
  select p.author_id into owner_id from public.posts p where p.id = new.post_id;
  if owner_id is not null and owner_id <> new.author_id then
    insert into public.notifications(recipient_id, actor_id, kind, source_id)
    values (owner_id, new.author_id, 'reaction', new.id);
  end if;
  return new;
end;
$$;
create trigger new_reaction_notification after insert on public.reactions
for each row execute function public.notify_reaction();

-- Sécurité du stockage : bucket privé ; les chemins commencent par <author UUID>/.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-media', 'post-media', false, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "Read media for accessible posts" on storage.objects for select to anon,authenticated
using (bucket_id = 'post-media' and exists (
  select 1 from public.post_photos pp where pp.storage_path = name and public.can_view_post(pp.post_id)
));
create policy "Users upload into own media folder" on storage.objects for insert to authenticated
with check (bucket_id = 'post-media' and split_part(name, '/', 1) = auth.uid()::text);
create policy "Users delete own uploaded media" on storage.objects for delete to authenticated
using (bucket_id = 'post-media' and split_part(name, '/', 1) = auth.uid()::text);

-- Un grade global pour visiteurs ne doit pas dévoiler l'existence des posts privés.
-- security_invoker : respecter RLS même dans une vue SQL.
create view public.place_public_grades with (security_invoker = true) as
with user_averages as (
  select place_id, author_id,
    avg(case grade when 'C' then 1 when 'B' then 2 when 'A' then 3 when 'S' then 4 end::numeric) as user_score
  from public.posts where visibility = 'public'
  group by place_id, author_id
)
select place_id, avg(user_score) as score, count(*) as unique_reviewers
from user_averages group by place_id;

-- IMPORTANT : À FAIRE DANS LES PROCHAINS SPRINTS
-- 1. Endpoint sécurisé et limité pour les signalements anonymes (pas de policy INSERT anon ouverte).
-- 2. Suppression de compte via Edge Function service-role, effacement des objets Storage et journal légal minimal.
-- 3. Revue de politiques UPDATE pour limiter les champs mutables côté client (RPC ou column grants).
-- 4. Revue complète RLS + tests automatisés avec deux utilisateurs et une session anonyme.
-- 5. Liens sécurisés des photos privées après perte d'amitié : limiter durée de vie des URLs signées.
