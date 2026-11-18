import fs from 'fs';
import path from 'path';
import { asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  categories as categoriesTable,
  deletedOrders as deletedOrdersTable,
  mediaAssets as mediaAssetsTable,
  mediaChunks as mediaChunksTable,
  orders as ordersTable,
  products as productsTable,
  reviews as reviewsTable,
  securityLogs as securityLogsTable,
  storeSettings as storeSettingsTable,
} from './schema.ts';
import type {
  Category,
  Order,
  OrderSecuritySettings,
  Product,
  PromoCode,
  Review,
  SecurityBlockLog,
  StoreSettings,
  TrackingPixelsSettings,
} from '../types.ts';
import {
  LACOSTE_BRACELETS_CATALOG,
  MEN_BRACELETS_CATALOG,
} from './braceletsCatalog.ts';
import { WOMEN_JEWELRY_CATALOG } from './womenJewelryCatalog.ts';

function normalizeMoroccanCityName(city: string): string {
  const trimmed = String(city || '').trim();
  if (!trimmed) return '';
  if (trimmed === 'الدار') return 'الدار البيضاء';
  if (trimmed === 'بني') return 'بني ملال';
  if (trimmed === 'القصر') return 'القصر الكبير';
  return trimmed;
}

function resolveSeedFile(): string {
  const candidates = [
    path.resolve(process.cwd(), 'data/store.json'),
    path.resolve(process.cwd(), '../data/store.json'),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {
      // ignore
    }
  }
  return candidates[0];
}

const IS_SERVERLESS = Boolean(
  process.env.NETLIFY ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.VERCEL
);

export const DEFAULT_ORDER_SECURITY: OrderSecuritySettings = {
  preventDuplicates: true,
  duplicateWindowHours: 24,
  rapidCooldownMinutes: 5,
  preventFakeOrders: true,
  preventBots: true,
  requireHumanCheck: false,
  autoBlockHighCancelPhones: true,
  autoBlockCancelThreshold: 2,
  maxOrdersPerIpPerHour: 4,
  blockedPhones: [],
};

export const DEFAULT_TRACKING_PIXELS: TrackingPixelsSettings = {
  facebookEnabled: false,
  facebookPixelId: '',
  googleEnabled: false,
  googleTagId: '',
  googleAdsConversionLabel: '',
  tiktokEnabled: false,
  tiktokPixelId: '',
};

export const DEFAULT_PROMO_CODES: PromoCode[] = [
  {
    code: 'NOBLE10',
    type: 'percent',
    value: 10,
    active: true,
    minOrderAmount: 0,
  },
];

export interface StoreDatabaseSnapshot {
  settings: StoreSettings & { adminPasswordHash?: string };
  categories: Category[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
  securityLogs: SecurityBlockLog[];
  deletedOrderIds: string[];
}

// Fast in-memory read-through cache kept warm across mutations
let cachedSnapshot: StoreDatabaseSnapshot | null = null;
let cacheVersion = 1;
let seedPromise: Promise<void> | null = null;

export function getStoreCacheVersion(): number {
  return cacheVersion;
}

export function bumpStoreCacheVersion() {
  cacheVersion += 1;
}

export function invalidateStoreCache() {
  cachedSnapshot = null;
  cacheVersion += 1;
}

function recalculateCachedCategoryCounts() {
  if (!cachedSnapshot) return;
  const products = cachedSnapshot.products || [];
  cachedSnapshot.categories = (cachedSnapshot.categories || []).map((cat) => {
    if (cat.id === 'all' || cat.slug === 'all') {
      return { ...cat, count: products.filter((p) => p.isPublished).length };
    }
    const count = products.filter(
      (p) =>
        p.isPublished &&
        (p.category === cat.id ||
          (Array.isArray(p.categories) && p.categories.includes(cat.id)))
    ).length;
    return { ...cat, count };
  });
}

function buildSettingsObject(row: typeof storeSettingsTable.$inferSelect | undefined): StoreSettings & { adminPasswordHash?: string } {
  const rawSec = (row?.orderSecurity as Partial<OrderSecuritySettings>) || {};
  const sec = {
    ...DEFAULT_ORDER_SECURITY,
    ...rawSec,
  };
  const promoCodes: PromoCode[] = Array.isArray(rawSec.promoCodes)
    ? rawSec.promoCodes
    : DEFAULT_PROMO_CODES;
  const trackingPixels: TrackingPixelsSettings = {
    ...DEFAULT_TRACKING_PIXELS,
    ...((row?.trackingPixels as Partial<TrackingPixelsSettings>) || {}),
  };
  const stripBidi = (val?: string | null) =>
    String(val || '')
      .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
      .trim();
  const cleanWhatsApp = stripBidi(row?.whatsappNumber);
  const rawSocial = ((row?.socialLinks as any) || {}) as Record<string, string>;
  return {
    storeName: row?.storeName || 'Noblewatch',
    tagline: row?.tagline || '',
    announcementText: row?.announcementText || '',
    currency: row?.currency || 'د.م.',
    whatsappNumber: cleanWhatsApp,
    contactPhone: stripBidi(row?.contactPhone),
    contactEmail: row?.contactEmail || '',
    city: row?.city || 'الدار البيضاء',
    heroTitle: row?.heroTitle || '',
    heroSubtitle: row?.heroSubtitle || '',
    heroBadge: row?.heroBadge || '',
    heroImage: row?.heroImage || '/assets/watches_and_accessories_hero.jpg',
    heroCtaText: row?.heroCtaText || 'اكتشف المجموعة الآن',
    heroSecondaryText: row?.heroSecondaryText || 'تواصل عبر واتساب',
    freeShippingThreshold: row?.freeShippingThreshold ?? 0,
    adminPasswordHash: row?.adminPasswordHash || 'admin123',
    socialLinks: {
      ...rawSocial,
      whatsapp: cleanWhatsApp || stripBidi(rawSocial.whatsapp),
    },
    orderSecurity: sec,
    trackingPixels,
    promoCodes,
    faqs: Array.isArray(row?.faqs) ? row.faqs : [],
    policies: (row?.policies as any) || {
      privacy: '',
      terms: '',
      shipping: '',
      returns: '',
      warranty: '',
    },
  };
}

function mapProductRow(row: typeof productsTable.$inferSelect): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    subtitle: row.subtitle || '',
    category: row.category,
    categories: Array.isArray(row.categories) ? row.categories : [row.category],
    price: Number(row.price),
    wholesalePrice: Number(row.wholesalePrice || 0),
    shippingCostPerOrder: Number(row.shippingCostPerOrder || 0),
    originalPrice: Number(row.originalPrice),
    discountPercent: Number(row.discountPercent || 0),
    rating: Number(row.rating || 5),
    reviewCount: Number(row.reviewCount || 0),
    stock: Number(row.stock ?? 10),
    isNew: Boolean(row.isNew),
    isSpecialOffer: Boolean(row.isSpecialOffer),
    isPublished: Boolean(row.isPublished),
    colors: Array.isArray(row.colors) ? row.colors : [],
    images: Array.isArray(row.images) ? row.images : [],
    videos: Array.isArray(row.videos) ? row.videos : [],
    specs: (row.specs as any) || {},
    boxContents: Array.isArray(row.boxContents) ? row.boxContents : [],
    description: row.description || '',
    features: Array.isArray(row.features) ? row.features : [],
    tieredPricing: row.tieredPricing || undefined,
  };
}

function mapOrderRow(row: typeof ordersTable.$inferSelect): Order & { clientIp?: string } {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    date: row.date,
    customerName: row.customerName,
    phone: row.phone,
    city: normalizeMoroccanCityName(row.city),
    address: row.address,
    notes: row.notes || '',
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shippingFee || 0),
    totalAmount: Number(row.totalAmount),
    paymentMethod: row.paymentMethod,
    status: row.status as any,
    adminNotes: row.adminNotes || '',
    history: Array.isArray(row.history) ? row.history : [],
    whatsappSent: Boolean(row.whatsappSent),
    whatsappSentDate: row.whatsappSentDate || undefined,
    confirmedAt: row.confirmedAt || undefined,
    customerAction: (row.customerAction as any) || 'pending',
    clientIp: row.clientIp || undefined,
  };
}

function mapReviewRow(row: typeof reviewsTable.$inferSelect): Review {
  return {
    id: row.id,
    productId: row.productId,
    author: row.author,
    city: normalizeMoroccanCityName(row.city || 'المغرب'),
    rating: Number(row.rating || 5),
    date: row.date,
    comment: row.comment,
    isVerified: Boolean(row.isVerified),
    isApproved: Boolean(row.isApproved),
    customerPhoto: row.customerPhoto || undefined,
  };
}

let schemaEnsured = false;

export async function ensureDatabaseSchema(): Promise<void> {
  if (schemaEnsured) return;

  try {
    const regCheck = await db.execute(sql`
      SELECT
        to_regclass('public.store_settings') AS has_settings,
        to_regclass('public.products') AS has_products,
        to_regclass('public.media_assets') AS has_media_assets,
        to_regclass('public.media_chunks') AS has_media_chunks,
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'store_settings'
            AND column_name = 'tracking_pixels'
        ) AS has_tracking_pixels
    `);
    const row = (regCheck as any)?.rows?.[0] || {};
    if (
      row.has_settings &&
      row.has_products &&
      row.has_media_assets &&
      row.has_media_chunks &&
      row.has_tracking_pixels
    ) {
      schemaEnsured = true;
      return;
    }

    if (row.has_settings && !row.has_tracking_pixels) {
      await db.execute(sql`
        ALTER TABLE store_settings
        ADD COLUMN IF NOT EXISTS tracking_pixels jsonb NOT NULL DEFAULT '{}'::jsonb;
      `);
    }

    if (!row.has_settings || !row.has_products) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id serial PRIMARY KEY,
          uid text NOT NULL UNIQUE,
          email text NOT NULL,
          display_name text,
          role text NOT NULL DEFAULT 'customer',
          created_at timestamp DEFAULT now()
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS store_settings (
          id integer PRIMARY KEY,
          store_name text NOT NULL DEFAULT 'Noblewatch',
          tagline text NOT NULL DEFAULT '',
          announcement_text text NOT NULL DEFAULT '',
          currency text NOT NULL DEFAULT 'د.م.',
          whatsapp_number text NOT NULL DEFAULT '',
          contact_phone text NOT NULL DEFAULT '',
          contact_email text NOT NULL DEFAULT '',
          city text NOT NULL DEFAULT 'الدار البيضاء',
          hero_title text NOT NULL DEFAULT '',
          hero_subtitle text NOT NULL DEFAULT '',
          hero_badge text NOT NULL DEFAULT '',
          hero_image text NOT NULL DEFAULT '/assets/watches_and_accessories_hero.jpg',
          hero_cta_text text NOT NULL DEFAULT 'اكتشف المجموعة الآن',
          hero_secondary_text text NOT NULL DEFAULT 'تواصل عبر واتساب',
          free_shipping_threshold integer NOT NULL DEFAULT 0,
          admin_password_hash text NOT NULL DEFAULT 'admin123',
          social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
          order_security jsonb NOT NULL DEFAULT '{}'::jsonb,
          tracking_pixels jsonb NOT NULL DEFAULT '{}'::jsonb,
          faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
          policies jsonb NOT NULL DEFAULT '{}'::jsonb,
          updated_at timestamp DEFAULT now()
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS categories (
          id text PRIMARY KEY,
          name text NOT NULL,
          slug text NOT NULL,
          count integer NOT NULL DEFAULT 0,
          sort_order integer NOT NULL DEFAULT 0
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS products (
          id text PRIMARY KEY,
          sku text NOT NULL,
          name text NOT NULL,
          subtitle text NOT NULL DEFAULT '',
          category text NOT NULL,
          categories jsonb NOT NULL DEFAULT '[]'::jsonb,
          price double precision NOT NULL,
          wholesale_price double precision NOT NULL DEFAULT 0,
          shipping_cost_per_order double precision NOT NULL DEFAULT 0,
          original_price double precision NOT NULL,
          discount_percent integer NOT NULL DEFAULT 0,
          rating double precision NOT NULL DEFAULT 5,
          review_count integer NOT NULL DEFAULT 0,
          stock integer NOT NULL DEFAULT 10,
          is_new boolean NOT NULL DEFAULT false,
          is_special_offer boolean NOT NULL DEFAULT false,
          is_published boolean NOT NULL DEFAULT true,
          colors jsonb NOT NULL DEFAULT '[]'::jsonb,
          images jsonb NOT NULL DEFAULT '[]'::jsonb,
          videos jsonb NOT NULL DEFAULT '[]'::jsonb,
          specs jsonb NOT NULL DEFAULT '{}'::jsonb,
          box_contents jsonb NOT NULL DEFAULT '[]'::jsonb,
          description text NOT NULL DEFAULT '',
          features jsonb NOT NULL DEFAULT '[]'::jsonb,
          tiered_pricing jsonb,
          sort_order integer NOT NULL DEFAULT 0,
          created_at timestamp DEFAULT now()
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS orders (
          id text PRIMARY KEY,
          order_number text NOT NULL UNIQUE,
          date text NOT NULL,
          customer_name text NOT NULL,
          phone text NOT NULL,
          city text NOT NULL,
          address text NOT NULL,
          notes text NOT NULL DEFAULT '',
          items jsonb NOT NULL DEFAULT '[]'::jsonb,
          subtotal double precision NOT NULL,
          shipping_fee double precision NOT NULL DEFAULT 0,
          total_amount double precision NOT NULL,
          payment_method text NOT NULL DEFAULT 'COD (الدفع عند الاستلام)',
          status text NOT NULL DEFAULT 'جديد',
          admin_notes text NOT NULL DEFAULT '',
          history jsonb NOT NULL DEFAULT '[]'::jsonb,
          whatsapp_sent boolean NOT NULL DEFAULT false,
          whatsapp_sent_date text,
          confirmed_at text,
          customer_action text NOT NULL DEFAULT 'pending',
          client_ip text,
          created_at timestamp DEFAULT now()
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS reviews (
          id text PRIMARY KEY,
          product_id text NOT NULL,
          author text NOT NULL,
          city text NOT NULL DEFAULT 'المغرب',
          rating integer NOT NULL DEFAULT 5,
          date text NOT NULL,
          comment text NOT NULL,
          is_verified boolean NOT NULL DEFAULT true,
          is_approved boolean NOT NULL DEFAULT true,
          customer_photo text,
          created_at timestamp DEFAULT now()
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS deleted_orders (
          id text PRIMARY KEY,
          deleted_at timestamp DEFAULT now()
        );
      `);

      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS security_logs (
          id text PRIMARY KEY,
          time text NOT NULL,
          reason_type text NOT NULL,
          reason_message text NOT NULL,
          customer_name text,
          phone text,
          city text,
          ip text,
          created_at timestamp DEFAULT now()
        );
      `);
    }

    if (!row.has_media_assets) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS media_assets (
          filename text PRIMARY KEY,
          mime_type text NOT NULL,
          data_base64 text NOT NULL,
          size integer NOT NULL DEFAULT 0,
          created_at timestamp DEFAULT now()
        );
      `);
    }

    if (!row.has_media_chunks) {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS media_chunks (
          id text PRIMARY KEY,
          upload_id text NOT NULL,
          chunk_index integer NOT NULL,
          data_base64 text NOT NULL,
          created_at timestamp DEFAULT now()
        );
      `);
    }
  } catch (err: any) {
    // Non-owner roles in managed Cloud SQL disallow runtime DDL; schema is managed via drizzle-kit
    const code = err?.code || err?.cause?.code;
    if (code === '42501') {
      console.warn('Skipping runtime DDL due to restricted DB role privileges.');
    } else {
      throw err;
    }
  }

  schemaEnsured = true;
}

// Idempotently seed the 20 men's fashion bracelets into whichever PostgreSQL DB is active (at most once)
async function ensureMenBraceletsSeeded(): Promise<void> {
  const existingBr = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(sql`${productsTable.id} LIKE 'prod-br-%'`)
    .limit(1);

  if (existingBr.length > 0) {
    return;
  }

  await db
    .insert(categoriesTable)
    .values({
      id: 'men-accessories',
      name: 'إكسسوارات رجالية',
      slug: 'men-accessories',
      count: MEN_BRACELETS_CATALOG.length,
      sortOrder: 3,
    })
    .onConflictDoNothing();

  await db
    .insert(productsTable)
    .values(
      MEN_BRACELETS_CATALOG.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        subtitle: p.subtitle,
        category: p.category,
        categories: p.categories,
        price: p.price,
        wholesalePrice: p.wholesalePrice,
        shippingCostPerOrder: p.shippingCostPerOrder,
        originalPrice: p.originalPrice,
        discountPercent: p.discountPercent,
        rating: p.rating,
        reviewCount: p.reviewCount,
        stock: p.stock,
        isNew: p.isNew,
        isSpecialOffer: p.isSpecialOffer,
        isPublished: p.isPublished,
        colors: p.colors,
        images: p.images,
        videos: p.videos,
        specs: p.specs,
        boxContents: p.boxContents,
        description: p.description,
        features: p.features,
        tieredPricing: p.tieredPricing,
        sortOrder: p.sortOrder,
      }))
    )
    .onConflictDoNothing();

  console.log(`✅ Seeded ${MEN_BRACELETS_CATALOG.length} men's fashion bracelets into PostgreSQL.`);
}

// Idempotently seed the 5 Lacoste Metropole & Strass bracelets (199 MAD) into the active PostgreSQL DB
async function ensureLacosteBraceletsSeeded(): Promise<void> {
  const existingLacoste = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(sql`${productsTable.id} LIKE 'prod-lacoste-%'`)
    .limit(1);

  if (existingLacoste.length > 0) {
    return;
  }

  await db
    .insert(categoriesTable)
    .values({
      id: 'men-accessories',
      name: 'إكسسوارات رجالية',
      slug: 'men-accessories',
      count: MEN_BRACELETS_CATALOG.length + LACOSTE_BRACELETS_CATALOG.length,
      sortOrder: 3,
    })
    .onConflictDoNothing();

  await db
    .insert(productsTable)
    .values(
      LACOSTE_BRACELETS_CATALOG.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        subtitle: p.subtitle,
        category: p.category,
        categories: p.categories,
        price: p.price,
        wholesalePrice: p.wholesalePrice,
        shippingCostPerOrder: p.shippingCostPerOrder,
        originalPrice: p.originalPrice,
        discountPercent: p.discountPercent,
        rating: p.rating,
        reviewCount: p.reviewCount,
        stock: p.stock,
        isNew: p.isNew,
        isSpecialOffer: p.isSpecialOffer,
        isPublished: p.isPublished,
        colors: p.colors,
        images: p.images,
        videos: p.videos,
        specs: p.specs,
        boxContents: p.boxContents,
        description: p.description,
        features: p.features,
        tieredPricing: p.tieredPricing,
        sortOrder: p.sortOrder,
      }))
    )
    .onConflictDoNothing();

  console.log(`✅ Seeded ${LACOSTE_BRACELETS_CATALOG.length} Lacoste men's bracelets (199 MAD) into PostgreSQL.`);
}

// Idempotently seed the 22 women's jewelry items under 'women-accessories' into PostgreSQL
async function ensureWomenJewelrySeeded(): Promise<void> {
  const existingWj = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(sql`${productsTable.id} LIKE 'prod-wj-%'`)
    .limit(1);

  if (existingWj.length > 0) {
    return;
  }

  await db
    .insert(categoriesTable)
    .values({
      id: 'women-accessories',
      name: 'إكسسوارات نسائية',
      slug: 'women-accessories',
      count: WOMEN_JEWELRY_CATALOG.length,
      sortOrder: 4,
    })
    .onConflictDoNothing();

  await db
    .insert(productsTable)
    .values(
      WOMEN_JEWELRY_CATALOG.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        subtitle: p.subtitle,
        category: p.category,
        categories: p.categories,
        price: p.price,
        wholesalePrice: p.wholesalePrice,
        shippingCostPerOrder: p.shippingCostPerOrder,
        originalPrice: p.originalPrice,
        discountPercent: p.discountPercent,
        rating: p.rating,
        reviewCount: p.reviewCount,
        stock: p.stock,
        isNew: p.isNew,
        isSpecialOffer: p.isSpecialOffer,
        isPublished: p.isPublished,
        colors: p.colors,
        images: p.images,
        videos: p.videos,
        specs: p.specs,
        boxContents: p.boxContents,
        description: p.description,
        features: p.features,
        tieredPricing: p.tieredPricing,
        sortOrder: p.sortOrder,
      }))
    )
    .onConflictDoNothing();

  console.log(`✅ Seeded ${WOMEN_JEWELRY_CATALOG.length} women's jewelry items into PostgreSQL.`);
}

// Lazily import initial data from data/store.json into PostgreSQL only on first request if DB is empty
async function seedDatabaseIfEmpty(): Promise<void> {
  if (seedPromise) {
    return seedPromise;
  }
  seedPromise = (async () => {
    try {
      await ensureDatabaseSchema();

      const [settingsCountRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(storeSettingsTable);
      const [productsCountRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(productsTable);

      if ((settingsCountRow?.count || 0) > 0 || (productsCountRow?.count || 0) > 0) {
        await ensureMenBraceletsSeeded();
        await ensureLacosteBraceletsSeeded();
        await ensureWomenJewelrySeeded();
        return;
      }

      const seedFilePath = resolveSeedFile();
      if (!fs.existsSync(seedFilePath)) {
        await db
          .insert(storeSettingsTable)
          .values({
            id: 1,
            storeName: 'Noblewatch',
            orderSecurity: DEFAULT_ORDER_SECURITY,
          })
          .onConflictDoNothing();
        return;
      }

      const raw = fs.readFileSync(seedFilePath, 'utf-8');
      const json = JSON.parse(raw);

      // 1. Settings
      const s = json.settings || {};
      await db
        .insert(storeSettingsTable)
        .values({
          id: 1,
          storeName: s.storeName || 'Noblewatch',
          tagline: s.tagline || '',
          announcementText: s.announcementText || '',
          currency: s.currency || 'د.م.',
          whatsappNumber: s.whatsappNumber || '',
          contactPhone: s.contactPhone || '',
          contactEmail: s.contactEmail || '',
          city: s.city || 'الدار البيضاء',
          heroTitle: s.heroTitle || '',
          heroSubtitle: s.heroSubtitle || '',
          heroBadge: s.heroBadge || '',
          heroImage: s.heroImage || '/assets/watches_and_accessories_hero.jpg',
          heroCtaText: s.heroCtaText || 'اكتشف المجموعة الآن',
          heroSecondaryText: s.heroSecondaryText || 'تواصل عبر واتساب',
          freeShippingThreshold: Number(s.freeShippingThreshold) || 0,
          adminPasswordHash: s.adminPasswordHash || 'admin123',
          socialLinks: s.socialLinks || {},
          orderSecurity: { ...DEFAULT_ORDER_SECURITY, ...(s.orderSecurity || {}) },
          trackingPixels: { ...DEFAULT_TRACKING_PIXELS, ...(s.trackingPixels || {}) },
          faqs: Array.isArray(s.faqs) ? s.faqs : [],
          policies: s.policies || {},
        })
        .onConflictDoNothing();

      // 2. Categories
      if (Array.isArray(json.categories) && json.categories.length > 0) {
        await db
          .insert(categoriesTable)
          .values(
            json.categories.map((c: any, idx: number) => ({
              id: String(c.id),
              name: String(c.name || ''),
              slug: String(c.slug || c.id),
              count: Number(c.count) || 0,
              sortOrder: idx,
            }))
          )
          .onConflictDoNothing();
      }

      // 3. Products
      if (Array.isArray(json.products) && json.products.length > 0) {
        await db
          .insert(productsTable)
          .values(
            json.products.map((p: any, idx: number) => ({
              id: String(p.id),
              sku: String(p.sku || `NW-${idx + 1}`),
              name: String(p.name || 'ساعة يد'),
              subtitle: String(p.subtitle || ''),
              category: String(p.category || 'luxury'),
              categories: Array.isArray(p.categories) ? p.categories : [p.category || 'luxury'],
              price: Number(p.price) || 0,
              wholesalePrice: Number(p.wholesalePrice) || 0,
              shippingCostPerOrder: Number(p.shippingCostPerOrder) || 0,
              originalPrice: Number(p.originalPrice) || Number(p.price) || 0,
              discountPercent: Number(p.discountPercent) || 0,
              rating: Number(p.rating) || 5,
              reviewCount: Number(p.reviewCount) || 0,
              stock: Number(p.stock) ?? 10,
              isNew: Boolean(p.isNew),
              isSpecialOffer: Boolean(p.isSpecialOffer),
              isPublished: p.isPublished !== undefined ? Boolean(p.isPublished) : true,
              colors: Array.isArray(p.colors) ? p.colors : [],
              images: Array.isArray(p.images) ? p.images : [],
              videos: Array.isArray(p.videos) ? p.videos : [],
              specs: p.specs || {},
              boxContents: Array.isArray(p.boxContents) ? p.boxContents : [],
              description: String(p.description || ''),
              features: Array.isArray(p.features) ? p.features : [],
              tieredPricing: p.tieredPricing || null,
              sortOrder: idx,
            }))
          )
          .onConflictDoNothing();
      }

      // 4. Orders & Deleted Orders
      if (Array.isArray(json.deletedOrderIds) && json.deletedOrderIds.length > 0) {
        await db
          .insert(deletedOrdersTable)
          .values(json.deletedOrderIds.map((id: any) => ({ id: String(id) })))
          .onConflictDoNothing();
      }

      if (Array.isArray(json.orders) && json.orders.length > 0) {
        await db
          .insert(ordersTable)
          .values(
            json.orders.map((o: any) => ({
              id: String(o.id),
              orderNumber: String(o.orderNumber),
              date: String(o.date || new Date().toISOString()),
              customerName: String(o.customerName || ''),
              phone: String(o.phone || ''),
              city: String(o.city || ''),
              address: String(o.address || ''),
              notes: String(o.notes || ''),
              items: Array.isArray(o.items) ? o.items : [],
              subtotal: Number(o.subtotal) || 0,
              shippingFee: Number(o.shippingFee) || 0,
              totalAmount: Number(o.totalAmount) || 0,
              paymentMethod: String(o.paymentMethod || 'COD (الدفع عند الاستلام)'),
              status: String(o.status || 'جديد'),
              adminNotes: String(o.adminNotes || ''),
              history: Array.isArray(o.history) ? o.history : [],
              whatsappSent: Boolean(o.whatsappSent),
              whatsappSentDate: o.whatsappSentDate || null,
              confirmedAt: o.confirmedAt || null,
              customerAction: String(o.customerAction || 'pending'),
              clientIp: o.clientIp || null,
            }))
          )
          .onConflictDoNothing();
      }

      // 5. Reviews (batched for speed)
      if (Array.isArray(json.reviews) && json.reviews.length > 0) {
        const chunkSize = 100;
        for (let i = 0; i < json.reviews.length; i += chunkSize) {
          const chunk = json.reviews.slice(i, i + chunkSize);
          await db
            .insert(reviewsTable)
            .values(
              chunk.map((r: any) => ({
                id: String(r.id),
                productId: String(r.productId),
                author: String(r.author || ''),
                city: String(r.city || 'المغرب'),
                rating: Number(r.rating) || 5,
                date: String(r.date || new Date().toISOString().split('T')[0]),
                comment: String(r.comment || ''),
                isVerified: r.isVerified !== undefined ? Boolean(r.isVerified) : true,
                isApproved: r.isApproved !== undefined ? Boolean(r.isApproved) : true,
                customerPhoto: r.customerPhoto || null,
              }))
            )
            .onConflictDoNothing();
        }
      }

      // 6. Security Logs
      if (Array.isArray(json.securityLogs) && json.securityLogs.length > 0) {
        await db
          .insert(securityLogsTable)
          .values(
            json.securityLogs.slice(0, 150).map((l: any) => ({
              id: String(l.id),
              time: String(l.time || new Date().toISOString()),
              reasonType: String(l.reasonType || 'bot'),
              reasonMessage: String(l.reasonMessage || ''),
              customerName: l.customerName || null,
              phone: l.phone || null,
              city: l.city || null,
              ip: l.ip || null,
            }))
          )
          .onConflictDoNothing();
      }

      await ensureMenBraceletsSeeded();
      await ensureLacosteBraceletsSeeded();
      await ensureWomenJewelrySeeded();

      console.log('✅ Initialized PostgreSQL database from existing store snapshot.');
    } catch (error) {
      seedPromise = null;
      console.error('Database seed failed:', error);
      throw new Error('Failed to initialize store database.', { cause: error });
    }
  })();

  return seedPromise;
}

export async function getStoreSnapshot(): Promise<StoreDatabaseSnapshot> {
  if (!IS_SERVERLESS && cachedSnapshot) {
    return cachedSnapshot;
  }
  try {
    await seedDatabaseIfEmpty();

    const [
      settingsRows,
      categoryRows,
      productRows,
      orderRows,
      reviewRows,
      deletedRows,
      secRows,
    ] = await Promise.all([
      db.select().from(storeSettingsTable).where(eq(storeSettingsTable.id, 1)),
      db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder)),
      db.select().from(productsTable).orderBy(asc(productsTable.sortOrder), desc(productsTable.createdAt)),
      db.select().from(ordersTable).orderBy(desc(ordersTable.date)),
      db.select().from(reviewsTable).orderBy(desc(reviewsTable.createdAt)),
      db.select().from(deletedOrdersTable),
      db.select().from(securityLogsTable).orderBy(desc(securityLogsTable.time)).limit(150),
    ]);

    const deletedSet = new Set(deletedRows.map((d) => d.id));
    const cleanOrders = orderRows
      .filter((o) => !deletedSet.has(o.id) && !deletedSet.has(o.orderNumber))
      .map(mapOrderRow);

    const mappedProducts = productRows.map(mapProductRow);
    const mappedCategories = categoryRows.map((c) => {
      if (c.id === 'all' || c.slug === 'all') {
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          count: mappedProducts.filter((p) => p.isPublished).length,
        };
      }
      const computedCount = mappedProducts.filter(
        (p) =>
          p.isPublished &&
          (p.category === c.id ||
            (Array.isArray(p.categories) && p.categories.includes(c.id)))
      ).length;
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: computedCount,
      };
    });

    const snapshot: StoreDatabaseSnapshot = {
      settings: buildSettingsObject(settingsRows[0]),
      categories: mappedCategories,
      products: mappedProducts,
      orders: cleanOrders,
      reviews: reviewRows.map(mapReviewRow),
      securityLogs: secRows.map((l) => ({
        id: l.id,
        time: l.time,
        reasonType: l.reasonType as any,
        reasonMessage: l.reasonMessage,
        customerName: l.customerName || undefined,
        phone: l.phone || undefined,
        city: l.city || undefined,
        ip: l.ip || undefined,
      })),
      deletedOrderIds: Array.from(deletedSet),
    };

    if (!IS_SERVERLESS) {
      cachedSnapshot = snapshot;
    }

    return snapshot;
  } catch (error) {
    console.error('Database query failed in getStoreSnapshot:', error);
    throw new Error('Failed to load store data from database.', { cause: error });
  }
}

export async function insertSecurityLogDb(entry: SecurityBlockLog): Promise<void> {
  try {
    await db.insert(securityLogsTable).values({
      id: entry.id,
      time: entry.time,
      reasonType: entry.reasonType,
      reasonMessage: entry.reasonMessage,
      customerName: entry.customerName || null,
      phone: entry.phone || null,
      city: entry.city || null,
      ip: entry.ip || null,
    });
    if (cachedSnapshot) {
      cachedSnapshot.securityLogs = [entry, ...(cachedSnapshot.securityLogs || [])].slice(0, 150);
    }
  } catch (error) {
    console.error('Failed to insert security log:', error);
  }
}

export async function clearSecurityLogsDb(): Promise<void> {
  try {
    await db.delete(securityLogsTable);
    if (cachedSnapshot) {
      cachedSnapshot.securityLogs = [];
    }
  } catch (error) {
    console.error('Failed to clear security logs:', error);
    throw new Error('Failed to clear security logs.', { cause: error });
  }
}

export async function createOrderDb(
  newOrder: Order & { clientIp?: string },
  stockUpdates: Array<{ id: string; stock: number }>
): Promise<Order> {
  try {
    await db.insert(ordersTable).values({
      id: newOrder.id,
      orderNumber: newOrder.orderNumber,
      date: newOrder.date,
      customerName: newOrder.customerName,
      phone: newOrder.phone,
      city: newOrder.city,
      address: newOrder.address,
      notes: newOrder.notes || '',
      items: newOrder.items,
      subtotal: newOrder.subtotal,
      shippingFee: newOrder.shippingFee,
      totalAmount: newOrder.totalAmount,
      paymentMethod: newOrder.paymentMethod,
      status: newOrder.status,
      adminNotes: newOrder.adminNotes || '',
      history: newOrder.history,
      whatsappSent: Boolean(newOrder.whatsappSent),
      whatsappSentDate: newOrder.whatsappSentDate || null,
      confirmedAt: newOrder.confirmedAt || null,
      customerAction: newOrder.customerAction || 'pending',
      clientIp: newOrder.clientIp || null,
    });

    if (stockUpdates.length > 0) {
      await Promise.all(
        stockUpdates.map((upd) =>
          db
            .update(productsTable)
            .set({ stock: upd.stock })
            .where(eq(productsTable.id, upd.id))
        )
      );
    }

    if (cachedSnapshot) {
      const normalizedOrder = {
        ...newOrder,
        city: normalizeMoroccanCityName(newOrder.city),
      };
      cachedSnapshot.orders = [
        normalizedOrder,
        ...(cachedSnapshot.orders || []).filter((o) => o.id !== newOrder.id),
      ];
      if (stockUpdates.length > 0) {
        const stockMap = new Map(stockUpdates.map((u) => [u.id, u.stock]));
        cachedSnapshot.products = cachedSnapshot.products.map((p) =>
          stockMap.has(p.id) ? { ...p, stock: stockMap.get(p.id)! } : p
        );
      }
    }
    bumpStoreCacheVersion();
    return newOrder;
  } catch (error) {
    console.error('Database query failed in createOrderDb:', error);
    throw new Error('Failed to save order in database.', { cause: error });
  }
}

export async function updateOrderDb(order: Order & { clientIp?: string }): Promise<Order> {
  try {
    await db
      .update(ordersTable)
      .set({
        customerName: order.customerName,
        phone: order.phone,
        city: order.city,
        address: order.address,
        notes: order.notes || '',
        items: order.items,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        totalAmount: order.totalAmount,
        status: order.status,
        adminNotes: order.adminNotes || '',
        history: order.history,
        whatsappSent: Boolean(order.whatsappSent),
        whatsappSentDate: order.whatsappSentDate || null,
        confirmedAt: order.confirmedAt || null,
        customerAction: order.customerAction || 'pending',
      })
      .where(eq(ordersTable.id, order.id));

    if (cachedSnapshot) {
      const normalizedOrder = {
        ...order,
        city: normalizeMoroccanCityName(order.city),
      };
      cachedSnapshot.orders = (cachedSnapshot.orders || []).map((o) =>
        o.id === order.id ? normalizedOrder : o
      );
    }
    bumpStoreCacheVersion();
    return order;
  } catch (error) {
    console.error('Database query failed in updateOrderDb:', error);
    throw new Error('Failed to update order in database.', { cause: error });
  }
}

export async function deleteOrderDb(idOrNumber: string, matchedOrder?: Order): Promise<void> {
  try {
    const idsToBlacklist = [idOrNumber];
    if (matchedOrder?.id && !idsToBlacklist.includes(matchedOrder.id)) idsToBlacklist.push(matchedOrder.id);
    if (matchedOrder?.orderNumber && !idsToBlacklist.includes(matchedOrder.orderNumber)) {
      idsToBlacklist.push(matchedOrder.orderNumber);
    }

    await db
      .insert(deletedOrdersTable)
      .values(idsToBlacklist.map((id) => ({ id })))
      .onConflictDoNothing();

    if (matchedOrder) {
      await db.delete(ordersTable).where(eq(ordersTable.id, matchedOrder.id));
    } else {
      await Promise.all([
        db.delete(ordersTable).where(inArray(ordersTable.id, idsToBlacklist)),
        db.delete(ordersTable).where(inArray(ordersTable.orderNumber, idsToBlacklist)),
      ]);
    }

    if (cachedSnapshot) {
      const delSet = new Set(idsToBlacklist);
      cachedSnapshot.deletedOrderIds = Array.from(
        new Set([...(cachedSnapshot.deletedOrderIds || []), ...idsToBlacklist])
      );
      cachedSnapshot.orders = (cachedSnapshot.orders || []).filter(
        (o) => !delSet.has(o.id) && !delSet.has(o.orderNumber)
      );
    }
    bumpStoreCacheVersion();
  } catch (error) {
    console.error('Database query failed in deleteOrderDb:', error);
    throw new Error('Failed to delete order from database.', { cause: error });
  }
}

export async function clearAllOrdersDb(existingOrders: Order[]): Promise<void> {
  try {
    const idsToBlacklist: string[] = [];
    for (const o of existingOrders) {
      if (o.id) idsToBlacklist.push(o.id);
      if (o.orderNumber) idsToBlacklist.push(o.orderNumber);
    }
    if (idsToBlacklist.length > 0) {
      await db
        .insert(deletedOrdersTable)
        .values(Array.from(new Set(idsToBlacklist)).map((id) => ({ id })))
        .onConflictDoNothing();
    }
    await db.delete(ordersTable);
    if (cachedSnapshot) {
      cachedSnapshot.deletedOrderIds = Array.from(
        new Set([...(cachedSnapshot.deletedOrderIds || []), ...idsToBlacklist])
      );
      cachedSnapshot.orders = [];
    }
    bumpStoreCacheVersion();
  } catch (error) {
    console.error('Database query failed in clearAllOrdersDb:', error);
    throw new Error('Failed to clear orders from database.', { cause: error });
  }
}

export async function createProductDb(product: Product): Promise<Product> {
  try {
    await db.insert(productsTable).values({
      id: product.id,
      sku: product.sku,
      name: product.name,
      subtitle: product.subtitle || '',
      category: product.category,
      categories: product.categories,
      price: product.price,
      wholesalePrice: product.wholesalePrice || 0,
      shippingCostPerOrder: product.shippingCostPerOrder || 0,
      originalPrice: product.originalPrice,
      discountPercent: product.discountPercent,
      rating: product.rating,
      reviewCount: product.reviewCount,
      stock: product.stock,
      isNew: product.isNew,
      isSpecialOffer: product.isSpecialOffer,
      isPublished: product.isPublished,
      colors: product.colors,
      images: product.images,
      videos: product.videos,
      specs: product.specs,
      boxContents: product.boxContents,
      description: product.description,
      features: product.features,
      tieredPricing: product.tieredPricing || null,
      sortOrder: -1,
    });
    if (cachedSnapshot) {
      cachedSnapshot.products = [
        product,
        ...(cachedSnapshot.products || []).filter((p) => p.id !== product.id),
      ];
      recalculateCachedCategoryCounts();
    }
    bumpStoreCacheVersion();
    return product;
  } catch (error) {
    console.error('Database query failed in createProductDb:', error);
    throw new Error('Failed to create product in database.', { cause: error });
  }
}

export async function updateProductDb(product: Product): Promise<Product> {
  try {
    await db
      .update(productsTable)
      .set({
        sku: product.sku,
        name: product.name,
        subtitle: product.subtitle || '',
        category: product.category,
        categories: product.categories,
        price: product.price,
        wholesalePrice: product.wholesalePrice || 0,
        shippingCostPerOrder: product.shippingCostPerOrder || 0,
        originalPrice: product.originalPrice,
        discountPercent: product.discountPercent,
        rating: product.rating,
        reviewCount: product.reviewCount,
        stock: product.stock,
        isNew: product.isNew,
        isSpecialOffer: product.isSpecialOffer,
        isPublished: product.isPublished,
        colors: product.colors,
        images: product.images,
        videos: product.videos,
        specs: product.specs,
        boxContents: product.boxContents,
        description: product.description,
        features: product.features,
        tieredPricing: product.tieredPricing || null,
      })
      .where(eq(productsTable.id, product.id));

    if (cachedSnapshot) {
      cachedSnapshot.products = (cachedSnapshot.products || []).map((p) =>
        p.id === product.id ? product : p
      );
      recalculateCachedCategoryCounts();
    }
    bumpStoreCacheVersion();
    return product;
  } catch (error) {
    console.error('Database query failed in updateProductDb:', error);
    throw new Error('Failed to update product in database.', { cause: error });
  }
}

export async function deleteProductDb(id: string): Promise<boolean> {
  try {
    const res = await db.delete(productsTable).where(eq(productsTable.id, id)).returning();
    if (cachedSnapshot) {
      cachedSnapshot.products = (cachedSnapshot.products || []).filter((p) => p.id !== id);
      recalculateCachedCategoryCounts();
    }
    bumpStoreCacheVersion();
    return res.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteProductDb:', error);
    throw new Error('Failed to delete product from database.', { cause: error });
  }
}

export async function createReviewDb(
  review: Review,
  productRatingUpdate?: { productId: string; rating: number; reviewCount: number }
): Promise<Review> {
  try {
    await db.insert(reviewsTable).values({
      id: review.id,
      productId: review.productId,
      author: review.author,
      city: review.city,
      rating: review.rating,
      date: review.date,
      comment: review.comment,
      isVerified: review.isVerified,
      isApproved: review.isApproved,
      customerPhoto: review.customerPhoto || null,
    });

    if (productRatingUpdate) {
      await db
        .update(productsTable)
        .set({
          rating: productRatingUpdate.rating,
          reviewCount: productRatingUpdate.reviewCount,
        })
        .where(eq(productsTable.id, productRatingUpdate.productId));
    }

    if (cachedSnapshot) {
      const normalizedReview = {
        ...review,
        city: normalizeMoroccanCityName(review.city || 'المغرب'),
      };
      cachedSnapshot.reviews = [normalizedReview, ...(cachedSnapshot.reviews || [])];
      if (productRatingUpdate) {
        cachedSnapshot.products = (cachedSnapshot.products || []).map((p) =>
          p.id === productRatingUpdate.productId
            ? {
                ...p,
                rating: productRatingUpdate.rating,
                reviewCount: productRatingUpdate.reviewCount,
              }
            : p
        );
      }
    }
    bumpStoreCacheVersion();
    return review;
  } catch (error) {
    console.error('Database query failed in createReviewDb:', error);
    throw new Error('Failed to save review in database.', { cause: error });
  }
}

export async function updateReviewApprovalDb(id: string, isApproved: boolean): Promise<Review | null> {
  try {
    const updated = await db
      .update(reviewsTable)
      .set({ isApproved })
      .where(eq(reviewsTable.id, id))
      .returning();
    const mapped = updated[0] ? mapReviewRow(updated[0]) : null;
    if (cachedSnapshot && mapped) {
      cachedSnapshot.reviews = (cachedSnapshot.reviews || []).map((r) =>
        r.id === id ? mapped : r
      );
    }
    bumpStoreCacheVersion();
    return mapped;
  } catch (error) {
    console.error('Database query failed in updateReviewApprovalDb:', error);
    throw new Error('Failed to update review in database.', { cause: error });
  }
}

export async function deleteReviewDb(id: string): Promise<void> {
  try {
    await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
    if (cachedSnapshot) {
      cachedSnapshot.reviews = (cachedSnapshot.reviews || []).filter((r) => r.id !== id);
    }
    bumpStoreCacheVersion();
  } catch (error) {
    console.error('Database query failed in deleteReviewDb:', error);
    throw new Error('Failed to delete review from database.', { cause: error });
  }
}

export async function updateSettingsDb(merged: StoreSettings & { adminPasswordHash?: string }): Promise<void> {
  try {
    const persistedPromoCodes = Array.isArray(merged.promoCodes)
      ? merged.promoCodes
      : Array.isArray(merged.orderSecurity?.promoCodes)
      ? merged.orderSecurity.promoCodes
      : DEFAULT_PROMO_CODES;
    const persistedOrderSecurity: OrderSecuritySettings = {
      ...DEFAULT_ORDER_SECURITY,
      ...(merged.orderSecurity || {}),
      promoCodes: persistedPromoCodes,
    };

    const persistedTrackingPixels: TrackingPixelsSettings = {
      ...DEFAULT_TRACKING_PIXELS,
      ...(merged.trackingPixels || {}),
    };
    const persistedSocialLinks = merged.socialLinks || {};

    await db
      .insert(storeSettingsTable)
      .values({
        id: 1,
        storeName: merged.storeName,
        tagline: merged.tagline,
        announcementText: merged.announcementText,
        currency: merged.currency,
        whatsappNumber: merged.whatsappNumber,
        contactPhone: merged.contactPhone,
        contactEmail: merged.contactEmail,
        city: merged.city,
        heroTitle: merged.heroTitle,
        heroSubtitle: merged.heroSubtitle,
        heroBadge: merged.heroBadge,
        heroImage: merged.heroImage,
        heroCtaText: merged.heroCtaText,
        heroSecondaryText: merged.heroSecondaryText,
        freeShippingThreshold: Number(merged.freeShippingThreshold) || 0,
        adminPasswordHash: merged.adminPasswordHash || 'admin123',
        socialLinks: persistedSocialLinks,
        orderSecurity: persistedOrderSecurity,
        trackingPixels: persistedTrackingPixels,
        faqs: merged.faqs || [],
        policies: merged.policies || {
          privacy: '',
          terms: '',
          shipping: '',
          returns: '',
          warranty: '',
        },
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: storeSettingsTable.id,
        set: {
          storeName: merged.storeName,
          tagline: merged.tagline,
          announcementText: merged.announcementText,
          currency: merged.currency,
          whatsappNumber: merged.whatsappNumber,
          contactPhone: merged.contactPhone,
          contactEmail: merged.contactEmail,
          city: merged.city,
          heroTitle: merged.heroTitle,
          heroSubtitle: merged.heroSubtitle,
          heroBadge: merged.heroBadge,
          heroImage: merged.heroImage,
          heroCtaText: merged.heroCtaText,
          heroSecondaryText: merged.heroSecondaryText,
          freeShippingThreshold: Number(merged.freeShippingThreshold) || 0,
          adminPasswordHash: merged.adminPasswordHash || 'admin123',
          socialLinks: persistedSocialLinks,
          orderSecurity: persistedOrderSecurity,
          trackingPixels: persistedTrackingPixels,
          faqs: merged.faqs || [],
          policies: merged.policies || {
            privacy: '',
            terms: '',
            shipping: '',
            returns: '',
            warranty: '',
          },
          updatedAt: new Date(),
        },
      });
    if (cachedSnapshot) {
      cachedSnapshot.settings = {
        ...cachedSnapshot.settings,
        ...merged,
        socialLinks: persistedSocialLinks,
        orderSecurity: persistedOrderSecurity,
        promoCodes: persistedPromoCodes,
        trackingPixels: persistedTrackingPixels,
      };
    }
    bumpStoreCacheVersion();
  } catch (error) {
    console.error('Database query failed in updateSettingsDb:', error);
    throw new Error('Failed to update settings in database.', { cause: error });
  }
}

export async function syncStoreDataDb(payload: {
  products?: Product[];
  categories?: Category[];
  settings?: StoreSettings & { adminPasswordHash?: string };
  orders?: Array<Order & { clientIp?: string }>;
}): Promise<void> {
  try {
    if (Array.isArray(payload.products) && payload.products.length > 0) {
      for (let idx = 0; idx < payload.products.length; idx++) {
        const p = payload.products[idx];
        await db
          .insert(productsTable)
          .values({
            id: p.id,
            sku: p.sku,
            name: p.name,
            subtitle: p.subtitle || '',
            category: p.category,
            categories: p.categories || [p.category],
            price: Number(p.price),
            wholesalePrice: Number(p.wholesalePrice || 0),
            shippingCostPerOrder: Number(p.shippingCostPerOrder || 0),
            originalPrice: Number(p.originalPrice),
            discountPercent: Number(p.discountPercent || 0),
            rating: Number(p.rating || 5),
            reviewCount: Number(p.reviewCount || 0),
            stock: Number(p.stock ?? 10),
            isNew: Boolean(p.isNew),
            isSpecialOffer: Boolean(p.isSpecialOffer),
            isPublished: p.isPublished !== undefined ? Boolean(p.isPublished) : true,
            colors: p.colors || [],
            images: p.images || [],
            videos: p.videos || [],
            specs: p.specs || ({} as any),
            boxContents: p.boxContents || [],
            description: p.description || '',
            features: p.features || [],
            tieredPricing: p.tieredPricing || null,
            sortOrder: idx,
          })
          .onConflictDoUpdate({
            target: productsTable.id,
            set: {
              sku: p.sku,
              name: p.name,
              subtitle: p.subtitle || '',
              category: p.category,
              categories: p.categories || [p.category],
              price: Number(p.price),
              wholesalePrice: Number(p.wholesalePrice || 0),
              shippingCostPerOrder: Number(p.shippingCostPerOrder || 0),
              originalPrice: Number(p.originalPrice),
              discountPercent: Number(p.discountPercent || 0),
              rating: Number(p.rating || 5),
              reviewCount: Number(p.reviewCount || 0),
              stock: Number(p.stock ?? 10),
              isNew: Boolean(p.isNew),
              isSpecialOffer: Boolean(p.isSpecialOffer),
              isPublished: p.isPublished !== undefined ? Boolean(p.isPublished) : true,
              colors: p.colors || [],
              images: p.images || [],
              videos: p.videos || [],
              specs: p.specs || ({} as any),
              boxContents: p.boxContents || [],
              description: p.description || '',
              features: p.features || [],
              tieredPricing: p.tieredPricing || null,
              sortOrder: idx,
            },
          });
      }
      if (cachedSnapshot) {
        cachedSnapshot.products = payload.products;
      }
    }

    if (Array.isArray(payload.categories) && payload.categories.length > 0) {
      for (let idx = 0; idx < payload.categories.length; idx++) {
        const c = payload.categories[idx];
        await db
          .insert(categoriesTable)
          .values({
            id: c.id,
            name: c.name,
            slug: c.slug,
            count: Number(c.count) || 0,
            sortOrder: idx,
          })
          .onConflictDoUpdate({
            target: categoriesTable.id,
            set: {
              name: c.name,
              slug: c.slug,
              count: Number(c.count) || 0,
              sortOrder: idx,
            },
          });
      }
      if (cachedSnapshot) {
        cachedSnapshot.categories = payload.categories;
      }
    }

    if (payload.settings) {
      await updateSettingsDb(payload.settings);
    }

    if (Array.isArray(payload.orders)) {
      for (const o of payload.orders) {
        await db
          .insert(ordersTable)
          .values({
            id: o.id,
            orderNumber: o.orderNumber,
            date: o.date,
            customerName: o.customerName,
            phone: o.phone,
            city: o.city,
            address: o.address,
            notes: o.notes || '',
            items: o.items,
            subtotal: Number(o.subtotal),
            shippingFee: Number(o.shippingFee || 0),
            totalAmount: Number(o.totalAmount),
            paymentMethod: o.paymentMethod || 'COD (الدفع عند الاستلام)',
            status: o.status,
            adminNotes: o.adminNotes || '',
            history: o.history || [],
            whatsappSent: Boolean(o.whatsappSent),
            whatsappSentDate: o.whatsappSentDate || null,
            confirmedAt: o.confirmedAt || null,
            customerAction: o.customerAction || 'pending',
            clientIp: o.clientIp || null,
          })
          .onConflictDoUpdate({
            target: ordersTable.id,
            set: {
              status: o.status,
              adminNotes: o.adminNotes || '',
              history: o.history || [],
              whatsappSent: Boolean(o.whatsappSent),
              whatsappSentDate: o.whatsappSentDate || null,
              confirmedAt: o.confirmedAt || null,
              customerAction: o.customerAction || 'pending',
            },
          });
      }
    }

    bumpStoreCacheVersion();
  } catch (error) {
    console.error('Database query failed in syncStoreDataDb:', error);
    throw new Error('Failed to synchronize store data with database.', { cause: error });
  }
}

// ---------------- PERSISTENT POSTGRESQL MEDIA STORAGE ---------------- //

export async function saveMediaAssetDb(asset: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<void> {
  await ensureDatabaseSchema();
  const dataBase64 = asset.buffer.toString('base64');
  await db
    .insert(mediaAssetsTable)
    .values({
      filename: asset.filename,
      mimeType: asset.mimeType,
      dataBase64,
      size: asset.buffer.length,
    })
    .onConflictDoUpdate({
      target: mediaAssetsTable.filename,
      set: {
        mimeType: asset.mimeType,
        dataBase64,
        size: asset.buffer.length,
      },
    });
}

export async function getMediaAssetDb(filename: string): Promise<{
  filename: string;
  mimeType: string;
  buffer: Buffer;
  size: number;
} | null> {
  await ensureDatabaseSchema();
  const rows = await db
    .select()
    .from(mediaAssetsTable)
    .where(eq(mediaAssetsTable.filename, filename))
    .limit(1);
  if (!rows[0]) return null;
  return {
    filename: rows[0].filename,
    mimeType: rows[0].mimeType,
    buffer: Buffer.from(rows[0].dataBase64, 'base64'),
    size: rows[0].size,
  };
}

export async function listMediaAssetsDb(): Promise<
  Array<{ name: string; url: string; size: number; createdAt: Date | null }>
> {
  await ensureDatabaseSchema();
  const rows = await db
    .select({
      filename: mediaAssetsTable.filename,
      size: mediaAssetsTable.size,
      createdAt: mediaAssetsTable.createdAt,
    })
    .from(mediaAssetsTable)
    .orderBy(desc(mediaAssetsTable.createdAt));

  return rows.map((r) => ({
    name: r.filename,
    url: `/uploads/${r.filename}`,
    size: r.size,
    createdAt: r.createdAt,
  }));
}

export async function deleteMediaAssetDb(filename: string): Promise<boolean> {
  await ensureDatabaseSchema();
  const deleted = await db
    .delete(mediaAssetsTable)
    .where(eq(mediaAssetsTable.filename, filename))
    .returning({ filename: mediaAssetsTable.filename });
  return deleted.length > 0;
}

export async function saveMediaChunkDb(
  uploadId: string,
  chunkIndex: number,
  buffer: Buffer
): Promise<void> {
  await ensureDatabaseSchema();
  const id = `${uploadId}:${chunkIndex}`;
  const dataBase64 = buffer.toString('base64');
  await db
    .insert(mediaChunksTable)
    .values({
      id,
      uploadId,
      chunkIndex,
      dataBase64,
    })
    .onConflictDoUpdate({
      target: mediaChunksTable.id,
      set: { dataBase64 },
    });
}

export async function assembleMediaChunksDb(uploadId: string): Promise<Buffer> {
  await ensureDatabaseSchema();
  const chunks = await db
    .select()
    .from(mediaChunksTable)
    .where(eq(mediaChunksTable.uploadId, uploadId))
    .orderBy(asc(mediaChunksTable.chunkIndex));

  const buffers = chunks.map((c) => Buffer.from(c.dataBase64, 'base64'));
  await db.delete(mediaChunksTable).where(eq(mediaChunksTable.uploadId, uploadId));
  return Buffer.concat(buffers);
}

