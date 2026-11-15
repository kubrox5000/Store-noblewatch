import React from 'react';
import { ShoppingBag, Sparkles, ShieldCheck, Truck, Gift } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { localizeSettingText } from '../i18n/storefront';

export const HeroSection: React.FC = () => {
  const { settings, setSelectedCategory } = useStore();
  const { lang, isFr } = useLanguage();

  const handleShopNow = () => {
    setSelectedCategory('all');
    const el = document.getElementById('products-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDiscoverLuxury = () => {
    setSelectedCategory('luxury');
    const el = document.getElementById('products-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const heroTitle = localizeSettingText(
    settings?.heroTitle,
    ['كل ما تحتاجه في مكان واحد'],
    'Tout ce dont vous avez besoin au même endroit',
    lang
  );
  const heroSubtitle = localizeSettingText(
    settings?.heroSubtitle,
    [
      'تشكيلة متكاملة من أرقى ساعات اليد الرجالية والنسائية، مع إكسسوارات راقية تمنحك الأناقة والتميز. دفع آمن عند الاستلام وتوصيل مجاني لجميع مدن المغرب.',
    ],
    'Une collection exclusive de montres et d’accessoires raffinés pour homme et femme. Paiement sécurisé à la livraison et livraison gratuite partout au Maroc.',
    lang
  );
  const heroCtaText = localizeSettingText(settings?.heroCtaText, ['تسوق الآن'], 'Acheter maintenant', lang);
  const heroSecondaryText = localizeSettingText(
    settings?.heroSecondaryText,
    ['اكتشف مجموعتنا الفاخرة'],
    'Découvrir notre collection luxe',
    lang
  );
  const heroBadge = localizeSettingText(
    settings?.heroBadge,
    ['التوصيل مجاني لجميع أنحاء المغرب'],
    'Livraison gratuite partout au Maroc',
    lang
  );

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#f6f4ee] via-[#faf9f6] to-white border-b border-gray-200 py-12 lg:py-20">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#c5a869]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-10 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Text Column */}
          <div className={`lg:col-span-7 space-y-6 ${isFr ? 'text-left' : 'text-right'}`}>
            {/* Top badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white border border-[#c5a869]/50 text-[#996515] text-[11px] sm:text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#b8860b] flex-shrink-0" />
              <span className="truncate">
                {isFr
                  ? 'Boutique marocaine certifiée de montres et accessoires de luxe'
                  : 'المتجر المغربي المعتمد للساعات والإكسسوارات الفاخرة'}
              </span>
            </div>

            {/* Main Marketing Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 leading-tight sm:leading-[1.25]">
              {heroTitle}
              <span className="block mt-2 gold-gradient-text font-serif italic text-2xl sm:text-4xl lg:text-5xl">
                {isFr ? 'Une élégance digne de chaque instant' : 'أناقة تليق بك في كل لحظة'}
              </span>
            </h1>

            {/* Subtitle description */}
            <p className="text-sm sm:text-lg text-gray-600 max-w-2xl leading-relaxed">{heroSubtitle}</p>

            {/* Quality & Warranty Badges */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-3 pt-1">
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-[#fefaf0] border border-[#c5a869]/60 text-[10px] sm:text-xs font-extrabold text-[#8a5a00] shadow-xs text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-[#996515] flex-shrink-0" />
                <span>{isFr ? 'Certificat de garantie 1 an' : 'شهادة ضمان لمدة سنة عند الشراء'}</span>
              </div>
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300/80 text-[10px] sm:text-xs font-extrabold text-emerald-800 shadow-xs text-center">
                <Gift className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                <span>{isFr ? 'Cadeau offert à l’achat' : 'هدية مع شراء أي منتج'}</span>
              </div>
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-[10px] sm:text-xs font-semibold text-gray-800 shadow-xs text-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c5a869] flex-shrink-0"></span>
                <span>{isFr ? 'Qualité originale' : 'جودة أصلية'}</span>
              </div>
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-[10px] sm:text-xs font-semibold text-gray-800 shadow-xs text-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c5a869] flex-shrink-0"></span>
                <span>{isFr ? 'Prix accessibles' : 'أسعار مناسبة'}</span>
              </div>
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-[10px] sm:text-xs font-semibold text-gray-800 shadow-xs text-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c5a869] flex-shrink-0"></span>
                <span>{isFr ? 'Collection tendance' : 'تشكيلة رائدة'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                onClick={handleShopNow}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl gold-gradient-bg text-black font-extrabold text-base shadow-lg shadow-[#c5a869]/25 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5 text-black" />
                <span>{heroCtaText}</span>
              </button>

              <button
                onClick={handleDiscoverLuxury}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-sm shadow-sm transition cursor-pointer"
              >
                <span>{heroSecondaryText}</span>
                <span className="text-[#996515] text-base">{isFr ? '→' : '←'}</span>
              </button>
            </div>

            {/* COD & Warranty Certificate reassurance bar */}
            <div className="flex flex-col gap-2 pt-4 text-xs font-medium text-gray-600 border-t border-gray-200">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  {isFr
                    ? 'Paiement à la livraison (COD) partout au Maroc : vérifiez votre montre avant de payer le moindre dirham.'
                    : 'الدفع عند الاستلام (COD) في كافة ربوع المغرب: افحص ساعتك قبل أن تدفع درهماً واحداً.'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-[#8a5a00] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#996515] flex-shrink-0" />
                <span>
                  {isFr
                    ? 'Pour chaque produit acheté sur notre site, vous recevez un certificat de garantie officiel d’un an.'
                    : 'عند شراء أي منتج من المتجر، يحصل الزبون على شهادة ضمان رسمية لمدة سنة كاملة.'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-emerald-800 font-bold">
                <Gift className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>
                  {isFr
                    ? 'Cadeau spécial offert : pour l’achat de n’importe quel produit, vous recevez un cadeau gratuit avec votre commande.'
                    : 'هدية خاصة عند الشراء: عند شراء أي منتج من المتجر، سوف يحصل الزبون على هدية مجانية مميزة مرفقة مع الطلب.'}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Column */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="absolute inset-0 -m-4 rounded-3xl bg-gradient-to-tr from-[#c5a869]/20 via-transparent to-amber-200/20 blur-xl"></div>

              <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-2xl bg-white">
                <img
                  src={settings?.heroImage || '/assets/watches_and_accessories_hero.jpg'}
                  alt={isFr ? 'Collection de montres et accessoires Noblewatch' : 'تشكيلة ساعات وإكسسوارات Noblewatch الفاخرة'}
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-80 sm:h-96 lg:h-[460px] object-cover hover:scale-105 transition-transform duration-700"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10"></div>

                {/* Floating Free Delivery Morocco Badge */}
                <div className="absolute bottom-4 right-4 left-4 p-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-[#c5a869]/50 shadow-2xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg gold-gradient-bg flex items-center justify-center text-black font-black flex-shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className={isFr ? 'text-left' : 'text-right'}>
                      <div className="text-gray-900 font-bold text-sm">{heroBadge}</div>
                      <div className="text-[#996515] text-xs font-semibold">
                        {isFr
                          ? 'Livraison rapide sous 24 à 48h jusqu’à votre porte'
                          : 'توصيل سريع خلال 24 - 48 ساعة حتى باب بيتك'}
                      </div>
                    </div>
                  </div>
                  <span className="hidden sm:inline-block text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-1 rounded flex-shrink-0">
                    0 DH
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
