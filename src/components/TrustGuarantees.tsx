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
    <section className="py-8 bg-white border-b border-gray-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {guarantees.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`relative group p-4 sm:p-5 rounded-2xl bg-white border border-gray-200/90 hover:border-[#c5a869] transition-all duration-300 shadow-sm hover:shadow-md ${
                  isFr ? 'text-left' : 'text-right'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-[#fefaf0] group-hover:bg-[#c5a869] text-[#b8860b] group-hover:text-black flex items-center justify-center transition-colors shadow-inner">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-[#996515] bg-[#fefaf0] px-2 py-0.5 rounded-full border border-[#c5a869]/30">
                    {item.highlight}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 group-hover:text-[#996515] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* Dedicated 1-Year Official Warranty Certificate & Free Gift Announcement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div
            className={`rounded-2xl bg-gradient-to-r from-[#11131a] via-[#1a1e2b] to-[#11131a] border border-[#c5a869]/70 p-4 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md ${
              isFr ? 'text-left' : 'text-right'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#c5a869]/20 border border-[#c5a869] text-[#f3d999] flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#f3d999]">
                  {isFr
                    ? 'Certificat de garantie officiel d’un an offert'
                    : 'شهادة ضمان رسمية لمدة سنة عند شراء أي منتج'}
                </h3>
                <p className="text-xs text-gray-300 mt-0.5">
                  {isFr
                    ? 'Chaque commande inclut un certificat nominatif valable 12 mois contre tout défaut de fabrication avec QR code.'
                    : 'تُمنح مع كل طلبية شهادة ضمان رسمية لمدة 12 شهراً ضد أي عطب مصنعي مع رمز تحقق QR.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsWarrantyCheckOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#c5a869] hover:bg-[#d8ba78] text-black font-extrabold text-xs flex items-center gap-1.5 flex-shrink-0 cursor-pointer transition shadow"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isFr ? 'Vérifier une garantie' : 'تحقق من الضمان'}</span>
            </button>
          </div>

          <div
            className={`rounded-2xl bg-gradient-to-r from-[#fefaf0] via-[#fffdf6] to-emerald-50/70 border border-[#c5a869]/70 p-4 sm:px-5 flex items-center gap-3.5 shadow-sm ${
              isFr ? 'text-left' : 'text-right'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full mb-1">
                <span>{isFr ? 'Cadeau offert avec chaque commande' : 'مفاجأة مجانية للزبناء'}</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-gray-900">
                {isFr
                  ? 'Un cadeau offert pour l’achat de n’importe quel produit'
                  : 'عند شراء أي منتج سوف تحصل على هدية مجانية'}
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                {isFr
                  ? 'Chaque commande passée sur Noblewatch est accompagnée d’un cadeau gratuit soigneusement sélectionné.'
                  : 'مع كل طلبية لشراء أي منتج من المتجر نُرفق لكم هدية مجانية مميزة تصلكم مع الطلب.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
