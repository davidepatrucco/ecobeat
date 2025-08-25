🧭 Fase 0 — Preparazione 

 Repo monorepo (pnpm workspaces): apps/mobile, apps/api, packages/shared

DoD: lint, prettier, tsconfig condiviso, commit hooks (husky+lint-staged).

 Gestione segreti: .env.example, AWS SSM/Secrets Manager, schema config.

 Design tokens: palette, tipografia, spaziature in packages/shared/theme.

☁️ Fase 1 — Infrastruttura (IaC CDK) 

 Stack base: API Gateway (REST), Lambda Node 20, LogGroup, WAF, CloudWatch Alarms.

 KMS key: per firma JWT (alias attivo), policy minima.

 SES: domini/identità verificate + template email (verify, reset, magic link).

 MongoDB Atlas: cluster serverless su AWS eu-west-1, IP allowlist/peering, utente app.

 Redis (Elasticache serverless): per rate-limit e blacklist token.

DoD: cdk deploy idempotente, output con URL API, ARNs chiavi, variabili pronte.

🔐 Fase 2 — Auth custom (API)

Moduli

 User model (Mongo): users, refresh_tokens, email_tokens + indici.

 Password hashing: Argon2id (parametri tunati).

 JWT service: header+payload, firma via KMS.Sign, kid gestione/rotazione.

 JWKS endpoint: GET /.well-known/jwks.json (+ caching 15m).

 Rate limiting: bucket Redis per /auth/* e /activities write.

 Middleware auth: validazione JWT (JWK fetch & cache), scope/ruoli.

Endpoint

 POST /auth/register (+ email verify token SES)

 GET /auth/verify-email?token=...

 POST /auth/login (password) + opzionale require_mfa

 POST /auth/magic-link + GET /auth/magic-link/consume

 POST /auth/refresh (rotazione refresh, jti blacklist)

 POST /auth/logout / POST /auth/logout-all

 POST /auth/forgot-password + POST /auth/reset-password

 POST /auth/mfa/setup|verify|disable (TOTP, secret cifrato KMS)

DoD: test unit (Vitest) per ogni endpoint, test e2e minimal (supertest), log strutturati (pino).

📱 Fase 3 — App Mobile (Expo) (1–2 settimane)

 Scaffold: Expo Router, NativeWind, React Query, Zustand, i18n, Reanimated.

 Secure storage: expo-secure-store (refresh token, device_id).

 Auth screens: Sign-up, Login, Magic link, Verify email, Reset, MFA TOTP.

 Session handling: interceptor React Query (auto-refresh, retry, logout on 401).

 Onboarding quiz + salvataggio profilo base.

 UI Dashboard con impatto settimanale + quick actions.

DoD: build Android (internal) e iOS (TestFlight) + OTA canary abilitato.

🧮 Fase 4 — Core dominio (API + App) 

 Activities API: POST /activities, GET /activities?from&to, DELETE /:id

 Motore impatto: fattori emissione versionati (factors_v1.json), calcolo server-side.

 Aggregazioni: impacts per week/month; job EventBridge nightly.

 Suggerimenti AI (v0): rule-based (in base a profilo/attività recenti).

 Gamification: punti, badge base; endpoint /challenges (lista/join/progress).

 App UI: tracking rapido (icone/tap), consigli a card, progress bar sfide.

DoD: query summary (GET /impact/summary?range=week), performance p95 < 300ms su GET cacheable.

🛍️ Fase 5 — Reward & Partner 

 Rewards API: GET /rewards, POST /rewards/:id/redeem (stock, idempotenza).

 Coupon engine: mock issuer + audit redemption.

 App UI: store premi (lista/dettaglio/riscatto).

DoD: redemption transazionale (sessione Mongo), doppio click safe.

🔎 Fase 6 — Observability, Sicurezza, Qualità (3–5 gg)

 Sentry mobile + backend; release health.

 CloudWatch dashboards: invocazioni, errori, latenze; allarmi su 5xx e throttling.

 WAF regole OWASP core + bot control su /auth/*.

 Privacy/GDPR: export/delete account endpoint admin; data retention log 30–90 gg.

 Pen test checklist: brute force, token reuse, replay, CORS, header sicurezza (HSTS, CSP API).

DoD: checklist sicurezza firmata, run zap/burp baseline su staging.

📈 Fase 7 — Analytics & Growth 

 Eventi prodotto (PostHog/Amplitude): signup, login, activity_add, challenge_join, reward_redeem.

 Funnel: activation (prima attività entro 24h), D1/D7 retention dashboard.

 Feature flags: suggerimenti AI on/off, fattori emissione v2.

DoD: eventi visibili in dashboard + segmentazione base.

🚀 Fase 8 — Release & Operatività 

 CI/CD: GitHub Actions (lint/test/build), cdk synth/deploy, promozione env (dev→staging→prod).

 Versionamento API: v1 prefix + changelog; contratti OpenAPI generati.

 Store readiness: privacy policy, termini, screenshot, icone, descrizioni.

 Runbook: incident response, rotazione KMS, revoke di massa, key leak procedure.

DoD: beta pubblica limitata + canale feedback in-app.

📌 Issue template (GitHub)

Titolo: [Area] Descrizione breve

Contesto: perché serve

Accettazione (DoD): criteri misurabili

Sicurezza/Privacy: impatti e mitigazioni

Test: unit/e2e richiesti

Stima: S, M, L

🔁 Priorità (ordine consigliato)

IaC base → 2) Auth end-to-end → 3) Onboarding+Dashboard → 4) Activities+Impatto → 5) Gamification → 6) Rewards → 7) Security/Observability → 8) Analytics → 9) Store/Release.