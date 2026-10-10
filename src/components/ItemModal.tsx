import React, { useState } from 'react';
import { MenuItem, FlavourId } from '../types';
import { FLAVOURS, SIDES_LIST, MENU_ITEMS } from '../data/menuData';
import { useCart } from '../context/CartContext';
import { X, Plus, Minus, Flame, Check, Sparkles, ChevronDown } from 'lucide-react';

interface ItemModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

const BASE_EXTRAS_OPTIONS = [
  { name: 'Extra Melted Cheese', price: 10.0 },
  { name: 'Add Extra Roll', price: 6.0 },
];

const DRINK_GROUPS = [
  {
    id: 'water' as const,
    title: '💧 Still & Sparkling Spring Water',
    priceText: '+R15.00',
    drinks: [
      { id: 'drink-valpre-water-500ml', name: 'Valpré Still Spring Water (500ml)', price: 15.00, badge: 'STILL WATER' },
      { id: 'drink-valpre-sparkling-500ml', name: 'Valpré Sparkling Spring Water (500ml)', price: 15.00, badge: 'SPARKLING WATER' },
    ],
  },
  {
    id: 'sharing' as const,
    title: '🍾 1.5L Sharing Bottles',
    priceText: '+R25.00',
    drinks: [
      { id: 'drink-coke-original-15l', name: 'Coca-Cola Original (1.5L)', price: 25.00, badge: '1.5L SHARING' },
    ],
  },
  {
    id: 'mocktails' as const,
    title: '🍹 Refreshing Craft Mocktails',
    priceText: '+R39.90',
    drinks: [
      { id: 'drink-watermelon-mocktail', name: 'Watermelon Mocktail', price: 39.90, badge: 'MOCKTAIL' },
      { id: 'drink-lime-mocktail', name: 'Lime Mocktail', price: 39.90, badge: 'MOCKTAIL' },
      { id: 'drink-blueberry-mocktail', name: 'Blueberry Mocktail', price: 39.90, badge: 'MOCKTAIL' },
    ],
  },
  {
    id: 'coffee' as const,
    title: '☕ Hot Brewed Coffee',
    priceText: '+R19.90',
    drinks: [
      { id: 'drink-cuppaccino', name: 'Cuppaccino (Medium)', price: 19.90, badge: 'HOT COFFEE' },
    ],
  },
  {
    id: 'buddies' as const,
    title: '🥤 440ml Cold Buddy Sodas',
    priceText: '+R18.00',
    drinks: [
      { id: 'drink-coke-original-440ml', name: 'Coca-Cola Original (440ml)', price: 18.00, badge: '440ML BUDDY' },
      { id: 'drink-fanta-orange-440ml', name: 'Fanta Orange (440ml)', price: 18.00, badge: '440ML BUDDY' },
      { id: 'drink-sprite-440ml', name: 'Sprite (440ml)', price: 18.00, badge: '440ML BUDDY' },
      { id: 'drink-stoney-440ml', name: 'Stoney Ginger Beer (440ml)', price: 18.00, badge: 'KWETZA' },
    ],
  },
];

export const ItemModal: React.FC<ItemModalProps> = ({ item, onClose }) => {
  const { addItem } = useCart();

  if (!item) return null;

  const [quantity, setQuantity] = useState(1);
  const [selectedFlavour, setSelectedFlavour] = useState<FlavourId>(
    item.hasFlavourChoice ? 'mild' : 'mild'
  );
  const availableSides = item.sideOptions || (item.includesSide ? SIDES_LIST : []);
  const availableDrinks = MENU_ITEMS.filter((m) => m.categoryId === 'drinks');
  const [isDrinksExpanded, setIsDrinksExpanded] = useState(false);
  const [drinkCategoryFilter, setDrinkCategoryFilter] = useState<'all' | 'water' | 'sharing' | 'mocktails' | 'coffee' | 'buddies'>('all');
  const [selectedSide, setSelectedSide] = useState<string>(
    availableSides.length > 0 ? availableSides[0] : ''
  );
  const [selectedExtras, setSelectedExtras] = useState<{ name: string; price: number }[]>([]);
  const [extraSauceFlavour, setExtraSauceFlavour] = useState<string>('Barbeque');
  const [notes, setNotes] = useState('');

  const isExtraSauceSelected = selectedExtras.some((e) => e.name.startsWith('Extra Sauce'));

  const handleToggleExtraSauce = () => {
    if (isExtraSauceSelected) {
      setSelectedExtras((prev) => prev.filter((e) => !e.name.startsWith('Extra Sauce')));
    } else {
      setSelectedExtras((prev) => [
        ...prev,
        { name: `Extra Sauce (${extraSauceFlavour})`, price: 8.0 },
      ]);
    }
  };

  const handleExtraSauceChange = (newFlavour: string) => {
    setExtraSauceFlavour(newFlavour);
    if (isExtraSauceSelected) {
      setSelectedExtras((prev) =>
        prev.map((e) =>
          e.name.startsWith('Extra Sauce')
            ? { ...e, name: `Extra Sauce (${newFlavour})` }
            : e
        )
      );
    }
  };

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
        <div className="relative aspect-[4/3] max-h-64 sm:max-h-80 w-full shrink-0 bg-zinc-950 overflow-hidden">
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
            <p className="text-[13px] sm:text-[15px] text-zinc-200 mt-1 leading-relaxed">{item.description}</p>
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
                          <div className="text-[11px] sm:text-xs text-zinc-200 leading-tight mt-0.5">{f.description}</div>
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
                          : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-zinc-200'
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
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <span className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-md border border-amber-400 bg-amber-400/15 flex items-center justify-center shrink-0 shadow-[0_0_6px_rgba(251,191,36,0.25)]">
                  <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300 stroke-[3]" />
                </span>
                <span>Delicious Optional Extras (Optional)</span>
              </label>
            </div>

            <div className="space-y-2">
              {/* Extra Sauce with Custom Sauce Flavour Dropdown */}
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  isExtraSauceSelected
                    ? 'bg-rose-500/10 border-rose-500/60 text-white'
                    : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-white/5 text-zinc-200'
                }`}
              >
                <div
                  onClick={handleToggleExtraSauce}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <span className="text-xs font-semibold">
                    Extra Sauce {isExtraSauceSelected ? `(${extraSauceFlavour})` : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">+R8.00</span>
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                        isExtraSauceSelected ? 'border-rose-500 bg-rose-500 text-white' : 'border-zinc-600'
                      }`}
                    >
                      {isExtraSauceSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {isExtraSauceSelected && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <label className="text-[11px] font-bold text-amber-300">
                      Choose Extra Sauce:
                    </label>
                    <select
                      value={extraSauceFlavour}
                      onChange={(e) => handleExtraSauceChange(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/20 text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {FLAVOURS.map((f) => (
                        <option key={f.id} value={f.name}>
                          {f.emoji} {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Other Extras (Extra Melted Cheese R10, Add Extra Roll R6) */}
              {BASE_EXTRAS_OPTIONS.map((extra) => {
                const isSelected = selectedExtras.some((e) => e.name === extra.name);
                return (
                  <button
                    key={extra.name}
                    type="button"
                    onClick={() => toggleExtra(extra)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500/10 border-rose-500/60 text-white'
                        : 'bg-zinc-900/60 hover:bg-zinc-800/80 border-white/5 text-zinc-200'
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

              {/* Add Drink - Expandable View of All Available Menu Drinks */}
              {(() => {
                const selectedDrinkItems = selectedExtras.filter((e) =>
                  availableDrinks.some((d) => d.name === e.name)
                );
                const hasSelectedDrinks = selectedDrinkItems.length > 0;

                const filteredGroups =
                  drinkCategoryFilter === 'all'
                    ? DRINK_GROUPS
                    : DRINK_GROUPS.filter((g) => g.id === drinkCategoryFilter);

                return (
                  <div
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      hasSelectedDrinks
                        ? 'border-amber-500/50 bg-amber-500/5'
                        : 'border-white/10 bg-zinc-900/60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setIsDrinksExpanded(!isDrinksExpanded)}
                      className="w-full p-2.5 sm:p-3 flex items-center justify-between text-left hover:bg-zinc-800/80 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span className="text-base shrink-0">🥤</span>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white flex items-center gap-1.5 flex-wrap">
                            <span>Add drink</span>
                            {hasSelectedDrinks && (
                              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-zinc-950 font-black text-[10px]">
                                {selectedDrinkItems.length} selected
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-200 truncate">
                            {hasSelectedDrinks
                              ? selectedDrinkItems.map((d) => d.name).join(', ')
                              : '1.5L Coke, Waters, 3 Mocktails & 440ml Sodas'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-amber-400">
                          {hasSelectedDrinks
                            ? `+R${selectedDrinkItems.reduce((sum, d) => sum + d.price, 0).toFixed(2)}`
                            : 'From +R15.00'}
                        </span>
                        <div
                          className={`p-1 rounded-md bg-zinc-800 text-zinc-400 transition-transform ${
                            isDrinksExpanded ? 'rotate-180 text-amber-400' : ''
                          }`}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>

                    {/* Expanded View of All Available Menu Drinks with Relative Pricing */}
                    {isDrinksExpanded && (
                      <div className="p-3 pt-2 border-t border-white/10 bg-black/50 space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                        
                        {/* Quick Category Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setDrinkCategoryFilter('all')}
                            className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                              drinkCategoryFilter === 'all'
                                ? 'bg-amber-400 text-zinc-950 font-black'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            All ({availableDrinks.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setDrinkCategoryFilter('water')}
                            className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                              drinkCategoryFilter === 'water'
                                ? 'bg-amber-400 text-zinc-950 font-black'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            💧 Water (2)
                          </button>
                          <button
                            type="button"
                            onClick={() => setDrinkCategoryFilter('sharing')}
                            className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                              drinkCategoryFilter === 'sharing'
                                ? 'bg-amber-400 text-zinc-950 font-black'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            🍾 1.5L Coke (1)
                          </button>
                          <button
                            type="button"
                            onClick={() => setDrinkCategoryFilter('mocktails')}
                            className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                              drinkCategoryFilter === 'mocktails'
                                ? 'bg-amber-400 text-zinc-950 font-black'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            🍹 Mocktails (3)
                          </button>
                          <button
                            type="button"
                            onClick={() => setDrinkCategoryFilter('coffee')}
                            className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                              drinkCategoryFilter === 'coffee'
                                ? 'bg-amber-400 text-zinc-950 font-black'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            ☕ Coffee (1)
                          </button>
                          <button
                            type="button"
                            onClick={() => setDrinkCategoryFilter('buddies')}
                            className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                              drinkCategoryFilter === 'buddies'
                                ? 'bg-amber-400 text-zinc-950 font-black'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            🥤 440ml Buddies (9)
                          </button>
                        </div>

                        {/* Grouped Drink Sections */}
                        {filteredGroups.map((group) => (
                          <div key={group.id} className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-amber-300/90 pt-1.5 border-t border-white/5 first:border-0 first:pt-0">
                              <span>{group.title}</span>
                              <span className="text-zinc-500 font-bold">{group.priceText}</span>
                            </div>

                            <div className="space-y-1">
                              {group.drinks.map((drink) => {
                                const isSelected = selectedExtras.some((e) => e.name === drink.name);
                                return (
                                  <button
                                    key={drink.id}
                                    type="button"
                                    onClick={() => toggleExtra({ name: drink.name, price: drink.price })}
                                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                                      isSelected
                                        ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm ring-1 ring-amber-500/30'
                                        : 'bg-zinc-900/70 hover:bg-zinc-800/80 border-white/5 text-zinc-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 pr-2">
                                      <span className="text-xs font-semibold truncate">{drink.name}</span>
                                      {drink.badge && (
                                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-zinc-800 text-amber-300 border border-white/10 shrink-0 hidden sm:inline">
                                          {drink.badge}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-xs font-bold text-amber-400">+R{drink.price.toFixed(2)}</span>
                                      <div
                                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                                          isSelected
                                            ? 'border-amber-400 bg-amber-400 text-zinc-950 font-black'
                                            : 'border-zinc-600 bg-zinc-800/50'
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
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 4. Special Kitchen Instructions */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <label className="text-xs font-bold text-zinc-200">Special Instructions for Kitchen:</label>
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
