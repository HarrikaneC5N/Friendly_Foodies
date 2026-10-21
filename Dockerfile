# syntax=docker/dockerfile:1
# Development: Vite + React with the source directory mounted by Compose.
FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
# The initial starter has no npm lockfile yet. Prefer reproducible npm ci once it exists.
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi

FROM dependencies AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Vite variables are embedded during *build*. They are not runtime secrets.
FROM dependencies AS build
COPY . .
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ARG VITE_MAP_STYLE_URL="https://tiles.openfreemap.org/styles/liberty"
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL} \
    VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY} \
    VITE_MAP_STYLE_URL=${VITE_MAP_STYLE_URL}
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
