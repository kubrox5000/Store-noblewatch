import React from 'react';
import {
  MousePointerClick,
  ClipboardEdit,
  Truck,
  PackageCheck,
  ArrowDown,
  MessageCircle,
  Search,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../context/StoreContext';
import { buildWhatsAppUrl } from '../utils/constants';

export const HowToOrderSection: React.FC = () => {
  const { isFr } = useLanguage();
  const { settings, setIsTrackingOpen } = useStore();

  const scrollToProducts = () => {
    const el = document.getElementById('products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const steps = [
    {
      num: '01',
      icon: MousePointerClick,
      title: isFr ? 'Choisissez votre produit' : 'اختار المنتوج واللون',
      desc: isFr
        ? 'Parcourez nos montres et bracelets et sélectionnez le modèle et la couleur qui vous plaisent.'
        : 'تصفح الساعات والإكسسوارات واختار الموديل واللون اللي عجبك من التشكيلة.',
    },
    {
      num: '02',
      icon: ClipboardEdit,
      title: isFr ? 'Commandez en 30 secondes' : 'عمّر الاستمارة فـ 30 ثانية',
      desc: isFr
        ? 'Cliquez sur « Commander », entrez votre nom, téléphone et ville sans aucune carte bancaire.'
        : 'ضغط على «اطلب الآن» ودخل سميتك، رقم الهاتف والمدينة فقط بلا بطاقة بنكية.',
    },
    {
      num: '03',
      icon: Truck,
      title: isFr ? 'Confirmation & livraison gratuite' : 'تأكيد سريع وتوصيل مجاني',
      desc: isFr
        ? 'Notre équipe confirme votre commande et vous livre gratuitement (0 DH) sous 24h à 48h partout au Maroc.'
        : 'فريقنا كيتواصل معاك للتأكيد وكيوصلك الطلب مجاناً (0 درهم) لجميع مدن المغرب خلال 24-48 ساعة.',
    },
    {
      num: '04',
      icon: PackageCheck,
      title: isFr ? 'Vérifiez avant de payer' : 'قلب المنتوج عاد خلّص',
      desc: isFr
        ? 'Inspectez votre colis à la réception avant de payer en espèces, avec garantie 1 an et cadeau offert.'
        : 'ملي يوصلك الموزّع، حلّ الطرد وشوف الجودة بعينيك عاد خلّص كاش مع شهادة ضمان سنة وهدية مجانية.',
    },
  ];

  const whatsappUrl = buildWhatsAppUrl(
    settings?.whatsappNumber,
    isFr
      ? 'Bonjour, je souhaite obtenir de l’aide pour passer ma commande sur Noblewatch.'
      : 'السلام عليكم، بغيت مساعدة باش نطلب المنتوج ديالي من متجر Noblewatch'
  );

  return (
    <section
      id="how-to-order-section"
      aria-labelledby="how-to-order-heading"
      dir={isFr ? 'ltr' : 'rtl'}
      className="py-12 sm:py-14 bg-gradient-to-b from-white via-[#fcfbf8] to-white border-b border-gray-200/80 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-9 sm:mb-10">
          <p className="text-xs font-bold text-[#996515] tracking-wide mb-2">
            {isFr
              ? '4 étapes simples · Sans carte bancaire · Paiement à la livraison'
              : '4 خطوات بسيطة · بدون بطاقة بنكية · الدفع عند الاستلام'}
          </p>
          <h2
            id="how-to-order-heading"
            className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight text-balance"
          >
            {isFr ? 'Comment commander votre produit ?' : 'كيفاش تطلب المنتوج ديالك؟'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
            {isFr
              ? 'Une expérience d’achat claire, rapide et 100 % sécurisée partout au Maroc.'
              : 'طريقة الطلب ساهلة وواضحة بزاف: كتطلب عبر الموقع أو الواتساب وكتفحص طلبيتك قبل ما تخلّص.'}
          </p>
          <div className="w-12 h-1 bg-[#c5a869] mx-auto mt-3 rounded-full" />
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className={`group relative rounded-2xl bg-white border border-gray-200/90 hover:border-[#c5a869] p-5 sm:p-6 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between ${
                  isFr ? 'text-left' : 'text-right'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#fefaf0] group-hover:bg-[#c5a869] text-[#996515] group-hover:text-black flex items-center justify-center transition-colors duration-200 border border-[#c5a869]/30">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-2xl sm:text-3xl font-black text-[#c5a869]/45 group-hover:text-[#996515] tabular-nums transition-colors duration-200 select-none">
                      {step.num}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-gray-900 mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-gray-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] font-bold text-[#996515]">
                  {step.num === '01' && (isFr ? 'Catalogue 100 % authentique' : 'اختيار حر للساعات والأساور')}
                  {step.num === '02' && (isFr ? 'Aucune carte requise' : 'بدون تسجيل حساب أو بطاقة')}
                  {step.num === '03' && (isFr ? 'Livraison 0 DH · Maroc' : 'توصيل مجاني لجميع المدن')}
                  {step.num === '04' && (isFr ? 'Garantie 1 an + Cadeau' : 'معاينة قبل الدفع + ضمان سنة')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Action Strip */}
        <div className="mt-8 sm:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={scrollToProducts}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-xl bg-[#c5a869] hover:bg-[#b59655] text-black font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#996515]"
          >
            <span>{isFr ? 'Choisir mon produit maintenant' : 'اختار منتوجك واطلب الآن'}</span>
            <ArrowDown className="w-4 h-4" />
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 hover:border-emerald-300 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>{isFr ? 'Commander via WhatsApp' : 'اطلب أو استفسر عبر واتساب'}</span>
          </a>

          <button
            type="button"
            onClick={() => setIsTrackingOpen(true)}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 hover:border-[#c5a869]/60 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#996515]"
          >
            <Search className="w-4 h-4 text-[#996515]" />
            <span>{isFr ? 'Suivre ma commande' : 'تتبع طلبيتك'}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
