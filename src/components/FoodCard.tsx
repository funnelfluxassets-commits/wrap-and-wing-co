import React from 'react';
import { MenuItem } from '../types';
import { Plus, Flame, Sparkles } from 'lucide-react';
import { FLAVOURS } from '../data/menuData';
import { getCdnThumbnailUrl } from '../utils/cdn';

interface FoodCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  isOutOfStock?: boolean;
  onSoldOutClick?: (itemName: string) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  item,
  onSelect,
  isOutOfStock = false,
  onSoldOutClick,
}) => {
  const handleClick = () => {
    if (isOutOfStock) {
      onSoldOutClick?.(item.name);
      return;
    }
    onSelect(item);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative rounded-2xl bg-zinc-900/90 border transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer select-none ${
        isOutOfStock
          ? 'border-white/10 opacity-95'
          : 'border-white/10 hover:border-rose-500/50 hover:shadow-xl hover:shadow-rose-950/30'
      }`}
    >
      <div>
        {/* Food Image Container */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-950">
          {item.image ? (
            <img
              src={getCdnThumbnailUrl(item.image)}
              alt={item.name}
              className={`w-full h-full object-cover object-center transition-transform duration-500 ${
                isOutOfStock ? '' : 'group-hover:scale-108'
              }`}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (item.image && target.src !== item.image) {
                  target.src = item.image;
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-500 p-4 text-center">
              <span className="text-4xl mb-1">🔥</span>
              <span className="text-xs font-bold text-zinc-400">Wrap & Wings Co Special</span>
            </div>
          )}

          {/* Bottom centered OUT OF STOCK badge */}
          {isOutOfStock && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="px-3 py-1 rounded-lg bg-[#FFD100] text-black font-black text-[10px] sm:text-[11px] uppercase tracking-wider shadow-lg border border-black/20 whitespace-nowrap">
                OUT OF STOCK
              </div>
            </div>
          )}

          {/* Badge */}
          {item.badge && !isOutOfStock && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
              {item.badge}
            </div>
          )}

          {/* Includes Side Indicator */}
          {item.includesSide && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-amber-300 border border-amber-400/30 text-[10px] font-extrabold">
              + SIDE INCLUDED
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3
              className={`text-base sm:text-lg font-black transition-colors leading-snug ${
                isOutOfStock ? 'text-zinc-200' : 'text-white group-hover:text-rose-400'
              }`}
            >
              {item.name}
            </h3>
          </div>

          <p className="text-[13px] sm:text-[14px] text-zinc-300 line-clamp-2 mb-3 leading-relaxed">
            {item.description}
          </p>

          {/* Flavours Available Pills */}
          {item.hasFlavourChoice && (
            <div className="flex items-center gap-1 mb-3 pt-1 border-t border-white/5">
              <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mr-1">5 Basting Sauces:</span>
              <div className="flex -space-x-1">
                {FLAVOURS.map((f) => (
                  <span
                    key={f.id}
                    title={f.name}
                    className="w-4.5 h-4.5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px]"
                  >
                    {f.emoji}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Price & Add Button */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 flex items-center justify-between gap-3 border-t border-white/5 mt-auto">
        <div>
          <span className="text-[11px] font-bold text-zinc-300 uppercase block">Price</span>
          <span className="text-lg sm:text-xl font-black text-amber-400">
            R{item.price.toFixed(2)}
          </span>
        </div>

        <button
          type="button"
          disabled={isOutOfStock}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
            isOutOfStock
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed select-none shadow-none border border-white/5'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40 group-hover:scale-105'
          }`}
          title={isOutOfStock ? 'Sold out today' : 'Customize & Add'}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
        </button>
      </div>
    </div>
  );
};
