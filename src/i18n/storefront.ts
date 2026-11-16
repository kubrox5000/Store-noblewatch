import type { Language } from '../context/LanguageContext';

export const translateOrderStatus = (status: string, lang: Language): string => {
  if (lang === 'ar') return status;
  const map: Record<string, string> = {
    'جديد': 'Nouvelle',
    'قيد التأكيد': 'En confirmation',
    'تم التأكيد': 'Confirmée',
    'قيد التجهيز': 'En préparation',
    'تم الشحن': 'Expédiée',
    'تم التسليم': 'Livrée',
    'ملغى': 'Annulée',
    'مرتجع': 'Retournée',
  };
  return map[status] || status;
};

const COLOR_AR_TO_FR: Record<string, string> = {
  'أسود ملكي': 'Noir Royal',
  'فضي كلاسيكي': 'Argent Classique',
  'ذهبي فاخر': 'Or Luxe',
  'روز غولد': 'Or Rose',
  'أزرق ملكي': 'Bleu Royal',
  'أزرق داكن': 'Bleu Nuit',
  'أزرق': 'Bleu',
  'أبيض': 'Blanc',
  'أبيض لؤلؤي': 'Blanc Nacré',
  'أسود': 'Noir',
  'ذهبي': 'Or',
  'فضي': 'Argent',
  'أخضر': 'Vert',
  'أخضر داكن': 'Vert profond',
  'أخضر زمردي': 'Vert Émeraude',
  'بني': 'Marron',
  'رمادي': 'Gris',
  'أحمر': 'Rouge',
  'برونزي': 'Bronze',
  'أصفر ذهبي': 'Jaune',
  'شوكولاتة': 'Chocolat',
  'أزرق سماوي': 'Bleu ciel',
  'ذهب أصفر': 'Or Jaune',
  'ذهب أبيض': 'Or Blanc',
  'تركواز': 'Turquoise',
  'وردي': 'Rose',
  'ثنائي اللون': 'Bicolore',
  'افتراضي': 'Standard',
};

const COLOR_FR_TO_AR: Record<string, string> = {
  'noir royal': 'أسود ملكي',
  'argent classique': 'فضي كلاسيكي',
  'or luxe': 'ذهبي فاخر',
  'or rose': 'روز غولد',
  'or rose serti': 'ذهبي وردي مرصع',
  'or jaune': 'ذهب أصفر',
  'yellow gold': 'ذهب أصفر',
  'white gold': 'ذهب أبيض',
  'doré': 'ذهبي',
  'bicolore': 'ثنائي اللون',
  'argent / doré': 'فضي وذهبي',
  'argenté': 'فضي',
  'rose': 'وردي',
  'pink': 'وردي',
  'bleu royal': 'أزرق ملكي',
  'bleu nuit': 'أزرق داكن',
  'bleu ciel': 'أزرق سماوي',
  'bleu & rouge': 'أزرق وأحمر (Pepsi)',
  'bleu & noir': 'أزرق وأسود (Batman)',
  'bleu & argent': 'أزرق وفضي',
  'or & noir': 'ذهبي وأسود',
  'noir & argent': 'أسود وفضي',
  'or & blanc': 'ذهبي وأبيض',
  'bleu': 'أزرق',
  'blue': 'أزرق',
  'blanc': 'أبيض',
  'white': 'أبيض',
  'blanc nacré': 'أبيض لؤلؤي',
  'noir': 'أسود',
  'black': 'أسود',
  'or': 'ذهبي',
  'gold': 'ذهبي',
  'argent': 'فضي',
  'silver': 'فضي',
  'vert': 'أخضر',
  'green': 'أخضر',
  'vert profond': 'أخضر داكن',
  'vert émeraude': 'أخضر زمردي',
  'marron': 'بني',
  'brown': 'بني',
  'brun': 'بني',
  'gris': 'رمادي',
  'grey': 'رمادي',
  'gray': 'رمادي',
  'rouge': 'أحمر',
  'red': 'أحمر',
  'bronze': 'برونزي',
  'jaune': 'أصفر ذهبي',
  'yellow': 'أصفر ذهبي',
  'chocolat': 'شوكولاتة (بني)',
  'chocolate': 'شوكولاتة (بني)',
  'marine': 'أزرق داكن',
  'navy': 'أزرق داكن',
  'turquoise': 'تركواز',
  'turquoise / bleu et noir': 'تركواز / أزرق وأسود',
  'brun / effet tropical': 'بني / تأثير استوائي',
  'blanc avec compteurs noirs': 'أبيض مع عدادات سوداء',
  'classique': 'كلاسيكي',
  'standard': 'قياسي',
};

export const translateColorName = (name: string, lang: Language): string => {
  if (!name) return name;
  const trimmed = name.trim();
  const hasAr = /[\u0600-\u06FF]/.test(trimmed);

  if (lang === 'ar') {
    if (hasAr) return trimmed;
    const lower = trimmed.toLowerCase();
    if (COLOR_FR_TO_AR[lower]) return COLOR_FR_TO_AR[lower];

    // Translate simple multi-part colors separated by "/", "&", or "et"
    if (trimmed.includes('/')) {
      return trimmed
        .split('/')
        .map((part) => translateColorName(part.trim(), 'ar'))
        .join(' / ');
    }
    if (trimmed.includes('&')) {
      return trimmed
        .split('&')
        .map((part) => translateColorName(part.trim(), 'ar'))
        .join(' و ');
    }
    if (/\set\s/i.test(trimmed)) {
      return trimmed
        .split(/\s+et\s+/i)
        .map((part) => translateColorName(part.trim(), 'ar'))
        .join(' و ');
    }
    return trimmed;
  }

  // lang === 'fr'
  if (COLOR_AR_TO_FR[trimmed]) return COLOR_AR_TO_FR[trimmed];
  const lower = trimmed.toLowerCase();
  if (lower === 'blue') return 'Bleu';
  if (lower === 'green') return 'Vert';
  if (lower === 'grey' || lower === 'gray') return 'Gris';
  if (lower === 'yellow gold') return 'Or Jaune';
  if (lower === 'white gold') return 'Or Blanc';
  if (lower === 'black') return 'Noir';
  if (lower === 'silver') return 'Argent (Silver)';
  return trimmed;
};

export const formatCityLabel = (cityEntry: string, lang: Language): string => {
  if (lang === 'ar') return cityEntry;
  if (cityEntry.startsWith('أخرى')) return 'Autre (autre ville / village au Maroc)';
  const match = cityEntry.match(/\(([^)]+)\)/);
  if (match && match[1]) return match[1].trim();
  return cityEntry;
};

export const getCityValue = (cityEntry: string, lang: Language): string => {
  if (lang === 'fr') {
    if (cityEntry.startsWith('أخرى')) return 'أخرى';
    const match = cityEntry.match(/\(([^)]+)\)/);
    if (match && match[1]) return match[1].trim();
  }
  if (cityEntry.startsWith('أخرى')) return 'أخرى';
  return cityEntry.replace(/\s*\([^)]*\)/g, '').trim();
};

export const localizeTierBadge = (badge: string | undefined, lang: Language): string | undefined => {
  if (!badge || lang === 'ar') return badge;
  const map: Record<string, string> = {
    'الأكثر طلباً ⭐': 'Plus populaire ⭐',
    'أفضل توفير 🔥': 'Meilleure offre 🔥',
  };
  return map[badge] || badge;
};

export const localizeSettingText = (
  value: string | undefined,
  arDefaults: string[],
  frFallback: string,
  lang: Language
): string => {
  if (lang === 'ar') return value || arDefaults[0] || '';
  if (!value || arDefaults.some((d) => value.trim() === d.trim())) {
    return frFallback;
  }
  // If admin wrote something mostly Latin/French already, keep it; if purely Arabic default-like, keep value or fallback cleanly
  const hasArabic = /[\u0600-\u06FF]/.test(value);
  return hasArabic ? frFallback : value;
};

export const localizeFaqItem = (
  faq: { id: string; question: string; answer: string },
  index: number,
  lang: Language
): { id: string; question: string; answer: string } => {
  if (lang === 'ar') return faq;

  const q = faq.question || '';
  if (q.includes('كيف أطلب') || q.includes('طريقة الطلب')) {
    return {
      id: faq.id,
      question: 'Comment passer une commande et comment fonctionne le paiement ?',
      answer:
        'Choisissez votre montre ou accessoire préféré, sélectionnez la couleur et la quantité, puis cliquez sur « Commander maintenant » et saisissez votre nom, téléphone WhatsApp, ville et adresse. Vous payez en espèces uniquement à la livraison après vérification du colis.',
    };
  }
  if (q.includes('كم تستغرق') || q.includes('مدة التوصيل') || q.includes('الشحن')) {
    return {
      id: faq.id,
      question: 'Quel est le délai de livraison et quels sont les frais ?',
      answer:
        'La livraison est 100% GRATUITE (0 DH) partout au Maroc ! Votre commande arrive sous 24 à 48 heures dans les grandes villes et sous 48 à 72 heures dans les autres régions.',
    };
  }
  if (q.includes('معاينة') || q.includes('فحص')) {
    return {
      id: faq.id,
      question: 'Puis-je vérifier le produit avant de payer ?',
      answer:
        'Oui, absolument ! Vous avez le droit total d’ouvrir votre colis et de vérifier la qualité et la couleur de votre montre devant le livreur avant de payer le moindre dirham.',
    };
  }
  if (q.includes('الضمان') || q.includes('ضمان')) {
    return {
      id: faq.id,
      question: 'Les montres sont-elles garanties et échangeables ?',
      answer:
        'Toutes nos montres et accessoires bénéficient d’une garantie officielle d’un an contre tout défaut de fabrication, ainsi que d’un droit d’échange ou de retour gratuit sous 7 jours.',
    };
  }
  if (q.includes('الماء') || q.includes('مقاوم')) {
    return {
      id: faq.id,
      question: 'Les montres sont-elles résistantes à l’eau ?',
      answer:
        'Oui, nos modèles sont résistants à l’eau (3ATM à 5ATM pour le lavage des mains et la pluie) et fabriqués en acier inoxydable anti-rayures.',
    };
  }

  // Fallback if custom Arabic FAQ without French match
  const hasArabic = /[\u0600-\u06FF]/.test(faq.question);
  if (!hasArabic) return faq;
  return {
    id: faq.id,
    question: `Question fréquente #${index + 1}`,
    answer: faq.answer,
  };
};

import {
  translateCityName,
  translateReviewComment,
  translateProductFeature,
  translateProductSubtitle,
  translateProductDescription,
} from './catalogTranslations';

export {
  translateCityName,
  translateReviewComment,
  translateProductSubtitle,
  translateProductDescription,
};

export const localizeProductFeature = (feat: string, lang: Language): string => {
  return translateProductFeature(feat, lang);
};
