import React from 'react';
import { ShieldCheck, Truck, Banknote, Headphones, Award, Gift } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../context/StoreContext';

export const TrustGuarantees: React.FC = () => {
  const { isFr } = useLanguage();
  const { setIsWarrantyCheckOpen } = useStore();

  const guarantees = [
    {
      icon: ShieldCheck,
      title: isFr ? 'Achat sécurisé' : 'تسوق آمن',
      description: isFr
        ? 'Vos informations sont protégées et aucune carte bancaire n’est requise'
        : 'معلوماتك في أمان تام ولا نطلب بطاقة بنكية',
      highlight: isFr ? 'Protection 100%' : 'حماية 100%',
    },
    {
      icon: Banknote,
      title: isFr ? 'Paiement à la livraison' : 'دفع عند الاستلام',
      description: isFr
        ? 'Vérifiez votre montre et ses accessoires avant de payer'
        : 'افحص ساعتك وإكسسواراتك وتأكد من جودتها قبل الدفع',
      highlight: isFr ? 'COD Maroc' : 'COD مغربي',
    },
    {
      icon: Truck,
      title: isFr ? 'Livraison gratuite' : 'توصيل مجاني',
      description: isFr
        ? 'Expédition rapide partout dans les villes et villages du Maroc'
        : 'شحن سريع لجميع مدن وقرى المملكة المغربية',
      highlight: isFr ? 'Gratuit 0 DH' : 'مجاناً 0 درهم',
    },
    {
      icon: Headphones,
      title: isFr ? 'Service client' : 'خدمة العملاء',
      description: isFr
        ? 'Une équipe dédiée à votre écoute 7j/7 par téléphone et WhatsApp'
        : 'فريق دعم رهن إشارتك طيلة أيام الأسبوع',
      highlight: isFr ? 'Support WhatsApp & Tél' : 'دعم واتساب وهاتف',
    },
  ];

  return (
    <section className="py-6 sm:py-8 bg-white border-b border-gray-200/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
          {guarantees.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`relative group p-3 sm:p-5 rounded-2xl bg-white border border-gray-200/90 hover:border-[#c5a869] transition-all duration-300 shadow-sm hover:shadow-md ${
                  isFr ? 'text-left' : 'text-right'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2 sm:mb-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#fefaf0] group-hover:bg-[#c5a869] text-[#b8860b] group-hover:text-black flex items-center justify-center transition-colors shadow-inner flex-shrink-0">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#996515] bg-[#fefaf0] px-1.5 sm:px-2 py-0.5 rounded-full border border-[#c5a869]/30 whitespace-nowrap">
                    {item.highlight}
                  </span>
                </div>
                <h3 className="text-xs sm:text-base font-bold text-gray-900 mb-1 group-hover:text-[#996515] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* Dedicated 1-Year Official Warranty Certificate & Free Gift Announcement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Official 1-Year Warranty Card */}
          <div
            className={`rounded-2xl bg-gradient-to-br from-[#11131a] via-[#1a1e2b] to-[#11131a] border border-[#c5a869]/65 p-4 sm:p-5 flex flex-col justify-between gap-3.5 shadow-md ${
              isFr ? 'text-left' : 'text-right'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#c5a869]/20 border border-[#c5a869]/70 text-[#f3d999] flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#c5a869] tracking-wide mb-0.5">
                    {isFr ? 'Garantie officielle · 12 mois' : 'ضمان رسمي · لمدة 12 شهراً'}
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-[#f3d999] leading-snug">
                    {isFr
                      ? 'Certificat de garantie officiel d’un an offert'
                      : 'شهادة ضمان رسمية لمدة سنة عند شراء أي منتج'}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                {isFr
                  ? 'Chaque commande inclut un certificat nominatif valable 12 mois contre tout défaut de fabrication avec QR code.'
                  : 'تُمنح مع كل طلبية شهادة ضمان رسمية لمدة 12 شهراً ضد أي عطب مصنعي مع رمز تحقق QR.'}
              </p>
            </div>

            <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-3">
              <span className="hidden sm:inline text-[11px] text-gray-400 font-medium">
                {isFr ? 'Vérification instantanée par numéro de série' : 'فحص فوري برمز الشهادة'}
              </span>
              <button
                type="button"
                onClick={() => setIsWarrantyCheckOpen(true)}
                className="w-full sm:w-auto min-h-[42px] px-4 py-2 rounded-xl bg-[#c5a869] hover:bg-[#d8ba78] active:scale-[0.98] text-black font-extrabold text-xs flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer transition shadow"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isFr ? 'Vérifier une garantie' : 'تحقق من الضمان'}</span>
              </button>
            </div>
          </div>

          {/* Free Gift Card */}
          <div
            className={`rounded-2xl bg-gradient-to-br from-[#fefaf0] via-[#fffdf7] to-emerald-50/75 border border-[#c5a869]/60 p-4 sm:p-5 flex flex-col justify-between gap-3.5 shadow-sm ${
              isFr ? 'text-left' : 'text-right'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-extrabold text-emerald-700 tracking-wide mb-0.5">
                    {isFr ? 'Offre incluse · Cadeau offert' : 'مفاجأة مجانية للزبناء · هدية مرفقة'}
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-gray-900 leading-snug">
                    {isFr
                      ? 'Un cadeau offert pour l’achat de n’importe quel produit'
                      : 'عند شراء أي منتج سوف تحصل على هدية مجانية'}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                {isFr
                  ? 'Chaque commande passée sur Luxwatch est accompagnée d’un cadeau gratuit soigneusement sélectionné.'
                  : 'مع كل طلبية لشراء أي منتج من المتجر نُرفق لكم هدية مجانية مميزة تصلكم مع الطلب.'}
              </p>
            </div>

            <div className="pt-2.5 border-t border-emerald-200/70 flex items-center justify-between text-[11px] font-bold text-emerald-800">
              <span>{isFr ? 'Inclus automatiquement avec votre colis' : 'تُرسل تلقائياً داخل الطرد بدون تكلفة إضافية'}</span>
              <span className="font-mono text-emerald-700 shrink-0">0 DH</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
