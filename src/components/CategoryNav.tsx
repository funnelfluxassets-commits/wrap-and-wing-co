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
      const offset = direction === 'left' ? -250 : 250;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-[68px] sm:top-[76px] lg:top-[80px] z-30 bg-[#121217]/95 backdrop-blur-md border-y border-white/10 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative flex items-center">
        
        {/* Left Scroll Button */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="hidden md:flex absolute -left-1 z-10 w-8 h-8 rounded-full bg-zinc-900 border border-white/20 text-zinc-300 hover:text-white items-center justify-center shadow-lg hover:scale-105 cursor-pointer"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth w-full px-1"
        >
          {/* "All" Category Pill */}
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeCategory === 'all'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 ring-2 ring-rose-500/50'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-white/10'
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
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 ring-2 ring-rose-500/50'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-white/10'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Button */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className="hidden md:flex absolute -right-1 z-10 w-8 h-8 rounded-full bg-zinc-900 border border-white/20 text-zinc-300 hover:text-white items-center justify-center shadow-lg hover:scale-105 cursor-pointer"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
