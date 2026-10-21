import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  Bell, Check, ChevronDown, Compass, Heart, MapPin, Menu, Plus, Search,
  Settings, Share2, SlidersHorizontal, Sparkles, UserRound, Users, X,
} from 'lucide-react';
import MapView from './components/MapView';
import AuthDialog from './components/AuthDialog';
import { places, type DemoPlace } from './data/demo';
import { GRADES, calculateVenueGrade, gradeLabels, type Grade } from './lib/grades';
import { supabase } from './lib/supabase';

type MapMode = 'discover' | 'friends';
type NavItem = 'carte' | 'amis' | 'decouvrir' | 'notifications' | 'profil' | 'parametres';

const par = { longitude: 2.3504, latitude: 48.8582 };
function distanceKm([lon, lat]: [number, number]): number {
  const toRad = (v: number) => v * Math.PI / 180;
  const radius = 6371;
  const dLat = toRad(lat - par.latitude);
  const dLon = toRad(lon - par.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(par.latitude)) * Math.cos(toRad(lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function Logo({ small = false }: { small?: boolean }) {
  return <div className={`brand ${small ? 'brand--small' : ''}`}><span className="brand-mark">F<span className="brand-mark__dot">●</span></span><span className="brand-wordmark"><strong>Friendly</strong><strong>Foodies</strong></span></div>;
}

const navigation: { item: NavItem; label: string; icon: typeof Compass }[] = [
  { item: 'carte', label: 'La carte', icon: MapPin },
  { item: 'amis', label: 'Mes amis', icon: Users },
  { item: 'decouvrir', label: 'Découvrir', icon: Compass },
  { item: 'notifications', label: 'Notifications', icon: Bell },
  { item: 'profil', label: 'Mon profil', icon: UserRound },
  { item: 'parametres', label: 'Paramètres', icon: Settings },
];

function FoodVisual({ id, className = '' }: { id: number; className?: string }) {
  return <div className={`food-visual food-visual--${id % 5} ${className}`} aria-label="Illustration de plat pour la démonstration" role="img">
    <div className="food-plate"><span className="food-garnish food-garnish--a" /><span className="food-garnish food-garnish--b" /><span className="food-garnish food-garnish--c" /></div>
  </div>;
}

function VenuePreview({ place, onOpen }: { place: DemoPlace; onOpen: () => void }) {
  const publicPosts = place.posts.filter((post) => post.visibility === 'public');
  const score = calculateVenueGrade(publicPosts);
  return <button onClick={onOpen} className="venue-card">
    <FoodVisual id={place.visual} className="venue-card__image" />
    <div className="venue-card__body"><div className="venue-card__row"><h3>{place.name}</h3><span className="grade-badge">{score?.grade ?? '—'}</span></div>
      <p>{place.categories[0]} · {place.subtitle}</p><div className="venue-card__footer"><span><Heart size={13} /> {publicPosts.length} expérience{publicPosts.length !== 1 ? 's' : ''}</span><span className="visit-link">Découvrir →</span></div>
    </div>
  </button>;
}

function VenueDetail({ place, onClose, onAction }: { place: DemoPlace; onClose: () => void; onAction: () => void }) {
  const publicPosts = place.posts.filter((post) => post.visibility === 'public');
  const score = calculateVenueGrade(publicPosts);
  return <div className="venue-sheet" role="dialog" aria-modal="false" aria-label={`Fiche de ${place.name}`}>
    <button className="round-icon venue-sheet__close" onClick={onClose} aria-label="Fermer la fiche"><X size={18} /></button>
    <FoodVisual id={place.visual} className="venue-sheet__cover" />
    <div className="venue-sheet__content">
      <div className="tiny-label">UNE ADRESSE À DÉCOUVRIR</div>
      <h2>{place.name}</h2><p className="sheet-subtitle"><MapPin size={15} /> {place.subtitle}</p>
      <div className="category-row">{place.categories.map((category) => <span className="category-chip" key={category}>{category}</span>)}</div>
      <div className="place-summary"><span><small>GRADE DE LA COMMUNAUTÉ</small><strong>{score?.grade ?? '—'} <em>{score ? gradeLabels[score.grade] : 'Non noté'}</em></strong></span><span><small>EXPÉRIENCES PUBLIQUES</small><strong>{publicPosts.length}</strong></span><span><small>MEMBRES</small><strong>{score?.contributors ?? 0}</strong></span></div>
      <button className="primary-button new-review" onClick={onAction}><Plus size={18} /> Ajouter mon expérience</button>
      <div className="reviews-heading"><h3>Les expériences</h3><span>{publicPosts.length} publication{publicPosts.length > 1 ? 's' : ''}</span></div>
      {publicPosts.map((post) => <article className="review" key={post.id}>
        <div className="review__header"><span className="avatar">{post.author[0]}</span><span><strong>{post.author}</strong><small>{post.visit}</small></span><span className="grade-badge">{post.grade}</span></div>
        <p>« {post.text} »</p><div className="review__actions"><button onClick={onAction}><Heart size={15} /> Je valide</button><button onClick={onAction}>◇ Pas pour moi</button></div>
      </article>)}
      <p className="privacy-explainer">Seules les expériences publiques sont visibles ici. Les expériences réservées aux amis ne sont jamais affichées aux visiteurs.</p>
    </div>
  </div>;
}

export default function App() {
  const [mode, setMode] = useState<MapMode>('discover');
  const [nav, setNav] = useState<NavItem>('carte');
  const [query, setQuery] = useState('');
  const [distance, setDistance] = useState(20);
  const [minGrade, setMinGrade] = useState<Grade>('C');
  const [selected, setSelected] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => { if (active) setSession(data.session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  const filteredPlaces = useMemo(() => places.filter((place) => {
    const byText = `${place.name} ${place.subtitle} ${place.categories.join(' ')}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr'));
    const publicPosts = place.posts.filter((post) => post.visibility === 'public');
    const grade = calculateVenueGrade(publicPosts)?.grade;
    return byText && distanceKm(place.coordinates) <= distance && Boolean(grade && GRADES.indexOf(grade) >= GRADES.indexOf(minGrade));
  }), [distance, minGrade, query]);

  const selectedPlace = places.find((place) => place.id === selected) ?? null;

  function requireAccount(action: string) {
    if (!session) { setAuthOpen(true); return; }
    setToast(`${action} : ce parcours sera connecté à Supabase lors du prochain sprint.`);
  }
  function navigate(item: NavItem) {
    setMobileNavOpen(false);
    if (item === 'carte' || item === 'decouvrir') { setNav(item); setMode('discover'); setSelected(null); return; }
    if (!session) { setAuthOpen(true); return; }
    setNav(item);
    setToast(`${navigation.find((element) => element.item === item)?.label} : interface prévue, données à brancher au prochain sprint.`);
  }
  function chooseMode(nextMode: MapMode) {
    if (nextMode === 'friends' && !session) { setAuthOpen(true); return; }
    if (nextMode === 'friends') { setToast('Carte des amis : connexion à la base et droits RLS prévus au prochain sprint.'); return; }
    setMode(nextMode); setSelected(null);
  }
  async function sharePlace() {
    if (!selectedPlace) return;
    const data = { title: `${selectedPlace.name} — Friendly Foodies`, text: `Découvre ${selectedPlace.name}`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(data.url); setToast('Lien copié.'); }
    } catch { /* annulation du partage utilisateur */ }
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNavOpen ? 'sidebar--open' : ''}`}>
      <Logo /><button className="sidebar__close" onClick={() => setMobileNavOpen(false)} aria-label="Fermer le menu"><X size={20} /></button>
      <p className="sidebar-section-label">EXPLORER</p>
      <nav className="sidebar__nav" aria-label="Navigation principale">
        {navigation.slice(0, 3).map(({ item, label, icon: Icon }) => <button key={item} onClick={() => navigate(item)} className={`nav-link ${nav === item ? 'nav-link--active' : ''}`}><Icon size={19} strokeWidth={2} />{label}</button>)}
      </nav>
      <p className="sidebar-section-label sidebar-section-label--second">MON ESPACE</p>
      <nav className="sidebar__nav" aria-label="Espace personnel">
        {navigation.slice(3).map(({ item, label, icon: Icon }) => <button key={item} onClick={() => navigate(item)} className={`nav-link ${nav === item ? 'nav-link--active' : ''}`}><Icon size={19} />{label}</button>)}
      </nav>
      <div className="sidebar__bottom"><div className="sidebar-sparkle"><Sparkles size={19} /><strong>La gourmandise se partage !</strong><p>Garde les meilleures adresses près de toi.</p></div><span className="sidebar-caption">Friendly Foodies · Démo V1</span></div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <button className="menu-button" aria-label="Afficher le menu" onClick={() => setMobileNavOpen(true)}><Menu size={21} /></button>
        <div className="topbar__search"><Search size={19} /><input aria-label="Rechercher une adresse" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un restaurant, une spécialité, un quartier…" /></div>
        <button className="primary-button topbar__create" onClick={() => requireAccount('Publication')}><Plus size={18} /> Ajouter une expérience</button>
        <button className="round-icon topbar__notification" onClick={() => navigate('notifications')} aria-label="Notifications"><Bell size={19} /></button>
        <button className="topbar__account" onClick={() => session ? navigate('profil') : setAuthOpen(true)} aria-label={session ? 'Mon profil' : 'Se connecter'}>{session?.user.email?.charAt(0).toUpperCase() || '✳'}</button>
      </header>
      <section className="home" aria-label="Exploration Friendly Foodies">
        <div className="home-head">
          <div><div className="eyebrow"><span className="eyebrow__line" /> LA CARTE DES GOURMANDS</div><h1>De belles adresses, <em>de vraies découvertes.</em></h1><p>Explore les expériences culinaires partagées avec la communauté.</p></div>
          <div className="home-head__aside"><span className="friends-bubbles"><i>L</i><i>T</i><i>M</i></span> La gourmandise nous rassemble</div>
        </div>
        <div className="map-toolbar">
          <div className="segmented" role="group" aria-label="Mode de carte"><button className={mode === 'friends' ? 'segmented__active' : ''} onClick={() => chooseMode('friends')}><Users size={16} /> Mes amis</button><button className={mode === 'discover' ? 'segmented__active' : ''} onClick={() => chooseMode('discover')}><Compass size={16} /> Découvrir</button></div>
          <div className="filters"><span className="filters__title"><SlidersHorizontal size={16} /> Filtres</span><label className="filter-field">Distance <span className="filter-field__value">{distance} km</span><ChevronDown size={14} /><select value={distance} aria-label="Distance maximale depuis le centre de Paris, démonstration" onChange={(event) => setDistance(Number(event.target.value))}>{[1, 2, 3, 5, 10, 20, 50].map((v) => <option value={v} key={v}>{v} km</option>)}</select></label>
            <label className="filter-field">Grade minimum <span className="filter-field__value">{minGrade}</span><ChevronDown size={14} /><select value={minGrade} aria-label="Grade minimum" onChange={(event) => setMinGrade(event.target.value as Grade)}>{GRADES.map((grade) => <option value={grade} key={grade}>{grade} · {gradeLabels[grade]}</option>)}</select></label></div>
        </div>
        <div className="map-container"><MapView places={filteredPlaces} selectedPlaceId={selected} onSelect={setSelected} />{selectedPlace && <div className="map-selected-card"><FoodVisual id={selectedPlace.visual} /><div><span className="tiny-label">UNE ADRESSE À EXPLORER</span><h3>{selectedPlace.name}</h3><p>{selectedPlace.subtitle}</p><button onClick={() => document.getElementById('venue-detail')?.scrollIntoView({ behavior: 'smooth' })}>Voir les expériences →</button></div><button className="map-selected-card__close" aria-label="Fermer" onClick={() => setSelected(null)}><X size={17} /></button></div>}</div>
        <div className="places-section"><div className="places-section__head"><div><h2>Autour de cette zone <span className="places-count">{filteredPlaces.length}</span></h2><p>Des lieux à explorer, des histoires à découvrir.</p></div><span className="demo-only">Toutes les adresses sont fictives</span></div>
          <div className="places-grid">{filteredPlaces.length ? filteredPlaces.map((place) => <VenuePreview key={place.id} place={place} onOpen={() => setSelected(place.id)} />) : <div className="no-results">Aucune adresse ne correspond à ces filtres. Augmente la distance ou diminue le grade minimum.</div>}</div>
        </div>
      </section>
    </main>
    {selectedPlace && <div id="venue-detail" className="venue-detail-anchor"><VenueDetail place={selectedPlace} onClose={() => setSelected(null)} onAction={() => requireAccount('Interaction sociale')} /><button className="floating-share" onClick={() => void sharePlace()}><Share2 size={17} /> Partager</button></div>}
    <nav className="bottom-nav" aria-label="Navigation mobile"><button className="bottom-nav__active" onClick={() => navigate('carte')}><MapPin size={22} /> Carte</button><button onClick={() => navigate('amis')}><Users size={22} /> Amis</button><button className="bottom-nav__plus" aria-label="Créer une expérience" onClick={() => requireAccount('Publication')}><Plus size={23} /></button><button onClick={() => navigate('decouvrir')}><Compass size={22} /> Explorer</button><button onClick={() => navigate('profil')}><UserRound size={22} /> Profil</button></nav>
    {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
    {toast && <div role="status" className="toast"><Check size={17} /> {toast}<button onClick={() => setToast(null)} aria-label="Fermer le message"><X size={14} /></button></div>}
  </div>;
}
