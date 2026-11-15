import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import * as users from '../database/users';
import { logSecurityEvent } from '../database/security-log';
import { isValidEmail, isStrongPassword, passwordErrors, isValidName, sanitize } from '../middleware/validate';
import type { AuthPayload } from '../middleware/auth';

function setAuthCookie(res: Response, payload: AuthPayload) {
  const token = jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  });
  res.cookie(config.auth.cookieName, token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email format' });
  }

  const user = users.findByEmail(email);

  if (!user) {
    logSecurityEvent('login_failed', req, email, 'Unknown email');
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  if (users.isAccountLocked(user)) {
    logSecurityEvent('login_failed', req, email, 'Account locked');
    return res.status(423).json({
      success: false,
      error: 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.',
    });
  }

  const valid = await users.verifyPassword(user, password);

  if (!valid) {
    const attempts = users.incrementFailedAttempts(user.id);
    if (attempts >= 5) {
      logSecurityEvent('account_locked', req, email);
    } else {
      logSecurityEvent('login_failed', req, email, `Attempt ${attempts}`);
    }
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  users.resetFailedAttempts(user.id);
  logSecurityEvent('login_success', req, email);

  const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
  setAuthCookie(res, payload);

  res.json({
    success: true,
    data: { email: user.email, fullName: user.full_name, role: user.role },
  });
}

export async function register(req: Request, res: Response) {
  const { email, fullName, password, confirmPassword } = req.body;

  if (!email || !fullName || !password || !confirmPassword) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address' });
  }

  if (!isValidName(fullName)) {
    return res.status(400).json({ success: false, error: 'Full name is required (max 100 characters)' });
  }

  if (!isStrongPassword(password)) {
    const missing = passwordErrors(password);
    return res.status(400).json({
      success: false,
      error: `Password must contain: ${missing.join(', ')}`,
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, error: 'Passwords do not match' });
  }

  const existing = users.findByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, error: 'An account with this email already exists' });
  }

  const safeUser = await users.createUser(email, sanitize(fullName), password);
  logSecurityEvent('register', req, email);

  const payload: AuthPayload = { userId: safeUser.id, email: safeUser.email, role: safeUser.role };
  setAuthCookie(res, payload);

  res.status(201).json({
    success: true,
    data: { email: safeUser.email, fullName: safeUser.full_name, role: safeUser.role },
  });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  // Always return the same response to prevent email enumeration
  const genericMsg = 'If an account exists with that email, a reset link has been generated.';

  if (!isValidEmail(email)) {
    return res.json({ success: true, message: genericMsg });
  }

  const user = users.findByEmail(email);

  if (!user) {
    return res.json({ success: true, message: genericMsg });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  users.setResetToken(user.id, token, expires);
  logSecurityEvent('password_reset_requested', req, email);

  const resetUrl = `http://localhost:5173/reset-password?token=${token}`;
  console.log(`\n  [Password Reset] ${email}\n  URL: ${resetUrl}\n  Expires: ${expires.toISOString()}\n`);

  res.json({ success: true, message: genericMsg });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  if (!isStrongPassword(password)) {
    const missing = passwordErrors(password);
    return res.status(400).json({
      success: false,
      error: `Password must contain: ${missing.join(', ')}`,
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, error: 'Passwords do not match' });
  }

  const user = users.findByResetToken(token);
  if (!user) {
    return res.status(400).json({ success: false, error: 'Invalid or expired reset link' });
  }

  await users.updatePassword(user.id, password);
  users.clearResetToken(user.id);
  users.resetFailedAttempts(user.id);
  logSecurityEvent('password_reset_completed', req, user.email);

  res.json({ success: true, message: 'Password has been reset. You can now log in.' });
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  if (!isStrongPassword(newPassword)) {
    const missing = passwordErrors(newPassword);
    return res.status(400).json({
      success: false,
      error: `Password must contain: ${missing.join(', ')}`,
    });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ success: false, error: 'New passwords do not match' });
  }

  const user = users.findById(req.user!.userId);
  if (!user) {
    return res.status(401).json({ success: false, error: 'User not found' });
  }

  const valid = await users.verifyPassword(user, currentPassword);
  if (!valid) {
    return res.status(401).json({ success: false, error: 'Current password is incorrect' });
  }

  await users.updatePassword(user.id, newPassword);
  logSecurityEvent('password_changed', req, user.email);

  res.json({ success: true, message: 'Password changed successfully' });
}

export function me(req: Request, res: Response) {
  const user = users.findById(req.user!.userId);
  if (!user) {
    return res.status(401).json({ success: false, error: 'User not found' });
  }
  res.json({
    success: true,
    data: { email: user.email, fullName: user.full_name, role: user.role },
  });
}

export function logout(req: Request, res: Response) {
  if (req.user) {
    logSecurityEvent('logout', req, req.user.email);
  }
  res.clearCookie(config.auth.cookieName, { path: '/' });
  res.json({ success: true });
}
