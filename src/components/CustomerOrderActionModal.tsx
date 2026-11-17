import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { Order } from '../types';
import { buildWhatsAppUrl, formatPrice, formatPhoneForWhatsApp } from '../utils/constants';
import { translateColorName } from '../i18n/storefront';
import {
  CheckCircle2,
  XCircle,
  Truck,
  ShieldCheck,
  MessageCircle,
  Clock,
  X,
  AlertTriangle,
} from 'lucide-react';

export const CustomerOrderActionModal: React.FC = () => {
  const { orders, settings, showToast } = useStore();
  const { lang, isFr } = useLanguage();
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionDone, setActionDone] = useState<'confirmed' | 'cancelled' | null>(null);

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#confirm-order')) {
        const queryIndex = hash.indexOf('?');
        if (queryIndex !== -1) {
          const params = new URLSearchParams(hash.substring(queryIndex));
          const id = params.get('id');
          if (id) {
            setActiveOrderId(id);
          }
        }
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  useEffect(() => {
    if (!activeOrderId) {
      setFetchedOrder(null);
      return;
    }
    const inCtx = orders.find((o) => o.id === activeOrderId || o.orderNumber === activeOrderId);
    if (inCtx) {
      setFetchedOrder(inCtx);
      return;
    }
    let cancelled = false;
    fetch(`/api/orders/public/${encodeURIComponent(activeOrderId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.success && data.order) {
          setFetchedOrder(data.order);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeOrderId, orders]);

  if (!activeOrderId) return null;

  const currentOrder =
    fetchedOrder ||
    orders.find((o) => o.id === activeOrderId || o.orderNumber === activeOrderId) ||
    null;

  const handleClose = () => {
    setActiveOrderId(null);
    setFetchedOrder(null);
    setActionDone(null);
    if (window.location.hash.startsWith('#confirm-order')) {
      window.location.hash = '';
    }
  };

  const handleConfirmOrder = async () => {
    if (!currentOrder) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(currentOrder.id)}/customer-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirmed',
          note: isFr
            ? 'Commande confirmée par le client en un clic via WhatsApp'
            : 'تم تأكيد الطلب إلكترونياً من طرف الزبون بنقرة واحدة عبر رابط الواتساب',
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.order) setFetchedOrder(data.order);
        setActionDone('confirmed');
        showToast(
          isFr
            ? 'Merci ! Votre commande est confirmée et sera expédiée rapidement.'
            : 'شكراً لك! تم تأكيد طلبك بنجاح وسيتواصل معك الموزع قريباً.',
          'success'
        );
      } else {
        showToast(data.message || 'تعذر تأكيد الطلب', 'error');
      }
    } catch {
      showToast('تعذر الاتصال بالخادم', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!currentOrder) return;
    const confirmMsg = isFr
      ? 'Êtes-vous sûr de vouloir annuler cette commande ?'
      : 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟';
    if (!window.confirm(confirmMsg)) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(currentOrder.id)}/customer-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancelled',
          note: isFr
            ? 'Commande annulée par le client via WhatsApp'
            : 'تم إلغاء الطلب من طرف الزبون عبر رابط الواتساب',
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.order) setFetchedOrder(data.order);
        setActionDone('cancelled');
        showToast(isFr ? 'La commande a été annulée.' : 'تم إلغاء الطلب بنجاح.', 'info');
      } else {
        showToast(data.message || 'تعذر إلغاء الطلب', 'error');
      }
    } catch {
      showToast('تعذر الاتصال بالخادم', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const storeWhatsApp = formatPhoneForWhatsApp(settings?.whatsappNumber || '+212612345678') || '212612345678';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-xl rounded-3xl bg-white border border-gray-200 shadow-2xl overflow-hidden my-auto max-h-[96vh] flex flex-col ${
          isFr ? 'text-left' : 'text-right'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-white p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gold-gradient-bg flex items-center justify-center text-black font-black shadow-xs flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                {isFr
                  ? 'Confirmation et suivi - Paiement à la livraison'
                  : 'تأكيد ومتابعة الطلبية - الدفع عند الاستلام'}
              </h3>
              <p className="text-[11px] text-[#996515] font-semibold">
                {isFr
                  ? `Boutique ${settings?.storeName || 'Noblewatch'} — Montres & Accessoires de luxe 🇲🇦`
                  : `متجر ${settings?.storeName || 'Noblewatch'} للساعات والإكسسوارات الفاخرة 🇲🇦`}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {!currentOrder ? (
            <div className="text-center py-8 space-y-3">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
              <h4 className="text-base font-bold text-gray-900">
                {isFr ? 'Commande introuvable' : 'لم يتم العثور على هذا الطلب'}
              </h4>
              <p className="text-xs text-gray-500">
                {isFr
                  ? 'Veuillez vérifier le lien ou contacter notre service client sur WhatsApp.'
                  : 'يرجى التأكد من صحة الرابط أو التواصل مع خدمة العملاء عبر الواتساب.'}
              </p>
              <button
                onClick={handleClose}
                className="mt-2 px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition"
              >
                {isFr ? 'Fermer la fenêtre' : 'إغلاق النافذة'}
              </button>
            </div>
          ) : actionDone === 'confirmed' ||
            currentOrder.status === 'تم التأكيد' ||
            currentOrder.status === 'قيد التجهيز' ||
            currentOrder.status === 'تم الشحن' ||
            currentOrder.status === 'تم التسليم' ||
            currentOrder.customerAction === 'confirmed' ? (
            /* ================= CONFIRMED SUCCESS VIEW ================= */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-300 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold inline-block">
                  {isFr ? `Commande : #${currentOrder.orderNumber}` : `رقم طلبك: #${currentOrder.orderNumber}`}
                </span>
                <h4 className="text-xl font-black text-gray-900">
                  {isFr ? 'Votre commande est confirmée ! 🇲🇦' : 'تم تأكيد طلبك بنجاح! 🇲🇦'}
                </h4>
                <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                  {isFr ? (
                    <>
                      Merci <strong className="text-gray-900">{currentOrder.customerName}</strong>. Notre
                      livreur à <strong className="text-[#996515]">{currentOrder.city}</strong> vous
                      contactera pour la livraison sous 24 à 48h.
                    </>
                  ) : (
                    <>
                      شكراً لك <strong className="text-gray-900">{currentOrder.customerName}</strong>.
                      سيتواصل معك الموزع في مدينة{' '}
                      <strong className="text-[#996515]">{currentOrder.city}</strong> لتسليمك الطرد
                      خلال 24 إلى 48 ساعة.
                    </>
                  )}
                </p>
              </div>

              {/* Order Brief */}
              <div
                className={`p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2 ${
                  isFr ? 'text-left' : 'text-right'
                }`}
              >
                <div className="flex justify-between text-gray-700">
                  <span>{isFr ? 'Montant à la livraison :' : 'المبلغ المطلوب عند الاستلام:'}</span>
                  <span className="text-emerald-700 font-black text-sm">
                    {formatPrice(currentOrder.totalAmount, lang)}{' '}
                    {isFr ? '(Livraison gratuite)' : '(توصيل مجاني)'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>{isFr ? 'Statut :' : 'حالة الطلبية:'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                    {isFr
                      ? 'Confirmée & en préparation 🚀'
                      : 'تم التأكيد وجاري التجهيز للشحن 🚀'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={buildWhatsAppUrl(
                    storeWhatsApp,
                    isFr
                      ? `Bonjour, je suis ${currentOrder.customerName}, j'ai confirmé ma commande #${currentOrder.orderNumber}. Merci.`
                      : `السلام عليكم، أنا ${currentOrder.customerName}، قمت بتأكيد طلبي رقم #${currentOrder.orderNumber} عبر الرابط. شكراً لكم.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isFr ? 'Nous contacter sur WhatsApp' : 'مراسلتنا عبر واتساب'}</span>
                </a>
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition cursor-pointer"
                >
                  {isFr ? 'Retour à la boutique' : 'العودة للمتجر'}
                </button>
              </div>
            </div>
          ) : actionDone === 'cancelled' || currentOrder.status === 'ملغى' ? (
            /* ================= CANCELLED VIEW ================= */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 border border-rose-300 flex items-center justify-center mx-auto shadow-sm">
                <XCircle className="w-9 h-9" />
              </div>

              <div className="space-y-1">
                <span className="px-3 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300 text-xs font-mono font-bold inline-block">
                  {isFr ? `Commande : #${currentOrder.orderNumber}` : `طلب رقم: #${currentOrder.orderNumber}`}
                </span>
                <h4 className="text-xl font-black text-gray-900">
                  {isFr ? 'Commande annulée' : 'تم إلغاء الطلبية بنجاح'}
                </h4>
                <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                  {isFr
                    ? "L'annulation a bien été enregistrée. Aucun livreur ne sera envoyé. À très bientôt !"
                    : 'تم تسجيل إلغاء الطلبية ولن يتم إرسال الموزع. نأمل أن نراك مجدداً قريباً!'}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={buildWhatsAppUrl(
                    storeWhatsApp,
                    isFr
                      ? `Bonjour, concernant la commande #${currentOrder.orderNumber}, je souhaite avoir des informations ou recommander.`
                      : `السلام عليكم، بخصوص الطلب رقم #${currentOrder.orderNumber}، أود الاستفسار أو إعادة الطلب.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#c5a869] hover:bg-[#b59859] text-black font-black text-xs shadow transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {isFr
                      ? 'Contacter sur WhatsApp si vous changez d’avis'
                      : 'تواصل معنا عبر واتساب إذا غيرت رأيك'}
                  </span>
                </a>
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition cursor-pointer"
                >
                  {isFr ? 'Découvrir nos autres produits' : 'تصفح المنتجات الأخرى'}
                </button>
              </div>
            </div>
          ) : (
            /* ================= PENDING ACTION VIEW (CONFIRM / CANCEL) ================= */
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-bold text-gray-900">
                    {isFr ? (
                      <>
                        Bonjour <span className="text-[#996515] font-black">{currentOrder.customerName}</span> 👋
                      </>
                    ) : (
                      <>
                        مرحباً بك أخي/أختي{' '}
                        <span className="text-[#996515] font-black">{currentOrder.customerName}</span> 👋
                      </>
                    )}
                  </h4>
                  <p className="text-gray-600 mt-0.5 leading-relaxed">
                    {isFr
                      ? 'Veuillez vérifier les détails de votre commande ci-dessous et confirmer pour lancer l’expédition.'
                      : 'المرجو مراجعة بيانات طلبيتك أدناه وتأكيد شحنها لنبدأ بتجهيزها وإرسالها فوراً مع الموزع.'}
                  </p>
                </div>
              </div>

              {/* Order Info Card */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">{isFr ? 'N° de commande :' : 'رقم الطلبية:'}</span>
                  <span className="font-mono font-black text-gray-900 text-sm">
                    #{currentOrder.orderNumber}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <span className="font-bold text-gray-800 block">
                    {isFr ? 'Articles commandés :' : 'المنتجات المطلوبة:'}
                  </span>
                  {currentOrder.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-gray-200/90 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={it.image || '/assets/watches_and_accessories_hero.jpg'}
                          alt={it.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              '/assets/watches_and_accessories_hero.jpg';
                          }}
                          className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-200 flex-shrink-0"
                        />
                        <div>
                          <h5 className="font-bold text-gray-900 text-xs">{it.name}</h5>
                          <div className="text-[11px] text-[#996515] font-semibold mt-0.5">
                            {isFr ? 'Couleur :' : 'الألوان:'} {translateColorName(it.color, lang)}
                          </div>
                          {it.bundleLabel && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#c5a869]/20 text-[#855810] inline-block mt-0.5">
                              {isFr && it.quantity > 1 ? `Pack ${it.quantity} pièces` : it.bundleLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={`font-mono ${isFr ? 'text-right' : 'text-left'}`}>
                        <span className="font-bold text-gray-900 block text-xs">
                          {formatPrice(it.price * it.quantity, lang)}
                        </span>
                        <span className="text-[10px] text-gray-500 font-normal">
                          {it.quantity} &times; {formatPrice(it.price, lang)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery details */}
                <div className="border-t border-gray-200 pt-2 space-y-1.5 text-gray-700">
                  <div className="flex justify-between">
                    <span>{isFr ? 'Ville :' : 'المدينة:'}</span>
                    <span className="font-bold text-gray-900">{currentOrder.city}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>{isFr ? 'Adresse :' : 'العنوان:'}</span>
                    <span
                      className={`font-semibold text-gray-900 max-w-[240px] truncate ${
                        isFr ? 'text-right' : 'text-left'
                      }`}
                    >
                      {currentOrder.address}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isFr ? 'Téléphone :' : 'الهاتف:'}</span>
                    <span className="font-mono font-bold text-gray-900" dir="ltr">
                      {currentOrder.phone}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200/80 pt-1.5">
                    <span className="font-bold text-gray-900">
                      {isFr ? 'Total à la livraison :' : 'المبلغ المطلوب عند الاستلام:'}
                    </span>
                    <span className="font-black text-emerald-700 text-sm">
                      {formatPrice(currentOrder.totalAmount, lang)}{' '}
                      {isFr ? '(Livraison gratuite 0 DH)' : '(توصيل مجاني 0 درهم)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Guarantees */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  {isFr ? (
                    <>
                      <strong>Vérification avant paiement :</strong> ouvrez le colis et vérifiez votre
                      montre avant de payer.
                    </>
                  ) : (
                    <>
                      <strong>معاينة وفحص قبل الدفع:</strong> تفتح الطرد وتتفقد ساعتك بيدك قبل تسليم
                      أي مبلغ للموزع.
                    </>
                  )}
                </span>
              </div>

              {/* Confirmation Actions */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmOrder}
                  className="w-full py-3.5 rounded-xl gold-gradient-bg text-black font-black text-sm shadow-md hover:brightness-105 active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5 fill-black text-white" />
                  <span>
                    {isProcessing
                      ? isFr
                        ? 'Confirmation en cours...'
                        : 'جاري التأكيد...'
                      : isFr
                      ? 'Confirmer l’expédition maintenant'
                      : 'تأكيد شحن الطلبية الآن (نعم، أنا جاهز للاستلام)'}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleCancelOrder}
                    className="py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>{isFr ? 'Annuler' : 'إلغاء الطلب'}</span>
                  </button>

                  <a
                    href={buildWhatsAppUrl(
                      storeWhatsApp,
                      isFr
                        ? `Bonjour, concernant ma commande #${currentOrder.orderNumber}, je souhaite modifier l'adresse ou poser une question.`
                        : `السلام عليكم، بخصوص طلبي رقم #${currentOrder.orderNumber}، أود تعديل تفاصيل العنوان أو الاستفسار.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>{isFr ? 'Modifier via WhatsApp' : 'تعديل عبر واتساب'}</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
