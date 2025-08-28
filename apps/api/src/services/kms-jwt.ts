import AWS from 'aws-sdk';
import { getAppConfig } from '@ecobeat/shared';
import * as forge from 'node-forge';

export interface KMSJWTService {
  signJWT(payload: any, keyId: string): Promise<string>;
  getPublicKey(keyId: string): Promise<any>;
  generateJWKS(): Promise<any>;
}

export class KMSJWTServiceImpl implements KMSJWTService {
  private static instance: KMSJWTServiceImpl;
  private kms: AWS.KMS;
  private keyId: string | null = null;

  private constructor() {
    this.kms = new AWS.KMS({ region: process.env.AWS_REGION || 'eu-west-1' });
  }

  public static getInstance(): KMSJWTServiceImpl {
    if (!KMSJWTServiceImpl.instance) {
      KMSJWTServiceImpl.instance = new KMSJWTServiceImpl();
    }
    return KMSJWTServiceImpl.instance;
  }

  /**
   * Initialize KMS JWT service
   */
  public async initialize(): Promise<void> {
    if (!this.keyId) {
      const config = await getAppConfig();

      // In development, we might not have KMS access
      if (config.NODE_ENV === 'development') {
        console.log('🔧 Development mode: KMS JWT disabled, using fallback');
        this.keyId = null; // Will trigger fallback mode
        return;
      }

      // Try to get KMS key ID from environment or config
      this.keyId = process.env.KMS_KEY_ID || config.AWS_KMS_KEY_ID || null;

      if (!this.keyId) {
        throw new Error('KMS_KEY_ID not found in configuration');
      }
    }
  }

  /**
   * Sign JWT using KMS
   */
  public async signJWT(payload: any, customKeyId?: string): Promise<string> {
    await this.initialize();

    const keyId = customKeyId || this.keyId!;

    // Create JWT header
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: keyId,
    };

    // Create JWT payload with standard claims
    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      ...payload,
      iat: now,
      exp: now + 24 * 60 * 60, // 24 hours
      iss: 'ecobeat-api',
      aud: 'ecobeat-mobile',
    };

    // Encode header and payload
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
      'base64url'
    );
    const encodedPayload = Buffer.from(JSON.stringify(jwtPayload)).toString(
      'base64url'
    );

    // Create signing input
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    try {
      // Sign with KMS
      const signResult = await this.kms
        .sign({
          KeyId: keyId,
          Message: Buffer.from(signingInput),
          MessageType: 'RAW',
          SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
        })
        .promise();

      if (!signResult.Signature) {
        throw new Error('KMS signing failed - no signature returned');
      }

      // Encode signature
      const signature = Buffer.from(
        signResult.Signature as Uint8Array
      ).toString('base64url');

      return `${signingInput}.${signature}`;
    } catch (error) {
      console.error('KMS JWT signing error:', error);
      throw new Error('Failed to sign JWT with KMS');
    }
  }

  /**
   * Get public key from KMS for JWKS
   */
  public async getPublicKey(customKeyId?: string): Promise<any> {
    await this.initialize();

    const keyId = customKeyId || this.keyId!;

    try {
      const result = await this.kms
        .getPublicKey({
          KeyId: keyId,
        })
        .promise();

      if (!result.PublicKey) {
        throw new Error('No public key returned from KMS');
      }

      return {
        keyId,
        publicKey: result.PublicKey,
        keyUsage: result.KeyUsage,
        keySpec: result.KeySpec,
        signingAlgorithms: result.SigningAlgorithms,
      };
    } catch (error) {
      console.error('Error getting public key from KMS:', error);
      throw new Error('Failed to get public key from KMS');
    }
  }

  /**
   * Generate JWKS (JSON Web Key Set) from KMS public key
   */
  public async generateJWKS(): Promise<any> {
    await this.initialize();

    // Development fallback
    if (!this.keyId) {
      console.log('🔧 Development mode: Returning mock JWKS');
      return {
        keys: [],
        notice: 'Development mode - JWT verification using shared secret',
        environment: 'development',
      };
    }

    try {
      const publicKeyInfo = await this.getPublicKey();

      // Convert DER-encoded public key to JWK format using node-forge
      const publicKeyDer = Buffer.from(publicKeyInfo.publicKey as Uint8Array);
      const asn1 = forge.asn1.fromDer(publicKeyDer.toString('binary'));
      const publicKey = forge.pki.publicKeyFromAsn1(asn1);

      // Extract RSA modulus and exponent
      if (!('n' in publicKey) || !('e' in publicKey)) {
        throw new Error('Invalid RSA public key structure');
      }

      const rsaPublicKey = publicKey as forge.pki.rsa.PublicKey;

      // Convert BigInteger to base64url
      const modulus = Buffer.from(rsaPublicKey.n.toString(16), 'hex').toString(
        'base64url'
      );
      const exponent = Buffer.from(rsaPublicKey.e.toString(16), 'hex').toString(
        'base64url'
      );

      // Generate key ID from the KMS key ID
      const kid = `${publicKeyInfo.keyId}-${Date.now().toString(36)}`;

      const jwk = {
        kty: 'RSA',
        kid: kid,
        use: 'sig',
        alg: 'RS256',
        n: modulus,
        e: exponent,
        // Additional metadata
        kms_key_id: publicKeyInfo.keyId,
        key_spec: publicKeyInfo.keySpec,
      };

      return {
        keys: [jwk],
        metadata: {
          issuer: 'ecobeat-api',
          algorithm: 'RS256',
          generated_at: new Date().toISOString(),
          cache_max_age: 900, // 15 minutes
        },
      };
    } catch (error) {
      console.error('Error generating JWKS:', error);
      throw new Error('Failed to generate JWKS');
    }
  }
}
