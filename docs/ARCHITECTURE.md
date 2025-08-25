# 🏗️ Infrastructure Architecture

## Overview

Ecobeat usa una architettura serverless su AWS per garantire scalabilità, sicurezza e costi ottimizzati.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   CloudFront    │    │   API Gateway   │
│   (Expo/RN)     │◄──►│      CDN        │◄──►│     REST API    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │  Lambda Function │
                                               │   (Node.js 20)   │
                                               └─────────────────┘
                                                        │
                    ┌─────────────────┐                │                ┌─────────────────┐
                    │   MongoDB Atlas │◄───────────────┼───────────────►│ Redis ElastiCache│
                    │   (Primary DB)  │                │                │   (Sessions)    │
                    └─────────────────┘                │                └─────────────────┘
                                                        │
                                               ┌─────────────────┐
                                               │   AWS KMS       │
                                               │ (JWT Signing)   │
                                               └─────────────────┘
```

## Environments

### Development
- **Location**: Local development
- **API**: `localhost:3001`
- **Mobile**: Expo DevTools
- **Database**: Local MongoDB or shared dev instance

### Staging
- **Location**: AWS `eu-west-1`
- **API**: `https://api-staging.ecobeat.app`
- **Database**: MongoDB Atlas M2 cluster
- **Cache**: Redis t3.micro single node
- **Lambda**: 512MB, 30s timeout

### Production
- **Location**: AWS `eu-west-1`
- **API**: `https://api.ecobeat.app`
- **Database**: MongoDB Atlas M10 cluster with replicas
- **Cache**: Redis t3.small cluster (2 nodes)
- **Lambda**: 1024MB, 30s timeout
- **CDN**: CloudFront for global distribution

## Security

### Authentication
- **JWT Tokens**: Signed with AWS KMS RSA-2048 keys
- **Refresh Tokens**: Stored in Redis with TTL
- **Password Hashing**: Argon2id with tuned parameters

### Network Security
- **WAF**: AWS WAF v2 with rate limiting
- **CORS**: Restricted to allowed origins
- **API Keys**: For mobile app authentication
- **VPC**: Private subnets for databases

### Data Protection
- **Encryption at Rest**: All databases encrypted
- **Encryption in Transit**: TLS 1.3 everywhere
- **Secrets Management**: AWS SSM Parameter Store
- **Logging**: CloudWatch with sensitive data masking

## Monitoring & Observability

### Metrics
- **Lambda**: Duration, errors, cold starts
- **API Gateway**: Request count, latency, 4xx/5xx errors
- **Database**: Connection pool, query performance
- **Redis**: Hit ratio, memory usage

### Alarms
- **High Error Rate**: >5 errors in 2 periods
- **High Latency**: >10s average duration
- **Database Issues**: Connection failures
- **Memory Usage**: >80% Lambda memory

### Logging
- **Application Logs**: Structured JSON logging
- **Access Logs**: API Gateway access patterns
- **Error Tracking**: Centralized error collection
- **X-Ray Tracing**: Request flow visualization

## Cost Optimization

### Lambda
- **Right-sizing**: Memory allocated based on profiling
- **Provisioned Concurrency**: Only for critical endpoints
- **Cold Start Optimization**: Minimal dependencies

### Database
- **Connection Pooling**: Shared connections across invocations
- **Query Optimization**: Indexes on frequent queries
- **Data Archiving**: Old data moved to cheaper storage

### Caching Strategy
- **Redis**: Session data, frequently accessed data
- **CloudFront**: Static assets, API responses (when appropriate)
- **Application**: In-memory caching for Lambda

## Deployment Strategy

### Blue-Green Deployment
- **Staging**: Always reflects latest `staging` branch
- **Production**: Manual promotion from staging
- **Rollback**: Instant rollback capability
- **Health Checks**: Automated health verification

### Infrastructure as Code
- **AWS CDK**: TypeScript-based infrastructure
- **Environment Parity**: Same code, different configs
- **Version Control**: All infrastructure versioned
- **Automated Testing**: Infrastructure tests in CI/CD

## Disaster Recovery

### Backup Strategy
- **MongoDB**: Automated daily backups with 30-day retention
- **Redis**: No backup needed (cache only)
- **Code**: Git repository with multiple remotes

### Recovery Procedures
- **RTO**: 15 minutes for critical systems
- **RPO**: 4 hours maximum data loss
- **Multi-AZ**: Automatic failover for databases
- **Documentation**: Step-by-step recovery procedures
