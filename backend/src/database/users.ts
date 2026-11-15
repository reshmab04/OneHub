import bcrypt from 'bcrypt';
import db from './index';
import type { UserRecord } from './index';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export type User = UserRecord;
export type SafeUser = Omit<User, 'password_hash' | 'reset_token' | 'reset_token_expires'>;

export function findByEmail(email: string): User | undefined {
  return db.findUserByEmail(email);
}

export function findById(id: number): User | undefined {
  return db.findUserById(id);
}

export function findByResetToken(token: string): User | undefined {
  return db.findUserByResetToken(token);
}

export async function createUser(
  email: string,
  fullName: string,
  password: string,
  role: 'admin' | 'user' = 'user',
): Promise<SafeUser> {
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const now = new Date().toISOString();
  const user = db.createUser({
    email: email.toLowerCase().trim(),
    full_name: fullName.trim(),
    password_hash: hash,
    role,
    failed_login_attempts: 0,
    locked_until: null,
    reset_token: null,
    reset_token_expires: null,
    created_at: now,
    updated_at: now,
  });
  return toSafeUser(user);
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password_hash);
}

export async function updatePassword(userId: number, newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  db.updateUser(userId, { password_hash: hash, updated_at: new Date().toISOString() });
}

export function incrementFailedAttempts(userId: number): number {
  const user = findById(userId)!;
  const attempts = user.failed_login_attempts + 1;

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    const lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
    db.updateUser(userId, { failed_login_attempts: attempts, locked_until: lockUntil });
  } else {
    db.updateUser(userId, { failed_login_attempts: attempts });
  }

  return attempts;
}

export function resetFailedAttempts(userId: number): void {
  db.updateUser(userId, { failed_login_attempts: 0, locked_until: null });
}

export function isAccountLocked(user: User): boolean {
  if (!user.locked_until) return false;
  if (new Date(user.locked_until) > new Date()) return true;
  resetFailedAttempts(user.id);
  return false;
}

export function setResetToken(userId: number, token: string, expiresAt: Date): void {
  db.updateUser(userId, { reset_token: token, reset_token_expires: expiresAt.toISOString() });
}

export function clearResetToken(userId: number): void {
  db.updateUser(userId, { reset_token: null, reset_token_expires: null });
}

export function toSafeUser(user: User): SafeUser {
  const { password_hash, reset_token, reset_token_expires, ...safe } = user;
  return safe;
}

export function countAdmins(): number {
  return db.countAdmins();
}
