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

export const translateColorName = (name: string, lang: Language): string => {
  if (lang === 'ar' || !name) return name;
  const exact: Record<string, string> = {
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
    'أخضر زمردي': 'Vert Émeraude',
    'بني': 'Marron',
    'رمادي': 'Gris',
    'أحمر': 'Rouge',
    'افتراضي': 'Standard',
  };
  if (exact[name.trim()]) return exact[name.trim()];
  return name;
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
  return cityEntry.split(' ')[0];
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
