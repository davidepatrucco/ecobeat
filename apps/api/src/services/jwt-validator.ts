import * as forge from 'node-forge';
import { KMSJWTServiceImpl } from './kms-jwt';

export interface JWTPayload {
  sub: string;
  email?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  [key: string]: any;
}

export interface JWTValidationResult {
  isValid: boolean;
  payload?: JWTPayload;
  error?: string;
}

export class JWTValidatorService {
  private static instance: JWTValidatorService;
  private jwksCache: any = null;
  private cacheExpiry = 0;
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  private constructor() {}

  public static getInstance(): JWTValidatorService {
    if (!JWTValidatorService.instance) {
      JWTValidatorService.instance = new JWTValidatorService();
    }
    return JWTValidatorService.instance;
  }

  /**
   * Get JWKS with caching
   */
  private async getJWKS(): Promise<any> {
    const now = Date.now();

    // Return cached JWKS if still valid
    if (this.jwksCache && now < this.cacheExpiry) {
      return this.jwksCache;
    }

    // Fetch fresh JWKS
    const kmsJwtService = KMSJWTServiceImpl.getInstance();
    this.jwksCache = await kmsJwtService.generateJWKS();
    this.cacheExpiry = now + this.CACHE_DURATION;

    return this.jwksCache;
  }

  /**
   * Find JWK by kid (Key ID)
   */
  private async findJWKByKid(kid: string): Promise<any> {
    const jwks = await this.getJWKS();

    if (!jwks.keys || !Array.isArray(jwks.keys)) {
      throw new Error('Invalid JWKS format');
    }

    const jwk = jwks.keys.find((key: any) => key.kid === kid);
    if (!jwk) {
      throw new Error(`JWK not found for kid: ${kid}`);
    }

    return jwk;
  }

  /**
   * Convert JWK to forge RSA public key
   */
  private jwkToPublicKey(jwk: any): forge.pki.rsa.PublicKey {
    if (jwk.kty !== 'RSA') {
      throw new Error('Only RSA keys are supported');
    }

    // Decode base64url encoded modulus and exponent
    const nBuffer = Buffer.from(jwk.n, 'base64url');
    const eBuffer = Buffer.from(jwk.e, 'base64url');

    // Convert to hex strings and then to BigIntegers
    const n = new forge.jsbn.BigInteger(nBuffer.toString('hex'), 16);
    const e = new forge.jsbn.BigInteger(eBuffer.toString('hex'), 16);

    // Create RSA public key
    return forge.pki.rsa.setPublicKey(n, e);
  }

  /**
   * Validate JWT signature and claims
   */
  public async validateJWT(token: string): Promise<JWTValidationResult> {
    try {
      // Parse JWT
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { isValid: false, error: 'Invalid JWT format' };
      }

      const [headerB64, payloadB64, signatureB64] = parts;

      // Validate parts exist
      if (!headerB64 || !payloadB64 || !signatureB64) {
        return { isValid: false, error: 'Invalid JWT format - missing parts' };
      }

      // Decode header and payload
      const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
      const payload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString()
      );

      // Check algorithm
      if (header.alg !== 'RS256') {
        return { isValid: false, error: 'Unsupported algorithm' };
      }

      // Check required claims
      const now = Math.floor(Date.now() / 1000);

      if (!payload.exp || payload.exp < now) {
        return { isValid: false, error: 'Token expired' };
      }

      if (!payload.iat || payload.iat > now + 300) {
        // Allow 5 min clock skew
        return { isValid: false, error: 'Invalid issued at time' };
      }

      if (payload.iss !== 'ecobeat-api') {
        return { isValid: false, error: 'Invalid issuer' };
      }

      // Get JWK for signature verification
      const jwk = await this.findJWKByKid(header.kid);
      const publicKey = this.jwkToPublicKey(jwk);

      // Verify signature
      const signingInput = `${headerB64}.${payloadB64}`;
      const signature = Buffer.from(signatureB64, 'base64url');

      // Create MD (Message Digest) object
      const md = forge.md.sha256.create();
      md.update(signingInput, 'utf8');

      const isSignatureValid = publicKey.verify(
        md.digest().bytes(),
        signature.toString('binary')
      );

      if (!isSignatureValid) {
        return { isValid: false, error: 'Invalid signature' };
      }

      return {
        isValid: true,
        payload: payload as JWTPayload,
      };
    } catch (error) {
      console.error('JWT validation error:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Clear JWKS cache (useful for testing or forced refresh)
   */
  public clearCache(): void {
    this.jwksCache = null;
    this.cacheExpiry = 0;
  }
}
