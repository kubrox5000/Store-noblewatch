import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Phone,
  MapPin,
  User,
  MessageCircle,
  AlertCircle,
  FileText,
  Check,
  Sparkles,
  Tag,
  Loader2,
  Lock,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import {
  MOROCCAN_CITIES,
  formatPrice,
  normalizeMoroccanPhone,
  isFakeMoroccanPhonePattern,
  isFakeCustomerName,
  getProductColors,
  calculateTierOffers,
  getBundlePriceForQuantity,
  buildWhatsAppUrl,
} from '../utils/constants';
import { trackPixelInitiateCheckout } from '../utils/trackingPixels';
import {
  formatCityLabel,
  getCityValue,
  translateColorName,
  localizeTierBadge,
} from '../i18n/storefront';

export const CodCheckoutModal: React.FC = () => {
  const { checkoutProduct, setCheckoutProduct, placeOrder, settings } = useStore();
  const { lang, isFr } = useLanguage();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(() => getCityValue(MOROCCAN_CITIES[0], lang));
  const [customCity, setCustomCity] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedColor, setSelectedColor] = useState(
    (checkoutProduct?.color && checkoutProduct.color !== 'افتراضي')
      ? checkoutProduct.color
      : (getProductColors(checkoutProduct?.product)[0]?.name || 'أسود ملكي')
  );
  const [quantity, setQuantity] = useState(checkoutProduct?.quantity || 1);
  const [multiColors, setMultiColors] = useState<string[]>([]);
  const [useSeparateColors, setUseSeparateColors] = useState(true);

  useEffect(() => {
    const matchedEntry = MOROCCAN_CITIES.find(
      (c) => getCityValue(c, 'ar') === city || getCityValue(c, 'fr') === city
    );
    if (matchedEntry) {
      setCity(getCityValue(matchedEntry, lang));
    }
  }, [lang, city]);

  useEffect(() => {
    if (checkoutProduct) {
      const colors = getProductColors(checkoutProduct.product);
      const defaultCol = (checkoutProduct.color && checkoutProduct.color !== 'افتراضي')
        ? checkoutProduct.color
        : (colors[0]?.name || 'أسود ملكي');
      setSelectedColor(defaultCol);
      const initialQty = checkoutProduct.quantity || 1;
      setQuantity(initialQty);

      if (checkoutProduct.selectedColors && checkoutProduct.selectedColors.length >= initialQty) {
        setMultiColors(checkoutProduct.selectedColors.slice(0, initialQty));
      } else {
        const initialList: string[] = [];
        for (let i = 0; i < initialQty; i++) {
          // Provide distinct color for piece 2 as an example (e.g., Black + White)
          const colForPiece = colors[i % colors.length]?.name || defaultCol;
          initialList.push(i === 0 ? defaultCol : colForPiece);
        }
        setMultiColors(initialList);
      }
      setUseSeparateColors(initialQty > 1);
    }
  }, [checkoutProduct]);

  // Sync multiColors length when quantity changes
  useEffect(() => {
    if (!checkoutProduct) return;
    const colors = getProductColors(checkoutProduct.product);
    setMultiColors((prev) => {
      const updated = [...prev];
      for (let i = updated.length; i < quantity; i++) {
        const colForPiece = colors[i % colors.length]?.name || selectedColor;
        updated.push(colForPiece);
      }
      return updated.slice(0, quantity);
    });
    if (quantity > 1) {
      setUseSeparateColors(true);
    }
  }, [quantity, selectedColor, checkoutProduct]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    type: 'percent' | 'fixed';
    value: number;
  } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Silent anti-bot & anti-duplicate tracking
  const [honeypot, setHoneypot] = useState('');
  const formOpenedAtRef = React.useRef<number>(Date.now());
  const hasInteractedRef = React.useRef<boolean>(false);

  useEffect(() => {
    if (checkoutProduct) {
      formOpenedAtRef.current = Date.now();
      hasInteractedRef.current = false;
      setHoneypot('');
      setSubmitError('');
      setNameError('');
      setPhoneError('');
      setAddressError('');
      setPromoCodeInput('');
      setAppliedPromo(null);
      setPromoError('');

      const qty = Math.max(1, checkoutProduct.quantity || 1);
      const calc = getBundlePriceForQuantity(checkoutProduct.product, qty);
      trackPixelInitiateCheckout({
        items: [
          {
            id: checkoutProduct.product.id,
            name: checkoutProduct.product.name,
            category: checkoutProduct.product.category,
            price: calc.totalPrice / qty,
            quantity: qty,
          },
        ],
        totalValue: calc.totalPrice,
      });
    }
  }, [checkoutProduct]);

  if (!checkoutProduct) return null;

  const product = checkoutProduct.product;
  const colorsList = getProductColors(product);
  const activeColorObj = colorsList.find((c) => c.name === selectedColor);
  const currentPreviewImage =
    (activeColorObj?.imageIndex !== undefined && product.images[activeColorObj.imageIndex]) ||
    product.images[0] ||
    '/assets/watches_and_accessories_hero.jpg';

  const tierOffers = calculateTierOffers(product, lang);
  const bundleCalculation = getBundlePriceForQuantity(product, quantity, lang);
  const subtotal = bundleCalculation.totalPrice;
  const savingsAmount = bundleCalculation.savingsMAD;
  const promoDiscountAmount = appliedPromo
    ? appliedPromo.type === 'fixed'
      ? Math.min(subtotal, Math.round(appliedPromo.value))
      : Math.min(subtotal, Math.round((subtotal * Math.min(90, appliedPromo.value)) / 100))
    : 0;
  const shippingFee = 0; // Free delivery
  const totalAmount = Math.max(0, subtotal - promoDiscountAmount + shippingFee);

  const handleApplyPromoCode = async () => {
    const code = promoCodeInput.trim().toUpperCase();
    setPromoError('');
    if (!code) {
      setPromoError(isFr ? 'Veuillez saisir un code promo.' : 'يرجى إدخال رمز التخفيض أولاً.');
      return;
    }

    setIsValidatingPromo(true);
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal, lang }),
      });
      const data = await res.json();
      if (res.ok && data?.success && data.promo) {
        setAppliedPromo({
          code: data.promo.code,
          type: data.promo.type,
          value: Number(data.promo.value) || 0,
        });
        setPromoCodeInput(data.promo.code);
        setPromoError('');
      } else {
        setAppliedPromo(null);
        setPromoError(
          data?.message ||
            (isFr ? 'Code promo invalide ou expiré.' : 'رمز التخفيض غير صحيح أو غير مفعل حالياً.')
        );
      }
    } catch {
      setAppliedPromo(null);
      setPromoError(
        isFr
          ? 'Impossible de vérifier le code pour le moment.'
          : 'تعذر التحقق من رمز التخفيض حالياً، يرجى المحاولة مجدداً.'
      );
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    hasInteractedRef.current = true;

    // Silent honeypot check
    if (honeypot.trim() !== '') {
      setSubmitError(
        isFr
          ? 'Impossible de valider la commande pour des raisons de sécurité.'
          : 'تعذر إتمام الطلب لأسباب أمنية.'
      );
      return;
    }

    const antiFakeEnabled = settings?.orderSecurity?.preventFakeOrders !== false;
    const antiDupEnabled = settings?.orderSecurity?.preventDuplicates !== false;

    // Validations
    let hasError = false;
    if (!customerName.trim() || customerName.trim().length < 3 || (antiFakeEnabled && isFakeCustomerName(customerName))) {
      setNameError(
        isFr
          ? 'Veuillez saisir votre nom complet (au moins 3 lettres, sans chiffres ni mots de test)'
          : 'يرجى إدخال اسمك الكامل والحقيقي (3 أحرف على الأقل، بدون أرقام أو كلمات تجريبية)'
      );
      hasError = true;
    } else {
      setNameError('');
    }

    const normPhone = normalizeMoroccanPhone(phone);
    if (!/^0[567]\d{8}$/.test(normPhone)) {
      setPhoneError(
        isFr
          ? 'Veuillez saisir un numéro marocain valide à 10 chiffres (ex : 06... ou 07...)'
          : 'يرجى إدخال رقم هاتف أو واتساب مغربي صحيح مكون من 10 أرقام (مثال: 06... أو 07...)'
      );
      hasError = true;
    } else if (antiFakeEnabled && isFakeMoroccanPhonePattern(normPhone)) {
      setPhoneError(
        isFr
          ? 'Ce numéro semble invalide ou fictif. Veuillez entrer un vrai numéro WhatsApp marocain.'
          : 'رقم الهاتف المدخل يبدو وهمياً أو مكرراً. يرجى إدخال رقم واتساب مغربي حقيقي لتأكيد الطلب.'
      );
      hasError = true;
    } else {
      setPhoneError('');
    }

    if (!address.trim() || address.trim().length < 5) {
      setAddressError(
        isFr
          ? 'Veuillez saisir votre adresse complète (quartier, rue, N° — au moins 5 caractères)'
          : 'يرجى إدخال عنوان التوصيل بالتفصيل (الحي، الشارع، أو نقطة دالة — 5 أحرف على الأقل)'
      );
      hasError = true;
    } else {
      setAddressError('');
    }

    if (hasError) return;

    // Client-side duplicate submission guard
    if (antiDupEnabled) {
      try {
        const raw = localStorage.getItem('noblewatch_recent_orders');
        const list: Array<{ phone: string; productId: string; orderNumber?: string; ts: number }> = raw
          ? JSON.parse(raw)
          : [];
        const cooldownMs = Math.max(1, Number(settings?.orderSecurity?.rapidCooldownMinutes) || 5) * 60 * 1000;
        const now = Date.now();
        const recentSame = list.find(
          (item) => item.phone === normPhone && item.productId === product.id && now - item.ts < cooldownMs
        );
        if (recentSame) {
          setSubmitError(
            isFr
              ? `Votre commande pour cet article vient d'être enregistrée${recentSame.orderNumber ? ` (${recentSame.orderNumber})` : ''}. Merci de patienter quelques minutes avant de commander à nouveau.`
              : `تم استلام طلبك لهذا المنتج للتو بنجاح${recentSame.orderNumber ? ` (${recentSame.orderNumber})` : ''}. لتفادي التكرار، يرجى الانتظار بضع دقائق قبل إعادة الطلب.`
          );
          return;
        }
      } catch {
        // ignore storage parse issue
      }
    }

    setIsSubmitting(true);

    const chosenCity = city === 'أخرى' && customCity.trim() ? customCity.trim() : city;

    const finalColors = quantity > 1
      ? (useSeparateColors ? multiColors.slice(0, quantity) : Array(quantity).fill(selectedColor))
      : [selectedColor];

    const allSame = finalColors.length > 1 && finalColors.every((c) => c === finalColors[0]);

    const formattedColorString = quantity > 1
      ? (allSame
          ? `${translateColorName(finalColors[0], lang)} (${quantity} ${isFr ? 'pièces' : 'قطع'})`
          : finalColors.map((c, i) => `${isFr ? 'Montre' : 'ساعة'} ${i + 1}: ${translateColorName(c, lang)}`).join(' + '))
      : translateColorName(selectedColor, lang);

    const orderPayload = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      city: chosenCity,
      address: address.trim(),
      notes: [
        notes.trim(),
        quantity > 1
          ? isFr
            ? `[Pack : ${bundleCalculation.bundleLabel} - Couleurs : ${formattedColorString}]`
            : `[عرض الباقة: ${bundleCalculation.bundleLabel} - الألوان: ${formattedColorString}]`
          : '',
      ].filter(Boolean).join(' | '),
      items: [
        {
          productId: product.id,
          name: product.name,
          color: formattedColorString,
          selectedColors: finalColors,
          bundleLabel: bundleCalculation.bundleLabel,
          price: bundleCalculation.unitPrice,
          quantity,
          image: product.images[0],
        },
      ],
      promoCode: appliedPromo?.code || undefined,
      security: {
        honeypot,
        formOpenedAt: formOpenedAtRef.current,
        interacted: hasInteractedRef.current,
        webdriver: Boolean((navigator as any).webdriver),
      },
    };

    const res = await placeOrder(orderPayload);
    setIsSubmitting(false);

    if (res.success) {
      try {
        const raw = localStorage.getItem('noblewatch_recent_orders');
        const list: Array<{ phone: string; productId: string; orderNumber?: string; ts: number }> = raw
          ? JSON.parse(raw)
          : [];
        const updated = [
          { phone: normPhone, productId: product.id, orderNumber: res.order?.orderNumber, ts: Date.now() },
          ...list.filter((item) => Date.now() - item.ts < 24 * 60 * 60 * 1000),
        ].slice(0, 20);
        localStorage.setItem('noblewatch_recent_orders', JSON.stringify(updated));
      } catch {
        // ignore storage error
      }
      setOrderSuccess(res.order);
    } else {
      setSubmitError(
        res.message ||
          (isFr
            ? "Impossible d'enregistrer la commande, veuillez vérifier vos informations."
            : 'تعذر تسجيل الطلب، يرجى التحقق من البيانات والمحاولة مجدداً.')
      );
    }
  };

  const handleClose = () => {
    setCheckoutProduct(null);
    setOrderSuccess(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div
        dir={isFr ? 'ltr' : 'rtl'}
        className={`relative w-full max-w-xl rounded-3xl bg-white border border-gray-200 shadow-2xl overflow-hidden my-auto max-h-[96vh] flex flex-col ${
          isFr ? 'text-left' : 'text-right'
        }`}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#fefbf4] via-white to-gray-50/90 px-4 py-3.5 sm:px-5 sm:py-4 border-b border-gray-200 flex items-start justify-between gap-3 flex-shrink-0">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl gold-gradient-bg flex items-center justify-center text-black shadow-sm ring-1 ring-[#c5a869]/30 flex-shrink-0 mt-0.5">
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                {isFr ? 'Confirmer votre commande' : 'تأكيد طلب الشراء'}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#fefaf0] text-[#8a5a00] border border-[#c5a869]/40 text-[10px] sm:text-[11px] font-bold whitespace-nowrap">
                  {isFr ? 'Paiement à la livraison' : 'الدفع عند الاستلام'}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] sm:text-[11px] font-bold whitespace-nowrap">
                  {isFr ? 'Livraison gratuite 0 DH' : 'توصيل مجاني 0 درهم'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-gray-500 mt-1 leading-snug">
                {isFr
                  ? 'Vérifiez votre montre avant de payer le livreur'
                  : 'مع حق فحص ومعاينة المنتج قبل الدفع'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label={isFr ? 'Fermer' : 'إغلاق'}
            className="p-2 rounded-xl bg-gray-100/80 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition flex-shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {orderSuccess ? (
          /* ================= ORDER SUCCESS VIEW ================= */
          <div className="p-6 sm:p-8 space-y-6 text-center overflow-y-auto">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-300 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold">
                {isFr ? `N° de commande : ${orderSuccess.orderNumber}` : `رقم طلبك: ${orderSuccess.orderNumber}`}
              </span>
              <h2 className="text-2xl font-black text-gray-900">
                {isFr
                  ? 'Félicitations ! Votre commande est enregistrée 🇲🇦'
                  : 'مبروك! تم تسجيل طلبك بنجاح 🇲🇦'}
              </h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                {isFr ? (
                  <>
                    Merci <strong className="text-gray-900">{orderSuccess.customerName}</strong> pour votre
                    confiance. Notre conseiller vous contactera par téléphone ou WhatsApp pour confirmer la
                    livraison vers <strong className="text-[#996515]">{orderSuccess.city}</strong>.
                  </>
                ) : (
                  <>
                    شكراً لك <strong className="text-gray-900">{orderSuccess.customerName}</strong> على ثقتك بـ
                    Noblewatch. سيتصل بك موظف خدمة العملاء هاتفياً أو عبر الواتساب لتأكيد شحن طلبيتك إلى
                    مدينة <strong className="text-[#996515]">{orderSuccess.city}</strong>.
                  </>
                )}
              </p>
            </div>

            {/* Order Brief Box */}
            <div
              className={`p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2.5 ${
                isFr ? 'text-left' : 'text-right'
              }`}
            >
              <div className="flex justify-between text-gray-700">
                <span>{isFr ? 'Article commandé :' : 'المنتج المطلوب:'}</span>
                <span className="text-gray-900 font-bold">{product.name}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>{isFr ? 'Pack & quantité :' : 'باقة الطلب والكمية:'}</span>
                <span className="text-[#996515] font-black">
                  {orderSuccess.items[0]?.bundleLabel ||
                    (quantity > 1
                      ? isFr
                        ? `Pack ${quantity} pièces`
                        : `باقة ${quantity} قطع`
                      : isFr
                      ? '1 pièce'
                      : 'قطعة واحدة')}
                </span>
              </div>
              <div className="flex justify-between items-start text-gray-700 pt-1 border-t border-gray-200/60">
                <span>{isFr ? 'Couleurs choisies :' : 'ألوان الساعات المطلوبة:'}</span>
                <div className={`font-bold ${isFr ? 'text-right' : 'text-left'}`}>
                  {orderSuccess.items[0]?.selectedColors && orderSuccess.items[0].selectedColors.length > 1 ? (
                    <div className="flex flex-col gap-1 items-end">
                      {orderSuccess.items[0].selectedColors.map((colName: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-[#c5a869]/15 border border-[#c5a869]/30 text-xs text-[#996515]"
                        >
                          ⌚ {isFr ? `Montre ${idx + 1} :` : `ساعة ${idx + 1}:`}{' '}
                          <strong className="text-gray-900">{translateColorName(colName, lang)}</strong>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-900 font-bold">
                      {translateColorName(orderSuccess.items[0]?.color || selectedColor, lang)}
                    </span>
                  )}
                </div>
              </div>
              {(orderSuccess.promoCode || Number(orderSuccess.discountAmount) > 0) && (
                <div className="flex justify-between text-emerald-800 pt-1 border-t border-gray-200/60 font-bold">
                  <span>
                    {isFr
                      ? `Code promo (${orderSuccess.promoCode}) :`
                      : `خصم الرمز الترويجي (${orderSuccess.promoCode}):`}
                  </span>
                  <span>- {formatPrice(Number(orderSuccess.discountAmount) || 0, lang)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-700 pt-1 border-t border-gray-200/60">
                <span>{isFr ? 'Total à la livraison :' : 'المبلغ الواجب دفعه عند الاستلام:'}</span>
                <span className="text-emerald-700 font-black text-sm">
                  {formatPrice(orderSuccess.totalAmount, lang)}{' '}
                  {isFr ? '(Livraison gratuite)' : '(توصيل مجاني)'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <a
                href={buildWhatsAppUrl(
                  settings?.whatsappNumber,
                  isFr
                    ? `Bonjour, je viens de passer la commande ${orderSuccess.orderNumber} pour ${product.name} (${orderSuccess.items[0]?.bundleLabel || ''} - Couleurs : ${orderSuccess.items[0]?.color || selectedColor}) d'un montant de ${formatPrice(orderSuccess.totalAmount, lang)}. Merci de confirmer l'envoi.`
                    : `السلام عليكم، قمت بتأكيد الطلب رقم ${orderSuccess.orderNumber} لساعة ${product.name} (${orderSuccess.items[0]?.bundleLabel || ''} - الألوان: ${orderSuccess.items[0]?.color || selectedColor}) بمبلغ ${formatPrice(orderSuccess.totalAmount)}. المرجو تأكيد الشحن.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
              >
                <MessageCircle className="w-5 h-5" />
                <span>
                  {isFr ? 'Confirmation rapide sur WhatsApp' : 'تأكيد أسرع ومباشر عبر واتساب'}
                </span>
              </a>

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
              >
                {isFr ? 'Continuer mes achats' : 'العودة للتسوق'}
              </button>
            </div>
          </div>
        ) : (
          /* ================= ORDER FORM VIEW ================= */
          <form
            onSubmit={handleSubmit}
            onPointerDown={() => {
              hasInteractedRef.current = true;
            }}
            onKeyDown={() => {
              hasInteractedRef.current = true;
            }}
            className="p-4 sm:p-8 space-y-5 overflow-y-auto max-h-[calc(96vh-85px)] relative"
          >
            {/* Invisible Anti-Bot Honeypot Trap */}
            <div
              aria-hidden="true"
              className="absolute -left-[9999px] w-0 h-0 overflow-hidden opacity-0 pointer-events-none"
            >
              <label htmlFor="nw_company_website">Website</label>
              <input
                id="nw_company_website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {/* Product summary card */}
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
              <img
                src={currentPreviewImage}
                alt={product.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/watches_and_accessories_hero.jpg';
                }}
                className="w-16 h-16 rounded-xl object-cover bg-white border border-gray-200 shadow-xs flex-shrink-0"
              />
              <div className={`flex-1 min-w-0 ${isFr ? 'text-left' : 'text-right'}`}>
                <h4 className="text-sm font-bold text-gray-900 truncate">{product.name}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                  <span className="text-gray-900 font-black">{formatPrice(product.price, lang)}</span>
                  {product.originalPrice > product.price && (
                    <span className="text-gray-400 line-through text-[11px]">
                      {formatPrice(product.originalPrice, lang)}
                    </span>
                  )}
                  {selectedColor && selectedColor !== 'افتراضي' && (
                    <span className="text-[10px] font-bold text-[#996515] bg-[#c5a869]/15 border border-[#c5a869]/30 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                      {isFr ? 'Couleur :' : 'اللون:'} {translateColorName(selectedColor, lang)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ================= TIERED BUNDLE PRICING (Buy 1, 2, 3) ================= */}
            <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-b from-[#fbf8ef] to-white border-2 border-[#c5a869]/40 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#c5a869]" />
                  <span>
                    {isFr
                      ? 'Offres packs économies (Achetez plus, économisez plus) :'
                      : 'عروض باقات التوفير (اشتري أكثر ووفر أكثر):'}
                  </span>
                </label>
                {savingsAmount > 0 && (
                  <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span>
                      {isFr ? 'Économisez' : 'وفرت'} {formatPrice(savingsAmount, lang)}
                    </span>
                    <span>🎉</span>
                  </span>
                )}
              </div>

              {/* 3 Tier Offer Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {tierOffers.map((tier) => {
                  const isSelected = quantity === tier.quantity;
                  return (
                    <button
                      key={tier.quantity}
                      type="button"
                      onClick={() => setQuantity(tier.quantity)}
                      className={`relative p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none ${
                        isFr ? 'text-left' : 'text-right'
                      } ${
                        isSelected
                          ? 'bg-white border-[#c5a869] shadow-md ring-2 ring-[#c5a869]/30 scale-[1.02]'
                          : 'bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white'
                      }`}
                    >
                      {/* Top Badge */}
                      {tier.badge && (
                        <div className={`absolute -top-2.5 ${isFr ? 'right-3' : 'left-3'}`}>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black shadow-xs bg-[#c5a869] text-black">
                            {localizeTierBadge(tier.badge, lang)}
                          </span>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-black ${
                              isSelected ? 'text-[#996515]' : 'text-gray-900'
                            }`}
                          >
                            {tier.label}
                          </span>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-[#c5a869] bg-[#c5a869] text-white'
                                : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 line-clamp-1">{tier.subLabel}</p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-gray-100">
                        <div className="flex items-baseline gap-1.5 justify-between">
                          <span className="text-sm font-black text-gray-900">
                            {formatPrice(tier.totalPrice, lang)}
                          </span>
                          {tier.quantity > 1 && (
                            <span className="text-[10px] text-gray-400 line-through">
                              {formatPrice(tierOffers[0].totalPrice * tier.quantity, lang)}
                            </span>
                          )}
                        </div>
                        {tier.quantity > 1 && (
                          <span className="block text-[10px] text-emerald-800 font-bold mt-0.5">
                            {isFr
                              ? `(${formatPrice(tier.unitPrice, lang)} / pièce)`
                              : `(${formatPrice(tier.unitPrice, lang)} للقطعة فقط)`}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ================= COLOR SELECTION SECTION ================= */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-gray-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <label className="text-sm font-black text-gray-900 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#c5a869] shadow-xs" />
                    <span>
                      {quantity > 1
                        ? isFr
                          ? `🎨 Couleurs du pack (${quantity} pièces) :`
                          : `🎨 حدد ألوان الساعات في باقتك (${quantity} قطع):`
                        : isFr
                        ? 'Choisissez la couleur :'
                        : 'اختر لون الساعة / الموديل:'}
                    </span>
                  </label>
                  {quantity > 1 && (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {isFr
                        ? 'Choisissez la couleur de chaque montre (ex : Noir pour la 1re et Blanc pour la 2e)'
                        : 'اختر لون كل ساعة في طلبيتك (مثال: الساعة الأولى أسود والثانية أبيض)'}
                    </p>
                  )}
                </div>

                {quantity > 1 && (
                  <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setUseSeparateColors(true)}
                      className={`px-3 py-1.5 rounded-lg transition font-bold cursor-pointer ${
                        useSeparateColors
                          ? 'bg-[#c5a869] text-black shadow-xs font-black'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {isFr ? '✨ Couleurs variées' : '✨ ألوان مختلفة'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseSeparateColors(false);
                        const firstCol = multiColors[0] || selectedColor;
                        setMultiColors(Array(quantity).fill(firstCol));
                        setSelectedColor(firstCol);
                      }}
                      className={`px-3 py-1.5 rounded-lg transition font-bold cursor-pointer ${
                        !useSeparateColors
                          ? 'bg-white text-gray-900 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {isFr ? 'Même couleur' : 'نفس اللون للجميع'}
                    </button>
                  </div>
                )}
              </div>

              {/* Single Color / Same Color for All Pieces */}
              {(!useSeparateColors || quantity === 1) && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {colorsList.map((c, i) => {
                      const isSelected = selectedColor === c.name;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setSelectedColor(c.name);
                            setMultiColors(Array(quantity).fill(c.name));
                          }}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all cursor-pointer select-none ${
                            isFr ? 'text-left' : 'text-right'
                          } ${
                            isSelected
                              ? 'bg-[#fefaf0] border-[#c5a869] shadow-md ring-2 ring-[#c5a869]/30 scale-[1.02]'
                              : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-black/20 flex-shrink-0 shadow-sm flex items-center justify-center relative"
                            style={{ backgroundColor: c.code }}
                          >
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                            )}
                          </span>
                          <span
                            className={`text-xs truncate ${
                              isSelected ? 'font-black text-gray-900' : 'font-semibold text-gray-700'
                            }`}
                          >
                            {translateColorName(c.name, lang)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {quantity > 1 && (
                    <div className="text-[11px] font-bold text-gray-600 bg-gray-50 p-2 rounded-lg text-center">
                      {isFr ? (
                        <>
                          Les {quantity} montres seront envoyées en couleur :{' '}
                          <strong className="text-gray-900">{translateColorName(selectedColor, lang)}</strong>
                        </>
                      ) : (
                        <>
                          سيتم إرسال جميع الساعات الـ ({quantity}) بلون:{' '}
                          <strong className="text-gray-900">{selectedColor}</strong>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Separate Colors for Each Watch in Bundle (1 by 1) */}
              {useSeparateColors && quantity > 1 && (
                <div className="space-y-3.5">
                  {Array.from({ length: quantity }).map((_, itemIdx) => {
                    const currentPieceColor = multiColors[itemIdx] || selectedColor;
                    const matchedColorObj = colorsList.find((c) => c.name === currentPieceColor);
                    return (
                      <div
                        key={itemIdx}
                        className="p-3.5 rounded-2xl bg-gradient-to-r from-gray-50 to-[#fdfbf6] border border-gray-200/90 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-gray-900 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full gold-gradient-bg text-black font-black text-[11px] flex items-center justify-center shadow-xs">
                              {itemIdx + 1}
                            </span>
                            <span>
                              {isFr ? `Montre N° ${itemIdx + 1} :` : `الساعة رقم (${itemIdx + 1}):`}
                            </span>
                          </span>
                          <span className="text-xs font-black text-[#996515] bg-[#c5a869]/15 border border-[#c5a869]/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                            <span
                              className="w-3 h-3 rounded-full border border-black/20 inline-block"
                              style={{ backgroundColor: matchedColorObj?.code || '#111' }}
                            />
                            <span>
                              {isFr ? 'Couleur :' : 'اللون المختار:'}{' '}
                              {translateColorName(currentPieceColor, lang)}
                            </span>
                          </span>
                        </div>

                        {/* Color Buttons for this watch */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {colorsList.map((c, cIdx) => {
                            const isChosen = currentPieceColor === c.name;
                            return (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={() => {
                                  const updated = [...multiColors];
                                  updated[itemIdx] = c.name;
                                  setMultiColors(updated);
                                }}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer select-none ${
                                  isFr ? 'text-left' : 'text-right'
                                } ${
                                  isChosen
                                    ? 'bg-white border-[#c5a869] shadow-sm ring-2 ring-[#c5a869]/40 font-black text-gray-900 scale-[1.02]'
                                    : 'bg-white/80 border-gray-200 hover:border-gray-300 hover:bg-white text-gray-700'
                                }`}
                              >
                                <span
                                  className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0 flex items-center justify-center shadow-xs"
                                  style={{ backgroundColor: c.code }}
                                >
                                  {isChosen && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-2xs" />
                                  )}
                                </span>
                                <span className="text-xs truncate flex-1">
                                  {translateColorName(c.name, lang)}
                                </span>
                                {isChosen && <Check className="w-3.5 h-3.5 text-[#c5a869] stroke-[3]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Live Visual Summary Chip */}
                  <div className="p-3 rounded-xl bg-[#fdfaf3] border border-[#c5a869]/40 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className="font-bold text-gray-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#c5a869]" />
                      <span>{isFr ? 'Votre pack sélectionné :' : 'تشكيلة باقتك المختارة:'}</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {multiColors.slice(0, quantity).map((cName, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#c5a869]/50 text-gray-900 font-bold text-xs shadow-2xs flex items-center gap-1"
                        >
                          <span className="text-[#996515] font-black">
                            {isFr ? `Montre ${idx + 1} :` : `ساعة ${idx + 1}:`}
                          </span>
                          <span>{translateColorName(cName, lang)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Contact Fields */}
            <div className="space-y-4 pt-2 border-t border-gray-200">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#b8860b]" />
                  <span>{isFr ? 'Nom complet *' : 'الاسم الكامل *'}</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  placeholder={isFr ? 'Ex : Youssef Alami' : 'مثال: يوسف العلمي'}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#c5a869]"
                />
                {nameError && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{nameError}</span>
                  </p>
                )}
              </div>

              {/* Phone / WhatsApp */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#b8860b]" />
                    <span>{isFr ? 'Téléphone ou WhatsApp *' : 'رقم الهاتف أو الواتساب *'}</span>
                  </label>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                    <MessageCircle className="w-3 h-3 text-emerald-600" />
                    <span>{isFr ? 'Actif sur WhatsApp' : 'شغال في WhatsApp'}</span>
                  </span>
                </div>
                <div
                  className="flex items-center rounded-xl border border-gray-300 bg-gray-50 overflow-hidden focus-within:border-[#c5a869] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#c5a869]/20 transition shadow-xs"
                  dir="ltr"
                >
                  <div className="flex items-center gap-1.5 px-3 py-3 bg-gray-100 border-r border-gray-200 text-xs font-bold text-gray-700 select-none flex-shrink-0">
                    <span className="text-sm">🇲🇦</span>
                    <span className="font-mono text-gray-800">+212</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError('');
                    }}
                    placeholder={isFr ? '0612345678 ou 0712345678 (WhatsApp)' : '0612345678 أو 0712345678 (رقم الواتساب)'}
                    className="w-full bg-transparent px-3.5 py-3 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none text-left tracking-wide"
                    dir="ltr"
                  />
                </div>
                {phoneError ? (
                  <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{phoneError}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50/70 border border-emerald-200/60 rounded-lg px-2.5 py-1.5 mt-1.5 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>
                      {isFr
                        ? 'Indiquez un numéro joignable sur WhatsApp pour confirmer votre commande et suivre la livraison.'
                        : 'يرجى إدخال رقم هاتف متصل بالواتساب لتأكيد طلبيتك وإرسال تفاصيل الشحن فوراً.'}
                    </span>
                  </p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#b8860b]" />
                  <span>{isFr ? 'Ville *' : 'المدينة *'}</span>
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-3 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-[#c5a869]"
                >
                  {MOROCCAN_CITIES.map((c, i) => (
                    <option key={i} value={getCityValue(c, lang)}>
                      {formatCityLabel(c, lang)}
                    </option>
                  ))}
                </select>

                {city === 'أخرى' && (
                  <input
                    type="text"
                    required
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder={isFr ? 'Saisissez le nom de votre ville...' : 'اكتب اسم مدينتك أو قريتك هنا...'}
                    className="w-full mt-2 bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#c5a869]"
                  />
                )}
              </div>

              {/* Address (Required) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#b8860b]" />
                  <span>
                    {isFr
                      ? "Adresse détaillée (Quartier, Rue, N° d'immeuble/maison) *"
                      : 'العنوان بالتفصيل (الحي، الشارع، رقم المنزل/العمارة) *'}
                  </span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (addressError) setAddressError('');
                  }}
                  placeholder={
                    isFr
                      ? 'Ex : Quartier Maarif, Boulevard Al Massira Al Khadra, Résidence Andalus N° 12'
                      : 'مثال: حي المعاريف، شارع المسيرة الخضراء، إقامة الأندلس رقم 12'
                  }
                  className={`w-full bg-gray-50 border rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#c5a869] ${
                    addressError ? 'border-rose-400 bg-rose-50/40' : 'border-gray-300'
                  }`}
                />
                {addressError && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{addressError}</span>
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  {isFr ? 'Note pour le livreur (optionnel)' : 'ملاحظة إضافية للموزع (اختياري)'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    isFr
                      ? "Ex : Merci de m'appeler 30 min avant la livraison"
                      : 'مثال: يرجى الاتصال بي قبل الوصول بنصف ساعة'
                  }
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
                />
              </div>
              {/* Discount / Promo Code Section */}
              <div className="p-3.5 rounded-2xl bg-[#fefaf0] border border-[#c5a869]/50 space-y-2">
                <label className="block text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#996515]" />
                  <span>
                    {isFr
                      ? 'Vous avez un code promo ? (Optionnel)'
                      : 'هل لديك رمز تخفيض؟ (اختياري)'}
                  </span>
                </label>

                {appliedPromo ? (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        {isFr
                          ? `Code ${appliedPromo.code} appliqué (-${
                              appliedPromo.type === 'percent'
                                ? `${appliedPromo.value}%`
                                : formatPrice(appliedPromo.value, lang)
                            })`
                          : `تم تفعيل رمز التخفيض (${appliedPromo.code}) — خصم ${
                              appliedPromo.type === 'percent'
                                ? `${appliedPromo.value}%`
                                : formatPrice(appliedPromo.value, lang)
                            }`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedPromo(null);
                        setPromoCodeInput('');
                        setPromoError('');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-rose-700 hover:bg-rose-50 font-bold text-[11px] cursor-pointer"
                    >
                      {isFr ? 'Retirer' : 'إزالة'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => {
                        setPromoCodeInput(e.target.value.toUpperCase());
                        if (promoError) setPromoError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyPromoCode();
                        }
                      }}
                      placeholder={isFr ? 'Ex : NOBLE10' : 'مثال: NOBLE10'}
                      dir="ltr"
                      className="flex-1 bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold uppercase text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#c5a869]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromoCode}
                      disabled={isValidatingPromo}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#f3d999] font-extrabold text-xs transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer disabled:opacity-60"
                    >
                      {isValidatingPromo && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isFr ? 'Appliquer' : 'تطبيق'}</span>
                    </button>
                  </div>
                )}

                {promoError && (
                  <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{promoError}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Price Breakdown Calculation */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-700">
                <span className="font-medium">
                  {quantity > 1
                    ? isFr
                      ? `Prix de l'offre (${bundleCalculation.bundleLabel}) :`
                      : `سعر العرض (${bundleCalculation.bundleLabel}):`
                    : isFr
                    ? 'Prix du produit (1 pièce) :'
                    : 'سعر المنتج (قطعة واحدة):'}
                </span>
                <span className="font-bold text-gray-900">{formatPrice(subtotal, lang)}</span>
              </div>

              {savingsAmount > 0 && (
                <div className="flex justify-between text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{isFr ? 'Économie totale sur le pack :' : 'إجمالي التوفير في باقة العرض:'}</span>
                  </span>
                  <span>- {formatPrice(savingsAmount, lang)} 🎉</span>
                </div>
              )}

              {promoDiscountAmount > 0 && appliedPromo && (
                <div className="flex justify-between text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-700" />
                    <span>
                      {isFr
                        ? `Remise code promo (${appliedPromo.code}) :`
                        : `تخفيض الكود (${appliedPromo.code}):`}
                    </span>
                  </span>
                  <span>- {formatPrice(promoDiscountAmount, lang)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-700">
                <span>
                  {isFr ? 'Frais de livraison partout au Maroc :' : 'مصاريف التوصيل لجميع ربوع المغرب:'}
                </span>
                <span className="text-emerald-700 font-bold">
                  {isFr ? 'Gratuit 0 DH 🇲🇦' : 'مجاني 0 درهم 🇲🇦'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                <span>{isFr ? 'Transporteurs partenaires :' : 'شركاء التوصيل المعتمدين:'}</span>
                <span className="font-medium text-gray-700">Noblewatch Express • Ozon • Ameex.ma</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>{isFr ? 'Total à payer à la livraison :' : 'المبلغ الإجمالي عند الاستلام:'}</span>
                <span className="text-lg font-black text-gray-900 whitespace-nowrap" dir="ltr">
                  {formatPrice(totalAmount, lang)}
                </span>
              </div>
            </div>

            {/* Server / Security Rejection Banner */}
            {submitError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{submitError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="space-y-2.5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-5 py-3.5 rounded-2xl gold-gradient-bg text-black shadow-lg shadow-[#c5a869]/30 ring-1 ring-inset ring-white/40 hover:brightness-105 active:scale-[0.98] transition disabled:opacity-60 flex flex-col items-center justify-center gap-0.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2 text-sm sm:text-base font-black py-1">
                    <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                    <span>
                      {isFr
                        ? 'Validation et enregistrement en cours...'
                        : 'جاري التحقق وتسجيل الطلب...'}
                    </span>
                  </span>
                ) : (
                  <>
                    <span className="flex items-center justify-center gap-2 text-base sm:text-lg font-black leading-snug">
                      <ShieldCheck className="w-5 h-5 text-black flex-shrink-0" />
                      <span>{isFr ? 'Confirmer la commande' : 'تأكيد الطلب الآن'}</span>
                    </span>
                    <span className="text-[11px] sm:text-xs font-extrabold text-black/80 tracking-tight">
                      {isFr
                        ? 'Paiement à la livraison après vérification'
                        : 'الدفع عند الاستلام بعد المعاينة والفحص'}
                    </span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-gray-500 flex items-center justify-center gap-1.5 leading-relaxed px-2">
                <Lock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>
                  {isFr
                    ? 'Aucune carte bancaire requise • Paiement 100% en espèces après réception.'
                    : 'لا نطلب أي معلومات بنكية • الدفع نقداً 100% فقط عند استلام الطرد وفحصه.'}
                </span>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
