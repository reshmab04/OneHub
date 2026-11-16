import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function ensureJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set to a strong random string (≥32 chars) in production');
  }
  return crypto.randomBytes(48).toString('base64url');
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  github: {
    token: process.env.GITHUB_TOKEN || '',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
    bucket: process.env.SUPABASE_BUCKET || 'devhub-files',
  },
  auth: {
    adminEmail: process.env.ADMIN_EMAIL || 'admin@onehub.app',
    adminPassword: process.env.ADMIN_PASSWORD || 'Admin@2024!',
    jwtSecret: ensureJwtSecret(),
    jwtExpiresIn: '24h',
    cookieName: 'onehub_token',
  },
};
