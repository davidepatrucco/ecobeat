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
├── 🏗️ infrastructure/   # AWS CDK (Lambda, API Gateway, KMS)
├── 📋 docs/             # Documentazione
└── ⚙️ Root configs      # ESLint, Prettier, Husky hooks
```

### **Tech Stack**
- **Mobile**: React Native + Expo + TypeScript
- **Backend**: Node.js + Express + AWS Lambda
- **Database**: MongoDB Atlas + Redis ElastiCache  
- **Infrastructure**: AWS CDK + CloudFormation
- **Authentication**: JWT + AWS KMS signing
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
- **API Server**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🌳 Git Workflow

| Branch | Environment | Auto-Deploy | URL |
|--------|------------|-------------|-----|
| `develop` | Development | ❌ | localhost |
| `staging` | Staging | ✅ | api-staging.ecobeat.app |
| `main` | Production | ❌ Manual | api.ecobeat.app |

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

### **Infrastructure**
```bash
pnpm infra:build       # Build CDK
pnpm infra:synth       # Generate CloudFormation
pnpm infra:deploy:staging  # Deploy to staging
pnpm infra:deploy:prod     # Deploy to production
```

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

### **Current**
- `GET /health` - Health check
- `POST /auth/*` - Authentication (placeholder)

### **Planned**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /activities` - List user activities
- `POST /activities` - Log new activity
- `GET /challenges` - Available challenges

## 🎯 Roadmap

### **✅ Phase 0 - Setup (COMPLETED)**
- [x] Monorepo with pnpm workspaces
- [x] Mobile app with Expo + React Native
- [x] API server with Express + Lambda support
- [x] AWS CDK infrastructure setup
- [x] Git workflow + CI/CD preparation

### **🔄 Phase 1 - Infrastructure**
- [ ] Deploy staging environment
- [ ] MongoDB Atlas setup
- [ ] Redis ElastiCache configuration
- [ ] Domain + SSL certificates

### **🔄 Phase 2 - Authentication**
- [ ] JWT authentication with KMS signing
- [ ] User registration/login
- [ ] Password reset + email verification
- [ ] Rate limiting + security

### **🔄 Phase 3 - Core Features**
- [ ] Activity tracking
- [ ] CO₂ calculation engine
- [ ] Challenges system
- [ ] Rewards and gamification

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
