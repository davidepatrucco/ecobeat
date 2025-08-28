import { Router } from 'express';
import { KMSJWTServiceImpl } from '../services/kms-jwt';
import { JWTValidatorService } from '../services/jwt-validator';

const testRouter = Router();

/**
 * GET /test/jwks - Test JWKS generation and JWT validation
 */
testRouter.get('/jwks', async (req, res): Promise<void> => {
  try {
    const kmsJwtService = KMSJWTServiceImpl.getInstance();
    const validator = JWTValidatorService.getInstance();

    // Generate a test JWT
    const testPayload = {
      sub: 'test-user-123',
      email: 'test@example.com',
      role: 'user',
    };

    console.log('🔧 Generating test JWT...');
    const testJWT = await kmsJwtService.signJWT(testPayload);

    console.log('🔧 Getting JWKS...');
    const jwks = await kmsJwtService.generateJWKS();

    console.log('🔧 Validating JWT...');
    const validationResult = await validator.validateJWT(testJWT);

    res.status(200).json({
      message: 'JWKS Test Results',
      jwt: {
        token: testJWT,
        payload: testPayload,
      },
      jwks: jwks,
      validation: validationResult,
      test_passed: validationResult.isValid,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('JWKS test error:', error);
    res.status(500).json({
      error: 'Test Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /test/validate-jwt - Validate a custom JWT
 */
testRouter.post('/validate-jwt', async (req, res): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Token is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const validator = JWTValidatorService.getInstance();
    const result = await validator.validateJWT(token);

    res.status(200).json({
      message: 'JWT Validation Result',
      validation: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('JWT validation test error:', error);
    res.status(500).json({
      error: 'Validation Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export { testRouter };
