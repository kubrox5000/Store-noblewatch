import crypto from 'crypto';
import type { Request } from 'express';

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSigningSecret(passwordHash: string): string {
  const envSecret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) {
    return envSecret;
  }
  return crypto
    .createHash('sha256')
    .update(`${passwordHash || 'admin123'}:noblewatch_admin_hmac_2026`)
    .digest('hex');
}

export function issueAdminSessionToken(passwordHash: string): string {
  const now = Date.now();
  const payload = {
    role: 'admin',
    iat: now,
    exp: now + TOKEN_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSigningSecret(passwordHash))
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token: string, passwordHash: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return false;

  try {
    const expectedSig = crypto
      .createHmac('sha256', getSigningSecret(passwordHash))
      .update(encodedPayload)
      .digest('base64url');

    const sigBuf = Buffer.from(signature, 'utf-8');
    const expBuf = Buffer.from(expectedSig, 'utf-8');
    if (sigBuf.length !== expBuf.length) return false;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;

    const decoded = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    if (decoded?.role !== 'admin') return false;
    if (typeof decoded?.exp !== 'number' || decoded.exp < Date.now()) return false;

    return true;
  } catch {
    return false;
  }
}

export function extractAdminToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const customHeader = req.headers['x-admin-token'];
  if (typeof customHeader === 'string' && customHeader.trim()) {
    return customHeader.trim();
  }
  return null;
}

export function isAuthorizedAdminRequest(req: Request, passwordHash: string): boolean {
  const token = extractAdminToken(req);
  if (!token) return false;
  return verifyAdminSessionToken(token, passwordHash);
}

export function isAllowedAdminEmail(email: string | undefined | null): {
  allowed: boolean;
  reason?: string;
} {
  const rawList = process.env.ADMIN_EMAILS?.trim();
  if (!rawList) {
    // Allow in local development; in production require ADMIN_EMAILS or password login
    const isProd =
      process.env.NODE_ENV === 'production' ||
      Boolean(process.env.NETLIFY) ||
      Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
    if (isProd) {
      return {
        allowed: false,
        reason: 'تسجيل الدخول عبر Google يتطلب تحديد البريد المسموح في متغير ADMIN_EMAILS على الاستضافة، أو استخدم كلمة المرور.',
      };
    }
    return { allowed: true };
  }

  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) {
    return { allowed: false, reason: 'حساب Google لا يحتوي على بريد إلكتروني صالح.' };
  }

  const allowedSet = new Set(
    rawList
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );

  if (!allowedSet.has(normalized)) {
    return { allowed: false, reason: 'هذا الحساب غير مصرح له بالدخول إلى لوحة تحكم المتجر.' };
  }

  return { allowed: true };
}
