import React, { useState, useMemo } from 'react';
import { MENU_ITEMS, CATEGORIES } from '../data/menuData';
import { MenuItem, CategoryId } from '../types';
import { setItemStockStatus, resetAllToInStock } from '../services/stockService';
import {
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Package,
  PackageX,
  Sparkles,
} from 'lucide-react';

interface StockManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  outOfStockIds: string[];
}

export const StockManagementModal: React.FC<StockManagementModalProps> = ({
  isOpen,
  onClose,
  outOfStockIds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all' | 'out_only'>('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const outOfStockCount = outOfStockIds.length;

  // Filter items by category, out_only tab, and search query (Always call unconditionally at top level)
  const filteredItems = useMemo(() => {
    let items = MENU_ITEMS;

    // Filter by special "Out of stock only" tab or category
    if (selectedCategory === 'out_only') {
      items = items.filter((item) => outOfStockIds.includes(item.id));
    } else if (selectedCategory !== 'all') {
      items = items.filter((item) => item.categoryId === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.categoryId.toLowerCase().includes(q)
      );
    }

    return items;
  }, [selectedCategory, searchQuery, outOfStockIds]);

  const handleToggleStock = async (item: MenuItem) => {
    const isCurrentlyOut = outOfStockIds.includes(item.id);
    setIsUpdating(item.id);
    try {
      await setItemStockStatus(item.id, isCurrentlyOut); // if currently out, set to in-stock (true), else false
    } finally {
      setIsUpdating(null);
    }
  };

  const handleResetAll = async () => {
    if (outOfStockCount === 0) return;
    if (window.confirm('Restore all menu items to "In Stock"? All items will immediately become available to customers.')) {
      await resetAllToInStock();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#121218] border border-white/10 rounded-3xl shadow-2xl shadow-black/90 flex flex-col overflow-hidden text-white">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between gap-3 shrink-0 bg-[#161620]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
              <PackageX className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black uppercase tracking-wide text-white">
                  Kitchen Stock Availability
                </h2>
                {outOfStockCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[11px] font-black uppercase tracking-wider">
                    {outOfStockCount} Out of Stock
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                    All In Stock
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Tap any product to instantly mark it Out of Stock or restore it to In Stock.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {outOfStockCount > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-bold border border-white/10 transition-colors cursor-pointer"
                title="Restore all items to in-stock"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore All</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="p-3 sm:p-4 bg-[#14141d] border-b border-white/5 space-y-3 shrink-0">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by meal name or category..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Chips Scroll */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              All Items ({MENU_ITEMS.length})
            </button>

            {outOfStockCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategory('out_only')}
                className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === 'out_only'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Out of Stock Only ({outOfStockCount})</span>
              </button>
            )}

            {CATEGORIES.map((cat) => {
              const countInCat = MENU_ITEMS.filter((i) => i.categoryId === cat.id).length;
              const outInCat = MENU_ITEMS.filter(
                (i) => i.categoryId === cat.id && outOfStockIds.includes(i.id)
              ).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id as CategoryId)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-75">({countInCat})</span>
                  {outInCat > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-zinc-900" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 space-y-2">
              <Package className="w-10 h-10 mx-auto opacity-40 text-zinc-400" />
              <p className="text-sm font-bold text-zinc-400">No items match your filter</p>
              <p className="text-xs text-zinc-500">
                {selectedCategory === 'out_only'
                  ? 'All items are currently In Stock!'
                  : 'Try adjusting your search query or category filter.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
              {filteredItems.map((item) => {
                const isOut = outOfStockIds.includes(item.id);
                const isThisUpdating = isUpdating === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => !isThisUpdating && handleToggleStock(item)}
                    className={`relative p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer select-none group ${
                      isOut
                        ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400/60 shadow-inner'
                        : 'bg-zinc-900/80 border-white/5 hover:border-white/20 hover:bg-zinc-900'
                    }`}
                  >
                    {/* Item Image */}
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-white/10">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className={`w-full h-full object-cover transition-transform duration-300 ${
                            isOut ? 'opacity-40 grayscale group-hover:scale-105' : 'group-hover:scale-105'
                          }`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl bg-zinc-800">
                          🔥
                        </div>
                      )}
                      {isOut && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                          <span className="text-[9px] font-black text-amber-300 uppercase tracking-wider text-center leading-tight">
                            SOLD<br/>OUT
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Item Information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4
                          className={`text-xs sm:text-sm font-black truncate leading-tight ${
                            isOut ? 'text-amber-200 line-through decoration-amber-500/50' : 'text-white'
                          }`}
                        >
                          {item.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        R{item.price.toFixed(2)} • {CATEGORIES.find((c) => c.id === item.categoryId)?.name || item.categoryId}
                      </p>

                      {/* Stock Toggle Status Pill */}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black tracking-wider uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Out of Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            In Stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Toggle Switch Visual Indicator */}
                    <div className="shrink-0 flex items-center justify-center">
                      <div
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                          !isOut ? 'bg-emerald-500 justify-end' : 'bg-zinc-800 justify-start'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            isThisUpdating ? 'animate-spin' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-[#14141d] border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Changes reflect instantly across all customer menus & online orders</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
