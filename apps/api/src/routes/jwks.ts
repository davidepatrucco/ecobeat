import { Router } from 'express';
import { KMSJWTServiceImpl } from '../services/kms-jwt';

const jwksRouter = Router();

/**
 * GET /.well-known/jwks.json - JSON Web Key Set endpoint
 * This endpoint provides public keys for JWT verification
 */
jwksRouter.get('/.well-known/jwks.json', async (req, res): Promise<void> => {
  try {
    const kmsJwtService = KMSJWTServiceImpl.getInstance();
    const jwks = await kmsJwtService.generateJWKS();

    // Set appropriate headers for JWKS
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=900'); // 15 minutes

    res.status(200).json(jwks);
  } catch (error) {
    console.error('JWKS endpoint error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate JWKS',
      timestamp: new Date().toISOString(),
    });
  }
});

export { jwksRouter };
