🏗️ Architettura proposta
[App Mobile Expo React Native]
   ├─ Expo Router, React Query (cache rete), Zustand (state), i18n
   ├─ Expo Notifications, Expo Updates (OTA), Reanimated
   └─ Auth SDK (Clerk/Auth0/Firebase Auth)

          ⇅ HTTPS (JWT/OAuth2)

[API Serverless (Node.js/TypeScript)]
   ├─ Functions: /auth, /activities, /impact, /challenges, /rewards, /org
   ├─ Edge cache (CDN) per GET idempotenti
   ├─ Webhooks (Stripe, Expo Push, partner)
   └─ Job schedulati (cron) per badge, classifiche

          ⇅ MongoDB Driver/Mongoose

[MongoDB Atlas (Serverless)]
   ├─ Collections: users, activities, impacts, challenges, rewards, orgs
   ├─ TTL & indici composti
   ├─ Triggers per denormalizzazioni leggere
   └─ Atlas Search (facoltativo) per catalogo reward

[Servizi di contorno]
   ├─ File/Immagini: Cloudflare R2 o S3
   ├─ Push: Expo Push API
   ├─ Pagamenti: Stripe (per premium B2C)
   ├─ Analytics + Product: PostHog/Amplitude
   └─ Error tracking: Sentry

📱 Frontend (Expo)

Librerie:

Navigation: Expo Router

Stato locale: Zustand (semplice)

Dati remoti: React Query (retry, cache, offline)

UI: NativeWind (Tailwind RN) + lucide-react-native icone

i18n: react-intl o i18next

Form: react-hook-form + zod per validazione

OTA: Expo Updates (per fix rapidi senza store)

Push: Expo Notifications (topic per sfide/comunità)

Struttura cartelle:

app/
  (tabs)/home.tsx
  activities/[id].tsx
  challenges/index.tsx
  rewards/index.tsx
  profile/index.tsx
src/
  api/clients.ts   // fetch con React Query
  store/*          // Zustand slices
  components/*     // UI riusabili
  hooks/*          // hooks (useImpact, useChallenge)
  utils/*          // date, number, intl
  i18n/*           // strings IT/EN
  theme/*          // palette, spacing
  types/*          // zod schemas + TS types

☁️ Backend serverless

Piattaforma (scegline una):

Vercel Functions: DX super rapida, edge caching semplice.

Cloudflare Workers/Pages Functions: costi bassi, edge-first, cold start minimo.

AWS Lambda + API Gateway: più flessibile, un po’ più macchinoso ma robusto.

Runtime: Node.js + TypeScript

Framework: Hono o Fastify (Hono ottimo su edge).

Auth middleware: verifica JWT (Clerk/Auth0/Firebase).

Rate limiting: Redis/Upstash o in-memory token bucket su edge.

Caching: Cache-Control + CDN su GET (es. /impact/summary).

Cron: (Vercel/Cloudflare/AWS EventBridge) per chiudere sfide, assegnare badge, rigenerare classifiche.

Endpoint (bozza)

POST   /auth/callback
GET    /me
GET    /impact/summary?range=week
POST   /activities           // create
GET    /activities?from=&to=
DELETE /activities/:id
GET    /challenges
POST   /challenges/:id/join
POST   /challenges/:id/progress
GET    /rewards
POST   /rewards/:id/redeem
GET    /org/:orgId/dashboard  // B2B

🗄️ Dati (MongoDB Atlas Serverless)

users

{
  "_id": "ObjectId",
  "authProviderId": "string",       // sub JWT
  "email": "string",
  "name": "string",
  "locale": "it-IT",
  "level": "Eco Starter",
  "points": 320,
  "createdAt": "Date"
}


activities

{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "type": "commute|meal|recycle|energy",
  "subtype": "bike|car|bus|veg|plastic|kwh",
  "qty": 1,
  "unit": "trip|meal|kg|kwh",
  "co2eKg": 1.3,           // calcolato server-side
  "meta": { "distanceKm": 4.2 },
  "ts": "Date"
}


impacts (aggregazioni denormalizzate per velocità)

{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "period": "2025-W34",    // o YYYY-MM
  "co2eKg": 12.4,
  "waterL": 80,
  "wasteKg": 1.1,
  "updatedAt": "Date"
}


challenges

{
  "_id": "ObjectId",
  "title": "Plastic Free Week",
  "slug": "plastic-free-week",
  "durationDays": 7,
  "rules": { "targetActions": 5 },
  "rewards": { "points": 100, "badge": "Eco Warrior" },
  "public": true,
  "orgId": "ObjectId|null"
}


rewards

{
  "_id": "ObjectId",
  "title": "Voucher 10% EcoStore",
  "pointsCost": 200,
  "stock": 150,
  "partner": "EcoStore",
  "region": "IT",
  "metadata": { "couponType": "single-use" }
}


Indici consigliati

activities: { userId: 1, ts: -1 }, { userId: 1, type: 1, ts: -1 }

impacts: { userId: 1, period: 1 } (unique)

rewards: { region: 1, pointsCost: 1 }

challenges: { public: 1 }, { orgId: 1 }

🔐 Sicurezza & Privacy (GDPR-ready)

Auth: Clerk/Auth0/Firebase Auth con PKCE.

JWT: firma RS256, scadenza breve; refresh tramite provider.

PII: email e nome cifrati at-rest (FLE opzionale su Atlas).

Scopes: ruoli user, org_admin.

Consenso: banner privacy + granularità per analytics/marketing.

Data retention: TTL log, export & delete (diritto all’oblio).

Audit: Sentry + log strutturati (pino) + retention 30-90 gg.

🧮 Motore di calcolo impatto

Fattori di emissione versionati (es. factors_v1.json).

Calcolo server-side (mai fidarsi del client).

Feature flag per aggiornare fattori senza deploy.

Test unit + snapshot per mantenere coerenza storica.

🧪 Qualità, CI/CD, DevEx

Repo monorepo (pnpm workspaces): apps/mobile, apps/api, packages/shared.

CI: GitHub Actions

Lint/TypeCheck/Test su PR

Preview deploy (Vercel/CF Pages)

CD:

API → Vercel/Workers (prod & preview)

App → Expo EAS build + OTA canary/stable

Testing:

Mobile: Jest + Testing Library, Detox (e2e)

API: Vitest + supertest

Observability: Sentry (mobile & backend), PostHog events.

💸 Costi indicativi (MVP)

Vercel/Cloudflare: free/low tier iniziale.

MongoDB Atlas Serverless: paghi a consumo (pochi € al mese all’inizio).

Clerk/Auth0/Firebase: free tier → poi ~0,02–0,05€/utente attivo.

PostHog/Amplitude: free tier generoso.

Stripe: % transazione.

🛣️ Roadmap tecnica (12 settimane)

W1–2: setup monorepo, auth, scaffolding schermate (onboarding, dashboard).
W3–4: API /activities, calcolo CO₂, React Query + cache; UI tracking.
W5–6: dashboard impatto, consigli AI basici (rule-based), push.
W7–8: sfide + progress bar + punti + badge.
W9–10: rewards + redemption + integrazione partner (mock).
W11: analytics eventi, Sentry, hardening sicurezza.
W12: beta chiusa TestFlight/Play Internal + bugfix + OTA.

🔁 Alternative/varianti rapide

Backend “quasi zero”: MongoDB Atlas App Services (Realm) con Functions/Triggers e Device Sync se vuoi sincronizzazione offline spinta.

Supabase (Postgres) al posto di Mongo se vuoi RLS e SQL (ottimo per classifiche).

Firebase se privilegiate time-to-market + push/auth/analytics integrati (meno flessibilità DB).

Se vuoi, posso:

generarti lo scheletro di repo (cartelle, package.json, scripts, ESLint, TSConfig),

darti esempi di endpoint Hono + modelli Mongoose pronti,

preparare una lista di eventi analytics (PostHog) per misurare activation/retention.