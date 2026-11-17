import type { Order } from '../types';

export const MOROCCAN_CITIES = [
  'الدار البيضاء (Casablanca)',
  'الرباط (Rabat)',
  'مراكش (Marrakech)',
  'طنجة (Tanger)',
  'فاس (Fès)',
  'أكادير (Agadir)',
  'مكناس (Meknès)',
  'وجدة (Oujda)',
  'القنيطرة (Kénitra)',
  'تطوان (Tétouan)',
  'تمارة (Témara)',
  'سلا (Salé)',
  'المحمدية (Mohammédia)',
  'الجديدة (El Jadida)',
  'آسفي (Safi)',
  'بني ملال (Béni Mellal)',
  'خريبكة (Khouribga)',
  'الناظور (Nador)',
  'تازة (Taza)',
  'برشيد (Berrechid)',
  'سطات (Settat)',
  'العرائش (Larache)',
  'القصر الكبير (Ksar El Kebir)',
  'كلميم (Guelmim)',
  'العيون (Laâyoune)',
  'الداخلة (Dakhla)',
  'ورزازات (Ouarzazate)',
  'الصويرة (Essaouira)',
  'تارودانت (Taroudant)',
  'بركان (Berkane)',
  'سيدي قاسم (Sidi Kacem)',
  'سيدي سليمان (Sidi Slimane)',
  'الخميسات (Khémisset)',
  'الحسيمة (Al Hoceïma)',
  'شفشاون (Chefchaouen)',
  'إفران (Ifrane)',
  'ميدلت (Midelt)',
  'الرشيدية (Errachidia)',
  'أخرى (مدينة / قرية مغربية أخرى)'
];

export function normalizeMoroccanCityName(city: string): string {
  const trimmed = (city || '').trim();
  if (!trimmed) return '';
  if (trimmed === 'الدار') return 'الدار البيضاء';
  if (trimmed === 'بني') return 'بني ملال';
  if (trimmed === 'القصر') return 'القصر الكبير';
  return trimmed;
}

export function formatPrice(amount: number, currencyOrLang: string = 'MAD', lang?: 'ar' | 'fr'): string {
  const isFr = lang === 'fr' || currencyOrLang === 'fr';
  const currencyLabel =
    currencyOrLang === 'fr' || currencyOrLang === 'ar'
      ? (isFr ? 'DH' : 'MAD')
      : currencyOrLang;
  return `${amount.toLocaleString(isFr ? 'fr-MA' : 'ar-MA')} ${currencyLabel}`;
}

export function normalizeMoroccanPhone(phone: string): string {
  let cleaned = (phone || '').replace(/[\s\-\.\(\)\+]/g, '');
  if (cleaned.startsWith('00212')) {
    cleaned = '0' + cleaned.slice(5);
  } else if (cleaned.startsWith('212') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.slice(3);
  }
  return cleaned;
}

export function isFakeMoroccanPhonePattern(phone: string): boolean {
  const norm = normalizeMoroccanPhone(phone);
  if (!/^0[567]\d{8}$/.test(norm)) return true;

  const subscriber = norm.slice(2); // last 8 digits
  // All 8 digits identical (e.g., 0600000000, 0611111111, 0666666666)
  if (/^(\d)\1{7}$/.test(subscriber)) return true;

  // All 9 digits after '0' identical (e.g., 0666666666, 0777777777)
  if (/^(\d)\1{8}$/.test(norm.slice(1))) return true;

  // 7+ repeated identical digits in subscriber part
  const digitCounts: Record<string, number> = {};
  for (const ch of subscriber) {
    digitCounts[ch] = (digitCounts[ch] || 0) + 1;
  }
  if (Math.max(...Object.values(digitCounts)) >= 7) return true;

  // Known fake / placeholder sequences
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

  // Repeating 2-digit pattern like 12121212 or 45454545
  if (/^(\d{2})\1{3}$/.test(subscriber)) return true;

  // Ascending or descending 7+ digit run inside subscriber
  if (
    '0123456789'.includes(subscriber) ||
    '9876543210'.includes(subscriber)
  ) {
    return true;
  }

  return false;
}

export function validateMoroccanPhone(phone: string): boolean {
  const norm = normalizeMoroccanPhone(phone);
  if (!/^0[567]\d{8}$/.test(norm)) return false;
  return !isFakeMoroccanPhonePattern(norm);
}

export function isFakeCustomerName(name: string): boolean {
  const trimmed = (name || '').trim();
  if (trimmed.length < 3) return true;
  // Contains numbers
  if (/\d/.test(trimmed)) return true;
  // Repeated same character 4+ times (e.g. اااا, xxxx, aaaa)
  if (/(.)\1{3,}/u.test(trimmed)) return true;
  // Fewer than 2 distinct non-space letters
  const letters = trimmed.replace(/[\s\-_\.]/g, '');
  const uniqueChars = new Set(letters.toLowerCase().split(''));
  if (letters.length < 3 || uniqueChars.size < 2) return true;

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

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'جديد': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'قيد التأكيد': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  'تم التأكيد': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  'قيد التجهيز': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  'تم الشحن': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  'تم التسليم': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'ملغى': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  'مرتجع': { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' },
};

export const DEFAULT_WATCH_COLORS = [
  { name: 'أسود ملكي', code: '#111111', accent: '#000000', imageIndex: 0 },
  { name: 'فضي كلاسيكي', code: '#d1d5db', accent: '#9ca3af', imageIndex: 0 },
  { name: 'ذهبي فاخر', code: '#dfb76c', accent: '#b8860b', imageIndex: 0 },
  { name: 'روز غولد', code: '#b76e79', accent: '#a25964', imageIndex: 0 },
];

export function getProductColors(product?: { colors?: Array<{ name: string; code: string; accent?: string; imageIndex?: number }> } | null) {
  if (product?.colors && Array.isArray(product.colors) && product.colors.length > 0) {
    // Filter out any invalid items
    const valid = product.colors.filter((c) => c && c.name && c.name.trim() !== '');
    if (valid.length > 0) {
      return valid;
    }
  }
  return DEFAULT_WATCH_COLORS;
}

export interface TierBundleOffer {
  quantity: number;
  label: string;
  subLabel: string;
  totalPrice: number;
  originalTotal: number;
  unitPrice: number;
  savingsMAD: number;
  discountPercent: number;
  badge?: string;
  isPopular?: boolean;
}

export function calculateTierOffers(
  product?: {
    price: number;
    originalPrice?: number;
    tieredPricing?: {
      enabled?: boolean;
      mode?: 'auto' | 'custom';
      twoPiecesDiscountPercent?: number;
      threePiecesDiscountPercent?: number;
      twoPiecesPrice?: number;
      threePiecesPrice?: number;
      twoPiecesBadge?: string;
      threePiecesBadge?: string;
      bundleSubTitle?: string;
    };
  } | null,
  lang: 'ar' | 'fr' = 'ar'
): TierBundleOffer[] {
  const isFr = lang === 'fr';
  const p1Price = Number(product?.price) || 0;
  const p1Original = Number(product?.originalPrice) && Number(product?.originalPrice) > p1Price
    ? Number(product?.originalPrice)
    : Math.round(p1Price * 1.35);

  // Tier 1: 1 piece
  const tier1: TierBundleOffer = {
    quantity: 1,
    label: isFr ? '1 Pièce' : '1 قطعة',
    subLabel: isFr ? 'Prix unitaire' : 'السعر الفردي',
    totalPrice: p1Price,
    originalTotal: p1Original,
    unitPrice: p1Price,
    savingsMAD: Math.max(0, p1Original - p1Price),
    discountPercent: p1Original > p1Price ? Math.round(((p1Original - p1Price) / p1Original) * 100) : 0,
    badge: undefined,
    isPopular: false,
  };

  // If bundle offers explicitly disabled for this product, return only single item
  if (product?.tieredPricing && product.tieredPricing.enabled === false) {
    return [tier1];
  }

  const mode = product?.tieredPricing?.mode || (product?.tieredPricing?.twoPiecesPrice ? 'custom' : 'auto');

  // Tier 2: 2 pieces
  let tier2Total: number;
  if (mode === 'custom' && product?.tieredPricing?.twoPiecesPrice && Number(product.tieredPricing.twoPiecesPrice) > 0) {
    tier2Total = Number(product.tieredPricing.twoPiecesPrice);
  } else {
    const disc2 = Number(product?.tieredPricing?.twoPiecesDiscountPercent) || 16;
    tier2Total = Math.max(p1Price + 10, Math.round((p1Price * 2 * (1 - disc2 / 100)) / 10) * 10 - 1);
  }
  const tier2Original = p1Original * 2;
  const tier2Savings = Math.max(0, (p1Price * 2) - tier2Total);

  const badge2Raw = product?.tieredPricing?.twoPiecesBadge || 'الأكثر طلباً ⭐';
  const badge2 = isFr && badge2Raw === 'الأكثر طلباً ⭐' ? 'Plus populaire ⭐' : badge2Raw;

  const tier2: TierBundleOffer = {
    quantity: 2,
    label: isFr ? '2 Pièces (Duo)' : '2 قطع (زوج)',
    subLabel: tier2Savings > 0
      ? (isFr ? `Économisez ${tier2Savings} DH de plus` : `وفر ${tier2Savings} درهم إضافي`)
      : (isFr ? 'Tarif Pack Économie' : 'سعر باقة التوفير'),
    totalPrice: tier2Total,
    originalTotal: tier2Original,
    unitPrice: Math.round(tier2Total / 2),
    savingsMAD: Math.max(0, tier2Original - tier2Total),
    discountPercent: tier2Original > 0 ? Math.round(((tier2Original - tier2Total) / tier2Original) * 100) : 16,
    badge: badge2,
    isPopular: true,
  };

  // Tier 3: 3 pieces
  let tier3Total: number;
  if (mode === 'custom' && product?.tieredPricing?.threePiecesPrice && Number(product.tieredPricing.threePiecesPrice) > 0) {
    tier3Total = Number(product.tieredPricing.threePiecesPrice);
  } else {
    const disc3 = Number(product?.tieredPricing?.threePiecesDiscountPercent) || 24;
    tier3Total = Math.max(tier2Total + 10, Math.round((p1Price * 3 * (1 - disc3 / 100)) / 10) * 10 - 1);
  }
  const tier3Original = p1Original * 3;
  const tier3Savings = Math.max(0, (p1Price * 3) - tier3Total);

  const badge3Raw = product?.tieredPricing?.threePiecesBadge || 'أفضل توفير 🔥';
  const badge3 = isFr && badge3Raw === 'أفضل توفير 🔥' ? 'Meilleure offre 🔥' : badge3Raw;

  const tier3: TierBundleOffer = {
    quantity: 3,
    label: isFr ? '3 Pièces (Coffret)' : '3 قطع (باقة الهدايا)',
    subLabel: tier3Savings > 0
      ? (isFr ? `Économisez ${tier3Savings} DH de plus` : `وفر ${tier3Savings} درهم إضافي`)
      : (isFr ? 'Meilleur rapport qualité-prix' : 'أفضل قيمة مقابل السعر'),
    totalPrice: tier3Total,
    originalTotal: tier3Original,
    unitPrice: Math.round(tier3Total / 3),
    savingsMAD: Math.max(0, tier3Original - tier3Total),
    discountPercent: tier3Original > 0 ? Math.round(((tier3Original - tier3Total) / tier3Original) * 100) : 24,
    badge: badge3,
    isPopular: false,
  };

  return [tier1, tier2, tier3];
}

export function getBundlePriceForQuantity(
  product: { price: number; originalPrice?: number; tieredPricing?: { enabled?: boolean; twoPiecesPrice?: number; threePiecesPrice?: number } } | null | undefined,
  quantity: number,
  lang: 'ar' | 'fr' = 'ar'
): { totalPrice: number; savingsMAD: number; unitPrice: number; bundleLabel: string } {
  const isFr = lang === 'fr';
  const offers = calculateTierOffers(product, lang);
  if (quantity === 1) {
    return {
      totalPrice: offers[0].totalPrice,
      savingsMAD: offers[0].savingsMAD,
      unitPrice: offers[0].unitPrice,
      bundleLabel: isFr ? '1 pièce' : 'قطعة واحدة (1)',
    };
  }
  if (quantity === 2) {
    return {
      totalPrice: offers[1].totalPrice,
      savingsMAD: (offers[0].totalPrice * 2) - offers[1].totalPrice,
      unitPrice: offers[1].unitPrice,
      bundleLabel: isFr ? 'Pack 2 pièces - Plus populaire' : 'باقة قطعتين (2) - الأكثر طلباً',
    };
  }
  if (quantity === 3) {
    return {
      totalPrice: offers[2].totalPrice,
      savingsMAD: (offers[0].totalPrice * 3) - offers[2].totalPrice,
      unitPrice: offers[2].unitPrice,
      bundleLabel: isFr ? 'Pack 3 pièces - Économie max' : 'باقة 3 قطع (3) - التوفير الأقصى',
    };
  }
  // For quantity > 3, use the best unit price from tier 3
  const bestUnitPrice = offers[2].unitPrice;
  const regularTotal = offers[0].totalPrice * quantity;
  const totalPrice = bestUnitPrice * quantity;
  return {
    totalPrice,
    savingsMAD: Math.max(0, regularTotal - totalPrice),
    unitPrice: bestUnitPrice,
    bundleLabel: isFr ? `Pack spécial (${quantity} pièces)` : `باقة خاصة (${quantity} قطع)`,
  };
}

/**
 * Strip invisible Unicode bidi/formatting marks (e.g. U+2066..U+2069, U+200E/F) copied from phones/WhatsApp
 */
export function sanitizePhoneText(phone?: string): string {
  if (!phone) return '';
  return String(phone)
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
    .trim();
}

/**
 * Format any Moroccan phone number into standard international format for WhatsApp wa.me links
 * e.g. '0612345678' -> '212612345678', '+212 6 12 34 56 78' -> '212612345678', '⁦+212699139119⁩' -> '212699139119'
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  let raw = sanitizePhoneText(phone);
  // If user pasted a full wa.me or api.whatsapp.com link, extract the phone part first
  const waMeMatch = raw.match(/wa\.me\/([^/?#\s]+)/i);
  if (waMeMatch && waMeMatch[1]) {
    raw = waMeMatch[1];
  } else {
    const queryPhoneMatch = raw.match(/[?&]phone=([^&\s]+)/i);
    if (queryPhoneMatch && queryPhoneMatch[1]) {
      raw = queryPhoneMatch[1];
    }
  }

  let cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1).replace(/\D/g, '');
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2).replace(/\D/g, '');
  } else {
    cleaned = cleaned.replace(/\D/g, '');
  }

  if (cleaned.startsWith('2120') && cleaned.length >= 13) {
    cleaned = '212' + cleaned.substring(4);
  } else if (cleaned.startsWith('0') && cleaned.length >= 9) {
    cleaned = '212' + cleaned.substring(1);
  } else if (!cleaned.startsWith('212') && cleaned.length === 9) {
    cleaned = '212' + cleaned;
  }
  return cleaned.replace(/\D/g, '');
}

/**
 * Strip lone UTF-16 surrogates, U+FE0F variation selectors, and replacement chars
 * so WhatsApp URI links never produce  characters on Windows/Desktop clients.
 */
export function sanitizeWhatsAppText(input?: string): string {
  if (!input) return '';
  let clean = '';
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    if (code === 0xfffd || code === 0xfe0f) continue;
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
      if (next >= 0xdc00 && next <= 0xdfff) {
        clean += input[i] + input[i + 1];
        i++;
      }
      continue;
    }
    if (code >= 0xdc00 && code <= 0xdfff) continue;
    clean += input[i];
  }
  return clean;
}

/**
 * Build a clean, valid https://api.whatsapp.com/send?phone=<digits>&text=... URL
 * directly (skipping wa.me double-encoding redirect issues on desktop browsers)
 */
export function buildWhatsAppUrl(phone?: string, text?: string): string {
  const digits = formatPhoneForWhatsApp(phone || '') || '212612345678';
  const safeText = sanitizeWhatsAppText(text);
  if (safeText && safeText.trim().length > 0) {
    return `https://api.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(safeText)}`;
  }
  return `https://api.whatsapp.com/send?phone=${digits}`;
}

/**
 * Build a clean tel: href stripping invisible directional characters and spaces
 */
export function buildTelHref(phone?: string): string {
  const clean = sanitizePhoneText(phone || '+212612345678').replace(/[^\d+]/g, '');
  return `tel:${clean || '+212612345678'}`;
}

/**
 * Generate a professional, comprehensive Moroccan Arabic WhatsApp confirmation message
 * using strictly BMP (U+0000-U+FFFF) semantic icons so every client renders crisp icons
 * without  replacement characters.
 */
export function generateCustomerConfirmationMessage(
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    city: string;
    address: string;
    totalAmount: number;
    items: Array<{
      name: string;
      color: string;
      quantity: number;
      bundleLabel?: string;
      selectedColors?: string[];
    }>;
  },
  storeName: string = 'Noblewatch'
): string {
  const itemsText = (order.items || [])
    .map((it, idx) => {
      const colorsLine =
        it.selectedColors && it.selectedColors.length > 1
          ? it.selectedColors.map((c, cIdx) => `⌚ ساعة ${cIdx + 1}: ${c}`).join(' | ')
          : it.color;
      return (
        `⌚ *المنتج (${idx + 1}):* ${sanitizeWhatsAppText(it.name)}\n` +
        `   ◈ *الألوان المطلوبة:* ${sanitizeWhatsAppText(colorsLine)}\n` +
        `   ▪ *الكمية:* ${it.quantity} ${it.bundleLabel ? `[${sanitizeWhatsAppText(it.bundleLabel)}]` : ''}`
      );
    })
    .join('\n\n');

  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://noblewatch.ma';
  const confirmUrl = `${origin}/#confirm-order?id=${encodeURIComponent(order.id)}`;

  return sanitizeWhatsAppText(
    `✨ السلام عليكم ورحمة الله أخي/أختي *${order.customerName}*\n\n` +
      `⌚ معك خدمة تأكيد ومتابعة الطلبات من متجر *${storeName}* للساعات الفاخرة بالمغرب\n\n` +
      `✅ تم تسجيل طلبيتك بنجاح برقم: *#${order.orderNumber}*\n\n` +
      `☑ *تفاصيل الطلبية كاملة:*\n` +
      `${itemsText}\n\n` +
      `✔ *المبلغ الإجمالي عند الاستلام:* *${formatPrice(order.totalAmount)}*\n` +
      `⚡ *الشحن والتوصيل السريع:* *مجاناً 0 درهم* لجميع مدن وقرى المغرب ✈\n` +
      `➤ *عنوان التسليم:* ${order.city} - ${order.address}\n\n` +
      `⚖ *حق الفحص والمعاينة قبل الدفع:*\n` +
      `يحق لك فحص ومعاينة ساعتك بيدك والتأكد من لمعانها وجودتها قبل تسليم أي درهم للموزع، مع ضمان لمدة سنة كاملة ✅\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⬇ *يرجى تأكيد شحن الطلبية للبدء في تجهيزها فوراً:* ⬇\n\n` +
      `✅ *لتأكيد الطلب للشحن:* قم بالرد على هذه الرسالة بكلمة: (*تأكيد*) أو (*نعم*)\n` +
      `❌ *لإلغاء الطلب:* قم بالرد بكلمة: (*إلغاء*)\n` +
      `✏ *لتعديل اللون أو العنوان:* أرسل التعديل المطلوب مباشرة في هذه المحادثة\n\n` +
      `➡ *أو اضغط على الرابط التالي للتأكيد أو الإلغاء بنقرة واحدة:*\n` +
      `${confirmUrl}\n\n` +
      `يسعدنا دائماً خدمتك ونتمنى لك تجربة تسوق راقية وفخمة! ✨`
  );
}

/**
 * Get direct WhatsApp link to customer phone with prefilled confirmation message
 */
export function getWhatsAppCustomerOrderUrl(order: any, storeName = 'Noblewatch'): string {
  const msg = generateCustomerConfirmationMessage(order, storeName);
  return buildWhatsAppUrl(order.phone, msg);
}

/**
 * Generate a professional Arabic WhatsApp message informing the customer that their order
 * has been handed over to the delivery company and will arrive within 24 hours.
 */
export function generateCustomerShippedMessage(
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    city: string;
    address: string;
    totalAmount: number;
    items: Array<{
      name: string;
      color: string;
      quantity: number;
      bundleLabel?: string;
      selectedColors?: string[];
    }>;
  },
  storeName: string = 'Noblewatch'
): string {
  const itemsText = (order.items || [])
    .map((it, idx) => {
      const colorsLine =
        it.selectedColors && it.selectedColors.length > 1
          ? it.selectedColors.map((c, cIdx) => `ساعة ${cIdx + 1}: ${c}`).join(' | ')
          : it.color;
      return (
        `⌚ *المنتج (${idx + 1}):* ${sanitizeWhatsAppText(it.name)}\n` +
        `   ◈ *اللون:* ${sanitizeWhatsAppText(colorsLine)} | ▪ *الكمية:* ${it.quantity}`
      );
    })
    .join('\n');

  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://noblewatch.ma';
  const trackUrl = `${origin}/#track?order=${encodeURIComponent(order.orderNumber)}`;

  return sanitizeWhatsAppText(
    `✨ السلام عليكم ورحمة الله أخي/أختي *${order.customerName}*\n\n` +
      `⌚ معك قسم الشحن والمتابعة في متجر *${storeName}* للساعات الفاخرة\n\n` +
      `✅ يسعدنا إبلاغك بأنه *تم شحن طلبيتك بنجاح* وتوجيهها عبر شركة التوصيل السريع! ⚡✈\n\n` +
      `⏳ *مدة التوصيل المتوقعة (خلال 24 ساعة):*\n` +
      `سوف تتوصل بطلبك خلال *24 ساعة* بإذن الله، وسيقوم موزع شركة التوصيل بالاتصال بك هاتفياً قبل الوصول لتسليمك الطرد.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `☑ *ملخص الطلبية المشحونة:*\n` +
      `# *رقم الطلب:* *#${order.orderNumber}*\n` +
      `${itemsText}\n` +
      `➤ *عنوان التسليم:* ${order.city} - ${order.address}\n` +
      `✔ *المبلغ المطلوب عند الاستلام:* *${formatPrice(order.totalAmount)}* (التوصيل مجاني 0 درهم)\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `☎ *ملاحظة هامة:* يرجى إبقاء هاتفك متاحاً للرد على مكالمة الموزع.\n` +
      `⚖ *ضمان الثقة:* يمكنك معاينة وفحص طلبيتك قبل تسليم المبلغ للموزع.\n\n` +
      `➡ *لتتبع حالة طلبك مباشرة:*\n` +
      `${trackUrl}\n\n` +
      `نتمنى لك استلاماً موفقاً وتجربة راقية مع ساعاتنا! ✨⌚`
  );
}

/**
 * Get direct WhatsApp link with the professional 24h shipping notification message
 */
export function getWhatsAppCustomerShippedUrl(order: any, storeName = 'Noblewatch'): string {
  const msg = generateCustomerShippedMessage(order, storeName);
  return buildWhatsAppUrl(order.phone, msg);
}

const ARABIC_TO_OZON_CITY_MAP: Record<string, string> = {
  'الدار البيضاء': 'Casablanca',
  'الدار': 'Casablanca',
  'كازا': 'Casablanca',
  'الرباط': 'Rabat',
  'مراكش': 'Marrakech',
  'طنجة': 'Tanger',
  'فاس': 'Fès',
  'أكادير': 'Agadir',
  'اكادير': 'Agadir',
  'مكناس': 'Meknès',
  'وجدة': 'Oujda',
  'القنيطرة': 'Kénitra',
  'تطوان': 'Tétouan',
  'تمارة': 'Témara',
  'سلا': 'Salé',
  'المحمدية': 'Mohammédia',
  'الجديدة': 'El Jadida',
  'آسفي': 'Safi',
  'اسفي': 'Safi',
  'بني ملال': 'Béni Mellal',
  'خريبكة': 'Khouribga',
  'الناظور': 'Nador',
  'تازة': 'Taza',
  'برشيد': 'Berrechid',
  'سطات': 'Settat',
  'العرائش': 'Larache',
  'القصر الكبير': 'Ksar El Kebir',
  'كلميم': 'Guelmim',
  'العيون': 'Laâyoune',
  'الداخلة': 'Dakhla',
  'ورزازات': 'Ouarzazate',
  'الصويرة': 'Essaouira',
  'تارودانت': 'Taroudant',
  'بركان': 'Berkane',
  'سيدي قاسم': 'Sidi Kacem',
  'سيدي سليمان': 'Sidi Slimane',
  'الخميسات': 'Khémisset',
  'الحسيمة': 'Al Hoceïma',
  'شفشاون': 'Chefchaouen',
  'إفران': 'Ifrane',
  'افران': 'Ifrane',
  'ميدلت': 'Midelt',
  'الرشيدية': 'Errachidia',
};

/**
 * Extract standard city name accepted by Ozon Express (e.g. 'الدار البيضاء (Casablanca)' -> 'Casablanca')
 */
export function extractCityForOzonExpress(city: string): string {
  if (!city) return '';
  const trimmed = city.trim();
  const parenMatch = trimmed.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    const inside = parenMatch[1].trim();
    if (!inside.includes('مدينة') && !inside.includes('أخرى')) {
      return inside;
    }
  }
  const withoutParens = trimmed.replace(/\([^)]*\)/g, '').trim();
  if (ARABIC_TO_OZON_CITY_MAP[withoutParens]) {
    return ARABIC_TO_OZON_CITY_MAP[withoutParens];
  }
  for (const [ar, fr] of Object.entries(ARABIC_TO_OZON_CITY_MAP)) {
    if (trimmed.includes(ar)) return fr;
  }
  return withoutParens || trimmed;
}

/**
 * Normalize Moroccan phone number into local 10-digit format (e.g. '0612345678') for Ozon Express Excel import
 */
export function formatLocalMoroccanPhone(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+212')) {
    digits = '0' + digits.slice(4);
  } else if (digits.startsWith('00212')) {
    digits = '0' + digits.slice(5);
  } else if (digits.startsWith('212') && digits.length >= 12) {
    digits = '0' + digits.slice(3);
  } else if (!digits.startsWith('0') && digits.length === 9 && /^[567]/.test(digits)) {
    digits = '0' + digits;
  }
  return digits;
}

/**
 * Export preparing orders to an Excel (.xlsx) workbook matching the exact Ozon Express
 * import template (NEW_MODELE_WODV):
 * CODE SUIVI | DESTINATAIRE | TELEPHONE | ADRESSE | PRIX | VILLE | COMMENTAIRE | QUARTIER | PRODUIT
 */
export async function exportOrdersToOzonExpressXlsx(orders: Order[], filename?: string): Promise<void> {
  const XLSX = await import('xlsx');
  const headers = [
    'CODE SUIVI',
    'DESTINATAIRE',
    'TELEPHONE',
    'ADRESSE',
    'PRIX',
    'VILLE',
    'COMMENTAIRE',
    'QUARTIER',
    'PRODUIT',
  ];

  const dataRows = orders.map((ord) => {
    const productSummary = (ord.items || [])
      .map((it) => {
        const colorPart =
          it.selectedColors && it.selectedColors.length > 0
            ? it.selectedColors.join(' / ')
            : it.color;
        return `${it.quantity}x ${it.name}${colorPart ? ` (${colorPart})` : ''}`;
      })
      .join(' + ');

    const commentText = typeof ord.notes === 'string' ? ord.notes.trim() : '';

    return [
      ord.orderNumber || ord.id || '',
      (ord.customerName || '').trim(),
      formatLocalMoroccanPhone(ord.phone || ''),
      (ord.address || '').trim(),
      Number(ord.totalAmount) || 0,
      extractCityForOzonExpress(ord.city || ''),
      commentText,
      '',
      productSummary,
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

  // Preserve leading zeros on TELEPHONE (col C, index 2) and keep CODE SUIVI (col A, index 0) as text
  for (let rowIdx = 1; rowIdx <= dataRows.length; rowIdx++) {
    const codeRef = XLSX.utils.encode_cell({ r: rowIdx, c: 0 });
    if (worksheet[codeRef]) {
      worksheet[codeRef].t = 's';
      worksheet[codeRef].v = String(worksheet[codeRef].v ?? '');
      worksheet[codeRef].z = '@';
    }

    const phoneRef = XLSX.utils.encode_cell({ r: rowIdx, c: 2 });
    if (worksheet[phoneRef]) {
      worksheet[phoneRef].t = 's';
      worksheet[phoneRef].v = String(worksheet[phoneRef].v ?? '');
      worksheet[phoneRef].z = '@';
    }

    const priceRef = XLSX.utils.encode_cell({ r: rowIdx, c: 4 });
    if (worksheet[priceRef]) {
      worksheet[priceRef].t = 'n';
      worksheet[priceRef].v = Number(worksheet[priceRef].v) || 0;
    }
  }

  worksheet['!cols'] = [
    { wch: 18 }, // CODE SUIVI
    { wch: 24 }, // DESTINATAIRE
    { wch: 15 }, // TELEPHONE
    { wch: 36 }, // ADRESSE
    { wch: 10 }, // PRIX
    { wch: 18 }, // VILLE
    { wch: 28 }, // COMMENTAIRE
    { wch: 16 }, // QUARTIER
    { wch: 42 }, // PRODUIT
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Colis');

  const datePart = new Date().toISOString().split('T')[0];
  const targetFilename = filename || `OzonExpress_Colis_${datePart}.xlsx`;
  XLSX.writeFile(workbook, targetFilename);
}



