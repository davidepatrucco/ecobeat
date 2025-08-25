export const productionConfig = {
  lambda: {
    memorySize: 1024,      // More memory for production
    timeout: 30,
  },
  monitoring: {
    enableXRay: true,
    logRetentionDays: 30,  // Keep logs longer in production
  },
  api: {
    throttling: {
      rateLimit: 10000,    // Higher rate limit for production
      burstLimit: 5000,
    },
  },
};
