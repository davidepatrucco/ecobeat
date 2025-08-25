#!/bin/bash

# Deploy script for production environment
# This ensures we stay in the infrastructure directory

echo "🚀 Starting PRODUCTION deployment..."
echo "⚠️  WARNING: This is a PRODUCTION deployment!"
echo "Current directory: $(pwd)"

# Ask for confirmation
read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Production deployment cancelled."
    exit 1
fi

# Build only infrastructure
echo "📦 Building infrastructure..."
npm run build

echo "Current directory after build: $(pwd)"

# Deploy to production
echo "🌍 Deploying to AWS production..."
cdk deploy --context environment=production

echo "✅ PRODUCTION deployment completed!"
