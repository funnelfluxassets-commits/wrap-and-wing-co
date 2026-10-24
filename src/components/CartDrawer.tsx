import React from 'react';
import { useCart } from '../context/CartContext';
import { isItemOutOfStock } from '../services/stockService';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Check, AlertCircle, Utensils } from 'lucide-react';
import { ChickenWingIcon } from './icons/ChickenWingIcon';
import { DeliveryMotorbikeIcon } from './icons/DeliveryMotorbikeIcon';
import { getCdnThumbnailUrl } from '../utils/cdn';

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
    tip,
    setTip,
    grandTotal,
    orderMode,
    setOrderMode,
    tableNumber,
    setTableNumber,
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
              <p className="text-[11px] text-zinc-200 font-medium">
                Wrap &amp; Wings Co
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-white transition-all text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm"
            aria-label="Add More Items"
            title="Return to menu to add more items"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
            <span>ADD ITEMS</span>
          </button>
        </div>

        {/* Order Mode Toggle (Dine-In vs Collection vs Delivery) */}
        <div className="p-3 bg-zinc-900/90 border-b border-white/5 space-y-2.5">
          <div className="grid grid-cols-3 gap-1 p-1 bg-black/40 rounded-xl border border-white/5 text-[11px] font-bold">
            {/* 1. Dine-In Button */}
            <button
              type="button"
              onClick={() => setOrderMode('dine-in')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer font-black ${
                orderMode === 'dine-in'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Utensils className="w-3 h-3 shrink-0" />
              <span>Dine-In</span>
            </button>

            {/* 2. Collection Button */}
            <button
              type="button"
              onClick={() => setOrderMode('collection')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer font-black ${
                orderMode === 'collection'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🛍️ Collect</span>
            </button>

            {/* 3. Delivery (Coming Soon) */}
            <div
              className="py-1.5 rounded-lg flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/60 border border-white/5 cursor-not-allowed select-none opacity-60"
              title="Doorstep Delivery is coming soon to Wrap & Wings Co!"
            >
              <span className="text-zinc-400 font-bold text-[10px]">Delivery</span>
              <span className="text-[8px] font-black uppercase text-amber-400 tracking-wider">
                Soon
              </span>
            </div>
          </div>

          {/* Table Picker inside Cart when Dine-In is active */}
          {orderMode === 'dine-in' && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-amber-300 flex items-center gap-1">
                  <span>🪑 Seated Table Number:</span>
                </span>
                <span className="text-amber-400 font-black text-xs">
                  {tableNumber ? `Table ${tableNumber}` : 'Tap table below'}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {(['6', '48', '7', '3', '47'] as const).map((tbl) => (
                  <button
                    key={tbl}
                    type="button"
                    onClick={() => setTableNumber(tbl)}
                    className={`py-1.5 rounded-lg border text-xs font-black transition-all cursor-pointer ${
                      tableNumber === tbl
                        ? 'bg-rose-600 border-rose-500 text-white shadow-md ring-1 ring-rose-400 scale-[1.05]'
                        : 'bg-zinc-800 text-zinc-300 border-white/5 hover:text-white hover:bg-zinc-700'
                    }`}
                  >
                    {tbl}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-3">
                <ChickenWingIcon className="w-8 h-8" />
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
                      src={getCdnThumbnailUrl(item.menuItem.image)}
                      alt={item.menuItem.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (item.menuItem.image && target.src !== item.menuItem.image) {
                          target.src = item.menuItem.image;
                        }
                      }}
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
                  <div className="text-[11px] text-zinc-200 mt-0.5 space-y-0.5">
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
                      <div className="italic text-zinc-300">"{item.customization.notes}"</div>
                    )}
                    {isItemOutOfStock(item.menuItem.id) && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Item is sold out today. Please remove to continue.</span>
                      </div>
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
            <div className="space-y-1.5 text-xs text-zinc-200">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-white font-bold">R{subtotal.toFixed(2)}</span>
              </div>
              {orderMode === 'delivery' && (
                <>
                  <div className="flex justify-between text-zinc-200">
                    <span>Delivery Fee</span>
                    <span className="text-white font-bold">R{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-t border-white/5 my-0.5">
                    <span className="text-zinc-300 font-semibold text-xs">Add Driver Tip:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTip(tip === 5 ? 0 : 5)}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          tip === 5
                            ? 'bg-amber-400 text-zinc-950 shadow-md ring-1 ring-amber-300'
                            : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-white/10'
                        }`}
                        title={tip === 5 ? 'Click to remove tip' : 'Add R5 tip'}
                      >
                        R5
                      </button>
                      <button
                        type="button"
                        onClick={() => setTip(tip === 10 ? 0 : 10)}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                          tip === 10
                            ? 'bg-amber-400 text-zinc-950 shadow-md ring-1 ring-amber-300'
                            : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-white/10'
                        }`}
                        title={tip === 10 ? 'Click to remove tip' : 'Add R10 tip'}
                      >
                        R10
                      </button>
                    </div>
                  </div>
                  {tip > 0 && (
                    <div className="flex justify-between text-xs text-amber-300 font-bold">
                      <span>Driver Tip</span>
                      <span>+R{tip.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between text-sm sm:text-base font-black text-white pt-2 border-t border-white/10">
                <span>Total Due</span>
                <span className="text-amber-400 text-lg">R{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {(() => {
              const hasOutOfStockItem = items.some((i) => isItemOutOfStock(i.menuItem.id));

              return (
                <button
                  type="button"
                  disabled={hasOutOfStockItem}
                  onClick={() => {
                    if (hasOutOfStockItem) return;
                    setIsCartOpen(false);
                    onOpenCheckout();
                  }}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-sm tracking-wide shadow-xl transition-all flex items-center justify-center gap-2 ${
                    hasOutOfStockItem
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed select-none border border-white/10'
                      : 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-950/40 hover:scale-[1.02] cursor-pointer'
                  }`}
                >
                  <span>{hasOutOfStockItem ? 'REMOVE SOLD OUT ITEMS TO PROCEED' : 'PROCEED TO CHECKOUT'}</span>
                  {!hasOutOfStockItem && <ArrowRight className="w-4 h-4" />}
                </button>
              );
            })()}

            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="w-full py-2 text-center text-xs font-bold text-zinc-400 hover:text-amber-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add More Items to Order</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
