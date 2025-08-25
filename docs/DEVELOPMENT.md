# 🔧 Development Guide

## Getting Started

### Environment Setup

1. **Install Dependencies**
   ```bash
   # Install Node.js 20+ and pnpm
   npm install -g pnpm
   
   # Install Expo CLI
   npm install -g @expo/cli
   
   # Install project dependencies
   pnpm install
   ```

2. **Environment Variables**
   ```bash
   # Copy example env files
   cp apps/api/.env.example apps/api/.env
   
   # Edit with your local settings
   vim apps/api/.env
   ```

3. **Start Development**
   ```bash
   # Terminal 1: Start API
   pnpm dev:api
   
   # Terminal 2: Start Mobile App
   pnpm dev:mobile
   ```

## Project Structure Deep Dive

### Apps Directory
```
apps/
├── mobile/              # React Native Mobile App
│   ├── app/            # Expo Router pages
│   │   ├── (tabs)/     # Tab navigation screens
│   │   └── _layout.tsx # Root layout
│   ├── assets/         # Images, fonts, etc.
│   ├── app.json        # Expo configuration
│   └── package.json    # Mobile dependencies
└── api/                # Node.js Backend API
    ├── src/
    │   ├── routes/     # API route handlers
    │   ├── app.ts      # Express app setup
    │   ├── index.ts    # Development server
    │   └── lambda.ts   # AWS Lambda handler
    └── package.json    # API dependencies
```

### Packages Directory
```
packages/
├── shared/             # Shared utilities
│   ├── src/
│   │   ├── schemas.ts  # Zod validation schemas
│   │   ├── config.ts   # Environment configuration
│   │   ├── utils.ts    # Utility functions
│   │   └── constants.ts # App constants
│   └── package.json
└── theme/              # Design system
    ├── src/
    │   ├── colors.ts   # Color palette
    │   ├── spacing.ts  # Spacing scale
    │   └── typography.ts # Font styles
    └── package.json
```

### Infrastructure Directory
```
infrastructure/
├── src/
│   ├── environments/   # Environment-specific configs
│   ├── ecobeat-stack.ts # Main CDK stack
│   └── app.ts          # CDK app entry point
├── cdk.json            # CDK configuration
└── package.json        # Infrastructure dependencies
```

## Development Workflow

### Feature Development
1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/user-authentication
   ```

2. **Develop Feature**
   - Write code in appropriate app/package
   - Add tests for new functionality
   - Update documentation if needed

3. **Test Locally**
   ```bash
   pnpm test              # Run all tests
   pnpm lint              # Check code style
   pnpm type-check        # TypeScript validation
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: implement user authentication"
   ```

5. **Create Pull Request**
   - Push branch to GitHub
   - Create PR to `develop` branch
   - Request code review

### API Development

#### Adding New Endpoints
1. **Create Route Handler**
   ```typescript
   // apps/api/src/routes/users.ts
   import { Router } from 'express';
   
   export const usersRouter = Router();
   
   usersRouter.get('/', (req, res) => {
     res.json({ users: [] });
   });
   ```

2. **Register Route**
   ```typescript
   // apps/api/src/app.ts
   import { usersRouter } from './routes/users';
   
   app.use('/users', usersRouter);
   ```

3. **Add Types**
   ```typescript
   // packages/shared/src/schemas.ts
   export const UserSchema = z.object({
     id: z.string(),
     email: z.string().email(),
     name: z.string(),
   });
   ```

#### Testing API Endpoints
```bash
# Start API server
pnpm dev:api

# Test endpoints
curl http://localhost:3001/health
curl http://localhost:3001/users
```

### Mobile Development

#### Adding New Screens
1. **Create Screen Component**
   ```typescript
   // apps/mobile/app/(tabs)/settings.tsx
   import { View, Text } from 'react-native';
   
   export default function SettingsScreen() {
     return (
       <View>
         <Text>Settings</Text>
       </View>
     );
   }
   ```

2. **Update Navigation**
   ```typescript
   // apps/mobile/app/(tabs)/_layout.tsx
   <Tabs.Screen
     name="settings"
     options={{
       title: 'Settings',
       tabBarIcon: ({ color }) => (
         <MaterialIcons name="settings" size={24} color={color} />
       ),
     }}
   />
   ```

#### Using Shared Packages
```typescript
// Import shared types
import { UserSchema } from '@ecobeat/shared';

// Import theme
import { colors, spacing } from '@ecobeat/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.md,
  },
});
```

## Code Standards

### TypeScript
- **Strict mode enabled** for all packages
- **Explicit return types** for functions
- **Interface over type** for object shapes
- **Zod schemas** for runtime validation

### React/React Native
- **Functional components** with hooks
- **TypeScript props interfaces**
- **StyleSheet** for styling (no inline styles)
- **Meaningful component names**

### API
- **Express Router** for route organization
- **Async/await** over promises
- **Proper error handling** with status codes
- **Request validation** with Zod

### Git Commits
- **Conventional Commits** format
- **feat:** for new features
- **fix:** for bug fixes
- **docs:** for documentation
- **refactor:** for code refactoring

## Testing Strategy

### Unit Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Integration Tests
```bash
# Test API endpoints
pnpm test:api

# Test mobile app components
pnpm test:mobile
```

### E2E Tests
```bash
# Test full user flows
pnpm test:e2e
```

## Debugging

### API Debugging
```bash
# Start API with debugger
DEBUG=* pnpm dev:api

# View API logs
tail -f logs/api.log
```

### Mobile Debugging
```bash
# React Native debugger
npx react-devtools

# Expo debugging
expo start --tunnel
```

### Infrastructure Debugging
```bash
# CDK diff
pnpm infra:diff

# CloudFormation events
aws logs tail /aws/lambda/ecobeat-api
```

## Performance Optimization

### Bundle Size
```bash
# Analyze mobile bundle
expo export --platform ios --dev false
npx @expo/bundle-analyzer dist/index.js

# Analyze API bundle
npm run build
npm run analyze
```

### Database Optimization
- **Index frequently queried fields**
- **Use connection pooling**
- **Implement query caching**
- **Monitor slow queries**

### API Performance
- **Implement response caching**
- **Use compression middleware**
- **Optimize Lambda cold starts**
- **Monitor execution time**

## Troubleshooting

### Common Issues

#### "Metro bundler won't start"
```bash
# Clear Metro cache
npx expo start --clear
```

#### "API won't connect"
```bash
# Check if port is in use
lsof -i :3001

# Restart API server
pnpm dev:api
```

#### "TypeScript errors"
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
pnpm install
```

#### "CDK deployment fails"
```bash
# Check AWS credentials
aws sts get-caller-identity

# Bootstrap CDK (first time only)
npx cdk bootstrap
```

## Contributing Guidelines

### Code Review Checklist
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No sensitive data exposed
- [ ] Performance impact considered

### Release Process
1. **Merge to staging** → Auto-deploy to staging
2. **Test on staging** environment
3. **Create release PR** to main
4. **Manual deploy** to production
5. **Monitor** post-deployment metrics
