import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import crypto from 'crypto';
import { adminAuth } from '../lib/firebase-admin.ts';
import {
  DEFAULT_ORDER_SECURITY,
  DEFAULT_PROMO_CODES,
  DEFAULT_TRACKING_PIXELS,
  assembleMediaChunksDb,
  clearAllOrdersDb,
  clearSecurityLogsDb,
  createOrderDb,
  createProductDb,
  createReviewDb,
  deleteMediaAssetDb,
  deleteOrderDb,
  deleteProductDb,
  deleteReviewDb,
  ensureDatabaseSchema,
  getMediaAssetDb,
  getStoreCacheVersion,
  getStoreSnapshot,
  insertSecurityLogDb,
  listMediaAssetsDb,
  saveMediaAssetDb,
  saveMediaChunkDb,
  syncStoreDataDb,
  updateOrderDb,
  updateProductDb,
  updateReviewApprovalDb,
  updateSettingsDb,
} from '../db/storeRepo.ts';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { getOrCreateUser } from '../db/users.ts';
import {
  isAllowedAdminEmail,
  isAuthorizedAdminRequest,
  issueAdminSessionToken,
} from './adminAuth.ts';
import { resolvePublicOrigin } from './seoHtml.ts';

function normalizeCityServer(city: unknown): string {
  const trimmed = String(city || '').trim();
  if (!trimmed) return '';
  if (trimmed === 'الدار') return 'الدار البيضاء';
  if (trimmed === 'بني') return 'بني ملال';
  if (trimmed === 'القصر') return 'القصر الكبير';
  return trimmed;
}

function evaluatePromoCodeServer(
  rawCode: unknown,
  subtotal: number,
  promoList: any[] | undefined,
  lang: string = 'ar'
): {
  valid: boolean;
  promo?: { code: string; type: 'percent' | 'fixed'; value: number; discountAmount: number };
  message?: string;
} {
  const normalized = String(rawCode || '').trim().toUpperCase();
  const isFr = lang === 'fr';
  if (!normalized) {
    return {
      valid: false,
      message: isFr ? 'Veuillez saisir un code promo.' : 'يرجى إدخال رمز التخفيض أولاً.',
    };
  }
  const activeList = Array.isArray(promoList) ? promoList : DEFAULT_PROMO_CODES;
  const matched = activeList.find(
    (p: any) => String(p?.code || '').trim().toUpperCase() === normalized && p?.active !== false
  );
  if (!matched) {
    return {
      valid: false,
      message: isFr
        ? 'Code promo invalide ou expiré.'
        : 'رمز التخفيض غير صحيح أو غير مفعل حالياً.',
    };
  }
  const minAmt = Math.max(0, Number(matched.minOrderAmount) || 0);
  if (subtotal < minAmt) {
    return {
      valid: false,
      message: isFr
        ? `Ce code nécessite un montant minimum de ${minAmt} DH.`
        : `يتطلب هذا الرمز طلباً بقيمة لا تقل عن ${minAmt} درهم.`,
    };
  }
  const ruleType: 'percent' | 'fixed' = matched.type === 'fixed' ? 'fixed' : 'percent';
  const rawVal = Math.max(0, Number(matched.value) || 0);
  const discountAmount =
    ruleType === 'fixed'
      ? Math.min(subtotal, Math.round(rawVal))
      : Math.min(subtotal, Math.round((subtotal * Math.min(90, rawVal)) / 100));

  return {
    valid: true,
    promo: {
      code: String(matched.code).trim().toUpperCase(),
      type: ruleType,
      value: rawVal,
      discountAmount,
    },
  };
}

export const IS_SERVERLESS = Boolean(
  process.env.NETLIFY ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.VERCEL
);

export const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

function ensureLocalDirs() {
  if (IS_SERVERLESS) return;
  try {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  } catch {
    // Ignore on read-only filesystems
  }
}

ensureLocalDirs();

export const app = express();

// Normalize Netlify Function paths so both /api/* and /.netlify/functions/api/* work cleanly
app.use((req: Request, _res: Response, next: NextFunction) => {
  const fnPrefix = '/.netlify/functions/api';
  if (req.url.startsWith(fnPrefix)) {
    const stripped = req.url.slice(fnPrefix.length) || '/';
    req.url = stripped.startsWith('/') ? stripped : `/${stripped}`;
  }
  if (
    !req.url.startsWith('/api') &&
    !req.url.startsWith('/uploads') &&
    req.url !== '/robots.txt' &&
    req.url !== '/sitemap.xml'
  ) {
    if (IS_SERVERLESS) {
      req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
    }
  }
  next();
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.raw({ type: 'application/octet-stream', limit: '6mb' }));

// Fast Gzip compression for /api/* JSON responses (skip when serverless platform compresses already if needed, safe here)
app.use('/api', (req: Request, res: Response, next) => {
  const acceptEncoding = String(req.headers['accept-encoding'] || '');
  if (!acceptEncoding.includes('gzip') || IS_SERVERLESS) {
    return next();
  }
  const origJson = res.json.bind(res);
  res.json = ((body: any) => {
    try {
      const jsonStr = JSON.stringify(body);
      if (jsonStr.length < 1024) {
        return origJson(body);
      }
      const compressed = zlib.gzipSync(Buffer.from(jsonStr, 'utf-8'));
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Vary', 'Accept-Encoding');
      return res.send(compressed);
    } catch {
      return origJson(body);
    }
  }) as any;
  next();
});

// ----------------- AUTO TRANSITION HELPER ----------------- //

const AUTO_PREPARE_DELAY_MS = 0; // Immediate transition upon confirmation

export async function processConfirmedToPreparingTransitions(dbInput?: any): Promise<boolean> {
  const db = dbInput || (await getStoreSnapshot());
  if (!Array.isArray(db.orders)) return false;

  const now = Date.now();
  let changed = false;

  const updatedOrders: any[] = [];
  for (const order of db.orders) {
    if (order.status === 'تم التأكيد') {
      let confirmedTs = order.confirmedAt ? new Date(order.confirmedAt).getTime() : 0;
      let orderChanged = false;
      if (!confirmedTs || Number.isNaN(confirmedTs)) {
        const historyEntry = Array.isArray(order.history)
          ? [...order.history].reverse().find((h: any) => h.status === 'تم التأكيد')
          : null;
        confirmedTs = historyEntry?.time ? new Date(historyEntry.time).getTime() : now;
        if (confirmedTs) {
          order.confirmedAt = new Date(confirmedTs).toISOString();
          changed = true;
          orderChanged = true;
        }
      }

      if (confirmedTs && now - confirmedTs >= AUTO_PREPARE_DELAY_MS) {
        order.status = 'قيد التجهيز';
        order.history = Array.isArray(order.history) ? order.history : [];
        order.history.push({
          status: 'قيد التجهيز',
          time: new Date().toISOString(),
          note: 'تم نقل الطلب تلقائياً إلى قسم "طلبات قيد التجهيز" فور تأكيده',
        });
        changed = true;
        orderChanged = true;
      }
      if (orderChanged) {
        updatedOrders.push(order);
      }
    }
  }

  for (const upd of updatedOrders) {
    await updateOrderDb(upd);
  }

  return changed;
}

// ----------------- SECURITY & VALIDATION HELPERS ----------------- //

interface OrderChallengeRecord {
  a: number;
  b: number;
  answer: number;
  createdAt: number;
  used: boolean;
}

const orderChallenges = new Map<string, OrderChallengeRecord>();
const ipOrderTimestamps = new Map<string, number[]>();

function cleanupSecurityMaps() {
  const now = Date.now();
  for (const [id, rec] of orderChallenges.entries()) {
    if (now - rec.createdAt > 30 * 60 * 1000) {
      orderChallenges.delete(id);
    }
  }
  for (const [ip, tsList] of ipOrderTimestamps.entries()) {
    const recent = tsList.filter((ts) => now - ts < 60 * 60 * 1000);
    if (recent.length === 0) {
      ipOrderTimestamps.delete(ip);
    } else {
      ipOrderTimestamps.set(ip, recent);
    }
  }
}

function getClientIp(req: Request): string {
  const nfIp = req.headers['x-nf-client-connection-ip'];
  if (typeof nfIp === 'string' && nfIp.trim()) {
    return nfIp.trim();
  }
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) {
    return fwd.split(',')[0].trim();
  }
  if (Array.isArray(fwd) && fwd.length > 0) {
    return fwd[0].split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || 'unknown';
}

function normalizeMoroccanPhoneServer(phone: string): string {
  let cleaned = String(phone || '').replace(/[\s\-\.\(\)\+]/g, '');
  if (cleaned.startsWith('00212')) {
    cleaned = '0' + cleaned.slice(5);
  } else if (cleaned.startsWith('212') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.slice(3);
  }
  return cleaned;
}

function isFakeMoroccanPhoneServer(phone: string): boolean {
  const norm = normalizeMoroccanPhoneServer(phone);
  if (!/^0[567]\d{8}$/.test(norm)) return true;

  const subscriber = norm.slice(2);
  if (/^(\d)\1{7}$/.test(subscriber)) return true;
  if (/^(\d)\1{8}$/.test(norm.slice(1))) return true;

  const digitCounts: Record<string, number> = {};
  for (const ch of subscriber) {
    digitCounts[ch] = (digitCounts[ch] || 0) + 1;
  }
  if (Math.max(...Object.values(digitCounts)) >= 7) return true;

  const fakeSequences = [
    '0612345678',
    '0712345678',
    '0512345678',
    '0698765432',
    '0798765432',
    '0601020304',
    '0610203040',
    '0612121212',
    '0600112233',
    '0623456789',
    '0687654321',
  ];
  if (fakeSequences.includes(norm)) return true;
  if (/^(\d{2})\1{3}$/.test(subscriber)) return true;
  if ('0123456789'.includes(subscriber) || '9876543210'.includes(subscriber)) {
    return true;
  }

  return false;
}

function isFakeCustomerTextServer(text: string, type: 'name' | 'address'): boolean {
  const trimmed = String(text || '').trim();
  if (type === 'name') {
    if (trimmed.length < 3) return true;
    if (/\d/.test(trimmed)) return true;
    if (/(.)\1{3,}/u.test(trimmed)) return true;
    const letters = trimmed.replace(/[\s\-_\.]/g, '');
    const uniqueChars = new Set(letters.toLowerCase().split(''));
    if (letters.length < 3 || uniqueChars.size < 2) return true;
  } else {
    if (!trimmed) return false;
    if (/(.)\1{4,}/u.test(trimmed)) return true;
  }

  const lower = trimmed.toLowerCase();
  const blockedWords = [
    'test', 'testing', 'fake', 'spam', 'bot', 'admin', 'asdf', 'qwer', 'qwerty',
    'azerty', 'zxcv', 'null', 'none', 'unknown', 'xxx', 'تجربة', 'تجريبي',
    'تيست', 'فحص', 'وهمي', 'مزيف', 'روبوت', 'مجهول', 'بدون اسم', 'لا أحد',
  ];
  if (blockedWords.some((w) => lower === w || lower.split(/\s+/).includes(w))) {
    return true;
  }
  return false;
}

async function logSecurityBlock(entry: {
  reasonType: 'duplicate' | 'fake' | 'bot' | 'blacklist' | 'rate_limit';
  reasonMessage: string;
  customerName?: string;
  phone?: string;
  city?: string;
  ip?: string;
}) {
  await insertSecurityLogDb({
    id: `sec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    time: new Date().toISOString(),
    ...entry,
  });
}

function hashAdminPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

function verifyAdminPassword(plain: string, stored: string): boolean {
  if (!plain || !stored) return false;
  if (stored.startsWith('scrypt:')) {
    const parts = stored.split(':');
    if (parts.length !== 3) return false;
    const [, salt, keyHex] = parts;
    const keyBuf = Buffer.from(keyHex, 'hex');
    const derivedBuf = crypto.scryptSync(plain, salt, 64);
    if (keyBuf.length !== derivedBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, derivedBuf);
  }
  return plain === stored;
}

async function requireAdminSession(req: Request, res: Response): Promise<any | null> {
  const db = await getStoreSnapshot();
  const currentPasswordHash = db.settings.adminPasswordHash || 'admin123';
  if (!isAuthorizedAdminRequest(req, currentPasswordHash)) {
    res.status(401).json({
      success: false,
      unauthorized: true,
      message: 'انتهت جلسة الإدارة أو غير مصرح بالوصول. يرجى تسجيل الدخول للوحة التحكم.',
    });
    return null;
  }
  return db;
}

function sanitizePublicOrder(o: any) {
  if (!o) return null;
  const { clientIp: _ip, ...rest } = o;
  return rest;
}

// ----------------- PERSISTENT MEDIA HELPERS ----------------- //

function mimeFromExt(ext: string): string {
  const lower = ext.toLowerCase();
  if (lower === 'png') return 'image/png';
  if (lower === 'webp') return 'image/webp';
  if (lower === 'avif') return 'image/avif';
  if (lower === 'gif') return 'image/gif';
  if (lower === 'svg') return 'image/svg+xml';
  if (lower === 'mp4') return 'video/mp4';
  if (lower === 'webm') return 'video/webm';
  if (lower === 'mov') return 'video/quicktime';
  return 'image/jpeg';
}

async function extractBase64ImageToStorage(
  dataUrl: string,
  prefix = 'watch_img',
  idx = 0
): Promise<string> {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }
  try {
    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex === -1) return dataUrl;
    const header = dataUrl.slice(0, commaIndex).toLowerCase();
    const base64Data = dataUrl.slice(commaIndex + 1);
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length < 32) return dataUrl;

    let ext = 'jpg';
    if (header.includes('png')) ext = 'png';
    else if (header.includes('webp')) ext = 'webp';
    else if (header.includes('avif')) ext = 'avif';
    else if (header.includes('gif')) ext = 'gif';
    else if (header.includes('svg')) ext = 'svg';

    const filename = `${prefix}_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}.${ext}`;
    const mimeType = mimeFromExt(ext);

    await saveMediaAssetDb({ filename, mimeType, buffer });

    if (!IS_SERVERLESS) {
      try {
        ensureLocalDirs();
        fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
      } catch {
        // Ignore local disk fallback error
      }
    }

    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Failed to persist inline base64 image:', err);
    return dataUrl;
  }
}

async function sanitizeProductImages(images: any[]): Promise<string[]> {
  if (!Array.isArray(images)) return [];
  return Promise.all(
    images.map((img, i) =>
      typeof img === 'string' && img.startsWith('data:image/')
        ? extractBase64ImageToStorage(img, 'watch_img', i)
        : Promise.resolve(img)
    )
  );
}

async function sanitizeProductVideos(videos: any[]): Promise<any[]> {
  if (!Array.isArray(videos)) return [];
  return Promise.all(
    videos.map(async (v, i) => {
      if (!v || typeof v !== 'object') return v;
      let url = v.url || '';
      if (typeof url === 'string' && url.startsWith('data:video')) {
        try {
          const commaIndex = url.indexOf(',');
          if (commaIndex !== -1) {
            const base64Data = url.slice(commaIndex + 1);
            const buffer = Buffer.from(base64Data, 'base64');
            const ext = url.includes('webm') ? 'webm' : 'mp4';
            const filename = `watch_video_${Date.now()}_${i}.${ext}`;
            await saveMediaAssetDb({
              filename,
              mimeType: mimeFromExt(ext),
              buffer,
            });
            if (!IS_SERVERLESS) {
              try {
                ensureLocalDirs();
                fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
              } catch {}
            }
            url = `/uploads/${filename}`;
          }
        } catch (err) {
          console.error('Failed to persist inline video:', err);
        }
      }
      let poster = v.poster || '';
      if (typeof poster === 'string' && poster.startsWith('data:image/')) {
        poster = await extractBase64ImageToStorage(poster, 'watch_poster', i);
      }
      return {
        ...v,
        url,
        poster,
      };
    })
  );
}

// ----------------- SEO CRAWLER ENDPOINTS (/robots.txt & /sitemap.xml) ----------------- //

function escapeXml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

app.get('/robots.txt', (req: Request, res: Response) => {
  const origin = resolvePublicOrigin(req);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      'Disallow: /*?*admin*',
      '',
      `Sitemap: ${origin}/sitemap.xml`,
    ].join('\n')
  );
});

app.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const origin = resolvePublicOrigin(req);
    const db = await getStoreSnapshot();
    const publishedProducts = Array.isArray(db.products)
      ? db.products.filter((p: any) => p && p.isPublished !== false)
      : [];
    const today = new Date().toISOString().split('T')[0];

    const urlEntries: string[] = [
      `  <url>
    <loc>${escapeXml(origin)}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
    ];

    for (const prod of publishedProducts) {
      const prodUrl = `${origin}/?product=${encodeURIComponent(prod.id)}`;
      const firstImg = Array.isArray(prod.images) ? prod.images[0] : '';
      const validImg =
        firstImg && typeof firstImg === 'string' && !firstImg.startsWith('data:')
          ? /^https?:\/\//i.test(firstImg)
            ? firstImg
            : `${origin}${firstImg.startsWith('/') ? '' : '/'}${firstImg}`
          : '';
      const imageBlock = validImg
        ? `\n    <image:image>\n      <image:loc>${escapeXml(validImg)}</image:loc>\n      <image:title>${escapeXml(prod.name)}</image:title>\n    </image:image>`
        : '';

      urlEntries.push(`  <url>
    <loc>${escapeXml(prodUrl)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imageBlock}
  </url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    return res.send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    return res.status(500).send('Failed to generate sitemap');
  }
});

// ----------------- API ROUTES ----------------- //

// 0. Health Check (verify Neon DB + deployment health)
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await ensureDatabaseSchema();
    const db = await getStoreSnapshot();
    return res.json({
      ok: true,
      serverless: IS_SERVERLESS,
      productsCount: db.products.length,
      categoriesCount: db.categories.length,
    });
  } catch (err: any) {
    console.error('Healthcheck error:', err);
    return res.status(500).json({
      ok: false,
      error: err?.message || 'Database connection failed',
    });
  }
});

// Firebase Auth verification & PostgreSQL user sync
app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userRecord = await getOrCreateUser(
      req.user!.uid,
      req.user!.email || '',
      req.user!.name
    );
    return res.json({ success: true, user: userRecord });
  } catch (error) {
    console.error('Error syncing authenticated user:', error);
    return res.status(500).json({ success: false, message: 'فشل التحقق من الحساب' });
  }
});

// Pre-serialized + pre-gzipped /api/store-data payload cache keyed by storeCacheVersion
interface CachedStorePayload {
  version: number;
  etag: string;
  plainBuffer: Buffer;
  gzipBuffer: Buffer;
}
const cachedStorePayloads: {
  public?: CachedStorePayload;
  admin?: CachedStorePayload;
} = {};

function getOrBuildStorePayload(db: any, isAdminAuthenticated: boolean): CachedStorePayload {
  const version = getStoreCacheVersion();
  const key = isAdminAuthenticated ? 'admin' : 'public';
  const existing = cachedStorePayloads[key];
  if (existing && existing.version === version) {
    return existing;
  }

  const deletedSet = new Set(db.deletedOrderIds || []);
  const cleanOrders = isAdminAuthenticated
    ? (db.orders || []).filter(
        (o: any) => !deletedSet.has(o.id) && !deletedSet.has(o.orderNumber)
      )
    : [];

  const { adminPasswordHash: _pw, ...publicSettings } = db.settings || ({} as any);
  const mergedOrderSecurity = {
    ...DEFAULT_ORDER_SECURITY,
    ...(publicSettings.orderSecurity || {}),
  };
  if (!isAdminAuthenticated) {
    delete (mergedOrderSecurity as any).promoCodes;
    delete publicSettings.promoCodes;
  }
  const mergedSettings = {
    ...publicSettings,
    orderSecurity: mergedOrderSecurity,
  };

  const jsonStr = JSON.stringify({
    success: true,
    isAdminAuthenticated,
    data: {
      settings: mergedSettings,
      categories: db.categories,
      products: db.products,
      orders: cleanOrders,
      reviews: db.reviews,
    },
  });
  const plainBuffer = Buffer.from(jsonStr, 'utf-8');
  const gzipBuffer = IS_SERVERLESS ? plainBuffer : zlib.gzipSync(plainBuffer);
  const built: CachedStorePayload = {
    version,
    etag: `"nw-${version}-${key}"`,
    plainBuffer,
    gzipBuffer,
  };
  cachedStorePayloads[key] = built;
  return built;
}

// 1. Get entire store initial state (orders returned ONLY for verified admin session)
app.get('/api/store-data', async (req: Request, res: Response) => {
  try {
    const db = await getStoreSnapshot();
    if (Array.isArray(db.orders) && db.orders.some((o: any) => o.status === 'تم التأكيد')) {
      await processConfirmedToPreparingTransitions(db);
    }

    const isAdminAuthenticated = isAuthorizedAdminRequest(
      req,
      db.settings.adminPasswordHash || 'admin123'
    );

    const payload = getOrBuildStorePayload(db, isAdminAuthenticated);
    res.setHeader('ETag', payload.etag);
    res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    res.setHeader('Vary', 'Authorization, Accept-Encoding');

    if (req.headers['if-none-match'] === payload.etag) {
      return res.status(304).end();
    }

    const acceptEncoding = String(req.headers['accept-encoding'] || '');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (acceptEncoding.includes('gzip') && !IS_SERVERLESS) {
      res.setHeader('Content-Encoding', 'gzip');
      return res.send(payload.gzipBuffer);
    }
    return res.send(payload.plainBuffer);
  } catch (error) {
    console.error('Error fetching store-data:', error);
    return res.status(500).json({ success: false, message: 'تعذر تحميل بيانات المتجر من قاعدة البيانات' });
  }
});

// Public Promo / Discount Code validation endpoint
app.post('/api/promo/validate', async (req: Request, res: Response) => {
  try {
    const { code, subtotal, lang } = req.body || {};
    const db = await getStoreSnapshot();
    const promoList = Array.isArray(db.settings?.promoCodes)
      ? db.settings.promoCodes
      : DEFAULT_PROMO_CODES;
    const numericSubtotal = Math.max(0, Number(subtotal) || 0);
    const result = evaluatePromoCodeServer(code, numericSubtotal, promoList, String(lang || 'ar'));
    if (!result.valid || !result.promo) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.json({ success: true, promo: result.promo });
  } catch (error) {
    console.error('Error validating promo code:', error);
    return res.status(500).json({ success: false, message: 'تعذر التحقق من رمز التخفيض حالياً' });
  }
});

// Anti-bot challenge endpoint for checkout modal
app.get('/api/order-challenge', (_req: Request, res: Response) => {
  cleanupSecurityMaps();
  const a = Math.floor(1 + Math.random() * 6);
  const b = Math.floor(1 + Math.random() * 6);
  const challengeId = `ch_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  orderChallenges.set(challengeId, {
    a,
    b,
    answer: a + b,
    createdAt: Date.now(),
    used: false,
  });
  return res.json({
    success: true,
    challengeId,
    a,
    b,
  });
});

// Public single-order lookup for Order Tracking Modal (prevents exposing all customers' data)
app.get('/api/orders/lookup', async (req: Request, res: Response) => {
  try {
    const rawQuery = String(req.query.q || '').trim();
    if (!rawQuery || rawQuery.length < 4) {
      return res.status(400).json({ success: false, message: 'يرجى إدخال رقم الطلب أو رقم الهاتف' });
    }

    const db = await getStoreSnapshot();
    await processConfirmedToPreparingTransitions(db);

    const upper = rawQuery.toUpperCase();
    const strippedCertPrefix = upper.replace(/^NW-WR-/, '');
    const cleanedPhone = normalizeMoroccanPhoneServer(rawQuery);
    const deletedSet = new Set(db.deletedOrderIds || []);

    const found = (db.orders || []).find((o: any) => {
      if (deletedSet.has(o.id) || deletedSet.has(o.orderNumber)) return false;
      const ordNum = String(o.orderNumber || '').toUpperCase();
      if (ordNum === upper || ordNum === strippedCertPrefix) return true;
      const ordPhone = normalizeMoroccanPhoneServer(o.phone || '');
      return cleanedPhone.length >= 9 && ordPhone === cleanedPhone;
    });

    if (!found) {
      return res.status(404).json({ success: false, message: 'لم يتم العثور على أي طلب' });
    }

    return res.json({ success: true, order: sanitizePublicOrder(found) });
  } catch (error) {
    console.error('Error looking up order:', error);
    return res.status(500).json({ success: false, message: 'تعذر البحث عن الطلب' });
  }
});

// Public single-order fetch for WhatsApp #confirm-order?id=... link
app.get('/api/orders/public/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const normalizedId = String(id || '').trim().replace(/^NW-WR-/i, '');
    const db = await getStoreSnapshot();
    await processConfirmedToPreparingTransitions(db);
    const deletedSet = new Set(db.deletedOrderIds || []);

    const found = (db.orders || []).find(
      (o: any) =>
        !deletedSet.has(o.id) &&
        !deletedSet.has(o.orderNumber) &&
        (o.id === id || o.orderNumber === id || o.id === normalizedId || o.orderNumber === normalizedId)
    );

    if (!found) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    return res.json({ success: true, order: sanitizePublicOrder(found) });
  } catch (error) {
    console.error('Error fetching public order:', error);
    return res.status(500).json({ success: false, message: 'تعذر تحميل بيانات الطلب' });
  }
});

// Public 1-click customer confirmation / cancellation from WhatsApp link
app.post('/api/orders/:id/customer-action', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, note } = req.body || {};
    if (action !== 'confirmed' && action !== 'cancelled') {
      return res.status(400).json({ success: false, message: 'إجراء غير صالح' });
    }

    const db = await getStoreSnapshot();
    const existing = (db.orders || []).find(
      (o: any) => o.id === id || o.orderNumber === id
    );
    if (!existing) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    const order = { ...existing };
    order.history = Array.isArray(order.history) ? [...order.history] : [];
    const nowIso = new Date().toISOString();

    if (action === 'confirmed') {
      order.customerAction = 'confirmed';
      order.confirmedAt = nowIso;
      if (order.status === 'جديد' || order.status === 'تم التأكيد') {
        order.history.push({
          status: 'تم التأكيد',
          time: nowIso,
          note: note || 'تم تأكيد الطلب إلكترونياً من طرف الزبون عبر رابط الواتساب',
        });
        order.status = 'قيد التجهيز';
        order.history.push({
          status: 'قيد التجهيز',
          time: nowIso,
          note: 'تم نقل الطلب تلقائياً إلى قسم "طلبات قيد التجهيز" فور تأكيده',
        });
      }
    } else {
      order.customerAction = 'cancelled';
      if (order.status !== 'تم التسليم' && order.status !== 'ملغى') {
        order.status = 'ملغى';
        order.history.push({
          status: 'ملغى',
          time: nowIso,
          note: note || 'تم إلغاء الطلب من طرف الزبون عبر رابط الواتساب',
        });
      }
    }

    await updateOrderDb(order);
    return res.json({ success: true, order: sanitizePublicOrder(order) });
  } catch (error) {
    console.error('Error processing customer order action:', error);
    return res.status(500).json({ success: false, message: 'تعذر تحديث حالة الطلب' });
  }
});

// Admin-only orders endpoint for live polling & auto-transitions
app.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    await processConfirmedToPreparingTransitions(db);
    const deletedSet = new Set(db.deletedOrderIds || []);
    const cleanOrders = (db.orders || []).filter(
      (o: any) => !deletedSet.has(o.id) && !deletedSet.has(o.orderNumber)
    );
    return res.json({ success: true, orders: cleanOrders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ success: false, message: 'تعذر تحميل الطلبات' });
  }
});

// Sync full store data (Admin only)
app.post('/api/sync-data', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    const { products, categories, settings, orders } = req.body;
    const deletedSet = new Set(db.deletedOrderIds || []);

    const safeProducts =
      Array.isArray(products) && products.length > 0
        ? await Promise.all(
            products.map(async (p: any) => ({
              ...p,
              images: await sanitizeProductImages(p.images),
              videos: await sanitizeProductVideos(p.videos),
            }))
          )
        : undefined;

    const safeOrders = Array.isArray(orders)
      ? orders.filter((o: any) => !deletedSet.has(o.id) && !deletedSet.has(o.orderNumber))
      : undefined;

    let safeSettings: any = undefined;
    if (settings && typeof settings === 'object' && Object.keys(settings).length > 0) {
      const cleaned = { ...settings };
      delete cleaned.adminPasswordHash;
      safeSettings = { ...db.settings, ...cleaned };
    }

    await syncStoreDataDb({
      products: safeProducts,
      categories: Array.isArray(categories) && categories.length > 0 ? categories : undefined,
      settings: safeSettings,
      orders: safeOrders,
    });

    return res.json({ success: true, message: 'تمت مزامنة البيانات وحفظها في قاعدة البيانات بنجاح' });
  } catch (error) {
    console.error('Error in sync-data:', error);
    return res.status(500).json({ success: false, message: 'فشلت المزامنة' });
  }
});

// 2. Admin Login Verification (Password)
app.post('/api/admin/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const db = await getStoreSnapshot();
    const currentPassword = db.settings.adminPasswordHash || 'admin123';
    if (verifyAdminPassword(String(password || ''), currentPassword)) {
      const token = issueAdminSessionToken(currentPassword);
      return res.json({ success: true, token });
    }
    return res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ success: false, message: 'خطأ في التحقق من كلمة المرور' });
  }
});

// 2a. Admin Google Login Verification (Checks Firebase ID Token + ADMIN_EMAILS guard)
app.post('/api/admin/google-login', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'رمز التحقق من Google مفقود' });
    }

    const idToken = authHeader.slice(7).trim();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const emailCheck = isAllowedAdminEmail(decoded.email);
    if (!emailCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: emailCheck.reason || 'هذا الحساب غير مصرح له بإدارة المتجر',
      });
    }

    await getOrCreateUser(decoded.uid, decoded.email || '', decoded.name);
    const db = await getStoreSnapshot();
    const token = issueAdminSessionToken(db.settings.adminPasswordHash || 'admin123');
    return res.json({ success: true, token, email: decoded.email });
  } catch (error) {
    console.error('Admin Google login error:', error);
    return res.status(401).json({
      success: false,
      message: 'تعذر التحقق من حساب Google، يرجى المحاولة مجدداً أو استخدام كلمة المرور',
    });
  }
});

// 2b. Change Admin Dashboard Password
app.post('/api/admin/change-password', async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return res.status(400).json({
        success: false,
        message: 'يجب أن تتكون كلمة المرور الجديدة من 4 أحرف أو أرقام على الأقل',
      });
    }
    if (newPassword.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور طويلة جداً',
      });
    }

    const db = await getStoreSnapshot();
    const storedHash = db.settings.adminPasswordHash || 'admin123';

    let isAuthorized = false;
    if (typeof currentPassword === 'string' && currentPassword.length > 0) {
      isAuthorized = verifyAdminPassword(currentPassword, storedHash);
    }

    if (!isAuthorized) {
      isAuthorized = isAuthorizedAdminRequest(req, storedHash);
    }

    if (!isAuthorized) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
          if (decoded?.uid && isAllowedAdminEmail(decoded.email).allowed) {
            isAuthorized = true;
          }
        } catch {
          // ignore invalid token
        }
      }
    }

    if (!isAuthorized) {
      return res.status(401).json({
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة',
      });
    }

    const nextHash = hashAdminPassword(newPassword);
    await updateSettingsDb({
      ...db.settings,
      adminPasswordHash: nextHash,
    });

    const newToken = issueAdminSessionToken(nextHash);
    return res.json({
      success: true,
      token: newToken,
      message: 'تم تغيير كلمة مرور لوحة التحكم وحفظها بنجاح',
    });
  } catch (error) {
    console.error('Error changing admin password:', error);
    return res.status(500).json({
      success: false,
      message: 'تعذر تحديث كلمة المرور، يرجى المحاولة مرة أخرى',
    });
  }
});

// 3. Orders Management
// Create a new COD order (public, protected against bots, fake orders, blacklist, and duplicates)
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    cleanupSecurityMaps();
    const { customerName, phone, city, address, notes, items, security, website, promoCode } = req.body;

    if (!customerName || !phone || !city || !address || String(address).trim().length < 5 || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال جميع البيانات الأساسية بما فيها العنوان بالتفصيل (5 أحرف على الأقل)',
      });
    }

    const db = await getStoreSnapshot();
    const sec = {
      ...DEFAULT_ORDER_SECURITY,
      ...((db.settings && db.settings.orderSecurity) || {}),
    };
    const clientIp = getClientIp(req);
    const normPhone = normalizeMoroccanPhoneServer(phone);
    const userAgent = String(req.headers['user-agent'] || '').toLowerCase();

    // ---- 1. ANTI-BOT PROTECTION ----
    if (sec.preventBots) {
      const honeypotVal = String((security && security.honeypot) || website || '').trim();
      if (honeypotVal.length > 0) {
        await logSecurityBlock({
          reasonType: 'bot',
          reasonMessage: 'تم إيقاف محاولة روبوت (تعبئة الحقل المخفي)',
          customerName: String(customerName),
          phone: normPhone,
          city: String(city),
          ip: clientIp,
        });
        return res.status(403).json({
          success: false,
          message: 'تم رفض الطلب لأسباب أمنية (اشتباه نشاط آلي).',
        });
      }

      const botUaPatterns = ['curl/', 'wget/', 'python-requests', 'postman', 'headless', 'puppeteer', 'playwright', 'selenium', 'httpclient'];
      if (
        !userAgent ||
        botUaPatterns.some((p) => userAgent.includes(p)) ||
        security?.webdriver === true ||
        security?.interacted === false
      ) {
        await logSecurityBlock({
          reasonType: 'bot',
          reasonMessage: 'تم رفض طلب آلي قادم من متصفح أو سكربت روبوت',
          customerName: String(customerName),
          phone: normPhone,
          city: String(city),
          ip: clientIp,
        });
        return res.status(403).json({
          success: false,
          message: 'عذراً، هذا النظام محمي ضد الطلبات الآلية والروبوتات.',
        });
      }

      const formOpenedAt = Number(security?.formOpenedAt || 0);
      const elapsedMs = Date.now() - formOpenedAt;
      if (!formOpenedAt || Number.isNaN(formOpenedAt) || elapsedMs < 2500) {
        await logSecurityBlock({
          reasonType: 'bot',
          reasonMessage: `إرسال سريع جداً (${Math.max(0, elapsedMs)}ms) يشتبه أنه روبوت`,
          customerName: String(customerName),
          phone: normPhone,
          city: String(city),
          ip: clientIp,
        });
        return res.status(403).json({
          success: false,
          message: 'تم إرسال الطلب بسرعة غير طبيعية. يرجى التأكد من بياناتك والمحاولة بهدوء.',
        });
      }
    }

    // ---- 2. ANTI-FAKE ORDERS PROTECTION ----
    if (sec.preventFakeOrders) {
      if (isFakeCustomerTextServer(customerName, 'name')) {
        await logSecurityBlock({
          reasonType: 'fake',
          reasonMessage: `اسم عميل مزيف أو غير صالح: "${String(customerName).trim()}"`,
          customerName: String(customerName),
          phone: normPhone,
          city: String(city),
          ip: clientIp,
        });
        return res.status(400).json({
          success: false,
          message: 'يرجى إدخال اسمك الشخصي الكامل والحقيقي (بدون أرقام أو رموز أو كلمات تجريبية).',
        });
      }

      if (isFakeMoroccanPhoneServer(phone)) {
        await logSecurityBlock({
          reasonType: 'fake',
          reasonMessage: `رقم هاتف وهمي أو غير صالح: "${phone}"`,
          customerName: String(customerName),
          phone: normPhone || String(phone),
          city: String(city),
          ip: clientIp,
        });
        return res.status(400).json({
          success: false,
          message: 'رقم الهاتف المدخل غير حقيقي أو غير صالح. يرجى إدخال رقم مغربي صحيح (06 أو 07 أو 05).',
        });
      }

      if (address && isFakeCustomerTextServer(address, 'address')) {
        await logSecurityBlock({
          reasonType: 'fake',
          reasonMessage: `عنوان غير صالح أو وهمي: "${String(address).trim()}"`,
          customerName: String(customerName),
          phone: normPhone,
          city: String(city),
          ip: clientIp,
        });
        return res.status(400).json({
          success: false,
          message: 'العنوان المدخل غير واضح، يرجى كتابة اسم الحي والشارع بشكل حقيقي.',
        });
      }
    }

    // ---- 3. BLACKLIST & AUTO-BLOCK HIGH CANCEL PHONES ----
    const blockedSet = new Set(
      (sec.blockedPhones || []).map((p: string) => normalizeMoroccanPhoneServer(p))
    );
    if (blockedSet.has(normPhone)) {
      await logSecurityBlock({
        reasonType: 'blacklist',
        reasonMessage: 'محاولة طلب من رقم موجود في القائمة السوداء',
        customerName: String(customerName),
        phone: normPhone,
        city: String(city),
        ip: clientIp,
      });
      return res.status(403).json({
        success: false,
        message: 'عذراً، لا يمكن إتمام الطلب بهذا الرقم حالياً. يرجى التواصل مع خدمة العملاء عبر الواتساب.',
      });
    }

    if (sec.autoBlockHighCancelPhones) {
      const cancelThreshold = Math.max(1, Number(sec.autoBlockCancelThreshold) || 2);
      const cancelledOrdersCount = (db.orders || []).filter(
        (o: any) =>
          normalizeMoroccanPhoneServer(o.phone) === normPhone &&
          (o.status === 'ملغى' || o.status === 'مرتجع')
      ).length;
      if (cancelledOrdersCount >= cancelThreshold) {
        await logSecurityBlock({
          reasonType: 'blacklist',
          reasonMessage: `حظر تلقائي: الرقم لديه ${cancelledOrdersCount} طلبات ملغاة/مرتجعة سابقة`,
          customerName: String(customerName),
          phone: normPhone,
          city: String(city),
          ip: clientIp,
        });
        return res.status(403).json({
          success: false,
          message: 'تم تقييد الطلب التلقائي لهذا الرقم بسبب وجود طلبات سابقة ملغاة أو غير مستلمة. يرجى التواصل معنا عبر الواتساب لتأكيد طلبك يدوياً.',
        });
      }
    }

    // ---- 4. IP RATE LIMITING (Combined in-memory + persistent DB check for serverless) ----
    const nowTs = Date.now();
    const maxPerIp = Math.max(1, Number(sec.maxOrdersPerIpPerHour) || 4);
    const recentDbOrdersFromIp = (db.orders || []).filter((o: any) => {
      if (!o.clientIp || o.clientIp !== clientIp) return false;
      const oTs = new Date(o.date).getTime();
      return !Number.isNaN(oTs) && nowTs - oTs < 60 * 60 * 1000;
    }).length;
    const recentIpTs = (ipOrderTimestamps.get(clientIp) || []).filter(
      (ts) => nowTs - ts < 60 * 60 * 1000
    );
    if (Math.max(recentIpTs.length, recentDbOrdersFromIp) >= maxPerIp) {
      await logSecurityBlock({
        reasonType: 'rate_limit',
        reasonMessage: `تجاوز حد الطلبات المسموح به (${maxPerIp}/ساعة) من نفس الـ IP`,
        customerName: String(customerName),
        phone: normPhone,
        city: String(city),
        ip: clientIp,
      });
      return res.status(429).json({
        success: false,
        message: 'تم تجاوز الحد المسموح به للطلبات خلال هذه الساعة من نفس الجهاز. يرجى المحاولة لاحقاً أو التواصل معنا عبر الواتساب.',
      });
    }

    // ---- 5. ANTI-DUPLICATE ORDERS PROTECTION ----
    if (sec.preventDuplicates) {
      const rapidMs = Math.max(1, Number(sec.rapidCooldownMinutes) || 5) * 60 * 1000;
      const dupWindowMs = Math.max(1, Number(sec.duplicateWindowHours) || 24) * 60 * 60 * 1000;
      const requestedProductIds = new Set(
        items.map((it: any) => String(it.productId || it.name || '')).filter(Boolean)
      );

      const rapidOrder = (db.orders || []).find((o: any) => {
        if (o.status === 'ملغى') return false;
        const oTs = new Date(o.date).getTime();
        return normalizeMoroccanPhoneServer(o.phone) === normPhone && nowTs - oTs < rapidMs;
      });
      if (rapidOrder) {
        await logSecurityBlock({
          reasonType: 'duplicate',
          reasonMessage: `طلب سريع مكرر خلال أقل من ${sec.rapidCooldownMinutes} دقائق (الطلب السابق ${rapidOrder.orderNumber})`,
          customerName: String(customerName),
          phone: normPhone,
          city: String(city),
          ip: clientIp,
        });
        return res.status(429).json({
          success: false,
          message: `تم تسجيل طلبك السابق (${rapidOrder.orderNumber}) للتو بنجاح! لتفادي التكرار، يرجى الانتظار قليلاً قبل إرسال طلب آخر.`,
        });
      }

      const duplicateOrder = (db.orders || []).find((o: any) => {
        if (o.status === 'ملغى' || o.status === 'مرتجع' || o.status === 'تم التسليم') {
          return false;
        }
        const oTs = new Date(o.date).getTime();
        if (nowTs - oTs > dupWindowMs) return false;

        const samePhone = normalizeMoroccanPhoneServer(o.phone) === normPhone;
        const sameIdentitySameIp =
          (o as any).clientIp &&
          (o as any).clientIp === clientIp &&
          nowTs - oTs < 15 * 60 * 1000 &&
          String(o.customerName || '').trim().toLowerCase() === String(customerName).trim().toLowerCase();

        if (!samePhone && !sameIdentitySameIp) return false;

        return Array.isArray(o.items) && o.items.some((it: any) => requestedProductIds.has(String(it.productId || it.name || '')));
      });

      if (duplicateOrder) {
        await logSecurityBlock({
          reasonType: 'duplicate',
          reasonMessage: `طلب مكرر لنفس المنتج خلال ${sec.duplicateWindowHours} ساعة (رقم الطلب السابق ${duplicateOrder.orderNumber})`,
          customerName: String(customerName),
          phone: normPhone,
          city: String(city),
          ip: clientIp,
        });
        return res.status(409).json({
          success: false,
          message: `لقد قمت بطلب هذا المنتج مسبقاً برقم الطلب (${duplicateOrder.orderNumber}) وهو قيد المعالجة حالياً. لتفادي تكرار الطلب، سيتواصل معك فريقنا قريباً.`,
        });
      }
    }

    const orderNumber = `NW-${Math.floor(10000 + Math.random() * 90000)}`;

    let subtotal = 0;
    const stockUpdates: Array<{ id: string; stock: number }> = [];
    const validatedItems = items.map((item: any) => {
      const prod = db.products.find((p: any) => p.id === item.productId);
      const unitPrice = Number(item.price) > 0 ? Number(item.price) : prod ? prod.price : 0;
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      subtotal += unitPrice * qty;

      if (prod && typeof prod.stock === 'number') {
        const nextStock = Math.max(0, prod.stock - qty);
        stockUpdates.push({ id: prod.id, stock: nextStock });
      }

      return {
        productId: item.productId,
        name: prod ? prod.name : item.name,
        color: item.color || (prod?.colors?.[0]?.name ?? 'افتراضي'),
        price: unitPrice,
        quantity: qty,
        image: prod ? prod.images[0] : item.image || '',
        bundleLabel: item.bundleLabel || undefined,
        selectedColors: Array.isArray(item.selectedColors) ? item.selectedColors : undefined,
      };
    });

    const shippingFee = 0;
    let discountAmount = 0;
    let appliedPromoCode = '';
    if (promoCode && String(promoCode).trim()) {
      const promoList = Array.isArray(db.settings?.promoCodes)
        ? db.settings.promoCodes
        : DEFAULT_PROMO_CODES;
      const evalRes = evaluatePromoCodeServer(promoCode, subtotal, promoList, 'ar');
      if (evalRes.valid && evalRes.promo && evalRes.promo.discountAmount > 0) {
        discountAmount = evalRes.promo.discountAmount;
        appliedPromoCode = evalRes.promo.code;
      }
    }
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

    const promoNoteTag = appliedPromoCode
      ? `[رمز التخفيض: ${appliedPromoCode} (-${discountAmount} MAD)]`
      : '';
    const combinedCustomerNotes = [notes ? notes.trim() : '', promoNoteTag]
      .filter(Boolean)
      .join(' | ');

    const newOrder: any = {
      id: `ord-${Date.now()}`,
      orderNumber,
      date: new Date().toISOString(),
      customerName: customerName.trim(),
      phone: phone.trim(),
      city: normalizeCityServer(city),
      address: String(address).trim(),
      notes: combinedCustomerNotes,
      items: validatedItems,
      subtotal,
      shippingFee,
      totalAmount,
      promoCode: appliedPromoCode || undefined,
      discountAmount: discountAmount || undefined,
      paymentMethod: 'COD (الدفع عند الاستلام)',
      status: 'جديد',
      whatsappSent: false,
      customerAction: 'pending',
      clientIp,
      adminNotes: appliedPromoCode
        ? `طلب جديد تم تسجيله بنجاح — تم تطبيق رمز التخفيض ${appliedPromoCode} (-${discountAmount} MAD)`
        : 'طلب جديد تم تسجيله بنجاح (تم اجتياز فحص الحماية)',
      history: [
        {
          status: 'جديد',
          time: new Date().toISOString(),
          note: appliedPromoCode
            ? `تم تسجيل الطلب عبر المتجر بنجاح مع تطبيق رمز التخفيض ${appliedPromoCode} (-${discountAmount} MAD)`
            : 'تم تسجيل الطلب عبر المتجر بنجاح بعد التحقق الأمني',
        },
      ],
    };

    recentIpTs.push(nowTs);
    ipOrderTimestamps.set(clientIp, recentIpTs);

    await createOrderDb(newOrder, stockUpdates);

    return res.status(201).json({
      success: true,
      message: 'تم تأكيد طلبك بنجاح!',
      order: sanitizePublicOrder(newOrder),
    });
  } catch (error) {
    console.error('Error placing order:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ أثناء معالجة الطلب' });
  }
});

// Update order status, admin notes, or order details (Admin only)
app.patch('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    const { id } = req.params;
    const {
      status,
      adminNotes,
      whatsappSent,
      whatsappSentDate,
      customerAction,
      customerName,
      phone,
      city,
      address,
      notes,
      items,
      subtotal,
      shippingFee,
      totalAmount,
    } = req.body;

    const orderIndex = db.orders.findIndex((o: any) => o.id === id || o.orderNumber === id);
    if (orderIndex === -1) {
      return res.status(404).json({ success: false, message: 'الطلب غير موجود' });
    }

    const order = { ...db.orders[orderIndex] };
    order.history = Array.isArray(order.history) ? [...order.history] : [];

    let detailsEdited = false;
    if (customerName !== undefined) {
      order.customerName = String(customerName).trim();
      detailsEdited = true;
    }
    if (phone !== undefined) {
      order.phone = String(phone).trim();
      detailsEdited = true;
    }
    if (city !== undefined) {
      order.city = normalizeCityServer(city);
      detailsEdited = true;
    }
    if (address !== undefined) {
      order.address = String(address).trim();
      detailsEdited = true;
    }
    if (notes !== undefined) {
      order.notes = String(notes).trim();
      detailsEdited = true;
    }
    if (Array.isArray(items)) {
      order.items = items;
      detailsEdited = true;
    }
    if (subtotal !== undefined && !Number.isNaN(Number(subtotal))) {
      order.subtotal = Number(subtotal);
      detailsEdited = true;
    }
    if (shippingFee !== undefined && !Number.isNaN(Number(shippingFee))) {
      order.shippingFee = Number(shippingFee);
      detailsEdited = true;
    }
    if (totalAmount !== undefined && !Number.isNaN(Number(totalAmount))) {
      order.totalAmount = Number(totalAmount);
      detailsEdited = true;
    }

    if (detailsEdited) {
      order.history.push({
        status: order.status,
        time: new Date().toISOString(),
        note: 'تم تعديل بيانات الطلب من لوحة التحكم',
      });
    }

    if (status && status !== order.status) {
      const nowIso = new Date().toISOString();
      if (status === 'تم التأكيد') {
        order.confirmedAt = nowIso;
        order.history.push({
          status: 'تم التأكيد',
          time: nowIso,
          note: adminNotes || 'تم تأكيد الطلب',
        });
        order.status = 'قيد التجهيز';
        order.history.push({
          status: 'قيد التجهيز',
          time: nowIso,
          note: 'تم نقل الطلب تلقائياً إلى قسم "طلبات قيد التجهيز" فور تأكيده',
        });
      } else {
        order.status = status;
        order.history.push({
          status,
          time: nowIso,
          note: adminNotes || `تم تحديث حالة الطلب إلى "${status}"`,
        });
      }
    }
    if (adminNotes !== undefined) {
      order.adminNotes = adminNotes;
    }
    if (whatsappSent !== undefined) {
      order.whatsappSent = Boolean(whatsappSent);
      order.whatsappSentDate = whatsappSentDate || new Date().toISOString();
      order.history.push({
        status: order.status,
        time: new Date().toISOString(),
        note: 'تم إرسال رسالة تأكيد الطلب للزبون عبر وتساب',
      });
    }
    if (customerAction !== undefined) {
      order.customerAction = customerAction;
    }

    await updateOrderDb(order);
    return res.json({ success: true, order });
  } catch (error) {
    console.error('Error updating order:', error);
    return res.status(500).json({ success: false, message: 'فشل تحديث الطلب' });
  }
});

// Delete order permanently (Admin only)
app.delete('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    const { id } = req.params;
    const orderToDel = db.orders.find((o: any) => o.id === id || o.orderNumber === id);
    await deleteOrderDb(id, orderToDel);
    return res.json({ success: true, message: 'تم حذف الطلب نهائياً بنجاح' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return res.status(500).json({ success: false, message: 'فشل حذف الطلب' });
  }
});

// Clear all orders (Admin only)
app.post('/api/orders/clear-all', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    await clearAllOrdersDb(db.orders || []);
    return res.json({ success: true, message: 'تم مسح جميع الطلبات بنجاح' });
  } catch (error) {
    console.error('Error clearing orders:', error);
    return res.status(500).json({ success: false, message: 'فشل مسح الطلبات' });
  }
});

// 4. Products Management (Admin only)
app.post('/api/products', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    const productData = req.body || {};
    const safeVideos = await sanitizeProductVideos(productData.videos);
    const safeImages = await sanitizeProductImages(productData.images);

    const parsedPrice = Math.max(0, Number(productData.price) || 299);
    const parsedOriginalPrice =
      productData.originalPrice !== undefined && productData.originalPrice !== '' && Number(productData.originalPrice) > 0
        ? Number(productData.originalPrice)
        : Math.round(parsedPrice * 1.3);
    const parsedStock =
      productData.stock !== undefined && productData.stock !== '' && Number.isFinite(Number(productData.stock))
        ? Math.max(0, Math.floor(Number(productData.stock)))
        : 10;
    const primaryCategory = String(productData.category || 'luxury').trim() || 'luxury';
    const categoriesList =
      Array.isArray(productData.categories) && productData.categories.length > 0
        ? productData.categories.map((c: any) => String(c || '').trim()).filter(Boolean)
        : [primaryCategory];

    const newProduct: any = {
      id: `prod-${Date.now()}`,
      sku: String(productData.sku || '').trim() || `NW-${Math.floor(100 + Math.random() * 900)}`,
      name: String(productData.name || '').trim() || 'ساعة يد جديدة',
      subtitle: String(productData.subtitle || ''),
      category: primaryCategory,
      categories: categoriesList.length > 0 ? categoriesList : [primaryCategory],
      price: parsedPrice,
      wholesalePrice: Math.max(0, Number(productData.wholesalePrice) || 0),
      shippingCostPerOrder: Math.max(0, Number(productData.shippingCostPerOrder) || 0),
      originalPrice: parsedOriginalPrice,
      discountPercent:
        parsedOriginalPrice > parsedPrice
          ? Math.round(((parsedOriginalPrice - parsedPrice) / parsedOriginalPrice) * 100)
          : 0,
      rating: Number(productData.rating) || 5.0,
      reviewCount: Number(productData.reviewCount) || 0,
      stock: parsedStock,
      isNew: Boolean(productData.isNew),
      isSpecialOffer: Boolean(productData.isSpecialOffer),
      isPublished: productData.isPublished !== undefined ? Boolean(productData.isPublished) : true,
      colors: Array.isArray(productData.colors) ? productData.colors : [],
      images: safeImages.length > 0 ? safeImages : ['/assets/luxury_watch_hero.jpg'],
      videos: safeVideos,
      specs:
        productData.specs && typeof productData.specs === 'object'
          ? productData.specs
          : {
              brand: 'Noblewatch',
              model: productData.name || 'ساعة يد جديدة',
              movement: 'كوارتز ياباني فائق الدقة',
              caseMaterial: 'فولاذ مقاوم للصدأ 316L',
              strapMaterial: 'جلد طبيعي فاخر',
              dialColor: 'أسود مع لمسات ذهبية',
              caseDiameter: '42 ملم',
              caseThickness: '11 ملم',
              glass: 'زجاج ياقوتي مقاوم للخدش',
              clasp: 'مشبك أمان كلاسيكي',
              waterResistance: '5ATM مقاوم للماء',
              warranty: 'ضمان رسمي لمدة سنة كاملة',
            },
      boxContents: Array.isArray(productData.boxContents)
        ? productData.boxContents
        : [
            'ساعة Noblewatch الأصلية',
            'علبة هدايا جلدية فاخرة',
            'بطاقة الضمان الدولي المعتمدة',
            'كتيب التعليمات ودليل العناية بالساعة',
          ],
      description:
        productData.description ||
        'ساعة فاخرة مصممة بأعلى معايير الدقة والأناقة لتناسب جميع المناسبات الرسمية واليومية.',
      features: Array.isArray(productData.features)
        ? productData.features
        : [
            'محرك ياباني فائق الدقة وطويل العمر',
            'زجاج مقوى مقاوم للصدمات والخدش اليومي',
            'مقاومة للماء والرذاذ وغسيل اليدين',
            'سوار مريح وعالي الجودة لا يسبب أي حساسية',
          ],
      tieredPricing: productData.tieredPricing || undefined,
    };

    await createProductDb(newProduct);
    return res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Error adding product:', error);
    return res.status(500).json({ success: false, message: 'فشل إضافة المنتج' });
  }
});

app.put('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    const { id } = req.params;
    const existing = db.products.find((p: any) => p.id === id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    const payload = { ...(req.body || {}) };
    if (Array.isArray(payload.images)) {
      payload.images = await sanitizeProductImages(payload.images);
    } else {
      delete payload.images;
    }
    if (Array.isArray(payload.videos)) {
      payload.videos = await sanitizeProductVideos(payload.videos);
    } else {
      delete payload.videos;
    }

    if (payload.name !== undefined) {
      const trimmedName = String(payload.name || '').trim();
      if (!trimmedName) {
        return res.status(400).json({ success: false, message: 'يرجى إدخال اسم الساعة قبل الحفظ' });
      }
      payload.name = trimmedName;
    }

    const updatedProduct = { ...existing, ...payload };

    if (payload.price !== undefined) {
      const parsedPrice = Number(payload.price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({ success: false, message: 'يرجى إدخال سعر صحيح' });
      }
      updatedProduct.price = parsedPrice;
    }
    if (payload.originalPrice !== undefined) {
      const parsedOrig = Number(payload.originalPrice);
      updatedProduct.originalPrice = Number.isFinite(parsedOrig) && parsedOrig >= 0 ? parsedOrig : updatedProduct.price;
    }
    if (payload.stock !== undefined) {
      const parsedStock = Number(payload.stock);
      updatedProduct.stock = Number.isFinite(parsedStock) && parsedStock >= 0 ? Math.floor(parsedStock) : existing.stock;
    }
    if (payload.wholesalePrice !== undefined) {
      updatedProduct.wholesalePrice = Math.max(0, Number(payload.wholesalePrice) || 0);
    }
    if (payload.shippingCostPerOrder !== undefined) {
      updatedProduct.shippingCostPerOrder = Math.max(0, Number(payload.shippingCostPerOrder) || 0);
    }

    if (Array.isArray(payload.categories)) {
      const cleanCats = payload.categories.map((c: any) => String(c || '').trim()).filter(Boolean);
      updatedProduct.categories = cleanCats.length > 0 ? cleanCats : [updatedProduct.category || 'luxury'];
    } else if (payload.category) {
      updatedProduct.categories = [String(payload.category).trim()];
    }

    if (updatedProduct.originalPrice && updatedProduct.originalPrice > updatedProduct.price) {
      updatedProduct.discountPercent = Math.round(
        ((updatedProduct.originalPrice - updatedProduct.price) / updatedProduct.originalPrice) * 100
      );
    } else {
      updatedProduct.discountPercent = 0;
    }

    await updateProductDb(updatedProduct);
    return res.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ success: false, message: 'فشل تحديث المنتج، يرجى المحاولة مرة أخرى' });
  }
});

app.delete('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    const { id } = req.params;
    const deleted = await deleteProductDb(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }
    return res.json({ success: true, message: 'تم حذف المنتج بنجاح' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ success: false, message: 'فشل حذف المنتج' });
  }
});

app.post('/api/products/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    const { id } = req.params;
    const product = db.products.find((p: any) => p.id === id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    const copy = {
      ...JSON.parse(JSON.stringify(product)),
      id: `prod-${Date.now()}`,
      name: `${product.name} (نسخة)`,
      sku: `${product.sku}-COPY`,
      isPublished: false,
    };

    await createProductDb(copy);
    return res.json({ success: true, product: copy });
  } catch (error) {
    console.error('Error duplicating product:', error);
    return res.status(500).json({ success: false, message: 'فشل نسخ المنتج' });
  }
});

// 5. Reviews Management
app.post('/api/reviews', async (req: Request, res: Response) => {
  try {
    const { productId, author, city, rating, comment, customerPhoto } = req.body;
    if (!productId || !author || !comment) {
      return res.status(400).json({ success: false, message: 'يرجى ملء جميع الحقول' });
    }

    const db = await getStoreSnapshot();
    const safePhoto =
      customerPhoto && typeof customerPhoto === 'string' && customerPhoto.startsWith('data:image/')
        ? await extractBase64ImageToStorage(customerPhoto, 'review_photo', 0)
        : customerPhoto;

    const newReview = {
      id: `rev-${Date.now()}`,
      productId,
      author: author.trim(),
      city: city ? city.trim() : 'المغرب',
      rating: Number(rating) || 5,
      date: new Date().toISOString().split('T')[0],
      comment: comment.trim(),
      isVerified: true,
      isApproved: true,
      customerPhoto:
        safePhoto ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    };

    const prodReviews = [newReview, ...(db.reviews || []).filter((r: any) => r.productId === productId)];
    const avg = prodReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / prodReviews.length;

    await createReviewDb(newReview, {
      productId,
      rating: parseFloat(avg.toFixed(1)),
      reviewCount: prodReviews.length,
    });

    return res.status(201).json({ success: true, review: newReview });
  } catch (error) {
    console.error('Error adding review:', error);
    return res.status(500).json({ success: false, message: 'فشل إضافة التقييم' });
  }
});

app.patch('/api/reviews/:id', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    const { id } = req.params;
    const { isApproved } = req.body;
    const review = await updateReviewApprovalDb(id, Boolean(isApproved));
    if (!review) {
      return res.status(404).json({ success: false, message: 'التقييم غير موجود' });
    }
    return res.json({ success: true, review });
  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({ success: false, message: 'فشل تحديث التقييم' });
  }
});

app.delete('/api/reviews/:id', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    const { id } = req.params;
    await deleteReviewDb(id);
    return res.json({ success: true, message: 'تم حذف التقييم' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ success: false, message: 'فشل حذف التقييم' });
  }
});

// 6. Settings Management (Admin only)
app.put('/api/settings', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    const payload = { ...req.body };
    delete payload.adminPasswordHash;
    const stripBidi = (v: unknown) =>
      typeof v === 'string'
        ? v.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '').trim()
        : v;
    const normalizeSocialUrl = (v: unknown): string => {
      const clean = String(stripBidi(v) || '').trim();
      if (!clean) return '';
      if (/^https?:\/\//i.test(clean)) return clean;
      if (clean.startsWith('//')) return `https:${clean}`;
      return `https://${clean.replace(/^\/+/, '')}`;
    };
    if (typeof payload.whatsappNumber === 'string') {
      payload.whatsappNumber = stripBidi(payload.whatsappNumber) as string;
    }
    if (typeof payload.contactPhone === 'string') {
      payload.contactPhone = stripBidi(payload.contactPhone) as string;
    }
    if (payload.heroImage && typeof payload.heroImage === 'string' && payload.heroImage.startsWith('data:image/')) {
      payload.heroImage = await extractBase64ImageToStorage(payload.heroImage, 'hero_banner', 0);
    }

    const rawSocialInput = payload.socialLinks && typeof payload.socialLinks === 'object' ? payload.socialLinks : {};
    const mergedSocialLinks: Record<string, string> = {
      ...(db.settings?.socialLinks || {}),
    };
    for (const key of ['instagram', 'facebook', 'tiktok', 'youtube'] as const) {
      if (key in rawSocialInput) {
        mergedSocialLinks[key] = normalizeSocialUrl(rawSocialInput[key]);
      }
    }
    if ('whatsapp' in rawSocialInput) {
      mergedSocialLinks.whatsapp = String(stripBidi(rawSocialInput.whatsapp) || '');
    }
    if (typeof payload.whatsappNumber === 'string' && payload.whatsappNumber) {
      mergedSocialLinks.whatsapp = payload.whatsappNumber;
    }

    const rawPixels =
      payload.trackingPixels && typeof payload.trackingPixels === 'object'
        ? payload.trackingPixels
        : null;
    const mergedTrackingPixels = {
      ...DEFAULT_TRACKING_PIXELS,
      ...(db.settings?.trackingPixels || {}),
      ...(rawPixels
        ? {
            facebookEnabled:
              rawPixels.facebookEnabled !== undefined
                ? Boolean(rawPixels.facebookEnabled)
                : Boolean(db.settings?.trackingPixels?.facebookEnabled),
            facebookPixelId:
              rawPixels.facebookPixelId !== undefined
                ? String(stripBidi(rawPixels.facebookPixelId) || '')
                : String(db.settings?.trackingPixels?.facebookPixelId || ''),
            googleEnabled:
              rawPixels.googleEnabled !== undefined
                ? Boolean(rawPixels.googleEnabled)
                : Boolean(db.settings?.trackingPixels?.googleEnabled),
            googleTagId:
              rawPixels.googleTagId !== undefined
                ? String(stripBidi(rawPixels.googleTagId) || '').toUpperCase()
                : String(db.settings?.trackingPixels?.googleTagId || ''),
            googleAdsConversionLabel:
              rawPixels.googleAdsConversionLabel !== undefined
                ? String(stripBidi(rawPixels.googleAdsConversionLabel) || '')
                : String(db.settings?.trackingPixels?.googleAdsConversionLabel || ''),
            tiktokEnabled:
              rawPixels.tiktokEnabled !== undefined
                ? Boolean(rawPixels.tiktokEnabled)
                : Boolean(db.settings?.trackingPixels?.tiktokEnabled),
            tiktokPixelId:
              rawPixels.tiktokPixelId !== undefined
                ? String(stripBidi(rawPixels.tiktokPixelId) || '').toUpperCase()
                : String(db.settings?.trackingPixels?.tiktokPixelId || ''),
          }
        : {}),
    };

    const mergedSettings = {
      ...db.settings,
      ...payload,
      socialLinks: mergedSocialLinks,
      trackingPixels: mergedTrackingPixels,
    };
    await updateSettingsDb(mergedSettings);
    cachedStorePayloads.public = undefined;
    cachedStorePayloads.admin = undefined;
    const { adminPasswordHash: _pw, ...publicSettings } = mergedSettings;
    return res.json({ success: true, settings: publicSettings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ success: false, message: 'فشل حفظ الإعدادات' });
  }
});

// 6b. Security Logs & Blacklist Management (Admin only)
app.get('/api/security/overview', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    return res.json({
      success: true,
      logs: Array.isArray(db.securityLogs) ? db.securityLogs : [],
      orderSecurity: {
        ...DEFAULT_ORDER_SECURITY,
        ...((db.settings && db.settings.orderSecurity) || {}),
      },
    });
  } catch (error) {
    console.error('Error loading security overview:', error);
    return res.status(500).json({ success: false, message: 'تعذر تحميل سجل الحماية' });
  }
});

app.post('/api/security/block-phone', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    const { phone } = req.body;
    const norm = normalizeMoroccanPhoneServer(phone);
    if (!norm || norm.length < 8) {
      return res.status(400).json({ success: false, message: 'رقم الهاتف غير صالح للحظر' });
    }
    const orderSecurity = {
      ...DEFAULT_ORDER_SECURITY,
      ...(db.settings.orderSecurity || {}),
    };
    const list: string[] = Array.isArray(orderSecurity.blockedPhones)
      ? [...orderSecurity.blockedPhones]
      : [];
    if (!list.includes(norm)) {
      list.unshift(norm);
    }
    orderSecurity.blockedPhones = list;
    await updateSettingsDb({ ...db.settings, orderSecurity });
    return res.json({ success: true, blockedPhones: list, orderSecurity });
  } catch (error) {
    console.error('Error blocking phone:', error);
    return res.status(500).json({ success: false, message: 'فشل حظر الرقم' });
  }
});

app.post('/api/security/unblock-phone', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    const { phone } = req.body;
    const norm = normalizeMoroccanPhoneServer(phone);
    const orderSecurity = {
      ...DEFAULT_ORDER_SECURITY,
      ...(db.settings.orderSecurity || {}),
    };
    const list: string[] = Array.isArray(orderSecurity.blockedPhones)
      ? orderSecurity.blockedPhones
      : [];
    orderSecurity.blockedPhones = list.filter(
      (p) => normalizeMoroccanPhoneServer(p) !== norm
    );
    await updateSettingsDb({ ...db.settings, orderSecurity });
    return res.json({
      success: true,
      blockedPhones: orderSecurity.blockedPhones,
      orderSecurity,
    });
  } catch (error) {
    console.error('Error unblocking phone:', error);
    return res.status(500).json({ success: false, message: 'فشل إلغاء حظر الرقم' });
  }
});

app.post('/api/security/clear-logs', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    await clearSecurityLogsDb();
    return res.json({ success: true });
  } catch (error) {
    console.error('Error clearing logs:', error);
    return res.status(500).json({ success: false, message: 'فشل مسح السجلات' });
  }
});

// 7. Chunked Video Upload Handler (Works on both serverless Neon chunks & local Node disk)
app.post('/api/upload-video-chunk', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    const uploadId = (req.query.uploadId as string) || (req.headers['x-upload-id'] as string) || (req.body && req.body.uploadId);
    const chunkIndex = parseInt(
      (req.query.chunkIndex as string) || (req.headers['x-chunk-index'] as string) || (req.body && req.body.chunkIndex) || '0',
      10
    );
    const totalChunks = parseInt(
      (req.query.totalChunks as string) || (req.headers['x-total-chunks'] as string) || (req.body && req.body.totalChunks) || '1',
      10
    );
    const rawFilename = (req.query.filename as string) || (req.headers['x-filename'] as string) || (req.body && req.body.filename) || 'video.mp4';
    const decodedName = decodeURIComponent(rawFilename);

    if (!uploadId) {
      return res.status(400).json({ success: false, message: 'معرف الرفع مفقود' });
    }

    const cleanExt = path.extname(decodedName).replace('.', '').toLowerCase() || 'mp4';
    const safeExt = ['mp4', 'webm', 'mov', 'm4v', 'avi', 'mkv', 'ogv'].includes(cleanExt) ? cleanExt : 'mp4';

    // Extract buffer from JSON base64, raw octet-stream Buffer, or stream
    let chunkBuffer: Buffer;
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) && req.body.chunkData) {
      let base64 = String(req.body.chunkData);
      if (base64.includes('base64,')) {
        base64 = base64.split('base64,')[1];
      }
      chunkBuffer = Buffer.from(base64, 'base64');
    } else if (Buffer.isBuffer(req.body)) {
      chunkBuffer = req.body;
    } else {
      chunkBuffer = await new Promise<Buffer>((resolve, reject) => {
        const parts: Buffer[] = [];
        req.on('data', (chunk) => parts.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        req.on('end', () => resolve(Buffer.concat(parts)));
        req.on('error', reject);
      });
    }

    if (IS_SERVERLESS) {
      await saveMediaChunkDb(uploadId, chunkIndex, chunkBuffer);
      if (chunkIndex >= totalChunks - 1) {
        const assembled = await assembleMediaChunksDb(uploadId);
        // Netlify Function response limit is 6MB (~4.5MB binary before base64 overhead in AWS Lambda)
        if (assembled.length > 4.2 * 1024 * 1024) {
          return res.status(413).json({
            success: false,
            message: 'حجم الفيديو يتجاوز حد الاستضافة السحابية (4.2MB). يرجى استخدام رابط فيديو خارجي (MP4) أو ضغط الفيديو.',
          });
        }
        const finalName = `watch_video_${Date.now()}_${Math.floor(Math.random() * 1000)}.${safeExt}`;
        await saveMediaAssetDb({
          filename: finalName,
          mimeType: mimeFromExt(safeExt),
          buffer: assembled,
        });
        return res.json({
          success: true,
          isComplete: true,
          url: `/uploads/${finalName}`,
          filename: finalName,
          size: assembled.length,
        });
      }
      return res.json({
        success: true,
        isComplete: false,
        chunkIndex,
        totalChunks,
      });
    }

    // Local Node disk mode
    ensureLocalDirs();
    const tempName = `temp_${uploadId}.${safeExt}`;
    const tempPath = path.join(UPLOADS_DIR, tempName);
    if (chunkIndex === 0 && fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch {}
    }
    fs.appendFileSync(tempPath, chunkBuffer);

    if (chunkIndex >= totalChunks - 1) {
      const finalName = `watch_video_${Date.now()}_${Math.floor(Math.random() * 1000)}.${safeExt}`;
      const finalPath = path.join(UPLOADS_DIR, finalName);
      fs.renameSync(tempPath, finalPath);
      const stats = fs.statSync(finalPath);
      return res.json({
        success: true,
        isComplete: true,
        url: `/uploads/${finalName}`,
        filename: finalName,
        size: stats.size,
      });
    }

    return res.json({
      success: true,
      isComplete: false,
      chunkIndex,
      totalChunks,
    });
  } catch (error) {
    console.error('Chunk upload exception:', error);
    return res.status(500).json({ success: false, message: 'خطأ أثناء رفع جزء الفيديو' });
  }
});

// 7b. Direct Streaming Video Upload Handler (Admin only)
app.post('/api/upload-video', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    const rawFilename = (req.query.filename as string) || (req.headers['x-filename'] as string) || 'video.mp4';
    const decodedName = decodeURIComponent(rawFilename);
    const cleanExt = path.extname(decodedName).replace('.', '').toLowerCase() || 'mp4';
    const safeExt = ['mp4', 'webm', 'mov', 'm4v', 'avi', 'mkv', 'ogv'].includes(cleanExt) ? cleanExt : 'mp4';
    const safeName = `watch_video_${Date.now()}_${Math.floor(Math.random() * 1000)}.${safeExt}`;

    let buffer: Buffer;
    if (Buffer.isBuffer(req.body)) {
      buffer = req.body;
    } else {
      buffer = await new Promise<Buffer>((resolve, reject) => {
        const parts: Buffer[] = [];
        req.on('data', (chunk) => parts.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        req.on('end', () => resolve(Buffer.concat(parts)));
        req.on('error', reject);
      });
    }

    if (buffer.length === 0) {
      return res.status(400).json({ success: false, message: 'ملف الفيديو فارغ' });
    }

    if (IS_SERVERLESS && buffer.length > 4.2 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        message: 'حجم الفيديو يتجاوز حد الاستضافة السحابية (4.2MB). يرجى استخدام رابط فيديو خارجي.',
      });
    }

    await saveMediaAssetDb({
      filename: safeName,
      mimeType: mimeFromExt(safeExt),
      buffer,
    });

    if (!IS_SERVERLESS) {
      try {
        ensureLocalDirs();
        fs.writeFileSync(path.join(UPLOADS_DIR, safeName), buffer);
      } catch {}
    }

    return res.json({
      success: true,
      url: `/uploads/${safeName}`,
      filename: safeName,
      size: buffer.length,
      type: 'video',
    });
  } catch (error) {
    console.error('Upload-video endpoint error:', error);
    return res.status(500).json({ success: false, message: 'فشل معالجة رفع الفيديو' });
  }
});

// 7c. Media Upload Handler (Saves permanently to Neon PostgreSQL + local disk fallback)
app.post('/api/upload', async (req: Request, res: Response) => {
  try {
    const { dataUrl, filename, mimeType } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'لم يتم إرسال أي ملف' });
    }

    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex === -1) {
      return res.status(400).json({ success: false, message: 'صيغة الملف غير صالحة' });
    }

    const header = dataUrl.slice(0, commaIndex);
    const base64Data = dataUrl.slice(commaIndex + 1);
    const mimeMatch = header.match(/^data:([^;]+)/);
    const type = mimeMatch ? mimeMatch[1].toLowerCase() : (mimeType || 'image/jpeg').toLowerCase();
    const buffer = Buffer.from(base64Data, 'base64');

    let ext = 'jpg';
    if (type.includes('png')) ext = 'png';
    else if (type.includes('webp')) ext = 'webp';
    else if (type.includes('svg')) ext = 'svg';
    else if (type.includes('gif')) ext = 'gif';
    else if (type.includes('avif')) ext = 'avif';
    else if (type.includes('mp4') || type.includes('video')) ext = 'mp4';
    else if (type.includes('webm')) ext = 'webm';
    else if (type.includes('quicktime') || type.includes('mov')) ext = 'mov';
    else if (filename && filename.includes('.')) {
      ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    }

    const isVideo = ext === 'mp4' || ext === 'webm' || ext === 'mov' || type.startsWith('video/');
    const safeName = `${isVideo ? 'watch_video' : 'watch'}_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;

    await saveMediaAssetDb({
      filename: safeName,
      mimeType: mimeFromExt(ext),
      buffer,
    });

    if (!IS_SERVERLESS) {
      try {
        ensureLocalDirs();
        fs.writeFileSync(path.join(UPLOADS_DIR, safeName), buffer);
      } catch {}
    }

    return res.json({
      success: true,
      url: `/uploads/${safeName}`,
      filename: safeName,
      type: isVideo ? 'video' : 'image',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ success: false, message: 'فشل حفظ الملف' });
  }
});

// List uploaded files (Admin only)
app.get('/api/uploads', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    const dbFiles = await listMediaAssetsDb();
    const seen = new Set(dbFiles.map((f) => f.name));

    if (!IS_SERVERLESS && fs.existsSync(UPLOADS_DIR)) {
      const fileNames = fs.readdirSync(UPLOADS_DIR);
      for (const fn of fileNames) {
        if (fn.startsWith('.') || seen.has(fn)) continue;
        const stats = fs.statSync(path.join(UPLOADS_DIR, fn));
        dbFiles.push({
          name: fn,
          url: `/uploads/${fn}`,
          size: stats.size,
          createdAt: stats.birthtime,
        });
      }
    }

    dbFiles.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return res.json({ success: true, files: dbFiles });
  } catch {
    return res.status(500).json({ success: false, message: 'فشل استرجاع الملفات' });
  }
});

// In-memory LRU media cache (avoids repeated PostgreSQL reads & speeds up video scrubbing)
const MAX_MEDIA_CACHE_BYTES = 24 * 1024 * 1024;
const mediaMemoryCache = new Map<string, { mimeType: string; buffer: Buffer }>();
let mediaMemoryCacheBytes = 0;

function setMediaCacheEntry(filename: string, mimeType: string, buffer: Buffer) {
  if (buffer.length > 8 * 1024 * 1024) return; // avoid letting a single huge file evict everything
  if (mediaMemoryCache.has(filename)) {
    const prev = mediaMemoryCache.get(filename)!;
    mediaMemoryCacheBytes -= prev.buffer.length;
    mediaMemoryCache.delete(filename);
  }
  while (mediaMemoryCacheBytes + buffer.length > MAX_MEDIA_CACHE_BYTES && mediaMemoryCache.size > 0) {
    const oldestKey = mediaMemoryCache.keys().next().value;
    if (!oldestKey) break;
    const oldest = mediaMemoryCache.get(oldestKey)!;
    mediaMemoryCacheBytes -= oldest.buffer.length;
    mediaMemoryCache.delete(oldestKey);
  }
  mediaMemoryCache.set(filename, { mimeType, buffer });
  mediaMemoryCacheBytes += buffer.length;
}

function sendBufferWithRange(req: Request, res: Response, buffer: Buffer, mimeType: string) {
  const total = buffer.length;
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

  const range = req.headers.range;
  if (range && range.startsWith('bytes=')) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parts[0] ? parseInt(parts[0], 10) : 0;
    const end = parts[1] ? Math.min(total - 1, parseInt(parts[1], 10)) : total - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= total) {
      res.setHeader('Content-Range', `bytes */${total}`);
      return res.status(416).end();
    }
    const chunk = buffer.subarray(start, end + 1);
    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
    res.setHeader('Content-Length', chunk.length);
    if (req.method === 'HEAD') return res.end();
    return res.send(chunk);
  }

  res.setHeader('Content-Length', total);
  if (req.method === 'HEAD') return res.end();
  return res.send(buffer);
}

// Delete uploaded file (Admin only)
app.delete('/api/uploads/:filename', async (req: Request, res: Response) => {
  try {
    const db = await requireAdminSession(req, res);
    if (!db) return;

    const { filename } = req.params;
    const safeName = path.basename(filename);

    if (mediaMemoryCache.has(safeName)) {
      const prev = mediaMemoryCache.get(safeName)!;
      mediaMemoryCacheBytes -= prev.buffer.length;
      mediaMemoryCache.delete(safeName);
    }

    const deletedDb = await deleteMediaAssetDb(safeName);
    let deletedDisk = false;
    if (!IS_SERVERLESS) {
      const filePath = path.join(UPLOADS_DIR, safeName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedDisk = true;
      }
    }

    if (deletedDb || deletedDisk) {
      return res.json({ success: true, message: 'تم حذف الملف' });
    }
    return res.status(404).json({ success: false, message: 'الملف غير موجود' });
  } catch {
    return res.status(500).json({ success: false, message: 'فشل حذف الملف' });
  }
});

// 8. Serve uploaded files from disk OR Neon PostgreSQL (for Netlify serverless persistence)
app.use('/uploads', async (req: Request, res: Response) => {
  const cleanPath = req.path.split('?')[0];
  const safeName = path.basename(cleanPath);

  if (!IS_SERVERLESS) {
    const filePath = path.join(UPLOADS_DIR, safeName);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(filePath);
    }
  }

  const memCached = mediaMemoryCache.get(safeName);
  if (memCached) {
    // Refresh LRU order
    mediaMemoryCache.delete(safeName);
    mediaMemoryCache.set(safeName, memCached);
    return sendBufferWithRange(req, res, memCached.buffer, memCached.mimeType);
  }

  try {
    const asset = await getMediaAssetDb(safeName);
    if (asset) {
      setMediaCacheEntry(safeName, asset.mimeType, asset.buffer);
      if (!IS_SERVERLESS) {
        ensureLocalDirs();
        fs.promises.writeFile(path.join(UPLOADS_DIR, safeName), asset.buffer).catch(() => {});
      }
      return sendBufferWithRange(req, res, asset.buffer, asset.mimeType);
    }
  } catch (err) {
    console.error('Error serving media asset from DB:', err);
  }

  const isImage = /\.(jpg|jpeg|png|webp|gif|svg|avif)$/i.test(safeName);
  if (isImage) {
    if (IS_SERVERLESS) {
      return res.redirect(302, '/assets/luxury_watch_hero.jpg');
    }
    const fallback = path.resolve(process.cwd(), 'public', 'assets', 'luxury_watch_hero.jpg');
    if (fs.existsSync(fallback)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(fallback);
    }
  }
  return res.status(404).json({ success: false, message: 'الملف غير موجود' });
});
