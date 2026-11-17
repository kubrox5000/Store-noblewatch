import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  Download,
  Printer,
  Copy,
  Check,
  X,
  Tag,
  Sparkles,
  ShieldCheck,
  Truck,
  Gift,
  Globe,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Loader2,
  Palette,
} from 'lucide-react';
import type { PromoCode, StoreSettings } from '../types';
import { useStore } from '../context/StoreContext';
import { sanitizePhoneText, normalizeMoroccanCityName } from '../utils/constants';

interface PromoCodeVoucherModalProps {
  promo: PromoCode;
  settings: StoreSettings | null;
  onClose: () => void;
}

type VoucherTheme = 'dark' | 'light';
type VoucherLang = 'ar' | 'fr';

const loadImage = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const drawWrappedLines = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
) => {
  const words = text.split(' ');
  let line = '';
  let y = startY;
  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = words[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
  }
};

export const PromoCodeVoucherModal: React.FC<PromoCodeVoucherModalProps> = ({
  promo,
  settings,
  onClose,
}) => {
  const { showToast } = useStore();
  const [theme, setTheme] = useState<VoucherTheme>('dark');
  const [voucherLang, setVoucherLang] = useState<VoucherLang>('ar');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const storeName = settings?.storeName || 'Noblewatch';
  const storeCity = normalizeMoroccanCityName(settings?.city || 'الدار البيضاء') || 'الدار البيضاء';
  const storeEmail = settings?.contactEmail || 'contact@noblewatch.ma';
  const storePhone = sanitizePhoneText(settings?.whatsappNumber || settings?.contactPhone) || '+212612345678';
  const storeUrl = useMemo(() => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return 'https://noblewatch.ma';
  }, []);

  const isFr = voucherLang === 'fr';
  const discountDisplay =
    promo.type === 'percent' ? `${promo.value}%` : `${promo.value} MAD`;
  const minOrder = Number(promo.minOrderAmount) || 0;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(storeUrl, {
      width: 260,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR generation failed:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [storeUrl]);

  useEffect(() => {
    const prevTitle = document.title;
    document.body.classList.add('printing-delivery-slip');
    document.title = `promo-${promo.code}-${storeName}`;
    return () => {
      document.title = prevTitle;
      document.body.classList.remove('printing-delivery-slip');
    };
  }, [promo.code, storeName]);

  const promoShareMessage = useMemo(() => {
    if (isFr) {
      return (
        `⭐ *Offre Exclusive ${storeName}* ✨\n\n` +
        `Profitez d'une réduction immédiate de *${discountDisplay}* sur votre commande !\n` +
        `✦ *Code Promo :* *${promo.code}*\n` +
        (minOrder > 0
          ? `✅ *Condition :* Valable dès ${minOrder} MAD d'achat.\n\n`
          : `✅ *Condition :* Valable sur toute la boutique sans minimum d'achat.\n\n`) +
        `✍ *Comment l'utiliser :*\n` +
        `1. Choisissez votre montre sur ${storeUrl}\n` +
        `2. Dans la fenêtre de commande, saisissez *${promo.code}* et cliquez sur Appliquer\n` +
        `3. Profitez de la réduction + Livraison gratuite 0 DH + Cadeau offert + Garantie 1 an ⌚`
      );
    }
    return (
      `⭐ *قسيمة تخفيض حصرية من متجر ${storeName}* ✨\n\n` +
      `استفد الآن من خصم فوري بقيمة *${discountDisplay}* على طلبيتك!\n` +
      `✦ *رمز التخفيض:* *${promo.code}*\n` +
      (minOrder > 0
        ? `✅ *الشرط:* صالح للطلبيات ابتداءً من ${minOrder} درهم.\n\n`
        : `✅ *الشرط:* صالح على جميع منتجات المتجر بدون حد أدنى للطلب.\n\n`) +
      `✍ *كيفية الاستعمال:*\n` +
      `1. اختر ساعتك المفضلة من الموقع: ${storeUrl}\n` +
      `2. في صفحة تأكيد الطلب، أدخل الرمز *${promo.code}* في خانة «رمز التخفيض» واضغط «تطبيق»\n` +
      `3. سيُخصم المبلغ فوراً مع توصيل مجاني 0 درهم + هدية مجانية + شهادة ضمان لمدة سنة ⌚`
    );
  }, [discountDisplay, isFr, minOrder, promo.code, storeName, storeUrl]);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(promoShareMessage);
      setCopiedMsg(true);
      showToast('تم نسخ رسالة العرض مع طريقة الاستعمال جاهزة للإرسال للزبناء', 'success');
      setTimeout(() => setCopiedMsg(false), 2500);
    } catch {
      showToast('تعذر النسخ التلقائي', 'error');
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopiedCode(true);
      showToast(`تم نسخ رمز التخفيض ${promo.code}`, 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      showToast('تعذر نسخ الرمز', 'error');
    }
  };

  const handleDownloadPng = async () => {
    setIsDownloadingPng(true);
    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const W = 1200;
      const H = 1560;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }

      const isDark = theme === 'dark';

      // 1. Background
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      if (isDark) {
        bgGrad.addColorStop(0, '#090b10');
        bgGrad.addColorStop(0.5, '#121622');
        bgGrad.addColorStop(1, '#080a0f');
      } else {
        bgGrad.addColorStop(0, '#fffdf7');
        bgGrad.addColorStop(0.5, '#ffffff');
        bgGrad.addColorStop(1, '#fdf7e7');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Ambient gold glow
      const glow = ctx.createRadialGradient(W / 2, 420, 40, W / 2, 420, 560);
      glow.addColorStop(0, isDark ? 'rgba(197, 168, 105, 0.18)' : 'rgba(197, 168, 105, 0.22)');
      glow.addColorStop(1, 'rgba(197, 168, 105, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // 2. Luxury Double Gold Frame
      const goldGrad = ctx.createLinearGradient(0, 0, W, H);
      goldGrad.addColorStop(0, '#f7e3a1');
      goldGrad.addColorStop(0.5, '#c5a869');
      goldGrad.addColorStop(1, '#8f6b24');

      ctx.strokeStyle = goldGrad;
      ctx.lineWidth = 6;
      drawRoundedRect(ctx, 32, 32, W - 64, H - 64, 34);
      ctx.stroke();

      ctx.strokeStyle = isDark ? 'rgba(197,168,105,0.45)' : 'rgba(157,126,53,0.45)';
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, 48, 48, W - 96, H - 96, 26);
      ctx.stroke();

      // Corner ornaments
      ctx.strokeStyle = '#c5a869';
      ctx.lineWidth = 4;
      const cLen = 36;
      const cPad = 66;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(cPad, cPad + cLen);
      ctx.lineTo(cPad, cPad);
      ctx.lineTo(cPad + cLen, cPad);
      ctx.stroke();
      // Top-right
      ctx.beginPath();
      ctx.moveTo(W - cPad - cLen, cPad);
      ctx.lineTo(W - cPad, cPad);
      ctx.lineTo(W - cPad, cPad + cLen);
      ctx.stroke();
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(cPad, H - cPad - cLen);
      ctx.lineTo(cPad, H - cPad);
      ctx.lineTo(cPad + cLen, H - cPad);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(W - cPad - cLen, H - cPad);
      ctx.lineTo(W - cPad, H - cPad);
      ctx.lineTo(W - cPad, H - cPad - cLen);
      ctx.stroke();

      // 3. Header: Logo + Store Name + Tagline
      const [logoImg, qrImg] = await Promise.all([
        loadImage('/favicon.svg'),
        qrDataUrl ? loadImage(qrDataUrl) : Promise.resolve(null),
      ]);

      // Subtle watermark in center
      if (logoImg) {
        ctx.save();
        ctx.globalAlpha = isDark ? 0.045 : 0.04;
        ctx.drawImage(logoImg, W / 2 - 220, 320, 440, 440);
        ctx.restore();
      }

      // Draw circular logo at top center
      const logoSize = 112;
      const logoX = W / 2 - logoSize / 2;
      const logoY = 82;
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, logoY + logoSize / 2, logoSize / 2 + 4, 0, Math.PI * 2);
      ctx.fillStyle = goldGrad;
      ctx.fill();
      if (logoImg) {
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      }
      ctx.restore();

      ctx.direction = 'ltr';
      ctx.textAlign = 'center';
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = '900 46px "Playfair Display", Georgia, serif';
      ctx.fillText(storeName, W / 2, 242);

      ctx.fillStyle = isDark ? '#dfbe74' : '#8a5a00';
      ctx.font = '700 18px "Cairo", sans-serif';
      ctx.fillText('GENEVE • MAROC  |  LUXURY WATCHES & ACCESSORIES', W / 2, 274);

      // VIP Badge Pill
      const badgeW = 430;
      const badgeH = 44;
      drawRoundedRect(ctx, W / 2 - badgeW / 2, 304, badgeW, badgeH, 22);
      ctx.fillStyle = goldGrad;
      ctx.fill();

      ctx.direction = isFr ? 'ltr' : 'rtl';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#090b10';
      ctx.font = '900 20px "Cairo", sans-serif';
      ctx.fillText(
        isFr ? 'BON DE RÉDUCTION EXCLUSIF VIP' : 'قسيمة تخفيض حصرية لزبناء المتجر الكرام',
        W / 2,
        333
      );

      // 4. Main Promo Card Hero Box
      const boxX = 96;
      const boxY = 382;
      const boxW = W - 192;
      const boxH = 380;

      drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 28);
      ctx.fillStyle = isDark ? 'rgba(22, 26, 38, 0.94)' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#c5a869';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Discount headline
      ctx.direction = isFr ? 'ltr' : 'rtl';
      ctx.textAlign = 'center';
      ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
      ctx.font = '700 26px "Cairo", sans-serif';
      ctx.fillText(
        isFr ? 'PROFITEZ D’UNE RÉDUCTION IMMÉDIATE DE' : 'احصل على خصم فوري بقيمة',
        W / 2,
        boxY + 58
      );

      // Huge discount value
      ctx.direction = 'ltr';
      ctx.fillStyle = isDark ? '#f7e19c' : '#8a5a00';
      ctx.font = '900 94px "Cairo", sans-serif';
      ctx.fillText(
        isFr ? `-${discountDisplay}` : `خصم ${discountDisplay}`,
        W / 2,
        boxY + 158
      );

      // Dashed Promo Code Ticket Pill
      const codeW = 540;
      const codeH = 104;
      const codeX = W / 2 - codeW / 2;
      const codeY = boxY + 188;
      ctx.save();
      drawRoundedRect(ctx, codeX, codeY, codeW, codeH, 20);
      ctx.fillStyle = isDark ? '#0b0e15' : '#fefaf0';
      ctx.fill();
      ctx.setLineDash([10, 8]);
      ctx.strokeStyle = '#c5a869';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      ctx.direction = isFr ? 'ltr' : 'rtl';
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '700 16px "Cairo", sans-serif';
      ctx.fillText(isFr ? 'VOTRE CODE PROMO :' : 'رمز التخفيض الخاص بك:', W / 2, codeY + 30);

      ctx.direction = 'ltr';
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = '900 48px monospace';
      ctx.fillText(promo.code, W / 2, codeY + 84);

      // Condition line
      ctx.direction = isFr ? 'ltr' : 'rtl';
      ctx.fillStyle = isDark ? '#6ee7b7' : '#047857';
      ctx.font = '700 20px "Cairo", sans-serif';
      ctx.fillText(
        minOrder > 0
          ? isFr
            ? `✓ Valable pour toute commande à partir de ${minOrder} MAD`
            : `✓ صالح على جميع المنتجات للطلبيات ابتداءً من ${minOrder} درهم`
          : isFr
          ? '✓ Valable sur toute la boutique sans minimum d’achat'
          : '✓ صالح على جميع ساعات وإكسسوارات المتجر بدون حد أدنى للطلب',
        W / 2,
        boxY + 344
      );

      // Perforated ticket divider
      ctx.save();
      ctx.setLineDash([12, 10]);
      ctx.strokeStyle = isDark ? 'rgba(197,168,105,0.45)' : 'rgba(157,126,53,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(86, 800);
      ctx.lineTo(W - 86, 800);
      ctx.stroke();
      ctx.restore();

      // Side notches
      ctx.fillStyle = isDark ? '#090b10' : '#fffdf7';
      ctx.beginPath();
      ctx.arc(32, 800, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(W - 32, 800, 22, 0, Math.PI * 2);
      ctx.fill();

      // 5. How to Use + QR Section
      const stepsTitleY = 852;
      ctx.direction = isFr ? 'ltr' : 'rtl';
      ctx.textAlign = isFr ? 'left' : 'right';
      ctx.fillStyle = isDark ? '#f3d999' : '#8a5a00';
      ctx.font = '900 28px "Cairo", sans-serif';
      ctx.fillText(
        isFr ? 'Comment utiliser votre code promo :' : 'كيفية استعمال رمز التخفيض :',
        isFr ? 96 : W - 96,
        stepsTitleY
      );

      const steps = isFr
        ? [
            'Choisissez votre montre ou accessoire sur le site et cliquez sur « Commander ».',
            `Dans la page de confirmation, entrez le code (${promo.code}) puis cliquez sur « Appliquer ».`,
            'La remise s’applique immédiatement + Livraison gratuite, Cadeau offert & Garantie 1 an.',
          ]
        : [
            'اختر منتجك المفضل من متجر Noblewatch واضغط على زر «اطلب الآن».',
            `في صفحة تأكيد الطلب، أدخل الرمز (${promo.code}) في خانة رمز التخفيض واضغط «تطبيق».`,
            'يتم خصم القيمة فوراً من السعر الإجمالي مع توصيل مجاني، هدية مجانية وضمان لمدة سنة.',
          ];

      // QR card on opposite side
      const qrBoxSize = 210;
      const qrX = isFr ? W - 96 - qrBoxSize : 96;
      const qrY = 880;
      drawRoundedRect(ctx, qrX, qrY, qrBoxSize, qrBoxSize + 52, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#c5a869';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      if (qrImg) {
        ctx.drawImage(qrImg, qrX + 18, qrY + 14, qrBoxSize - 36, qrBoxSize - 36);
      }
      ctx.direction = isFr ? 'ltr' : 'rtl';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 16px "Cairo", sans-serif';
      ctx.fillText(
        isFr ? 'Scannez pour commander' : 'امسح الكود لزيارة المتجر',
        qrX + qrBoxSize / 2,
        qrY + qrBoxSize + 24
      );

      // Draw 3 step cards
      const stepX = isFr ? 96 : 334;
      const stepW = W - 96 - 334;
      const stepH = 82;
      steps.forEach((stepText, idx) => {
        const sy = 880 + idx * 96;
        drawRoundedRect(ctx, stepX, sy, stepW, stepH, 16);
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = isDark ? 'rgba(197,168,105,0.28)' : 'rgba(197,168,105,0.45)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Step number circle
        const numCx = isFr ? stepX + 34 : stepX + stepW - 34;
        const numCy = sy + stepH / 2;
        ctx.beginPath();
        ctx.arc(numCx, numCy, 19, 0, Math.PI * 2);
        ctx.fillStyle = '#c5a869';
        ctx.fill();

        ctx.direction = 'ltr';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#090b10';
        ctx.font = '900 20px "Cairo", sans-serif';
        ctx.fillText(String(idx + 1), numCx, numCy + 7);

        ctx.direction = isFr ? 'ltr' : 'rtl';
        ctx.textAlign = isFr ? 'left' : 'right';
        ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b';
        ctx.font = '700 18px "Cairo", sans-serif';
        const textAnchorX = isFr ? stepX + 68 : stepX + stepW - 68;
        drawWrappedLines(ctx, stepText, textAnchorX, sy + 34, stepW - 88, 25);
      });

      // 6. Store Benefits Strip
      const benY = 1196;
      drawRoundedRect(ctx, 96, benY, W - 192, 64, 16);
      ctx.fillStyle = isDark ? 'rgba(197,168,105,0.12)' : '#fefaf0';
      ctx.fill();
      ctx.strokeStyle = 'rgba(197,168,105,0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.direction = isFr ? 'ltr' : 'rtl';
      ctx.textAlign = 'center';
      ctx.fillStyle = isDark ? '#f3d999' : '#8a5a00';
      ctx.font = '800 19px "Cairo", sans-serif';
      ctx.fillText(
        isFr
          ? '✓ Livraison Gratuite   •   ✓ Paiement à la livraison   •   ✓ Garantie 1 An   •   ✓ Cadeau Offert'
          : '✓ توصيل مجاني 0 درهم   •   ✓ الدفع عند الاستلام   •   ✓ ضمان لمدة سنة   •   ✓ هدية مجانية مع الطلب',
        W / 2,
        benY + 39
      );

      // 7. Store Information Footer Box
      const footY = 1288;
      const footH = 186;
      drawRoundedRect(ctx, 96, footY, W - 192, footH, 22);
      ctx.fillStyle = isDark ? '#0c0f17' : '#11131a';
      ctx.fill();
      ctx.strokeStyle = '#c5a869';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.direction = isFr ? 'ltr' : 'rtl';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f3d999';
      ctx.font = '900 22px "Cairo", sans-serif';
      ctx.fillText(
        isFr
          ? `${storeName} — Informations officielles de la boutique`
          : `${storeName} — المعلومات الرسمية للمتجر وخدمة العملاء`,
        W / 2,
        footY + 42
      );

      ctx.direction = 'ltr';
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '700 19px "Cairo", sans-serif';
      ctx.fillText(`🌐 ${storeUrl}    |    📱 ${storePhone}`, W / 2, footY + 92);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '600 18px "Cairo", sans-serif';
      ctx.fillText(`✉️ ${storeEmail}    |    📍 ${storeCity} - Maroc`, W / 2, footY + 132);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 14px "Cairo", sans-serif';
      ctx.fillText(
        isFr
          ? 'Présentez ou saisissez ce code lors de votre commande en ligne.'
          : 'يمكنكم إرسال هذه البطاقة لأصدقائكم أو استعمال الرمز مباشرة في الموقع.',
        W / 2,
        footY + 166
      );

      const pngUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Noblewatch-Promo-${promo.code}.png`;
      link.href = pngUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`تم تحميل بطاقة رمز التخفيض (${promo.code}) كصورة جاهزة للإرسال للزبناء`, 'success');
    } catch (err) {
      console.error('PNG generation failed:', err);
      showToast('تعذر إنشاء الصورة، يمكنك استعمال زر الطباعة / PDF', 'error');
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const isDark = theme === 'dark';

  const modalContent = (
    <div
      id="warranty-print-portal"
      dir={isFr ? 'ltr' : 'rtl'}
      className="fixed inset-0 z-[70] flex items-start justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-sm overflow-y-auto print:static print:block print:bg-white print:p-0 print:overflow-visible"
    >
      <div className="noblewatch-print-slip relative w-full max-w-3xl bg-[#11141d] text-white rounded-3xl border border-[#c5a869]/40 shadow-2xl my-3 sm:my-6 p-3 sm:p-6 print:p-0 print:m-0 print:shadow-none print:rounded-none print:border-none print:bg-white print:text-slate-900">
        {/* Top Screen-Only Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10 print:hidden" dir="rtl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#c5a869]/15 border border-[#c5a869]/50 text-[#f3d999] flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                بطاقة رمز التخفيض الاحترافية — <span className="font-mono text-[#f3d999]">{promo.code}</span>
              </h3>
              <p className="text-[11px] text-gray-400">
                جاهزة للتحميل كصورة عالية الجودة أو ملف PDF وإرسالها مباشرة للزبناء عبر واتساب
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 flex items-center gap-1.5 cursor-pointer transition"
              title="تغيير تصميم البطاقة"
            >
              <Palette className="w-3.5 h-3.5 text-[#c5a869]" />
              <span>{theme === 'dark' ? 'نمط كريمي' : 'نمط ملكي داكن'}</span>
            </button>

            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setVoucherLang(voucherLang === 'ar' ? 'fr' : 'ar')}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 flex items-center gap-1.5 cursor-pointer transition"
            >
              <Globe className="w-3.5 h-3.5 text-[#c5a869]" />
              <span>{voucherLang === 'ar' ? 'FR' : 'العربية'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= LUXURY PROMO VOUCHER CARD ================= */}
        <div
          className={`relative rounded-2xl border-[3px] border-[#b89242] p-1 shadow-2xl transition-colors ${
            isDark
              ? 'bg-gradient-to-br from-[#090b10] via-[#131724] to-[#080a0f] text-white'
              : 'bg-gradient-to-br from-[#fffdf7] via-[#ffffff] to-[#fdf6e4] text-slate-900'
          } print:rounded-xl print:shadow-none`}
        >
          {/* Decorative Gold Corners */}
          <span className="pointer-events-none absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#c5a869]" />
          <span className="pointer-events-none absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#c5a869]" />
          <span className="pointer-events-none absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#c5a869]" />
          <span className="pointer-events-none absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#c5a869]" />

          <div
            className={`relative rounded-xl border p-5 sm:p-7 print:p-5 space-y-5 print:space-y-3 overflow-hidden print:overflow-visible ${
              isDark ? 'border-[#c5a869]/40' : 'border-[#c5a869]/60'
            }`}
          >
            {/* Subtle Background Logo Watermark */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]">
              <img src="/favicon.svg" alt="" className="w-72 h-72 object-contain" />
            </div>

            {/* 1. Store Header (Logo + Name + VIP Badge) */}
            <div className="relative flex flex-col sm:flex-row print:flex-row items-center justify-between gap-4 border-b border-[#c5a869]/30 pb-4 print:pb-3">
              <div className="flex items-center gap-3.5" dir="ltr">
                <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-[#f5dc93] via-[#c5a869] to-[#8a651a] shadow-lg flex-shrink-0">
                  <img
                    src="/favicon.svg"
                    alt={`${storeName} Logo`}
                    className="w-full h-full rounded-full object-contain bg-[#08090d]"
                  />
                </div>
                <div className="text-left">
                  <div
                    className={`text-3xl font-serif font-black leading-none flex items-baseline ${
                      isDark ? 'text-white' : 'text-slate-950'
                    }`}
                  >
                    <span className="text-[#c5a869] italic text-4xl">{storeName.charAt(0)}</span>
                    <span className="tracking-wide">{storeName.slice(1)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] tracking-widest uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#c5a869]/15 border border-[#c5a869]/50 text-[#c5a869]">
                      GENEVE • MAROC
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono ${
                        isDark ? 'text-gray-400' : 'text-slate-500'
                      }`}
                    >
                      LUXURY WATCHES
                    </span>
                  </div>
                </div>
              </div>

              <div className={`text-center ${isFr ? 'sm:text-right' : 'sm:text-left'} space-y-1`}>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full gold-gradient-bg text-black text-[11px] font-black shadow">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isFr ? 'COUPON PRIVILÈGE VIP' : 'قسيمة تخفيض حصرية للزبناء'}</span>
                </span>
                <p className={`text-[11px] font-semibold ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                  {isFr
                    ? 'Offre valable sur la boutique officielle'
                    : 'عرض خاص صالح على المتجر الإلكتروني الرسمي'}
                </p>
              </div>
            </div>

            {/* 2. Center Discount Value & Promo Code Box */}
            <div
              className={`relative rounded-2xl border-2 border-[#c5a869] p-5 sm:p-6 print:p-4 text-center space-y-3 shadow-inner ${
                isDark
                  ? 'bg-gradient-to-b from-[#171c2b] to-[#0e111a]'
                  : 'bg-gradient-to-b from-[#fffdf8] to-[#fdf6e2]'
              }`}
            >
              <p className={`text-xs sm:text-sm font-bold ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
                {isFr
                  ? 'Bénéficiez d’une remise immédiate de :'
                  : 'استفد من تخفيض فوري ومباشر بقيمة:'}
              </p>

              <div
                className={`text-4xl sm:text-5xl print:text-4xl font-black tracking-tight ${
                  isDark ? 'text-[#f7e19c]' : 'text-[#8a5a00]'
                }`}
              >
                {isFr ? `-${discountDisplay}` : `خصم ${discountDisplay}`}
              </div>

              {/* Dashed Code Box */}
              <div className="max-w-md mx-auto pt-1">
                <div
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-[#c5a869] ${
                    isDark ? 'bg-[#090b10]' : 'bg-white'
                  }`}
                >
                  <div className={isFr ? 'text-left' : 'text-right'}>
                    <span className={`block text-[10px] font-bold ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      {isFr ? 'CODE PROMO :' : 'رمز التخفيض :'}
                    </span>
                    <span
                      dir="ltr"
                      className={`font-mono font-black text-2xl sm:text-3xl tracking-widest ${
                        isDark ? 'text-white' : 'text-slate-950'
                      }`}
                    >
                      {promo.code}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="print:hidden px-3 py-2 rounded-lg bg-[#c5a869]/20 hover:bg-[#c5a869]/30 border border-[#c5a869]/50 text-[#c5a869] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? (isFr ? 'Copié' : 'تم النسخ') : isFr ? 'Copier' : 'نسخ'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-1 flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
                <span
                  className={`px-3 py-1 rounded-full border ${
                    isDark
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  }`}
                >
                  {minOrder > 0
                    ? isFr
                      ? `Valable dès ${minOrder} MAD d’achat`
                      : `صالح للطلبيات ابتداءً من ${minOrder} MAD`
                    : isFr
                    ? 'Valable sur tous les produits sans minimum'
                    : 'صالح على جميع المنتجات بدون حد أدنى'}
                </span>
                <span
                  className={`px-3 py-1 rounded-full border ${
                    promo.active
                      ? isDark
                        ? 'bg-[#c5a869]/15 border-[#c5a869]/40 text-[#f3d999]'
                        : 'bg-amber-50 border-[#c5a869]/60 text-[#8a5a00]'
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {promo.active
                    ? isFr
                      ? '✓ Code actif'
                      : '✓ الرمز مفعل وجاهز'
                      : isFr
                      ? 'Code désactivé'
                      : 'الرمز معطل حالياً'}
                </span>
              </div>
            </div>

            {/* Ticket Divider */}
            <div className="relative flex items-center">
              <div className="w-full border-t-2 border-dashed border-[#c5a869]/40" />
            </div>

            {/* 3. How To Use + Store QR Code */}
            <div className="relative grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-8 print:col-span-8 space-y-2.5">
                <h4
                  className={`text-sm sm:text-base font-black flex items-center gap-2 ${
                    isDark ? 'text-[#f3d999]' : 'text-[#8a5a00]'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-[#c5a869]" />
                  <span>
                    {isFr ? 'Comment utiliser ce code promo ?' : 'كيفية استعمال رمز التخفيض :'}
                  </span>
                </h4>

                <div className="space-y-2 text-xs">
                  {(isFr
                    ? [
                        'Choisissez votre montre ou accessoire sur la boutique et cliquez sur « Commander ».',
                        `Sur la page de confirmation, saisissez le code (${promo.code}) et cliquez sur « Appliquer ».`,
                        'Le montant est réduit instantanément avec livraison gratuite, cadeau offert et garantie 1 an.',
                      ]
                    : [
                        'اختر ساعتك أو إكسسوارك المفضل من متجر Noblewatch واضغط على «اطلب الآن».',
                        `في صفحة تأكيد طلب الشراء، أدخل الرمز (${promo.code}) في خانة رمز التخفيض واضغط «تطبيق».`,
                        'يُخصم مبلغ التخفيض فوراً مع توصيل مجاني، هدية مجانية وشهادة ضمان لمدة سنة.',
                      ]
                  ).map((step, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${
                        isDark
                          ? 'bg-white/[0.03] border-white/10 text-gray-200'
                          : 'bg-white border-[#c5a869]/35 text-slate-800'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full gold-gradient-bg text-black font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-semibold">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Code Card */}
              <div className="md:col-span-4 print:col-span-4 flex flex-col items-center justify-center p-3 rounded-2xl bg-white border-2 border-[#c5a869] text-slate-900 shadow-md">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Store QR Code" className="w-32 h-32 print:w-28 print:h-28 object-contain" />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center text-xs text-slate-400">
                    QR...
                  </div>
                )}
                <span className="text-[11px] font-black text-slate-900 mt-1.5 text-center">
                  {isFr ? 'Scannez pour visiter la boutique' : 'امسح الكود لدخول المتجر'}
                </span>
                <span dir="ltr" className="text-[9px] font-mono text-slate-500 truncate max-w-full">
                  {storeUrl.replace(/^https?:\/\//, '')}
                </span>
              </div>
            </div>

            {/* 4. Store Guarantees Bar */}
            <div
              className={`grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-2 p-2.5 rounded-xl border text-[11px] font-bold text-center ${
                isDark
                  ? 'bg-[#c5a869]/10 border-[#c5a869]/30 text-[#f3d999]'
                  : 'bg-[#fefaf0] border-[#c5a869]/50 text-[#8a5a00]'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Truck className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{isFr ? 'Livraison gratuite' : 'توصيل مجاني 0DH'}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{isFr ? 'Garantie 1 an' : 'ضمان لمدة سنة'}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Gift className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{isFr ? 'Cadeau offert' : 'هدية مجانية'}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{isFr ? 'Paiement à la livraison' : 'الدفع عند الاستلام'}</span>
              </div>
            </div>

            {/* 5. Store Information Footer */}
            <div className="rounded-xl bg-[#0c0f17] border border-[#c5a869]/60 p-3.5 text-white space-y-2">
              <div className="text-xs font-black text-[#f3d999] text-center">
                {isFr
                  ? `${storeName} — Informations officielles de la boutique`
                  : `${storeName} — المعلومات الرسمية للمتجر وخدمة العملاء`}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] text-gray-200">
                <span className="flex items-center gap-1.5 font-mono" dir="ltr">
                  <Globe className="w-3.5 h-3.5 text-[#c5a869]" />
                  <span>{storeUrl}</span>
                </span>
                <span className="flex items-center gap-1.5 font-mono" dir="ltr">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{storePhone}</span>
                </span>
                <span className="flex items-center gap-1.5 font-mono" dir="ltr">
                  <Mail className="w-3.5 h-3.5 text-[#c5a869]" />
                  <span>{storeEmail}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#c5a869]" />
                  <span>{storeCity} - المغرب</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SCREEN-ONLY DOWNLOAD & SHARE ACTIONS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4 print:hidden" dir="rtl">
          <button
            type="button"
            disabled={isDownloadingPng}
            onClick={handleDownloadPng}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl gold-gradient-bg text-black font-black text-xs shadow-lg hover:brightness-110 disabled:opacity-60 cursor-pointer transition"
          >
            {isDownloadingPng ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isDownloadingPng ? 'جاري تجهيز الصورة...' : 'تحميل كصورة (PNG)'}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs cursor-pointer transition"
          >
            <Printer className="w-4 h-4 text-[#c5a869]" />
            <span>تحميل PDF / طباعة</span>
          </button>

          <button
            type="button"
            onClick={handleCopyMessage}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs cursor-pointer transition"
          >
            {copiedMsg ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-[#c5a869]" />
            )}
            <span>{copiedMsg ? 'تم نسخ النص بنجاح' : 'نسخ نص العرض للزبون'}</span>
          </button>

          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(promoShareMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>إرسال عبر واتساب</span>
          </a>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};
