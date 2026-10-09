import React, { useRef } from 'react';
import { CATEGORIES } from '../data/menuData';
import { CategoryId } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryNavProps {
  activeCategory: CategoryId | 'all';
  onSelectCategory: (id: CategoryId | 'all') => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({ activeCategory, onSelectCategory }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleSelect = (id: CategoryId | 'all', el?: HTMLElement) => {
    onSelectCategory(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  return (
    <div className="sticky top-[104px] sm:top-[108px] z-30 bg-[#121217]/95 backdrop-blur-md border-y border-white/10 py-2 sm:py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 flex items-center gap-1.5 sm:gap-2">
        
        {/* Left Scroll Button (clearly visible on both mobile and desktop, never overlaps tabs) */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="flex shrink-0 w-8 h-8 rounded-full bg-zinc-900 border border-white/20 hover:border-amber-400 text-zinc-200 hover:text-amber-300 hover:bg-zinc-800 items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
          aria-label="Scroll left"
          title="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Container (sits safely between left & right buttons with zero overlap) */}
        <div
          ref={scrollRef}
          className="flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
        >
          {/* "All" Category Pill */}
          <button
            type="button"
            onClick={(e) => handleSelect('all', e.currentTarget)}
            className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 border ${
              activeCategory === 'all'
                ? 'bg-rose-600 border-rose-600 text-white font-extrabold shadow-lg shadow-rose-900/40 ring-1 ring-rose-500/40'
                : 'bg-zinc-900/90 border-amber-400 hover:border-amber-300 hover:bg-zinc-800 text-zinc-300 font-bold'
            }`}
          >
            <span>✨</span>
            <span>All Items</span>
          </button>

          {/* Category Pills */}
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={(e) => handleSelect(cat.id, e.currentTarget)}
                className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-rose-600 border-rose-600 text-white font-extrabold shadow-lg shadow-rose-900/40 ring-1 ring-rose-500/40'
                    : 'bg-zinc-900/90 border-amber-400 hover:border-amber-300 hover:bg-zinc-800 text-zinc-300 font-bold'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button (clearly visible on both mobile and desktop, never overlaps tabs) */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className="flex shrink-0 w-8 h-8 rounded-full bg-zinc-900 border border-white/20 hover:border-amber-400 text-zinc-200 hover:text-amber-300 hover:bg-zinc-800 items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
          aria-label="Scroll right"
          title="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
