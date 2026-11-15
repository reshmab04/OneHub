import db from './index';
import type { Request } from 'express';

export type SecurityEvent =
  | 'login_success'
  | 'login_failed'
  | 'account_locked'
  | 'register'
  | 'password_changed'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'logout'
  | 'unauthorized_access';

export function logSecurityEvent(
  event: SecurityEvent,
  req: Request,
  email?: string,
  details?: string,
): void {
  try {
    db.addSecurityLog({
      event,
      email: email ?? null,
      ip_address: req.ip ?? req.socket.remoteAddress ?? 'unknown',
      user_agent: (req.headers['user-agent'] ?? 'unknown').slice(0, 500),
      details: details ?? null,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Never let logging failures crash the app
  }
}
