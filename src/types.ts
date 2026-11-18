export interface WatchColor {
  name: string;
  code: string;
  accent: string;
  imageIndex: number;
}

export interface WatchVideo {
  title: string;
  url: string;
  poster: string;
  aspect?: '16:9' | '9:16';
  duration?: string;
}

export interface WatchSpecs {
  brand: string;
  model: string;
  movement: string;
  caseMaterial: string;
  strapMaterial: string;
  dialColor: string;
  caseDiameter: string;
  caseThickness: string;
  glass: string;
  clasp: string;
  waterResistance: string;
  battery?: string;
  weight?: string;
  warranty: string;
}

export interface TieredPricing {
  enabled?: boolean;
  mode?: 'auto' | 'custom';
  twoPiecesDiscountPercent?: number;
  threePiecesDiscountPercent?: number;
  twoPiecesPrice?: number;
  threePiecesPrice?: number;
  twoPiecesBadge?: string;
  threePiecesBadge?: string;
  bundleSubTitle?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  subtitle: string;
  category: string;
  categories: string[];
  price: number;
  wholesalePrice?: number;
  shippingCostPerOrder?: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  stock: number;
  isNew: boolean;
  isSpecialOffer: boolean;
  isPublished: boolean;
  colors: WatchColor[];
  images: string[];
  videos: WatchVideo[];
  specs: WatchSpecs;
  boxContents: string[];
  description: string;
  features: string[];
  tieredPricing?: TieredPricing;
}

export interface OrderItem {
  productId: string;
  name: string;
  color: string;
  selectedColors?: string[];
  bundleLabel?: string;
  price: number;
  quantity: number;
  image: string;
}

export interface OrderHistoryItem {
  status: string;
  time: string;
  note: string;
}

export type OrderStatus =
  | 'جديد'
  | 'قيد التأكيد'
  | 'تم التأكيد'
  | 'قيد التجهيز'
  | 'تم الشحن'
  | 'تم التسليم'
  | 'ملغى'
  | 'مرتجع';

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string;
  status: OrderStatus;
  adminNotes?: string;
  history: OrderHistoryItem[];
  whatsappSent?: boolean;
  whatsappSentDate?: string;
  confirmedAt?: string;
  customerAction?: 'confirmed' | 'cancelled' | 'pending';
  promoCode?: string;
  discountAmount?: number;
}


export interface Review {
  id: string;
  productId: string;
  author: string;
  city: string;
  rating: number;
  date: string;
  comment: string;
  isVerified: boolean;
  isApproved: boolean;
  customerPhoto?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface StorePolicies {
  privacy: string;
  terms: string;
  shipping: string;
  returns: string;
  warranty: string;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
}

export interface OrderSecuritySettings {
  preventDuplicates: boolean;
  duplicateWindowHours: number;
  rapidCooldownMinutes: number;
  preventFakeOrders: boolean;
  preventBots: boolean;
  requireHumanCheck: boolean;
  autoBlockHighCancelPhones: boolean;
  autoBlockCancelThreshold: number;
  maxOrdersPerIpPerHour: number;
  blockedPhones: string[];
  promoCodes?: PromoCode[];
}

export interface PromoCode {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  active: boolean;
  minOrderAmount?: number;
}

export interface SecurityBlockLog {
  id: string;
  time: string;
  reasonType: 'duplicate' | 'fake' | 'bot' | 'blacklist' | 'rate_limit';
  reasonMessage: string;
  customerName?: string;
  phone?: string;
  city?: string;
  ip?: string;
}

export interface TrackingPixelsSettings {
  facebookEnabled: boolean;
  facebookPixelId: string;
  googleEnabled: boolean;
  googleTagId: string;
  googleAdsConversionLabel?: string;
  tiktokEnabled: boolean;
  tiktokPixelId: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  announcementText: string;
  currency: string;
  whatsappNumber: string;
  contactPhone: string;
  contactEmail: string;
  city: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  heroImage: string;
  heroCtaText: string;
  heroSecondaryText: string;
  freeShippingThreshold: number;
  adminPasswordHash?: string;
  socialLinks?: SocialLinks;
  orderSecurity?: OrderSecuritySettings;
  trackingPixels?: TrackingPixelsSettings;
  promoCodes?: PromoCode[];
  faqs: FaqItem[];
  policies: StorePolicies;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  color: string;
  selectedColors?: string[];
  bundleLabel?: string;
}

