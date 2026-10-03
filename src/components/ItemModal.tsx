import React, { useState } from 'react';
import { MenuItem, FlavourId } from '../types';
import { FLAVOURS, SIDES_LIST } from '../data/menuData';
import { useCart } from '../context/CartContext';
import { X, Plus, Minus, Flame, Check, Sparkles } from 'lucide-react';

interface ItemModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

const EXTRAS_OPTIONS = [
  { name: 'Extra Signature Peri Sauce', price: 10.0 },
  { name: 'Extra Melted Cheese Slice', price: 12.0 },
  { name: 'Add 3 Flame-Grilled Wings', price: 45.0 },
  { name: 'Add Cold Buddy Soda (440ml)', price: 18.0 },
];

export const ItemModal: React.FC<ItemModalProps> = ({ item, onClose }) => {
  const { addItem } = useCart();

  if (!item) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedFlavour, setSelectedFlavour] = useState<FlavourId>(
    item.hasFlavourChoice ? 'mild' : 'mild'
  );
  const availableSides = item.sideOptions || (item.includesSide ? SIDES_LIST : []);
  const [selectedSide, setSelectedSide] = useState<string>(
    availableSides.length > 0 ? availableSides[0] : ''
  );
  const [selectedExtras, setSelectedExtras] = useState<{ name: string; price: number }[]>([]);
  const [notes, setNotes] = useState('');

  const toggleExtra = (extra: { name: string; price: number }) => {
    if (selectedExtras.some((e) => e.name === extra.name)) {
      setSelectedExtras(selectedExtras.filter((e) => e.name !== extra.name));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const extrasSum = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const singleUnitPrice = item.price + extrasSum;
  const totalPrice = singleUnitPrice * quantity;

  const handleAddToCart = () => {
    addItem(item, quantity, {
      flavour: item.hasFlavourChoice ? selectedFlavour : undefined,
      side: availableSides.length > 0 ? selectedSide : undefined,
      extras: selectedExtras.length > 0 ? selectedExtras : undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-xl max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl bg-[#141419] border border-white/10 shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Image & Close Button */}
        <div className="relative aspect-[16/9] w-full shrink-0 bg-zinc-950 overflow-hidden">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover object-center" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-4xl">
              🔥
            </div>
          )}
          
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 transition-all cursor-pointer shadow-md"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {item.badge && (
            <div className="absolute bottom-3 left-4 px-3 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider shadow-lg">
              {item.badge}
            </div>
          )}
        </div>

        {/* Scrollable Customization Options */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">{item.name}</h2>
              <span className="text-xl font-black text-amber-400">R{item.price.toFixed(2)}</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">{item.description}</p>
          </div>

          {/* 1. Flavour / Heat Choice */}
          {item.hasFlavourChoice && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-500" />
                  <span>Choose Your Basting Flavour</span>
                </label>
                <span className="text-[11px] font-bold text-rose-400 uppercase">Required</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FLAVOURS.map((f) => {
                  const isSelected = selectedFlavour === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFlavour(f.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-rose-500/15 border-rose-500 ring-1 ring-rose-500 text-white'
                          : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl">{f.emoji}</span>
                        <div>
                          <div className="text-xs font-black">{f.name}</div>
                          <div className="text-[10px] text-zinc-400 leading-tight">{f.description}</div>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-rose-500 bg-rose-500 text-white' : 'border-zinc-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Side Choice */}
          {availableSides.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-200">
                  🍟 Choose Your Side
                </label>
                <span className="text-[11px] font-bold text-amber-400 uppercase">Included</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableSides.map((side) => {
                  const isSelected = selectedSide === side;
                  return (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setSelectedSide(side)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500 text-white'
                          : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-zinc-400'
                      }`}
                    >
                      <div>{side}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Add-ons & Extras */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <label className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Delicious Extras (Optional)</span>
            </label>

            <div className="space-y-2">
              {EXTRAS_OPTIONS.map((extra) => {
                const isSelected = selectedExtras.some((e) => e.name === extra.name);
                return (
                  <button
                    key={extra.name}
                    type="button"
                    onClick={() => toggleExtra(extra)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500/10 border-rose-500/60 text-white'
                        : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-white/5 text-zinc-300'
                    }`}
                  >
                    <span className="text-xs font-semibold">{extra.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400">+R{extra.price.toFixed(2)}</span>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isSelected ? 'border-rose-500 bg-rose-500 text-white' : 'border-zinc-600'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Special Kitchen Instructions */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <label className="text-xs font-bold text-zinc-400">Special Instructions for Kitchen:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Extra sauce, no garnish, chips extra crispy..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
            />
          </div>

        </div>

        {/* Footer / Quantity & Add to Cart Action */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-t border-white/10 flex items-center justify-between gap-4 mt-auto">
          {/* Quantity Controls */}
          <div className="flex items-center bg-zinc-900 border border-white/10 rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-black text-white">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm tracking-wide shadow-lg shadow-rose-900/30 transition-all hover:scale-[1.02] flex items-center justify-between cursor-pointer"
          >
            <span>ADD TO ORDER</span>
            <span>R{totalPrice.toFixed(2)}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
