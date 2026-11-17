import React from 'react';
import { X, Trash2, ShoppingBag, Truck, Zap, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { formatPrice } from '../utils/constants';
import { trackPixelInitiateCheckout } from '../utils/trackingPixels';
import { translateColorName } from '../i18n/storefront';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    setCheckoutProduct,
  } = useStore();
  const { lang, isFr } = useLanguage();

  if (!isCartOpen) return null;

  const handleCheckoutAll = () => {
    if (cart.length === 0) return;
    trackPixelInitiateCheckout({
      items: cart.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        category: item.product.category,
        price: Number(item.product.price) || 0,
        quantity: item.quantity,
      })),
      totalValue: cartSubtotal,
    });
    setIsCartOpen(false);
    setCheckoutProduct({
      product: cart[0].product,
      color: cart[0].color,
      quantity: cart[0].quantity,
      selectedColors: cart[0].selectedColors,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div
        className={`fixed inset-y-0 max-w-full flex ${
          isFr ? 'right-0 pr-0 sm:pr-10' : 'left-0 pl-0 sm:pl-10'
        }`}
      >
        <div
          className={`w-screen max-w-md bg-white border-gray-200 shadow-2xl flex flex-col h-full ${
            isFr ? 'border-l text-left' : 'border-r text-right'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-gray-400 hover:text-black hover:bg-gray-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">
                {isFr ? 'Votre panier' : 'سلة المشتريات'}
              </h3>
              <span className="w-6 h-6 rounded-full gold-gradient-bg text-black font-black text-xs flex items-center justify-center shadow-sm">
                {cart.length}
              </span>
            </div>
          </div>

          {/* Free Shipping Alert Bar */}
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>
                {isFr
                  ? 'Félicitations ! Livraison gratuite partout au Maroc 🇲🇦'
                  : 'مبروك! طلبيتك مؤهلة للتوصيل المجاني 🇲🇦'}
              </span>
            </span>
            <span className="font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px] text-emerald-800 border border-emerald-300">
              {isFr ? '0 DH' : '0 درهم'}
            </span>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-gray-900">
                  {isFr ? 'Votre panier est vide' : 'سلتك فارغة حالياً'}
                </h4>
                <p className="text-xs text-gray-500 max-w-xs">
                  {isFr
                    ? 'Choisissez votre montre ou accessoire préféré et commandez en un clic avec paiement à la livraison.'
                    : 'اختر ساعتك أو إكسسواراتك المفضلة من تشكيلتنا الراقية واطلبها بنقرة واحدة مع الدفع عند الاستلام.'}
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 rounded-xl gold-gradient-bg text-black font-extrabold text-xs shadow hover:brightness-105"
                >
                  {isFr ? 'Découvrir la collection' : 'تصفح الساعات والإكسسوارات الآن'}
                </button>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={`${item.product.id}-${item.color}-${idx}`}
                  className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex gap-3 items-center justify-between shadow-sm"
                >
                  <img
                    src={item.product.images[0] || '/assets/luxury_watch_hero.jpg'}
                    alt={item.product.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/assets/luxury_watch_hero.jpg';
                    }}
                    className="w-16 h-16 rounded-xl object-cover bg-white border border-gray-200"
                  />

                  <div className={`flex-1 ${isFr ? 'text-left' : 'text-right'}`}>
                    <h5 className="text-xs font-bold text-gray-900 line-clamp-1">
                      {item.product.name}
                    </h5>
                    {item.bundleLabel && (
                      <span className="text-[10px] font-bold text-black gold-gradient-bg px-2 py-0.5 rounded-full inline-block mt-0.5">
                        {isFr && item.quantity > 1 ? `Pack de ${item.quantity} pièces` : item.bundleLabel}
                      </span>
                    )}
                    <span className="text-[11px] text-[#996515] font-semibold block mt-0.5">
                      {translateColorName(item.color, lang)}
                    </span>
                    <span className="text-xs font-black text-gray-900 mt-1 block">
                      {formatPrice(item.product.price, lang)}
                    </span>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center bg-white rounded-lg border border-gray-300 text-xs shadow-sm">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.color, -1)}
                          className="px-2 py-0.5 text-gray-600 hover:text-black font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 font-bold text-gray-900">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.color, 1)}
                          className="px-2 py-0.5 text-gray-600 hover:text-black font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id, item.color)}
                        className="text-gray-400 hover:text-rose-600 p-1"
                        title={isFr ? 'Supprimer' : 'حذف'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer with Checkout */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-gray-200 bg-gray-50 space-y-4">
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>{isFr ? 'Sous-total :' : 'المجموع الفرعي:'}</span>
                  <span className="text-gray-900 font-semibold">{formatPrice(cartSubtotal, lang)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isFr ? 'Livraison au Maroc :' : 'الشحن لجميع مدن المغرب:'}</span>
                  <span className="text-emerald-700 font-bold">
                    {isFr ? 'Gratuite 0 DH 🇲🇦' : 'مجاني 0 درهم 🇲🇦'}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>{isFr ? 'Total à payer :' : 'المبلغ الإجمالي:'}</span>
                  <span className="text-base font-black text-gray-900">
                    {formatPrice(cartSubtotal, lang)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckoutAll}
                className="w-full py-3.5 rounded-xl gold-gradient-bg text-black font-black text-sm shadow-md hover:brightness-105 active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>
                  {isFr ? 'Commander - Paiement à la livraison' : 'إتمام الطلب - الدفع عند الاستلام'}
                </span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#b8860b]" />
                <span>
                  {isFr
                    ? 'Vérifiez votre montre avant de payer'
                    : 'افحص طلبك وتأكد من ساعتك قبل أن تدفع'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
