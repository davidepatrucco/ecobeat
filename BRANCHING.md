# 🌳 Ecobeat Git Flow Strategy

## Branch Structure

### **🌟 main (Production)**
- **Deploy to:** AWS Production environment
- **Domain:** `api.ecobeat.app` 
- **Auto-deploy:** ❌ Manual approval required
- **Protection:** Branch protection enabled
- **Merge from:** `staging` only (via PR)

### **🧪 staging (Staging)**
- **Deploy to:** AWS Staging environment
- **Domain:** `api-staging.ecobeat.app`
- **Auto-deploy:** ✅ Automatic on push
- **Merge from:** `develop` (via PR)
- **Purpose:** Pre-production testing

### **⚡ develop (Development)**
- **Deploy to:** ❌ Local development only
- **Purpose:** Integration branch for features
- **Merge from:** Feature branches (via PR)
- **Testing:** Unit tests + integration tests

## Workflow

### 🚀 **Feature Development:**
```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/auth-system

# Work on feature...
git add .
git commit -m "feat: implement JWT authentication"

# Push and create PR to develop
git push origin feature/auth-system
```

### 🧪 **Staging Release:**
```bash
# Merge develop to staging
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# Auto-deploys to staging environment
```

### 🌍 **Production Release:**
```bash
# Merge staging to main (via PR only)
git checkout main
git pull origin main
git merge staging
git push origin main

# Manual deploy to production
pnpm infra:deploy:prod
```

## Environment URLs

| Environment | Branch | URL | Auto-Deploy |
|-------------|--------|-----|-------------|
| Development | `develop` | `localhost:3001` | ❌ |
| Staging | `staging` | `api-staging.ecobeat.app` | ✅ |
| Production | `main` | `api.ecobeat.app` | ❌ Manual |

## Deployment Commands

```bash
# Deploy to staging
pnpm infra:deploy:staging

# Deploy to production  
pnpm infra:deploy:prod

# Destroy staging (if needed)
pnpm infra:destroy:staging
```

## Branch Protection Rules

### **main branch:**
- ✅ Require PR reviews (1 reviewer)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict pushes to admins only

### **staging branch:**
- ✅ Require PR reviews (1 reviewer)
- ✅ Require status checks to pass

### **develop branch:**
- ✅ No direct pushes (PRs only)
- ✅ Require status checks to pass
