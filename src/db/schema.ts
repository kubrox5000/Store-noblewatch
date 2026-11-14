import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type {
  FaqItem,
  OrderHistoryItem,
  OrderItem,
  OrderSecuritySettings,
  SocialLinks,
  StorePolicies,
  TieredPricing,
  TrackingPixelsSettings,
  WatchColor,
  WatchSpecs,
  WatchVideo,
} from '../types.ts';

// 1. Users table linked to Firebase Authentication UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('customer'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Store settings (singleton row id = 1)
export const storeSettings = pgTable('store_settings', {
  id: integer('id').primaryKey(),
  storeName: text('store_name').notNull().default('Noblewatch'),
  tagline: text('tagline').notNull().default(''),
  announcementText: text('announcement_text').notNull().default(''),
  currency: text('currency').notNull().default('د.م.'),
  whatsappNumber: text('whatsapp_number').notNull().default(''),
  contactPhone: text('contact_phone').notNull().default(''),
  contactEmail: text('contact_email').notNull().default(''),
  city: text('city').notNull().default('الدار البيضاء'),
  heroTitle: text('hero_title').notNull().default(''),
  heroSubtitle: text('hero_subtitle').notNull().default(''),
  heroBadge: text('hero_badge').notNull().default(''),
  heroImage: text('hero_image').notNull().default('/assets/watches_and_accessories_hero.jpg'),
  heroCtaText: text('hero_cta_text').notNull().default('اكتشف المجموعة الآن'),
  heroSecondaryText: text('hero_secondary_text').notNull().default('تواصل عبر واتساب'),
  freeShippingThreshold: integer('free_shipping_threshold').notNull().default(0),
  adminPasswordHash: text('admin_password_hash').notNull().default('admin123'),
  socialLinks: jsonb('social_links').$type<SocialLinks>().notNull().default({}),
  orderSecurity: jsonb('order_security').$type<OrderSecuritySettings>().notNull().default({} as OrderSecuritySettings),
  trackingPixels: jsonb('tracking_pixels').$type<TrackingPixelsSettings>().notNull().default({} as TrackingPixelsSettings),
  faqs: jsonb('faqs').$type<FaqItem[]>().notNull().default([]),
  policies: jsonb('policies').$type<StorePolicies>().notNull().default({} as StorePolicies),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Categories table
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  count: integer('count').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
});

// 4. Products table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  subtitle: text('subtitle').notNull().default(''),
  category: text('category').notNull(),
  categories: jsonb('categories').$type<string[]>().notNull().default([]),
  price: doublePrecision('price').notNull(),
  wholesalePrice: doublePrecision('wholesale_price').notNull().default(0),
  shippingCostPerOrder: doublePrecision('shipping_cost_per_order').notNull().default(0),
  originalPrice: doublePrecision('original_price').notNull(),
  discountPercent: integer('discount_percent').notNull().default(0),
  rating: doublePrecision('rating').notNull().default(5),
  reviewCount: integer('review_count').notNull().default(0),
  stock: integer('stock').notNull().default(10),
  isNew: boolean('is_new').notNull().default(false),
  isSpecialOffer: boolean('is_special_offer').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(true),
  colors: jsonb('colors').$type<WatchColor[]>().notNull().default([]),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  videos: jsonb('videos').$type<WatchVideo[]>().notNull().default([]),
  specs: jsonb('specs').$type<WatchSpecs>().notNull().default({} as WatchSpecs),
  boxContents: jsonb('box_contents').$type<string[]>().notNull().default([]),
  description: text('description').notNull().default(''),
  features: jsonb('features').$type<string[]>().notNull().default([]),
  tieredPricing: jsonb('tiered_pricing').$type<TieredPricing | null>(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Orders table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  date: text('date').notNull(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  city: text('city').notNull(),
  address: text('address').notNull(),
  notes: text('notes').notNull().default(''),
  items: jsonb('items').$type<OrderItem[]>().notNull().default([]),
  subtotal: doublePrecision('subtotal').notNull(),
  shippingFee: doublePrecision('shipping_fee').notNull().default(0),
  totalAmount: doublePrecision('total_amount').notNull(),
  paymentMethod: text('payment_method').notNull().default('COD (الدفع عند الاستلام)'),
  status: text('status').notNull().default('جديد'),
  adminNotes: text('admin_notes').notNull().default(''),
  history: jsonb('history').$type<OrderHistoryItem[]>().notNull().default([]),
  whatsappSent: boolean('whatsapp_sent').notNull().default(false),
  whatsappSentDate: text('whatsapp_sent_date'),
  confirmedAt: text('confirmed_at'),
  customerAction: text('customer_action').notNull().default('pending'),
  clientIp: text('client_ip'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Reviews table
export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  author: text('author').notNull(),
  city: text('city').notNull().default('المغرب'),
  rating: integer('rating').notNull().default(5),
  date: text('date').notNull(),
  comment: text('comment').notNull(),
  isVerified: boolean('is_verified').notNull().default(true),
  isApproved: boolean('is_approved').notNull().default(true),
  customerPhoto: text('customer_photo'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. Deleted order IDs blacklist (prevents deleted orders from reappearing)
export const deletedOrders = pgTable('deleted_orders', {
  id: text('id').primaryKey(),
  deletedAt: timestamp('deleted_at').defaultNow(),
});

// 8. Security block logs (anti-bot, anti-fake, anti-duplicate, blacklist)
export const securityLogs = pgTable('security_logs', {
  id: text('id').primaryKey(),
  time: text('time').notNull(),
  reasonType: text('reason_type').notNull(),
  reasonMessage: text('reason_message').notNull(),
  customerName: text('customer_name'),
  phone: text('phone'),
  city: text('city'),
  ip: text('ip'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Persistent media assets stored in PostgreSQL (required for serverless environments like Netlify)
export const mediaAssets = pgTable('media_assets', {
  filename: text('filename').primaryKey(),
  mimeType: text('mime_type').notNull(),
  dataBase64: text('data_base64').notNull(),
  size: integer('size').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// 10. Temporary upload chunks stored in PostgreSQL across serverless invocations
export const mediaChunks = pgTable('media_chunks', {
  id: text('id').primaryKey(),
  uploadId: text('upload_id').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  dataBase64: text('data_base64').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

