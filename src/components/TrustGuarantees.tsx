import React from 'react';
import { ShieldCheck, Truck, Banknote, Headphones } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const TrustGuarantees: React.FC = () => {
  const { isFr } = useLanguage();

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      </div>
    </section>
  );
};
