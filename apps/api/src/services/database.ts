import mongoose from 'mongoose';
import { getAppConfig } from '@ecobeat/shared';

export class DatabaseService {
  private static instance: DatabaseService;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Connect to MongoDB with configuration from SSM
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('🔗 Database already connected');
      return;
    }

    try {
      const config = await getAppConfig();

      if (!config.MONGODB_URI) {
        throw new Error('MONGODB_URI not found in configuration');
      }

      // Configure mongoose
      mongoose.set('strictQuery', true);

      // Connection options
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      };

      await mongoose.connect(config.MONGODB_URI, options);

      this.isConnected = true;
      console.log('✅ Connected to MongoDB successfully');

      // Handle connection events
      mongoose.connection.on('error', error => {
        console.error('❌ MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
        this.isConnected = true;
      });
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Check if database is connected
   */
  public isConnectedToDatabase(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return (
      states[mongoose.connection.readyState as keyof typeof states] || 'unknown'
    );
  }

  /**
   * Test database connection with ping
   */
  public async ping(): Promise<{ success: boolean; latency: number }> {
    if (!this.isConnected) {
      return { success: false, latency: -1 };
    }

    try {
      const start = Date.now();
      await mongoose.connection.db?.admin().ping();
      const latency = Date.now() - start;

      return { success: true, latency };
    } catch (error) {
      console.error('Database ping failed:', error);
      return { success: false, latency: -1 };
    }
  }
}
