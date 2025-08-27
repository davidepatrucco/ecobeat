# GitHub Actions Setup

## Required Secrets

Per far funzionare i deploy automatici, devi configurare questi secrets in GitHub:

### 1. Vai su GitHub Repository Settings
```
https://github.com/davidepatrucco/ecobeat/settings/secrets/actions
```

### 2. Aggiungi questi Secrets:

#### `AWS_ACCESS_KEY_ID`
```
Il tuo AWS Access Key ID per il deploy
```

#### `AWS_SECRET_ACCESS_KEY`  
```
Il tuo AWS Secret Access Key per il deploy
```

### 3. Come ottenere le credenziali AWS:

#### Opzione A: Usa le tue credenziali esistenti
```bash
# Controlla le tue credenziali attuali
cat ~/.aws/credentials

# Copia:
# - aws_access_key_id → AWS_ACCESS_KEY_ID secret
# - aws_secret_access_key → AWS_SECRET_ACCESS_KEY secret
```

#### Opzione B: Crea un nuovo utente IAM per CI/CD
```bash
# 1. Vai su AWS IAM Console
# 2. Crea nuovo utente "ecobeat-github-actions"
# 3. Aggiungi policy: AdministratorAccess (o policy più restrittiva)
# 4. Crea Access Key
# 5. Copia le credenziali nei GitHub Secrets
```

## Workflow Configurati

### 🟢 Staging Deploy (auto)
- **Trigger**: Push su branch `main`
- **Target**: Environment `staging`
- **URL**: https://d1rcql97m4.execute-api.eu-west-1.amazonaws.com/staging/

### 🔴 Production Deploy (manual)
- **Trigger**: Push su branch `production` OR manual dispatch
- **Target**: Environment `production`  
- **Safety**: Richiede conferma manuale

### 🧪 Test & Validate
- **Trigger**: Pull Request + Push
- **Actions**: Build, lint, security audit, CDK validation

## Come usare:

### Deploy automatico staging:
```bash
git add .
git commit -m "feat: my changes"
git push origin main
# 🚀 Deploy automatico su staging!
```

### Deploy production:
```bash
# Opzione 1: Branch production
git checkout -b production
git push origin production

# Opzione 2: Manual dispatch da GitHub UI
# Vai su Actions → Deploy to Production → Run workflow
```

### Monitoraggio:
- **GitHub Actions**: https://github.com/davidepatrucco/ecobeat/actions
- **AWS CloudWatch**: Log Lambda function
- **API Health**: https://d1rcql97m4.execute-api.eu-west-1.amazonaws.com/staging/health/detailed

## Troubleshooting

### Deploy fallisce:
1. Controlla i log in GitHub Actions
2. Verifica credenziali AWS nei Secrets
3. Controlla che il bundle sia < 50MB
4. Verifica SSM parameters esistano

### Test falliscono:
1. Controlla errori di compilazione TypeScript
2. Verifica lint issues
3. Controlla security audit warnings

---

**Nota**: Prima di pushare, testa sempre in locale con:
```bash
pnpm build:api
cd apps/api && pnpm build:lambda-bundle
cd ../../infrastructure && pnpm cdk diff --context stage=staging
```
