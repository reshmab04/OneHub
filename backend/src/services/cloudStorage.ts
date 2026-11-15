import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export interface UploadResult {
  path: string;
  status: 'synced' | 'failed';
  timestamp: string;
  size?: number;
  error?: string;
}

export interface CloudFile {
  name: string;
  path: string;
  size: number;
  contentType: string;
  lastModified: string;
}

export interface SyncHistoryEntry {
  path: string;
  action: 'upload' | 'delete';
  status: 'synced' | 'failed';
  timestamp: string;
  size?: number;
  error?: string;
}

export interface SyncStatus {
  connected: boolean;
  lastSync: string | null;
  provider: string;
  totalFiles: number;
  totalSize: number;
}

class CloudStorageService {
  private client: SupabaseClient | null = null;
  private syncHistory: SyncHistoryEntry[] = [];
  private lastSyncTime: string | null = null;

  private getClient(): SupabaseClient {
    if (!this.client) {
      if (!config.supabase.url || !config.supabase.serviceKey) {
        throw new AppError(503, 'Cloud storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
      }
      this.client = createClient(config.supabase.url, config.supabase.serviceKey);
    }
    return this.client;
  }

  isConfigured(): boolean {
    return !!(config.supabase.url && config.supabase.serviceKey);
  }

  async uploadFile(relativePath: string, buffer: Buffer, contentType: string): Promise<UploadResult> {
    try {
      const client = this.getClient();
      const { error } = await client.storage
        .from(config.supabase.bucket)
        .upload(relativePath, buffer, {
          contentType,
          upsert: true,
        });

      if (error) throw error;

      const timestamp = new Date().toISOString();
      this.lastSyncTime = timestamp;

      const entry: SyncHistoryEntry = {
        path: relativePath,
        action: 'upload',
        status: 'synced',
        timestamp,
        size: buffer.length,
      };
      this.syncHistory.unshift(entry);
      if (this.syncHistory.length > 100) this.syncHistory.length = 100;

      return { path: relativePath, status: 'synced', timestamp, size: buffer.length };
    } catch (error: any) {
      const timestamp = new Date().toISOString();
      this.syncHistory.unshift({
        path: relativePath,
        action: 'upload',
        status: 'failed',
        timestamp,
        error: error.message,
      });

      return {
        path: relativePath,
        status: 'failed',
        timestamp,
        error: error.message,
      };
    }
  }

  async listFiles(prefix?: string): Promise<CloudFile[]> {
    const client = this.getClient();
    const { data, error } = await client.storage
      .from(config.supabase.bucket)
      .list(prefix || '', { limit: 200, sortBy: { column: 'name', order: 'asc' } });

    if (error) throw new AppError(500, error.message);

    return (data || [])
      .filter((f) => f.name !== '.emptyFolderPlaceholder')
      .map((f) => ({
        name: f.name,
        path: prefix ? `${prefix}/${f.name}` : f.name,
        size: f.metadata?.size ?? 0,
        contentType: f.metadata?.mimetype ?? 'application/octet-stream',
        lastModified: f.updated_at || f.created_at || new Date().toISOString(),
      }));
  }

  async downloadFile(filePath: string): Promise<{ buffer: Buffer; contentType: string }> {
    const client = this.getClient();
    const { data, error } = await client.storage
      .from(config.supabase.bucket)
      .download(filePath);

    if (error) throw new AppError(404, `File not found: ${error.message}`);

    const arrayBuffer = await data.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: data.type || 'application/octet-stream',
    };
  }

  async deleteFile(filePath: string): Promise<void> {
    const client = this.getClient();
    const { error } = await client.storage
      .from(config.supabase.bucket)
      .remove([filePath]);

    if (error) throw new AppError(500, error.message);

    const timestamp = new Date().toISOString();
    this.syncHistory.unshift({
      path: filePath,
      action: 'delete',
      status: 'synced',
      timestamp,
    });
    if (this.syncHistory.length > 100) this.syncHistory.length = 100;
  }

  getHistory(): SyncHistoryEntry[] {
    return this.syncHistory.slice(0, 50);
  }

  async getStatus(): Promise<SyncStatus> {
    const configured = this.isConfigured();
    let totalFiles = 0;
    let totalSize = 0;

    if (configured) {
      try {
        const files = await this.listFiles();
        totalFiles = files.length;
        totalSize = files.reduce((sum, f) => sum + f.size, 0);
      } catch {
        // ignore — status still returns connected state
      }
    }

    return {
      connected: configured,
      lastSync: this.lastSyncTime,
      provider: 'supabase',
      totalFiles,
      totalSize,
    };
  }
}

export const cloudStorageService = new CloudStorageService();
