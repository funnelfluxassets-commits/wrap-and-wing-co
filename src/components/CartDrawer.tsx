import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenCheckout }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeItem,
    updateQuantity,
    subtotal,
    deliveryFee,
    grandTotal,
    orderMode,
    setOrderMode,
    selectedStore,
    clearCart,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-md h-full bg-[#121217] border-l border-white/10 shadow-2xl flex flex-col text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">Your Order</h2>
              <p className="text-[11px] text-zinc-400 font-medium">
                {selectedStore.mall} ({selectedStore.landmark})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Mode Toggle (Collection vs Delivery) */}
        <div className="p-3 bg-zinc-900/90 border-b border-white/5">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 text-xs font-bold">
            <button
              type="button"
              onClick={() => setOrderMode('collection')}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                orderMode === 'collection' ? 'bg-rose-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🛍️ Store Collection</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderMode('delivery')}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                orderMode === 'delivery' ? 'bg-rose-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🚗 Delivery (+R25)</span>
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-3xl mb-3">
                🍗
              </div>
              <h3 className="text-base font-extrabold text-zinc-300">Your basket is empty</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Explore our flame-grilled chicken, delicious wraps, and wings to build your feast.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 flex items-start gap-3 relative group"
              >
                {/* Item Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-white/5">
                  {item.menuItem.image ? (
                    <img
                      src={item.menuItem.image}
                      alt={item.menuItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🔥</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="text-xs sm:text-sm font-black text-white truncate">
                      {item.menuItem.name}
                    </h4>
                    <span className="text-xs font-black text-amber-400 shrink-0">
                      R{item.itemTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Customizations */}
                  <div className="text-[11px] text-zinc-400 mt-0.5 space-y-0.5">
                    {item.customization?.flavour && (
                      <div className="capitalize text-rose-400 font-semibold">
                        Flavour: {item.customization.flavour}
                      </div>
                    )}
                    {item.customization?.side && (
                      <div>Side: {item.customization.side}</div>
                    )}
                    {item.customization?.extras?.map((e) => (
                      <div key={e.name} className="text-amber-300/80">
                        + {e.name}
                      </div>
                    ))}
                    {item.customization?.notes && (
                      <div className="italic text-zinc-500">"{item.customization.notes}"</div>
                    )}
                  </div>

                  {/* Quantity & Remove controls */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5">
                    <div className="flex items-center bg-zinc-950 border border-white/10 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer / Summary & Checkout */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-zinc-950 border-t border-white/10 space-y-3">
            <div className="space-y-1.5 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white font-bold">R{subtotal.toFixed(2)}</span>
              </div>
              {orderMode === 'delivery' && (
                <div className="flex justify-between text-zinc-400">
                  <span>Delivery Fee</span>
                  <span className="text-white font-bold">R{deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm sm:text-base font-black text-white pt-2 border-t border-white/10">
                <span>Total Due</span>
                <span className="text-amber-400 text-lg">R{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsCartOpen(false);
                onOpenCheckout();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm tracking-wide shadow-xl shadow-rose-950/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
