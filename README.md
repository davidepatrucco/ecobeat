# 🌱 Ecobeat - Sustainable Lifestyle Tracking

**Ecobeat** è un'applicazione mobile che gamifica le azioni sostenibili quotidiane, aiutando gli utenti a tracciare e ridurre la loro impronta di carbonio.

## 🏗️ Architettura

### **Monorepo Structure**

```
ecobeat/
├── 📱 apps/
│   ├── mobile/          # React Native app (Expo)
│   └── api/             # Node.js API (Express + AWS Lambda)
├── 📦 packages/
│   ├── shared/          # Types, utilities, config condivisi
│   └── theme/           # Design tokens e colori
├── 🏗️ infrastructure/   # AWS CDK (Lambda, API Gateway, KMS, SES)
├── 📋 docs/             # Documentazione
└── ⚙️ Root configs      # ESLint, Prettier, Husky hooks
```

### **Tech Stack**

- **Mobile**: React Native + Expo + TypeScript
- **Backend**: Node.js + Express + AWS Lambda
- **Database**: MongoDB Atlas
- **Infrastructure**: AWS CDK + CloudFormation
- **Authentication**: JWT + AWS KMS signing + Refresh Tokens
- **Email**: AWS SES con template HTML/text
- **Security**: Rate limiting + bcrypt + CORS
- **Monitoring**: CloudWatch + X-Ray

## 🚀 Quick Start

### **Prerequisites**

- Node.js 20+
- pnpm 8+
- Expo CLI
- AWS CLI (for deployment)

### **Installation**

```bash
# Clone repository
git clone https://github.com/davidepatrucco/ecobeat.git
cd ecobeat

# Install dependencies
pnpm install

# Start development
pnpm dev               # Both mobile + API
pnpm dev:mobile        # Solo mobile app
pnpm dev:api           # Solo API server
```

### **Development URLs**

- **Mobile App**: Expo QR Code → scan with Expo Go
- **API Server**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **JWKS Endpoint**: http://localhost:3000/.well-known/jwks.json

## 🔐 Authentication System

### **✅ Implemented Features**

- **JWT Authentication** with AWS KMS signing
- **Refresh Token Rotation** with secure storage
- **Email Verification** with AWS SES integration
- **Password Reset** with secure token-based flow
- **Biometric Authentication** for mobile devices
- **Rate Limiting** to prevent abuse
- **JWKS Endpoint** for JWT public key distribution

### **Security Features**

- 🔐 **KMS Integration**: JWT signing with AWS KMS (RSA-2048)
- 🔄 **Token Rotation**: Automatic refresh token rotation
- 📧 **Email Verification**: SES with HTML/text templates
- 🛡️ **Rate Limiting**: Multiple levels of protection
- 📱 **Biometric Support**: Touch ID / Face ID integration
- 🔒 **Secure Storage**: Encrypted credential management
- ⏰ **TTL Management**: Automatic cleanup of expired tokens

## 🌳 Git Workflow

| Branch    | Environment | Auto-Deploy | URL                     |
| --------- | ----------- | ----------- | ----------------------- |
| `develop` | Development | ❌          | localhost               |
| `staging` | Staging     | ✅          | api-staging.ecobeat.app |
| `main`    | Production  | ❌ Manual   | api.ecobeat.app         |

📖 **[Detailed Branching Strategy](docs/BRANCHING.md)**

## 🛠️ Development Commands

### **App Development**

```bash
pnpm dev:mobile        # Start Expo mobile app
pnpm dev:api           # Start API server locally
pnpm build             # Build all apps
pnpm test              # Run all tests
pnpm lint              # Lint all code
```

## 🔑 **Authentication & Security Features**

### **JWT & JWKS Implementation**

- ✅ **JWT Signing**: AWS KMS RSA-2048 keys with rotation support
- ✅ **JWKS Endpoint**: Standard `/.well-known/jwks.json` for distributed validation
- ✅ **JWT Validator**: Server-side validation with signature verification
- ✅ **Key Management**: Automatic key extraction from KMS (n, e values)
- ✅ **Caching**: 15-minute JWKS cache for optimal performance

### **Biometric Authentication**

- ✅ **Device Registration**: Secure biometric credential storage
- ✅ **Challenge/Response**: Cryptographic challenge generation
- ✅ **Multi-Device Support**: Multiple biometric credentials per user
- ✅ **Credential Management**: Registration, verification, and revocation APIs

### **Email Security**

- ✅ **AWS SES Integration**: Production-ready email service
- ✅ **Template System**: Professional HTML + text email templates
- ✅ **Parameter Store**: Environment-specific configuration loading
- ✅ **Rate Limiting**: Multi-level spam protection system

### **API Testing**

```bash
# Test authentication endpoints
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!","firstName":"Test","lastName":"User"}'

curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!"}'

# Test JWKS and JWT validation
curl http://localhost:3000/.well-known/jwks.json
curl http://localhost:3000/test/jwks  # Development test endpoint

# Test biometric authentication
curl -X POST http://localhost:3000/biometric/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"deviceInfo":{"name":"iPhone 15","biometricType":"faceID"}}'
```

### **Infrastructure**

```bash
pnpm infra:build       # Build CDK
pnpm infra:synth       # Generate CloudFormation
pnpm infra:deploy:staging  # Deploy to staging
pnpm infra:deploy:prod     # Deploy to production
```

## 📊 **API Endpoints Documentation**

### **Authentication Endpoints**

| Method | Endpoint                | Description                               | Auth Required |
| ------ | ----------------------- | ----------------------------------------- | ------------- |
| POST   | `/auth/register`        | User registration with email verification | No            |
| GET    | `/auth/verify-email`    | Email verification via token              | No            |
| POST   | `/auth/login`           | Email/password login                      | No            |
| POST   | `/auth/refresh`         | Refresh JWT tokens                        | No            |
| POST   | `/auth/logout`          | Logout (invalidate refresh token)         | Yes           |
| POST   | `/auth/logout-all`      | Logout from all devices                   | Yes           |
| POST   | `/auth/forgot-password` | Request password reset email              | No            |
| POST   | `/auth/reset-password`  | Reset password with token                 | No            |

### **Biometric Authentication**

| Method | Endpoint                          | Description                       | Auth Required |
| ------ | --------------------------------- | --------------------------------- | ------------- |
| POST   | `/biometric/register`             | Register biometric credentials    | Yes           |
| POST   | `/biometric/challenge`            | Create authentication challenge   | Yes           |
| POST   | `/biometric/verify`               | Verify biometric authentication   | Yes           |
| GET    | `/biometric/credentials`          | List user's biometric credentials | Yes           |
| DELETE | `/biometric/revoke/:credentialId` | Revoke biometric credential       | Yes           |

### **Email Services**

| Method | Endpoint                     | Description               | Auth Required |
| ------ | ---------------------------- | ------------------------- | ------------- |
| POST   | `/email/send-verification`   | Send email verification   | No            |
| POST   | `/email/send-password-reset` | Send password reset email | No            |

### **Security & Utilities**

| Method | Endpoint                 | Description                         | Auth Required |
| ------ | ------------------------ | ----------------------------------- | ------------- |
| GET    | `/.well-known/jwks.json` | JSON Web Key Set for JWT validation | No            |
| GET    | `/health`                | Basic health check                  | No            |
| GET    | `/health/detailed`       | Detailed system health              | No            |
| GET    | `/test/jwks`             | JWKS test endpoint (dev only)       | No            |
| POST   | `/test/validate-jwt`     | JWT validation test (dev only)      | No            |

## 📊 Rate Limiting Configuration

| Endpoint              | Window   | Max Requests | Purpose                   |
| --------------------- | -------- | ------------ | ------------------------- |
| Email Verification    | 15 min   | 3 requests   | Prevent email spam        |
| Password Reset        | 1 hour   | 5 requests   | Security protection       |
| Login Attempts        | 15 min   | 10 requests  | Brute force prevention    |
| Registration          | 1 hour   | 3 requests   | Account creation limits   |
| Email Verification DB | 24 hours | 5 emails     | Database-level protection |

## 🚀 Production Configuration

### **AWS Services Used**

- **Lambda**: Serverless API hosting
- **API Gateway**: HTTP endpoints and CORS
- **KMS**: JWT signing with RSA-2048 keys
- **SES**: Transactional email sending
- **Parameter Store**: Environment configuration
- **CloudWatch**: Logging and monitoring

### **Environment Variables**

```bash
# Required for production
NODE_ENV=production
AWS_REGION=us-east-1
KMS_KEY_ID=alias/ecobeat-jwt-signing-production

# Parameter Store paths (auto-loaded)
MONGODB_URI_PARAM=/ecobeat/production/mongodb/uri
FROM_EMAIL_PARAM=/ecobeat/production/ses/from-email
BASE_URL_PARAM=/ecobeat/production/app/base-url
```

### **SES Email Templates**

- **Email Verification**: Professional HTML + text templates
- **Password Reset**: Security-focused design with warnings
- **Template Features**: Responsive design, brand colors, clear CTAs

### **Security Best Practices**

- ✅ bcrypt password hashing (salt rounds: 12)
- ✅ JWT signed with AWS KMS (RSA-2048)
- ✅ Refresh token rotation on every use
- ✅ Rate limiting with in-memory + database checks
- ✅ CORS configuration for specific origins
- ✅ Helmet.js security headers
- ✅ Input validation with Zod schemas
- ✅ TTL cleanup for expired tokens

## 🤝 Contributing

## 📱 Mobile App Features

### **Current (Phase 0)**

- ✅ 5-tab navigation (Home, Activities, Challenges, Rewards, Profile)
- ✅ CO₂ impact tracking dashboard
- ✅ Custom Ecobeat logo integration
- ✅ TypeScript + ESLint + Prettier

### **Planned (Phase 1-3)**

- 🔄 User authentication (JWT)
- 🔄 Activity logging and CO₂ calculation
- 🔄 Gamification system (challenges, rewards)
- 🔄 Social features and leaderboards

## 🔧 API Endpoints

### **✅ Authentication**

- `POST /auth/register` - User registration with validation
- `POST /auth/login` - User login with rate limiting
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout with token revocation
- `POST /auth/revoke-all` - Revoke all user tokens
- `GET /auth/me` - Get current user info

### **✅ Email Services**

- `POST /email/send-verification` - Send email verification
- `POST /email/verify` - Verify email token
- `POST /email/send-password-reset` - Request password reset
- `POST /email/verify-reset-token` - Verify reset token
- `POST /email/reset-password` - Complete password reset

### **✅ Biometric Authentication**

- `POST /biometric/register` - Register biometric credential
- `POST /biometric/challenge` - Create authentication challenge
- `POST /biometric/verify` - Verify biometric authentication
- `GET /biometric/credentials` - List user's credentials
- `DELETE /biometric/revoke` - Revoke biometric credential
- `GET /biometric/status/:deviceId` - Check biometric status

### **✅ Security & Infrastructure**

- `GET /health` - Health check with detailed info
- `GET /.well-known/jwks.json` - JWT public keys

### **🔄 Planned Features**

- `GET /activities` - List user activities
- `POST /activities` - Log new activity
- `GET /challenges` - Available challenges
- `GET /leaderboard` - User rankings

## 🎯 Roadmap

### **✅ Phase 0 - Setup (COMPLETED)**

- [x] Monorepo with pnpm workspaces
- [x] Mobile app with Expo + React Native
- [x] API server with Express + Lambda support
- [x] AWS CDK infrastructure setup
- [x] Git workflow + CI/CD preparation

### **✅ Phase 1 - Infrastructure (COMPLETED)**

- [x] AWS CDK with KMS, SES, Parameter Store
- [x] MongoDB Atlas integration
- [x] Environment configuration (staging/production)
- [x] Security headers and CORS
- [x] Error handling and logging

### **✅ Phase 2 - Authentication (COMPLETED)**

- [x] JWT authentication with KMS signing
- [x] User registration/login with validation
- [x] Password reset + email verification (SES)
- [x] Refresh token rotation system
- [x] Rate limiting + security middleware
- [x] Biometric authentication for mobile
- [x] JWKS endpoint for public key distribution

### **🔄 Phase 3 - Core Features (NEXT)**

- [ ] Activity tracking and categorization
- [ ] CO₂ calculation engine with real factors
- [ ] Challenges system with gamification
- [ ] Rewards and achievement system
- [ ] User profile and preferences
- [ ] Social features and leaderboards

### **🔄 Phase 4 - Advanced Features**

- [ ] AI-powered personalized suggestions
- [ ] Push notifications with Expo
- [ ] Offline sync capabilities
- [ ] Advanced analytics dashboard
- [ ] B2B features for companies
- [ ] Third-party integrations (fitness apps, smart home)

## 🤝 Contributing

1. **Create feature branch** from `develop`
2. **Make changes** with tests
3. **Submit PR** to `develop`
4. **Deploy to staging** for testing
5. **Merge to main** for production

## 📄 License

MIT License - see LICENSE file for details

---

**Made with 🌱 for a sustainable future**

## 🏗️ Architettura

Il progetto è strutturato come un **monorepo** con pnpm workspaces:

```
ecobeat/
├── apps/
│   └── mobile/           # App Expo React Native
├── packages/
│   ├── shared/           # Tipi, utilities, schemas condivisi
│   └── theme/            # Design tokens (colori, tipografia, spacing)
├── infrastructure/       # CDK per AWS (da implementare)
└── docs/                 # Documentazione (da implementare)
```

## 🚀 Quick Start

### Prerequisiti

- **Node.js** ≥ 18.0.0
- **pnpm** ≥ 8.0.0
- **Expo CLI** (globale): `npm install -g @expo/cli`

### Setup

```bash
# Clone del repository
git clone https://github.com/davidepatrucco/ecobeat.git
cd ecobeat

# Installa le dipendenze
pnpm install

# Avvia l'app mobile in modalità sviluppo
cd apps/mobile
pnpm dev
```

### Sviluppo Mobile

```bash
# Avvia su iOS Simulator
pnpm ios

# Avvia su Android Emulator
pnpm android

# Avvia sul web
pnpm web

# Build per produzione
pnpm build
```

## 📱 Tech Stack

### Frontend (Mobile)

- **Expo** (~53.0) con React Native 0.79
- **Expo Router** per la navigazione
- **NativeWind** (Tailwind CSS per React Native)
- **React Query** per state management remoto
- **Zustand** per state management locale
- **React Hook Form + Zod** per form validation
- **Expo Notifications** per push notifications
- **Expo Secure Store** per secure storage

### Backend (Pianificato)

- **AWS Lambda** + **API Gateway** (serverless)
- **MongoDB Atlas** (serverless)
- **AWS CDK** per Infrastructure as Code
- **Node.js + TypeScript**

### Packages Condivisi

- **@ecobeat/shared**: Tipi, utilities, validazione (Zod schemas)
- **@ecobeat/theme**: Design tokens, palette colori, tipografia

## 🎨 Design System

### Palette Colori

- **Primary** (Verde natura): `#22c55e` - Azioni positive, brand
- **Secondary** (Blu acqua): `#0ea5e9` - Dati, informazioni
- **Accent** (Giallo sole): `#eab308` - Gamification, reward
- **Neutral**: Scala di grigi per testi e sfondi

### Principi UX

- **Mobile-first**: Design ottimizzato per smartphone
- **Semplicità**: Max 2 tap per ogni azione principale
- **Feedback positivo**: Microinterazioni che celebrano i comportamenti sostenibili
- **Accessibilità**: Contrasti forti, testi leggibili, navigazione intuitiva

## 📊 Funzionalità Principali

### MVP (Fase 1)

- ✅ **Onboarding** con quiz personalizzazione
- ✅ **Dashboard** con impatto settimanale CO₂
- ✅ **Tracking attività** sostenibili (trasporti, alimentazione, riciclo)
- ✅ **Suggerimenti AI** base (rule-based)
- ✅ **Gamification** semplice (punti, livelli, badge)

## 🗓️ **Development Roadmap**

### **✅ Phase 1 - Infrastructure & Authentication (COMPLETED)**

- ✅ **Monorepo Setup**: PNPM workspaces with apps/mobile, apps/api, packages/shared
- ✅ **AWS Infrastructure**: CDK stack with Lambda, API Gateway, KMS, SES
- ✅ **Authentication System**: Complete JWT auth with refresh tokens
- ✅ **Email Service**: AWS SES with production templates
- ✅ **Rate Limiting**: Multi-level spam protection
- ✅ **Biometric Auth**: Device-based authentication for mobile
- ✅ **JWKS Endpoint**: Standard JWT validation for distributed systems
- ✅ **Security Features**: bcrypt hashing, KMS signing, CORS, Helmet.js

### **🔄 Phase 2 - Mobile Application (IN PROGRESS)**

- 🔄 **Expo Setup**: NativeWind, React Query, Zustand, i18n
- 🔄 **Auth Screens**: Login, Register, Biometric, Email verification
- 🔄 **Session Management**: Auto-refresh, secure storage
- 📋 **Onboarding**: User profile setup and preferences
- 📋 **Dashboard**: Impact tracking and quick actions

### **📋 Phase 3 - Core Features (PLANNED)**

- 📋 **Activity Tracking**: Carbon footprint calculation engine
- 📋 **Impact Analytics**: Weekly/monthly reporting with charts
- 📋 **Gamification**: Points, badges, challenges system
- 📋 **AI Suggestions**: Personalized eco-friendly recommendations

### **📋 Phase 4 - Rewards & Partnerships (PLANNED)**

- 📋 **Reward System**: Points redemption and coupon engine
- 📋 **Partner Integration**: Local business partnerships
- 📋 **Marketplace**: Eco-friendly products and services

### **📋 Phase 5 - Advanced Features (FUTURE)**

- 📋 **B2B Dashboard**: Corporate sustainability tracking
- 📋 **IoT Integration**: Smart home and wearable devices
- 📋 **Advanced AI**: Machine learning recommendations
- 📋 **Community Features**: Social challenges and competitions

### Roadmap Future

- **Sfide** collaborative e personali
- **Marketplace reward** con partner locali
- **Funzionalità B2B** per aziende
- **AI avanzata** per suggerimenti personalizzati
- **Integrazione IoT** (smart home, wearables)

## 🔧 Scripts Disponibili

### Root Level

```bash
pnpm dev           # Avvia tutti i progetti in dev mode
pnpm build         # Build di tutti i progetti
pnpm test          # Test di tutti i progetti
pnpm lint          # Lint di tutti i progetti
pnpm lint:fix      # Fix automatico linting
pnpm format        # Format con Prettier
pnpm clean         # Pulizia di tutti i node_modules e build
```

### App Mobile

```bash
pnpm start         # Avvia Expo dev server
pnpm ios           # Avvia su iOS
pnpm android       # Avvia su Android
pnpm web           # Avvia su web
pnpm build         # Export per produzione
pnpm test          # Test con Jest
pnpm type-check    # TypeScript check
```

## 🧪 Testing

```bash
# Test di tutto il monorepo
pnpm test

# Test solo app mobile
cd apps/mobile && pnpm test

# Test in watch mode
cd apps/mobile && pnpm test:watch
```

## 📚 Struttura Progetto

### App Mobile (`apps/mobile/`)

```
app/
├── (tabs)/              # Tab navigation principale
│   ├── index.tsx        # Home/Dashboard
│   ├── activities.tsx   # Tracking attività
│   ├── challenges.tsx   # Sfide e gamification
│   ├── rewards.tsx      # Marketplace premi
│   └── profile.tsx      # Profilo utente
├── auth/                # Schermate autenticazione (da implementare)
├── onboarding/          # Flusso onboarding (da implementare)
└── _layout.tsx          # Root layout con providers
```

### Packages Condivisi

```
packages/
├── shared/src/
│   ├── schemas.ts       # Zod schemas per validazione
│   ├── constants.ts     # Costanti app (fattori CO₂, punti)
│   ├── utils.ts         # Utilities (date, calcoli, formatters)
│   └── index.ts         # Export principale
└── theme/src/
    ├── colors.ts        # Palette colori
    ├── typography.ts    # Font, dimensioni, line-height
    ├── spacing.ts       # Spacing, border-radius, shadows
    └── index.ts         # Theme object completo
```

## 🚀 Deployment

### Mobile (Expo)

```bash
# Build per store (future)
expo build:ios
expo build:android

# Over-the-Air Updates
expo publish
```

### Backend (Future)

```bash
# Deploy infrastruttura AWS
cd infrastructure
cdk deploy
```

## 🤝 Contributing

1. Fork del repository
2. Crea un branch feature: `git checkout -b feature/nome-feature`
3. Commit delle modifiche: `git commit -m 'Add: nuova feature'`
4. Push al branch: `git push origin feature/nome-feature`
5. Apri una Pull Request

### Commit Convention

- `feat:` Nuova funzionalità
- `fix:` Bug fix
- `docs:` Documentazione
- `style:` Formattazione, lint
- `refactor:` Refactoring codice
- `test:` Test
- `chore:` Maintenance

## 📄 License

MIT License - vedi file [LICENSE](LICENSE) per dettagli.

## 👥 Team

- **Davide Patrucco** - Project Lead & Full Stack Developer

---

🌍 **Insieme per un futuro più sostenibile!** 🌱
