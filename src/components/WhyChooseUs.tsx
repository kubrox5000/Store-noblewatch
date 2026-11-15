import React from 'react';
import { Award, Truck, Banknote, HeartHandshake } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const WhyChooseUs: React.FC = () => {
  const { isFr } = useLanguage();

  return (
    <section className="relative overflow-hidden py-16 bg-gradient-to-b from-[#fbfaf7] via-white to-[#fbfaf7] border-b border-gray-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-block px-4 py-1 rounded-full bg-white text-xs font-bold text-[#996515] border border-[#c5a869]/40 shadow-sm mb-3">
          {isFr ? 'Confiance & Qualité Marocaine Authentique 🇲🇦' : 'ثقة وجودة مغربية خالصة 🇲🇦'}
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-3">
          {isFr ? (
            <>
              Pourquoi choisir <span className="gold-gradient-text font-serif italic text-4xl">Noblewatch</span> ?
            </>
          ) : (
            <>
              لماذا تختار <span className="gold-gradient-text font-serif italic text-4xl">Noblewatch</span>؟
            </>
          )}
        </h2>
        <div className="w-16 h-1 bg-[#c5a869] mx-auto mb-10 rounded-full"></div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <div className="p-3.5 sm:p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#c5a869] transition group shadow-sm hover:shadow-md text-center flex flex-col justify-between">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#fefaf0] text-[#b8860b] group-hover:bg-[#c5a869] group-hover:text-black flex items-center justify-center mx-auto mb-3 transition shadow-inner">
              <HeartHandshake className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-xs sm:text-base font-bold text-gray-900 mb-1 sm:mb-2">
              {isFr ? 'Service client dédié' : 'خدمة عملاء مميزة'}
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
              {isFr
                ? 'Suivi attentif par téléphone et WhatsApp avant et après la réception de votre commande'
                : 'تواصل ومتابعة مستمرة عبر الهاتف والواتساب قبل وبعد وصول الطلب'}
            </p>
          </div>

          <div className="p-3.5 sm:p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#c5a869] transition group shadow-sm hover:shadow-md text-center flex flex-col justify-between">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#fefaf0] text-[#b8860b] group-hover:bg-[#c5a869] group-hover:text-black flex items-center justify-center mx-auto mb-3 transition shadow-inner">
              <Banknote className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-xs sm:text-base font-bold text-gray-900 mb-1 sm:mb-2">
              {isFr ? 'Paiement à la livraison' : 'دفع عند الاستلام'}
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
              {isFr
                ? 'Inspectez votre montre et ses accessoires et vérifiez leur qualité avant de payer'
                : 'افحص ساعتك وإكسسواراتك وتأكد من جودتها قبل الدفع'}
            </p>
          </div>

          <div className="p-3.5 sm:p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#c5a869] transition group shadow-sm hover:shadow-md text-center flex flex-col justify-between">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#fefaf0] text-[#b8860b] group-hover:bg-[#c5a869] group-hover:text-black flex items-center justify-center mx-auto mb-3 transition shadow-inner">
              <Truck className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-xs sm:text-base font-bold text-gray-900 mb-1 sm:mb-2">
              {isFr ? 'Livraison gratuite & rapide' : 'توصيل مجاني وسريع'}
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
              {isFr
                ? 'Livraison offerte dans toutes les villes et villages du Maroc sans frais supplémentaires'
                : 'شحن مجاني لجميع المدن والقرى المغربية بدون أي درهم إضافي'}
            </p>
          </div>

          <div className="p-3.5 sm:p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#c5a869] transition group shadow-sm hover:shadow-md text-center flex flex-col justify-between">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#fefaf0] text-[#b8860b] group-hover:bg-[#c5a869] group-hover:text-black flex items-center justify-center mx-auto mb-3 transition shadow-inner">
              <Award className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-xs sm:text-base font-bold text-gray-900 mb-1 sm:mb-2">
              {isFr ? 'Garantie 1 an & Cadeau offert' : 'ضمان لمدة سنة + هدية مجانية'}
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">
              {isFr
                ? 'Pour tout produit acheté, vous recevez un certificat de garantie officiel d’un an ainsi qu’un cadeau gratuit'
                : 'عند شراء أي منتج يحصل الزبون على شهادة ضمان رسمية لمدة سنة كاملة بالإضافة إلى هدية مجانية مميزة'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
