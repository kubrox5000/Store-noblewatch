import React from 'react';
import { X, ShieldCheck, Truck, RotateCcw, FileText, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { localizeSettingText } from '../i18n/storefront';

export const PoliciesModal: React.FC = () => {
  const { activePolicyModal, setActivePolicyModal, settings } = useStore();
  const { lang, isFr } = useLanguage();

  if (!activePolicyModal) return null;

  const policiesData: Record<string, { title: string; icon: any; content: string }> = {
    privacy: {
      title: isFr
        ? 'Politique de confidentialité et protection des données'
        : 'سياسة الخصوصية وحماية بيانات الزبائن',
      icon: ShieldCheck,
      content: localizeSettingText(
        settings?.policies?.privacy,
        [
          'نلتزم في Noblewatch بحماية خصوصية عملائنا الكرام. جميع المعلومات الشخصية المدخلة كالإسم ورقم الهاتف والعنوان تستخدم فقط لغرض توصيل الطلبيات والتواصل المباشر ولا تتم مشاركتها مع أي طرف ثالث تحت أي ظرف.',
        ],
        'Chez Noblewatch, nous protégeons strictement la confidentialité de nos clients. Toutes les informations fournies (nom, téléphone, adresse) sont utilisées uniquement pour la livraison de vos commandes et ne sont jamais partagées avec des tiers.',
        lang
      ),
    },
    terms: {
      title: isFr
        ? "Conditions générales d'utilisation et de commande"
        : 'شروط وأحكام الاستخدام والطلب',
      icon: FileText,
      content: localizeSettingText(
        settings?.policies?.terms,
        [
          'باستخدامك لموقع Noblewatch، توافق على شروط الخدمة. نحرص على تقديم مواصفات حقيقية وصور واقعية لكل منتج. يحق للعميل معاينة وفحص الطرد قبل تسليم المبلغ للموزع.',
        ],
        'En utilisant Noblewatch, vous acceptez nos conditions de service. Nous présentons des fiches détaillées et des photos fidèles de chaque modèle. Le client a le droit total de vérifier le colis avant de régler le livreur.',
        lang
      ),
    },
    shipping: {
      title: isFr
        ? 'Politique de livraison partout au Maroc 🇲🇦'
        : 'سياسة التوصيل والشحن لجميع أنحاء المغرب 🇲🇦',
      icon: Truck,
      content: localizeSettingText(
        settings?.policies?.shipping,
        [
          'نوفر خدمة الشحن السريع بالتعاون مع أفضل شركات التوصيل المعتمدة في المغرب. يتم تأكيد الطلب هاتفياً خلال ساعات قليلة من تسجيله وتوصيله خلال 24-48 ساعة لجميع المدن الكبرى، ومن 48 إلى 72 ساعة لباقي المناطق والقرى.',
        ],
        'Nous assurons la livraison rapide en partenariat avec les meilleurs transporteurs au Maroc. La commande est confirmée par téléphone en quelques heures et livrée sous 24 à 48 h dans les grandes villes (48 à 72 h dans les autres localités).',
        lang
      ),
    },
    returns: {
      title: isFr
        ? "Politique d'échange et de retour (7 jours)"
        : 'سياسة الاستبدال والإرجاع (7 أيام)',
      icon: RotateCcw,
      content: localizeSettingText(
        settings?.policies?.returns,
        [
          'تتيح سياسة الاسترجاع إمكانية استبدال أو إرجاع المنتج (ساعة أو إكسسوار) خلال 7 أيام من تاريخ الاستلام في حال وجود أي عيب مصنعي أو رغبة في استبدال اللون أو الموديل، شريطة أن يكون المنتج في حالته الأصلية مع كافة الملحقات والعلبة وبطاقة الضمان.',
        ],
        "Vous bénéficiez d'un droit d'échange ou de retour sous 7 jours après réception en cas de défaut de fabrication ou pour changer de couleur/modèle, à condition que le produit soit neuf dans son coffret d'origine avec tous les accessoires.",
        lang
      ),
    },
    warranty: {
      title: isFr
        ? 'Certificat de garantie officiel (1 an)'
        : 'سياسة شهادة الضمان الرسمية (سنة واحدة)',
      icon: CheckCircle2,
      content: localizeSettingText(
        settings?.policies?.warranty,
        [
          'عند شراء أي منتج من متجر Noblewatch، يحصل الزبون على شهادة ضمان رسمية لمدة سنة كاملة (12 شهراً) ضد أي عطب مصنعي في المحرك أو التصنيع. يشمل الضمان إصلاح أو استبدال المنتج مجاناً، مع إمكانية التحقق من صحة الشهادة عبر رمز QR.',
        ],
        'Pour chaque produit acheté chez Noblewatch, vous recevez un certificat de garantie officiel d’un an (12 mois) couvrant tout défaut de fabrication du mouvement. La réparation ou le remplacement est gratuit, avec vérification instantanée par QR code.',
        lang
      ),
    },
  };

  const current = policiesData[activePolicyModal] || policiesData.privacy;
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        className={`relative w-full max-w-lg rounded-3xl bg-white border border-gray-200 p-6 sm:p-8 shadow-2xl space-y-6 my-8 ${
          isFr ? 'text-left' : 'text-right'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#996515] flex items-center justify-center border border-amber-200/50">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">{current.title}</h3>
          </div>

          <button
            onClick={() => setActivePolicyModal(null)}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs sm:text-sm text-gray-700 leading-relaxed space-y-4">
          <p>{current.content}</p>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900 space-y-1.5">
            <strong className="text-gray-900 block font-bold">
              {isFr ? "Besoin d'aide supplémentaire ?" : 'تحتاج لمساعدة إضافية؟'}
            </strong>
            <p className="text-gray-700">
              {isFr
                ? 'Notre équipe support est disponible 24h/24 sur WhatsApp pour répondre à toutes vos questions concernant les commandes ou retours.'
                : 'فريق الدعم لدينا رهن إشارتك للإجابة عن أي استفسار يتعلق بالطلبات أو الاسترجاع عبر الواتساب على مدار الساعة.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setActivePolicyModal(null)}
            className="px-6 py-2.5 rounded-xl gold-gradient-bg text-black font-extrabold text-xs shadow-md hover:brightness-105 transition"
          >
            {isFr ? "J'ai compris" : 'حسناً، فهمت ذلك'}
          </button>
        </div>
      </div>
    </div>
  );
};
