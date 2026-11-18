import type { OrderItem, Product, TrackingPixelsSettings } from '../types';

export type PixelScriptState =
  | 'disabled'
  | 'missing_id'
  | 'invalid_id'
  | 'loading'
  | 'loaded'
  | 'blocked';

export interface SinglePixelDiagnostic {
  enabled: boolean;
  id: string;
  formatValid: boolean;
  scriptState: PixelScriptState;
  sdkReady: boolean;
  initialized: boolean;
  testEventDispatched?: boolean;
  note: string;
}

export interface PixelsDiagnosticReport {
  checkedAt: string;
  facebook: SinglePixelDiagnostic;
  google: SinglePixelDiagnostic;
  dispatchedEvents: string[];
}

declare global {
  interface Window {
    fbq?: ((...args: any[]) => void) & {
      callMethod?: (...args: any[]) => void;
      queue?: any[];
      loaded?: boolean;
      version?: string;
      push?: (...args: any[]) => void;
    };
    _fbq?: any;
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

const DEFAULT_CURRENCY = 'MAD';

let currentPixelsConfig: TrackingPixelsSettings = {
  facebookEnabled: false,
  facebookPixelId: '',
  googleEnabled: false,
  googleTagId: '',
  googleAdsConversionLabel: '',
};

const initializedFacebookIds = new Set<string>();
const initializedGoogleIds = new Set<string>();

let fbScriptState: PixelScriptState = 'disabled';
let googleScriptState: PixelScriptState = 'disabled';
let fbInitialPageViewSent = false;

export function extractFacebookPixelId(raw?: string): string {
  const str = String(raw || '').trim();
  if (!str) return '';
  if (/^\d{10,20}$/.test(str)) return str;

  // Match Meta Pixel snippet: fbq('init', '123456789012345') or tr?id=123456789012345
  const initMatch = str.match(/fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d{10,20})['"]/i);
  if (initMatch?.[1]) return initMatch[1];

  const urlMatch = str.match(/[?&]id=(\d{10,20})/i);
  if (urlMatch?.[1]) return urlMatch[1];

  // Match first standalone 10-20 digit sequence
  const seqMatch = str.match(/\b(\d{10,20})\b/);
  if (seqMatch?.[1]) return seqMatch[1];

  return str.replace(/[^\d]/g, '');
}

export function extractGoogleTagId(raw?: string): string {
  const str = String(raw || '').trim().toUpperCase();
  if (!str) return '';
  const match = str.match(/\b(G-[A-Z0-9]{4,20}|AW-\d{6,16}|GTM-[A-Z0-9]{4,16})\b/);
  if (match?.[1]) return match[1];
  return str.replace(/\s+/g, '');
}

export function normalizeFacebookPixelId(raw?: string): string {
  return extractFacebookPixelId(raw);
}

export function normalizeGoogleTagId(raw?: string): string {
  return extractGoogleTagId(raw);
}

export function isValidFacebookPixelId(raw?: string): boolean {
  const id = normalizeFacebookPixelId(raw);
  return /^\d{10,20}$/.test(id);
}

export function isValidGoogleTagId(raw?: string): boolean {
  const id = normalizeGoogleTagId(raw);
  return /^(G-[A-Z0-9]{4,20}|AW-\d{6,16}|GTM-[A-Z0-9]{4,16})$/.test(id);
}

export function getGoogleTagType(raw?: string): 'ga4' | 'ads' | 'gtm' | 'unknown' {
  const id = normalizeGoogleTagId(raw);
  if (id.startsWith('G-')) return 'ga4';
  if (id.startsWith('AW-')) return 'ads';
  if (id.startsWith('GTM-')) return 'gtm';
  return 'unknown';
}

function ensureFacebookStub() {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq === 'function') return;

  const fbqFunc: any = function (...args: any[]) {
    if (fbqFunc.callMethod) {
      fbqFunc.callMethod.apply(fbqFunc, args);
    } else {
      fbqFunc.queue.push(args);
    }
  };
  if (!window._fbq) window._fbq = fbqFunc;
  fbqFunc.push = fbqFunc;
  fbqFunc.loaded = true;
  fbqFunc.version = '2.0';
  fbqFunc.queue = [];
  window.fbq = fbqFunc;
}

function ensureGoogleGtagStub() {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag('js', new Date());
  }
}

function loadScriptOnce(
  elementId: string,
  src: string,
  onLoad: () => void,
  onError: () => void
) {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById(elementId) as HTMLScriptElement | null;
  if (existing) {
    if (existing.dataset.src === src) {
      if (existing.dataset.status === 'loaded') {
        onLoad();
      } else if (existing.dataset.status === 'blocked') {
        onError();
      }
      return;
    }
    existing.remove();
  }

  const script = document.createElement('script');
  script.id = elementId;
  script.async = true;
  script.src = src;
  script.dataset.src = src;
  script.dataset.status = 'loading';

  script.onload = () => {
    script.dataset.status = 'loaded';
    onLoad();
  };
  script.onerror = () => {
    script.dataset.status = 'blocked';
    onError();
  };

  document.head.appendChild(script);
}

export function initTrackingPixels(config?: TrackingPixelsSettings | null): void {
  if (typeof window === 'undefined') return;

  currentPixelsConfig = {
    facebookEnabled: Boolean(config?.facebookEnabled),
    facebookPixelId: normalizeFacebookPixelId(config?.facebookPixelId),
    googleEnabled: Boolean(config?.googleEnabled),
    googleTagId: normalizeGoogleTagId(config?.googleTagId),
    googleAdsConversionLabel: String(config?.googleAdsConversionLabel || '').trim(),
  };

  // 1. Facebook / Meta Pixel initialization
  try {
    if (!currentPixelsConfig.facebookEnabled) {
      fbScriptState = 'disabled';
    } else if (!currentPixelsConfig.facebookPixelId) {
      fbScriptState = 'missing_id';
    } else if (!isValidFacebookPixelId(currentPixelsConfig.facebookPixelId)) {
      fbScriptState = 'invalid_id';
    } else {
      ensureFacebookStub();
      const fbId = currentPixelsConfig.facebookPixelId;
      if (!initializedFacebookIds.has(fbId)) {
        window.fbq?.('init', fbId);
        initializedFacebookIds.add(fbId);
        if (!fbInitialPageViewSent) {
          window.fbq?.('track', 'PageView');
          fbInitialPageViewSent = true;
        }
      }

      if (fbScriptState !== 'loaded') {
        fbScriptState = 'loading';
      }
      loadScriptOnce(
        'noblewatch-fb-pixel-script',
        'https://connect.facebook.net/en_US/fbevents.js',
        () => {
          fbScriptState = 'loaded';
        },
        () => {
          fbScriptState = 'blocked';
        }
      );
    }
  } catch {
    fbScriptState = 'blocked';
  }

  // 2. Google Pixel (GA4 / Google Ads / Google Tag Manager) initialization
  try {
    if (!currentPixelsConfig.googleEnabled) {
      googleScriptState = 'disabled';
    } else if (!currentPixelsConfig.googleTagId) {
      googleScriptState = 'missing_id';
    } else if (!isValidGoogleTagId(currentPixelsConfig.googleTagId)) {
      googleScriptState = 'invalid_id';
    } else {
      const gId = currentPixelsConfig.googleTagId;
      const gType = getGoogleTagType(gId);

      if (gType === 'gtm') {
        window.dataLayer = window.dataLayer || [];
        if (!initializedGoogleIds.has(gId)) {
          window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
          initializedGoogleIds.add(gId);
        }
        if (googleScriptState !== 'loaded') {
          googleScriptState = 'loading';
        }
        loadScriptOnce(
          'noblewatch-google-pixel-script',
          `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gId)}`,
          () => {
            googleScriptState = 'loaded';
          },
          () => {
            googleScriptState = 'blocked';
          }
        );
      } else {
        ensureGoogleGtagStub();
        if (!initializedGoogleIds.has(gId)) {
          window.gtag?.('config', gId, { send_page_view: true });
          initializedGoogleIds.add(gId);
        }
        if (googleScriptState !== 'loaded') {
          googleScriptState = 'loading';
        }
        loadScriptOnce(
          'noblewatch-google-pixel-script',
          `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gId)}`,
          () => {
            googleScriptState = 'loaded';
          },
          () => {
            googleScriptState = 'blocked';
          }
        );
      }
    }
  } catch {
    googleScriptState = 'blocked';
  }
}

function isFbReady(): boolean {
  return (
    typeof window !== 'undefined' &&
    currentPixelsConfig.facebookEnabled &&
    isValidFacebookPixelId(currentPixelsConfig.facebookPixelId) &&
    typeof window.fbq === 'function'
  );
}

function isGoogleActive(): boolean {
  return (
    typeof window !== 'undefined' &&
    currentPixelsConfig.googleEnabled &&
    isValidGoogleTagId(currentPixelsConfig.googleTagId) &&
    (typeof window.gtag === 'function' || Array.isArray(window.dataLayer))
  );
}

function emitGoogleEvent(eventName: string, params: Record<string, any>) {
  if (!isGoogleActive()) return;
  const gType = getGoogleTagType(currentPixelsConfig.googleTagId);
  if (gType === 'gtm') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...params });
  } else if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

export function trackPixelPageView(pageTitle?: string): void {
  try {
    if (isFbReady()) {
      window.fbq?.('track', 'PageView');
    }
    if (isGoogleActive()) {
      emitGoogleEvent('page_view', {
        page_title: pageTitle || (typeof document !== 'undefined' ? document.title : ''),
        page_location: typeof window !== 'undefined' ? window.location.href : '',
      });
    }
  } catch {
    // Silent guard against third-party blockers
  }
}

export function trackPixelViewContent(product: Product): void {
  if (!product) return;
  try {
    const price = Number(product.price) || 0;
    if (isFbReady()) {
      window.fbq?.('track', 'ViewContent', {
        content_ids: [product.id],
        content_name: product.name,
        content_category: product.category,
        content_type: 'product',
        value: price,
        currency: DEFAULT_CURRENCY,
      });
    }
    if (isGoogleActive()) {
      emitGoogleEvent('view_item', {
        currency: DEFAULT_CURRENCY,
        value: price,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            price,
            quantity: 1,
          },
        ],
      });
    }
  } catch {
    // Silent guard
  }
}

export function trackPixelAddToCart(
  product: Product,
  quantity = 1,
  unitPrice?: number
): void {
  if (!product) return;
  try {
    const qty = Math.max(1, Number(quantity) || 1);
    const price = typeof unitPrice === 'number' ? unitPrice : Number(product.price) || 0;
    const totalValue = Number((price * qty).toFixed(2));

    if (isFbReady()) {
      window.fbq?.('track', 'AddToCart', {
        content_ids: [product.id],
        content_name: product.name,
        content_category: product.category,
        content_type: 'product',
        value: totalValue,
        currency: DEFAULT_CURRENCY,
        num_items: qty,
      });
    }
    if (isGoogleActive()) {
      emitGoogleEvent('add_to_cart', {
        currency: DEFAULT_CURRENCY,
        value: totalValue,
        items: [
          {
            item_id: product.id,
            item_name: product.name,
            item_category: product.category,
            price,
            quantity: qty,
          },
        ],
      });
    }
  } catch {
    // Silent guard
  }
}

export function trackPixelInitiateCheckout(params: {
  items: Array<{ id: string; name: string; category?: string; price: number; quantity: number }>;
  totalValue: number;
}): void {
  try {
    const totalValue = Number(params.totalValue) || 0;
    const numItems = params.items.reduce((s, it) => s + (Number(it.quantity) || 1), 0);

    if (isFbReady()) {
      window.fbq?.('track', 'InitiateCheckout', {
        content_ids: params.items.map((it) => it.id),
        content_type: 'product',
        num_items: numItems,
        value: totalValue,
        currency: DEFAULT_CURRENCY,
      });
    }
    if (isGoogleActive()) {
      emitGoogleEvent('begin_checkout', {
        currency: DEFAULT_CURRENCY,
        value: totalValue,
        items: params.items.map((it) => ({
          item_id: it.id,
          item_name: it.name,
          item_category: it.category || '',
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1,
        })),
      });
    }
  } catch {
    // Silent guard
  }
}

export function trackPixelPurchase(params: {
  orderNumber: string;
  totalAmount: number;
  items: OrderItem[];
}): void {
  try {
    const value = Number(params.totalAmount) || 0;
    const items = Array.isArray(params.items) ? params.items : [];
    const numItems = items.reduce((s, it) => s + (Number(it.quantity) || 1), 0);

    if (isFbReady()) {
      window.fbq?.('track', 'Purchase', {
        content_ids: items.map((it) => it.productId),
        content_type: 'product',
        num_items: numItems,
        value,
        currency: DEFAULT_CURRENCY,
        order_id: params.orderNumber,
      });
    }

    if (isGoogleActive()) {
      emitGoogleEvent('purchase', {
        transaction_id: params.orderNumber,
        value,
        currency: DEFAULT_CURRENCY,
        items: items.map((it) => ({
          item_id: it.productId,
          item_name: it.name,
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1,
        })),
      });

      const gId = currentPixelsConfig.googleTagId;
      const adsLabel = currentPixelsConfig.googleAdsConversionLabel;
      if (gId.startsWith('AW-') && adsLabel && typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          send_to: `${gId}/${adsLabel}`,
          value,
          currency: DEFAULT_CURRENCY,
          transaction_id: params.orderNumber,
        });
      }
    }
  } catch {
    // Silent guard
  }
}

function describeFbState(
  enabled: boolean,
  id: string,
  formatValid: boolean,
  state: PixelScriptState,
  sdkReady: boolean
): string {
  if (!enabled) return 'البيكسل غير مفعل حالياً في الإعدادات.';
  if (!id) return 'يرجى إدخال معرف Facebook Pixel ID رقمي.';
  if (!formatValid) return 'صيغة المعرف غير صالحة (يجب أن يتكون من 10 إلى 20 رقماً فقط).';
  if (state === 'loaded' && sdkReady) return 'تم تحميل سكريبت Meta Pixel وتفعيله بنجاح دون أخطاء.';
  if (state === 'blocked') {
    return 'المعرف والتهيئة سليمان، لكن المتصفح أو إضافة مانع الإعلانات (AdBlocker) منعت تحميل السكريبت خارجياً.';
  }
  if (state === 'loading') return 'جاري الاتصال بخوادم Meta وتحميل السكريبت...';
  return sdkReady ? 'تم تجهيز واجهة التتبع بنجاح.' : 'في انتظار التحميل.';
}

function describeGoogleState(
  enabled: boolean,
  id: string,
  formatValid: boolean,
  state: PixelScriptState,
  sdkReady: boolean
): string {
  if (!enabled) return 'Google Pixel غير مفعل حالياً في الإعدادات.';
  if (!id) return 'يرجى إدخال معرف Google (مثل G-XXXX أو AW-XXXX أو GTM-XXXX).';
  if (!formatValid) return 'صيغة المعرف غير صالحة (يجب أن يبدأ بـ G- أو AW- أو GTM-).';
  if (state === 'loaded' && sdkReady) return 'تم تحميل Google Tag وتفعيله بنجاح دون أخطاء.';
  if (state === 'blocked') {
    return 'المعرف والتهيئة سليمان، لكن المتصفح أو مانع الإعلانات (AdBlocker) منع تحميل googletagmanager.com.';
  }
  if (state === 'loading') return 'جاري الاتصال بخوادم Google Tag Manager...';
  return sdkReady ? 'تم تجهيز طبقة البيانات (dataLayer) بنجاح.' : 'في انتظار التحميل.';
}

export function getPixelDiagnostics(config?: TrackingPixelsSettings | null): PixelsDiagnosticReport {
  const fbEnabled = Boolean(config?.facebookEnabled);
  const fbId = normalizeFacebookPixelId(config?.facebookPixelId);
  const fbValid = isValidFacebookPixelId(fbId);
  const fbSdkReady = typeof window !== 'undefined' && typeof window.fbq === 'function';

  const gEnabled = Boolean(config?.googleEnabled);
  const gId = normalizeGoogleTagId(config?.googleTagId);
  const gValid = isValidGoogleTagId(gId);
  const gSdkReady =
    typeof window !== 'undefined' &&
    (typeof window.gtag === 'function' || Array.isArray(window.dataLayer));

  return {
    checkedAt: new Date().toISOString(),
    facebook: {
      enabled: fbEnabled,
      id: fbId,
      formatValid: fbValid,
      scriptState: fbScriptState,
      sdkReady: fbSdkReady,
      initialized: fbValid && initializedFacebookIds.has(fbId),
      note: describeFbState(fbEnabled, fbId, fbValid, fbScriptState, fbSdkReady),
    },
    google: {
      enabled: gEnabled,
      id: gId,
      formatValid: gValid,
      scriptState: googleScriptState,
      sdkReady: gSdkReady,
      initialized: gValid && initializedGoogleIds.has(gId),
      note: describeGoogleState(gEnabled, gId, gValid, googleScriptState, gSdkReady),
    },
    dispatchedEvents: [],
  };
}

export async function runPixelVerificationTest(
  config?: TrackingPixelsSettings | null
): Promise<PixelsDiagnosticReport> {
  initTrackingPixels(config);

  // Allow network script onload/onerror up to 2.2s if still loading
  const start = Date.now();
  while (
    (fbScriptState === 'loading' || googleScriptState === 'loading') &&
    Date.now() - start < 2200
  ) {
    await new Promise((r) => setTimeout(r, 150));
  }

  const dispatchedEvents: string[] = [];
  let fbTestDispatched = false;
  let gTestDispatched = false;

  try {
    if (isFbReady()) {
      window.fbq?.('trackCustom', 'NoblewatchPixelVerify', {
        source: 'admin_diagnostics',
        currency: DEFAULT_CURRENCY,
      });
      fbTestDispatched = true;
      dispatchedEvents.push('Meta: NoblewatchPixelVerify');
    }
  } catch {
    // ignore
  }

  try {
    if (isGoogleActive()) {
      emitGoogleEvent('pixel_verification_test', {
        source: 'admin_diagnostics',
        currency: DEFAULT_CURRENCY,
      });
      gTestDispatched = true;
      dispatchedEvents.push('Google: pixel_verification_test');
    }
  } catch {
    // ignore
  }

  const report = getPixelDiagnostics(config);
  report.facebook.testEventDispatched = fbTestDispatched;
  report.google.testEventDispatched = gTestDispatched;
  report.dispatchedEvents = dispatchedEvents;
  return report;
}
