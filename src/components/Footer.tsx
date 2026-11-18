import React, { useState } from 'react';
import {
  Truck,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Clock,
  ChevronDown,
  HelpCircle,
  Sparkles,
  Send,
  Award,
  Search,
  CheckCircle2,
  Instagram,
  Facebook,
  Youtube,
  Package,
  Banknote,
  Lock,
  Zap,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { localizeFaqItem } from '../i18n/storefront';
import { buildWhatsAppUrl, buildTelHref, sanitizePhoneText } from '../utils/constants';

export const Footer: React.FC = () => {
  const {
    settings,
    setActivePolicyModal,
    setSelectedCategory,
    setActiveProductId,
    setIsTrackingOpen,
    setIsWarrantyCheckOpen,
    showToast,
  } = useStore();
  const { lang, isFr } = useLanguage();

  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [newsletterInput, setNewsletterInput] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const handleCategoryClick = (cat: string) => {
    setActiveProductId(null);
    setSelectedCategory(cat);
    const el = document.getElementById('products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGoHome = () => {
    setActiveProductId(null);
    setSelectedCategory('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterInput.trim()) return;

    setIsSubscribed(true);
    showToast(
      isFr
        ? '🎉 Bienvenue dans le Club Noblewatch VIP ! Votre code promo -10% : NOBLE10.'
        : '🎉 مرحباً بك في نادي النخبة! تم تفعيل كود الخصم: NOBLE10 (خصم 10% على طلبيتك القادمة).',
      'success'
    );
    setNewsletterInput('');
  };

  const currentYear = new Date().getFullYear();

  const moroccanCitiesDisplay = isFr
    ? [
        'Casablanca',
        'Rabat',
        'Marrakech',
        'Tanger',
        'Fès',
        'Agadir',
        'Meknès',
        'Oujda',
        'Kénitra',
        'Tétouan',
        'Témara',
        'Laâyoune',
        'Dakhla',
        'Nador',
        'El Jadida',
        'Safi',
        'Béni Mellal',
      ]
    : [
        'الدار البيضاء',
        'الرباط',
        'مراكش',
        'طنجة',
        'فاس',
        'أكادير',
        'مكناس',
        'وجدة',
        'القنيطرة',
        'تطوان',
        'تمارة',
        'العيون',
        'الداخلة',
        'الناظور',
        'الجديدة',
        'آسفي',
        'بني ملال',
      ];

  return (
    <footer
      className={`bg-[#08090d] text-gray-300 border-t border-white/10 selection:bg-[#c5a869] selection:text-black ${
        isFr ? 'text-left' : 'text-right'
      }`}
    >
      {/* 1. VIP Club / Newsletter Banner */}
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-[#0c0e14] via-[#141722] to-[#0c0e14] py-12 px-4">
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-[#c5a869]/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-1/4 w-96 h-32 bg-[#996515]/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className={`max-w-2xl text-center space-y-2 ${isFr ? 'lg:text-left' : 'lg:text-right'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c5a869]/15 border border-[#c5a869]/30 text-xs font-semibold text-[#f7dfa5]">
              <Sparkles className="w-3.5 h-3.5 text-[#c5a869]" />
              <span>{isFr ? 'Club Privilège Noblewatch VIP' : 'نادي النخبة Noblewatch VIP'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white">
              {isFr
                ? 'Rejoignez la communauté Noblewatch et profitez de nos offres privées à prix symbolique'
                : 'إنضم إلى مجوعة زبناء Noblewatch و أحصل على منتوجات بتمن رمزي'}
            </h3>
          </div>

          <div className="w-full lg:w-auto">
            {isSubscribed ? (
              <div className="flex items-center gap-3 bg-emerald-950/60 border border-emerald-500/40 px-6 py-4 rounded-2xl text-emerald-300 text-sm font-bold shadow-lg animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>
                  {isFr ? (
                    <>
                      Inscription confirmée ! Votre code promo :{' '}
                      <span className="font-mono text-white underline">NOBLE10</span>
                    </>
                  ) : (
                    <>
                      تم اشتراكك بنجاح! كود الخصم الخاص بك هو:{' '}
                      <span className="font-mono text-white underline">NOBLE10</span>
                    </>
                  )}
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto lg:mx-0 w-full"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    value={newsletterInput}
                    onChange={(e) => setNewsletterInput(e.target.value)}
                    placeholder={isFr ? 'Numéro WhatsApp ou e-mail...' : 'رقم الواتساب أو البريد الإلكتروني...'}
                    className="w-full bg-[#171b26] border border-white/15 rounded-xl py-3 px-4 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a869] focus:bg-[#1c2130] transition shadow-inner"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl gold-gradient-bg text-black font-extrabold text-xs sm:text-sm shadow-lg hover:brightness-110 active:scale-95 transition cursor-pointer flex-shrink-0"
                >
                  <Send className={`w-4 h-4 ${isFr ? '' : 'rotate-180'}`} />
                  <span>{isFr ? 'Activer la remise' : 'تفعيل الخصم'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 2. Moroccan Guarantee Pillars */}
      <div className="border-b border-white/5 py-8 px-4 bg-[#0a0c12]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#c5a869]/30 transition group">
            <div className="w-11 h-11 rounded-xl bg-[#161a25] border border-white/10 flex items-center justify-center text-[#c5a869] flex-shrink-0 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                {isFr ? 'Paiement à la livraison (COD)' : 'الدفع عند الاستلام (COD)'}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {isFr
                  ? 'Aucun paiement à l’avance, réglez en espèces à la réception'
                  : 'لا تدفع أي مبلغ مسبقاً، الدفع نقداً عند استلام'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#c5a869]/30 transition group">
            <div className="w-11 h-11 rounded-xl bg-[#161a25] border border-white/10 flex items-center justify-center text-[#c5a869] flex-shrink-0 group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                {isFr ? 'Livraison gratuite partout 🇲🇦' : 'توصيل مجاني لجميع المدن 🇲🇦'}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {isFr
                  ? 'Expédition rapide en 24 à 48h jusqu’à votre domicile ou bureau.'
                  : 'شحن سريع خلال 24 إلى 48 ساعة حتى باب منزلك أو مكان عملك.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#c5a869]/30 transition group">
            <div className="w-11 h-11 rounded-xl bg-[#161a25] border border-white/10 flex items-center justify-center text-[#c5a869] flex-shrink-0 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                {isFr ? 'Vérification avant paiement' : 'معاينة الطرد قبل الدفع'}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {isFr
                  ? 'Ouvrez et vérifiez votre colis devant le livreur avant de payer.'
                  : 'يحق لك فتح الطرد وفحص جودة ومواصفات بحضور الموزع.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#c5a869]/30 transition group">
            <div className="w-11 h-11 rounded-xl bg-[#161a25] border border-white/10 flex items-center justify-center text-[#c5a869] flex-shrink-0 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">
                {isFr ? 'Garantie officielle 1 an' : 'ضمان رسمي لمدة سنة'}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {isFr
                  ? 'Tous nos produits incluent une garantie officielle d’un an.'
                  : 'جميع منتوجات تتضمن ضمان رسمي لمدة سنة'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Moroccan Cities Ribbon */}
      <div className="border-b border-white/5 py-4 px-4 bg-[#07080c] text-xs">
        <div
          className={`max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center ${
            isFr ? 'md:text-left' : 'md:text-right'
          }`}
        >
          <div className="flex items-center gap-2 text-white font-bold flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <Truck className="w-4 h-4 text-[#c5a869]" />
            <span>
              {isFr
                ? 'Livraison dans tout le Royaume du Maroc 🇲🇦 :'
                : 'تغطية شحن شاملة لكافة المدن والقرى المغربية 🇲🇦:'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-gray-400">
            {moroccanCitiesDisplay.map((cityLabel, idx) => (
              <React.Fragment key={cityLabel}>
                <span className="text-white hover:text-[#c5a869] transition cursor-default">{cityLabel}</span>
                {idx < moroccanCitiesDisplay.length - 1 && <span className="text-white/20">•</span>}
              </React.Fragment>
            ))}
            <span className="text-white/20">•</span>
            <span className="text-[#c5a869] font-medium">
              {isFr ? '+ Toutes les régions du Royaume' : '+ جميع عمالات وأقاليم المملكة'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. FAQ Section */}
      {settings?.faqs && settings.faqs.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 py-14 border-b border-white/5">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#c5a869] mb-3">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{isFr ? 'Réponses claires et rapides' : 'إجابات واضحة وسريعة'}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              {isFr ? 'Questions fréquentes de nos clients' : 'الأسئلة الأكثر تداولاً من زبائننا'}
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              {isFr
                ? 'Tout savoir sur la commande, les délais de livraison et le paiement à la réception'
                : 'كل ما تود معرفته عن طريقة الطلب، مدة التوصيل، والدفع عند الاستلام'}
            </p>
          </div>

          <div className="space-y-3">
            {settings.faqs.map((faqRaw, idx) => {
              const faq = localizeFaqItem(faqRaw, idx, lang);
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl bg-[#11141d] border border-white/5 hover:border-white/10 transition overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className={`w-full p-4 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-gray-200 hover:text-white cursor-pointer transition ${
                      isFr ? 'text-left' : 'text-right'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#c5a869]" />
                      <span>{faq.question}</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#c5a869] transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs text-gray-300 leading-relaxed border-t border-white/5 bg-black/20 animate-in fade-in duration-200">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Main Footer Columns (4 Columns) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Brand & Identity */}
          <div className="space-y-5">
            <button
              onClick={handleGoHome}
              className={`text-3xl font-serif font-black tracking-tight text-white flex items-center gap-2.5 group ${
                isFr ? 'text-left' : 'text-right'
              }`}
            >
              <div className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-br from-[#dfb76c] via-[#c5a869] to-[#9d7e35] shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src="/favicon.svg"
                  alt="Noblewatch Logo"
                  className="w-full h-full rounded-full object-contain"
                />
              </div>
              <div className="flex items-center">
                <span className="gold-gradient-text italic group-hover:scale-105 transition-transform">N</span>
                <span>oblewatch</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#c5a869] mx-1 inline-block"></span>
              </div>
            </button>

            <p className="text-xs text-gray-400 leading-relaxed">
              {isFr
                ? 'La marque marocaine de référence pour les montres de luxe et accessoires haut de gamme pour homme et femme. Nous sélectionnons des matériaux d’exception et des designs raffinés avec paiement à la livraison.'
                : 'العلامة المغربية الرائدة في بيع جميع أنواع ساعات اليد الفاخرة والإكسسوارات الراقية للرجال والنساء. نحرص على انتقاء أجود الخامات وأفخم التصاميم لنمنحك إطلالة متكاملة وساحرة في كل لحظة، مع تجربة تسوق آمنة وسلسة عبر الدفع عند الاستلام.'}
            </p>

            <div className="space-y-3 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-[#c5a869]/30 text-xs text-[#c5a869] font-medium">
                <span>{isFr ? '🇲🇦 Boutique e-commerce marocaine 100% fiable' : '🇲🇦 متجر إلكتروني مغربي موثوق 100%'}</span>
              </div>

              {/* Social media links */}
              {(() => {
                const safeSocialUrl = (url?: string, fallback?: string) => {
                  const clean = String(url || '').trim();
                  if (!clean) return fallback || '#';
                  if (/^https?:\/\//i.test(clean)) return clean;
                  if (clean.startsWith('//')) return `https:${clean}`;
                  return `https://${clean.replace(/^\/+/, '')}`;
                };
                return (
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={buildWhatsAppUrl(
                    settings?.whatsappNumber || settings?.socialLinks?.whatsapp,
                    isFr
                      ? 'Bonjour, je souhaite contacter le service client Noblewatch.'
                      : 'السلام عليكم، أريد التواصل مع خدمة العملاء في متجر Noblewatch'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition shadow-sm"
                  title={isFr ? 'Contacter sur WhatsApp' : 'تواصل عبر واتساب'}
                >
                  <MessageCircle className="w-4 h-4" />
                </a>

                <a
                  href={safeSocialUrl(settings?.socialLinks?.instagram, 'https://instagram.com/noblewatch.ma')}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-xl bg-[#161a25] border border-white/10 text-gray-300 hover:text-white hover:border-[#c5a869] flex items-center justify-center transition shadow-sm"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>

                <a
                  href={safeSocialUrl(settings?.socialLinks?.facebook, 'https://facebook.com/noblewatch.ma')}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-xl bg-[#161a25] border border-white/10 text-gray-300 hover:text-white hover:border-[#c5a869] flex items-center justify-center transition shadow-sm"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>

                <a
                  href={safeSocialUrl(settings?.socialLinks?.tiktok, 'https://tiktok.com/@noblewatch.ma')}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="w-9 h-9 rounded-xl bg-[#161a25] border border-white/10 text-gray-300 hover:text-white hover:border-[#c5a869] flex items-center justify-center transition shadow-sm"
                  title="TikTok"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.81 4.48 6.26 6.26 0 0 0 1.9-4.48V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-.9-.07z" />
                  </svg>
                </a>

                <a
                  href={safeSocialUrl(settings?.socialLinks?.youtube, 'https://youtube.com/@noblewatch')}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-xl bg-[#161a25] border border-white/10 text-gray-300 hover:text-white hover:border-[#c5a869] flex items-center justify-center transition shadow-sm"
                  title="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
                );
              })()}
            </div>
          </div>

          {/* Column 2: Navigation & Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-[#c5a869]" />
              <span>{isFr ? 'Liens rapides' : 'روابط سريعة'}</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li>
                <button
                  onClick={handleGoHome}
                  className="hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-[#c5a869]">›</span>
                  <span>{isFr ? 'Accueil' : 'الصفحة الرئيسية'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('all')}
                  className="hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-[#c5a869]">›</span>
                  <span>{isFr ? 'Toutes les montres & accessoires' : 'جميع الساعات والإكسسوارات'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('men')}
                  className="hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-[#c5a869]">›</span>
                  <span>{isFr ? 'Montres Homme' : 'ساعات رجالية'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('women')}
                  className="hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-[#c5a869]">›</span>
                  <span>{isFr ? 'Montres Femme' : 'ساعات نسائية'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('men-accessories')}
                  className="hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-[#c5a869]">›</span>
                  <span>{isFr ? 'Accessoires Homme (Bracelets & Portefeuilles)' : 'إكسسوارات رجالية (أساور ومحافظ)'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleCategoryClick('women-accessories')}
                  className="hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-[#c5a869]">›</span>
                  <span>{isFr ? 'Accessoires Femme (Parures & Bracelets)' : 'إكسسوارات نسائية (أطقم وأساور)'}</span>
                </button>
              </li>
              <li className="pt-2 space-y-2">
                <button
                  onClick={() => setIsTrackingOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#f7dfa5] hover:bg-amber-500/20 text-xs font-bold transition cursor-pointer w-full"
                >
                  <Search className="w-3.5 h-3.5 text-[#c5a869]" />
                  <span>{isFr ? 'Suivre votre commande au Maroc 🚚' : 'تتبع حالة طلبيتك بالمغرب 🚚'}</span>
                </button>
                <button
                  onClick={() => setIsWarrantyCheckOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/20 text-xs font-bold transition cursor-pointer w-full"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isFr ? 'Vérifier votre certificat de garantie' : 'تحقق من شهادة الضمان الرسمية'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Policies */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-[#c5a869]" />
              <span>{isFr ? 'Informations & Politiques' : 'معلومات مهمة وسياسات'}</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li>
                <button
                  onClick={() => setActivePolicyModal('shipping')}
                  className="hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-[#c5a869]">›</span>
                  <span>{isFr ? 'Politique de livraison gratuite' : 'سياسة التوصيل والشحن المجاني'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicyModal('returns')}
                  className="hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-[#c5a869]">›</span>
                  <span>{isFr ? 'Échanges et retours (7 jours)' : 'سياسة الاستبدال والإرجاع (7 أيام)'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicyModal('warranty')}
                  className="hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-[#c5a869]">›</span>
                  <span>{isFr ? 'Certificat de garantie officiel (1 an)' : 'شهادة الضمان الرسمي المعتمد (سنة واحدة)'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicyModal('privacy')}
                  className="hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-[#c5a869]">›</span>
                  <span>{isFr ? 'Politique de confidentialité' : 'سياسة الخصوصية وحماية بيانات الزبائن'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicyModal('terms')}
                  className="hover:text-white transition flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-[#c5a869]">›</span>
                  <span>{isFr ? 'Conditions générales d’utilisation' : 'شروط الاستخدام وأحكام الطلب'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Direct Support */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-[#c5a869]" />
              <span>{isFr ? 'Contacter le service client' : 'تواصل مع خدمة العملاء'}</span>
            </h4>
            <div className="space-y-3 text-xs">
              <a
                href={buildTelHref(settings?.contactPhone)}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/20 hover:text-white transition group"
                dir="ltr"
              >
                <div className="w-8 h-8 rounded-lg bg-[#161a25] flex items-center justify-center text-[#c5a869] group-hover:scale-105 transition-transform flex-shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className={`flex-1 ${isFr ? 'text-left' : 'text-right'}`}>
                  <span className="text-[10px] text-gray-500 block">
                    {isFr ? 'Appel téléphonique direct' : 'اتصال هاتفي مباشر'}
                  </span>
                  <span className="font-bold text-gray-200 group-hover:text-white font-mono" dir="ltr">
                    {sanitizePhoneText(settings?.contactPhone) || '+212 6 12 34 56 78'}
                  </span>
                </div>
              </a>

              <a
                href={buildWhatsAppUrl(
                  settings?.whatsappNumber,
                  isFr
                    ? 'Bonjour, je souhaite obtenir des informations sur les montres et accessoires Noblewatch.'
                    : 'السلام عليكم، أريد الاستفسار عن ساعات وإكسسوارات متجر Noblewatch'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 text-emerald-300 hover:text-emerald-200 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-900/60 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform flex-shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-emerald-400/80 block">
                    {isFr ? 'Réponse rapide 24h/24' : 'رد فوري على مدار الساعة'}
                  </span>
                  <span className="font-bold">
                    {isFr ? 'Discussion WhatsApp directe 💬' : 'محادثة واتساب مباشرة 💬'}
                  </span>
                </div>
              </a>

              <div className="flex items-start gap-2.5 text-gray-400 pt-1">
                <Mail className="w-4 h-4 text-[#c5a869] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-gray-500">
                    {isFr ? 'E-mail officiel :' : 'البريد الإلكتروني الرسمي:'}
                  </span>
                  <a
                    href={`mailto:${settings?.contactEmail || 'contact@noblewatch.ma'}`}
                    className="text-gray-300 hover:text-white transition font-mono text-[11px] underline underline-offset-2"
                  >
                    {settings?.contactEmail || 'contact@noblewatch.ma'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-gray-400">
                <MapPin className="w-4 h-4 text-[#c5a869] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-gray-500">
                    {isFr ? 'Siège social & entrepôt :' : 'المقر الرئيسي ومستودع الشحن:'}
                  </span>
                  <span className="text-gray-300">
                    {isFr ? 'Casablanca, Royaume du Maroc 🇲🇦' : 'الدار البيضاء، المملكة المغربية 🇲🇦'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-gray-400">
                <Clock className="w-4 h-4 text-[#c5a869] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[11px] text-gray-500">
                    {isFr ? 'Horaires d’ouverture :' : 'أوقات العمل والتأكيد:'}
                  </span>
                  <span className="text-gray-300">
                    {isFr ? 'Lundi - Samedi : 09h00 - 20h00' : 'الإثنين - السبت: 09:00 ص - 08:00 م'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Moroccan Logistics & Trust Payment Badges */}
      <div className="border-t border-white/5 py-6 px-4 bg-[#06070a]">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          {/* Certified Payment Method Card */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 w-full lg:w-auto">
            <span className="text-gray-400 font-medium whitespace-nowrap flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#c5a869] flex-shrink-0" />
              <span>{isFr ? 'Paiement & livraison agréés :' : 'طريقة الدفع والشحن المعتمدة:'}</span>
            </span>

            <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#141720] via-[#191c28] to-[#141720] border border-[#c5a869]/35 shadow-sm max-w-full">
              <span className="w-6 h-6 rounded-lg bg-[#c5a869]/15 border border-[#c5a869]/30 text-[#c5a869] flex items-center justify-center flex-shrink-0">
                <Banknote className="w-3.5 h-3.5" />
              </span>
              <span className="text-white font-bold text-xs whitespace-nowrap">
                {isFr ? 'Paiement en espèces à la livraison' : 'الدفع نقداً عند الاستلام'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#c5a869]/15 border border-[#c5a869]/30 text-[#f3d89b] font-mono font-extrabold text-[10px] tracking-wider flex-shrink-0">
                COD
              </span>
            </div>
          </div>

          {/* Logistics Partners & Guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
            <span className="px-2.5 py-1.5 rounded-lg bg-[#c5a869]/10 border border-[#c5a869]/30 text-[#f7dfa5] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
              <Zap className="w-3 h-3 text-[#c5a869]" />
              <span>Noblewatch Express</span>
            </span>
            <span className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-gray-300 inline-flex items-center gap-1.5 whitespace-nowrap">
              <Package className="w-3 h-3 text-gray-400" />
              <span>Ozon Express</span>
            </span>
            <span className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-gray-300 inline-flex items-center gap-1.5 whitespace-nowrap">
              <Truck className="w-3 h-3 text-gray-400" />
              <span>Ameex.ma</span>
            </span>
            <span className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-gray-300 inline-flex items-center gap-1.5 whitespace-nowrap">
              <Truck className="w-3 h-3 text-gray-400" />
              <span>Amana Express</span>
            </span>
            <span className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-gray-300 inline-flex items-center gap-1.5 whitespace-nowrap">
              <Package className="w-3 h-3 text-gray-400" />
              <span>CTM Messagerie</span>
            </span>
            <span className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-medium inline-flex items-center gap-1.5 whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{isFr ? 'Échange gratuit garanti' : 'ضمان استبدال مجاني'}</span>
            </span>
            <span className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-gray-300 inline-flex items-center gap-1.5 whitespace-nowrap">
              <Lock className="w-3 h-3 text-[#c5a869]" />
              <span>{isFr ? 'Données 100% protégées' : '100% حماية البيانات'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 7. Bottom Copyright Bar */}
      <div className="border-t border-white/5 py-5 px-4 bg-[#040507] text-xs">
        <div
          className={`max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center ${
            isFr ? 'sm:text-left' : 'sm:text-right'
          }`}
        >
          <p className="text-gray-500">
            {isFr ? (
              <>
                Tous droits réservés &copy; {currentYear} <strong className="text-white font-serif">Noblewatch</strong> Maroc — Montres & Accessoires de Luxe.
              </>
            ) : (
              <>
                جميع الحقوق محفوظة &copy; {currentYear} متجر <strong className="text-white font-serif">Noblewatch</strong> المغربي للساعات والإكسسوارات الفاخرة.
              </>
            )}
          </p>

          <p className="text-gray-500 flex items-center justify-center sm:justify-end gap-1.5">
            <span>
              {isFr
                ? 'Conçu avec passion pour les amateurs d’élégance au Maroc 🇲🇦'
                : 'صُنع بشغف لخدمة عشاق الأناقة في المغرب 🇲🇦'}
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};
