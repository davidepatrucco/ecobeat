#!/bin/bash

# Deploy script for staging environment
# This ensures we stay in the infrastructure directory

echo "🚀 Starting staging deployment..."
echo "Current directory: $(pwd)"

# Build only infrastructure
echo "📦 Building infrastructure..."
npm run build

echo "Current directory after build: $(pwd)"

# Deploy to staging
echo "🌍 Deploying to AWS staging..."
cdk deploy --context environment=staging

echo "✅ Deployment completed!"
