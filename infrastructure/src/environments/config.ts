export interface EnvironmentConfig {
  stage: string;
  domainName?: string;
  certificateArn?: string;
  mongodb: {
    uri: string;
    cluster: string;
  };
  redis: {
    nodeType: string;
    numNodes: number;
  };
  lambda: {
    memorySize: number;
    timeout: number;
  };
  monitoring: {
    enableXRay: boolean;
    logRetentionDays: number;
  };
}

// Development environment (local)
export const developmentConfig: EnvironmentConfig = {
  stage: 'dev',
  mongodb: {
    uri: 'mongodb://localhost:27017/ecobeat-dev',
    cluster: 'local'
  },
  redis: {
    nodeType: 'cache.t3.micro',
    numNodes: 1
  },
  lambda: {
    memorySize: 256,
    timeout: 30
  },
  monitoring: {
    enableXRay: false,
    logRetentionDays: 7
  }
};

// Staging environment
export const stagingConfig: EnvironmentConfig = {
  stage: 'staging',
  domainName: 'api-staging.ecobeat.app',
  mongodb: {
    uri: 'mongodb+srv://staging-user:${MONGO_PASSWORD}@ecobeat-staging.mongodb.net/ecobeat',
    cluster: 'M2'
  },
  redis: {
    nodeType: 'cache.t3.micro',
    numNodes: 1
  },
  lambda: {
    memorySize: 512,
    timeout: 30
  },
  monitoring: {
    enableXRay: true,
    logRetentionDays: 14
  }
};

// Production environment
export const productionConfig: EnvironmentConfig = {
  stage: 'prod',
  domainName: 'api.ecobeat.app',
  mongodb: {
    uri: 'mongodb+srv://prod-user:${MONGO_PASSWORD}@ecobeat-prod.mongodb.net/ecobeat',
    cluster: 'M10'
  },
  redis: {
    nodeType: 'cache.t3.small',
    numNodes: 2
  },
  lambda: {
    memorySize: 1024,
    timeout: 30
  },
  monitoring: {
    enableXRay: true,
    logRetentionDays: 30
  }
};

export function getEnvironmentConfig(stage: string): EnvironmentConfig {
  switch (stage) {
    case 'dev':
      return developmentConfig;
    case 'staging':
      return stagingConfig;
    case 'prod':
      return productionConfig;
    default:
      throw new Error(`Unknown environment: ${stage}`);
  }
}
