import React from 'react';
import { Flavour, MenuCategory, MenuItem } from '../types';
import { ChickenWingIcon } from '../components/icons/ChickenWingIcon';

export const FLAVOURS: Flavour[] = [
  {
    id: 'lemony',
    name: 'Lemony',
    emoji: '🍋',
    color: '#EAB308',
    bgClass: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
    textClass: 'text-amber-400',
    description: 'Fresh lemon, herb infusion with a zesty citrus kick (Mild)',
  },
  {
    id: 'mild',
    name: 'Mild',
    emoji: '🌶️',
    color: '#22C55E',
    bgClass: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    textClass: 'text-emerald-400',
    description: 'Gentle warmth with savoury roasted spices',
  },
  {
    id: 'bbq',
    name: 'Barbeque',
    emoji: '🍶',
    color: '#854D0E',
    bgClass: 'bg-amber-800/20 border-amber-700/40 text-amber-200',
    textClass: 'text-amber-300',
    description: 'Sweet, smoky, and sticky flame-grilled classic',
  },
  {
    id: 'sweet_chilli',
    name: 'Sweet Chilli',
    emoji: '🍯',
    color: '#F97316',
    bgClass: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
    textClass: 'text-orange-400',
    description: 'Sweet honey undertones balanced with a spicy tang',
  },
  {
    id: 'hot',
    name: 'Hot',
    emoji: '🔥',
    color: '#EF4444',
    bgClass: 'bg-red-500/20 border-red-500/40 text-red-300',
    textClass: 'text-red-400',
    description: 'Authentic fire for true spice lovers',
  },
];

export const CATEGORIES: MenuCategory[] = [
  { id: 'wraps', name: 'Wraps', icon: '🌯', description: 'Fresh toasted wraps bursting with grilled chicken and savoury sauce' },
  { id: 'wings', name: 'Flame Grilled Wings', icon: React.createElement(ChickenWingIcon, { className: 'w-4.5 h-4.5' }), description: 'Charred to perfection in your choice of 5 signature flavours' },
  { id: 'chicken', name: 'Flame Grilled Chicken', icon: '🔥', description: 'Tender chicken steeped in marinade and flame-grilled' },
  { id: 'burgers', name: 'Burgers', icon: '🍔', description: 'Succulent chicken burgers (grilled or crispy fried) with seasoned chips' },
  { id: 'sandwiches', name: 'Toasted Sandwiches', icon: '🥪', description: 'Golden toasted bread served with small chips or side salad' },
  { id: 'seafood', name: 'Seafood', icon: '🐟', description: 'Crispy battered fish fillet with chips and tartar sauce' },
  { id: 'sides', name: 'Regular Sides', icon: '🍟', description: 'Hot golden chips, fragrant spicy rice, and creamy coleslaw' },
  { id: 'kids', name: 'Kids Menu', icon: '🧒', description: 'Crispy, tasty kid-friendly meals served with golden chips' },
  { id: 'drinks', name: 'Drinks', icon: '🥤', description: 'Refreshing cold sodas and still spring water' },
];

export const SIDES_LIST = ['Chips', 'Spicy Rice', 'Coleslaw', 'Side Salad'];

export const MENU_ITEMS: MenuItem[] = [
  // ── WRAPS ───────────────────────────────────────────────────────────────────
  {
    id: 'wrap-shwarma',
    categoryId: 'wraps',
    name: 'Wrap It Like A Shwarma',
    description: 'Warm tortilla wrapped with succulent flame-grilled chicken strips, fresh crisp salad, and our signature creamy garlic & herb basting.',
    price: 39.90,
    image: '/images/menu/wrap.webp',
    popular: true,
    hasFlavourChoice: true,
    badge: 'POPULAR',
  },
  {
    id: 'wrap-shwarma-side',
    categoryId: 'wraps',
    name: 'Wrap It Like A Shwarma With A Side',
    description: 'Our signature chicken shwarma wrap served with your choice of hot golden chips, savoury spicy rice, or fresh creamy coleslaw.',
    price: 69.90,
    image: '/images/menu/wrap-and-side.webp',
    popular: true,
    hasFlavourChoice: true,
    includesSide: true,
    sideOptions: SIDES_LIST,
    badge: 'MEAL COMBO',
  },

  // ── FLAME GRILLED WINGS ────────────────────────────────────────────────────
  {
    id: 'wings-3',
    categoryId: 'wings',
    name: '3 Wings with a Side',
    description: '3 plump, juicy flame-grilled chicken wings tossed in your choice of signature baste, paired with a fresh side.',
    price: 49.90,
    image: '/images/menu/wings-3.webp',
    hasFlavourChoice: true,
    includesSide: true,
    sideOptions: SIDES_LIST,
  },
  {
    id: 'wings-6',
    categoryId: 'wings',
    name: '6 Wings with a Side',
    description: '6 flame-charred wings bursting with juicy flavour and glazed with your favourite sauce, served with a regular side.',
    price: 69.90,
    image: '/images/menu/wings-6.webp',
    popular: true,
    hasFlavourChoice: true,
    includesSide: true,
    sideOptions: SIDES_LIST,
    badge: 'BESTSELLER',
  },
  {
    id: 'wings-10',
    categoryId: 'wings',
    name: '10 Wings with a Side',
    description: '10 epic flame-grilled wings packed with bold seasoning, accompanied by your choice of hot chips, rice, or slaw.',
    price: 99.90,
    image: '/images/menu/wings-10.webp',
    hasFlavourChoice: true,
    includesSide: true,
    sideOptions: SIDES_LIST,
    badge: 'SHARING SIZE',
  },

  // ── BURGERS ────────────────────────────────────────────────────────────────
  {
    id: 'burger-chicken-chips',
    categoryId: 'burgers',
    name: 'Chicken Burger & Chips',
    description: 'Tender chicken breast fillet (Grilled or Crispy Fried) topped with fresh lettuce, tomato, and mayo on a toasted sesame bun, served with chips.',
    price: 69.00,
    image: '/images/menu/burger-and-chips.webp',
    popular: true,
    hasFlavourChoice: true,
    badge: 'GRILLED OR FRIED',
  },

  // ── FLAME GRILLED CHICKEN ──────────────────────────────────────────────────
  {
    id: 'chicken-quarter',
    categoryId: 'chicken',
    name: '1/4 Chicken, Side & Roll',
    description: 'Quarter flame-grilled chicken basted in your choice of sauce, served with a regular side of your choice and a warm Portuguese roll.',
    price: 55.00,
    image: '/images/menu/quarter-chicken.webp',
    popular: true,
    hasFlavourChoice: true,
    includesSide: true,
    sideOptions: SIDES_LIST,
    badge: 'FLAME-GRILLED',
  },
  {
    id: 'chicken-full-family',
    categoryId: 'chicken',
    name: 'Full Chicken Feast (4 Rolls, Side & 2L Soft Drink)',
    description: 'Whole flame-grilled chicken generously basted to your taste, 4 warm rolls, 1 large regular side, and an ice-cold 2L soft drink. The ultimate family meal!',
    price: 149.90,
    image: '/images/menu/full-chicken.webp',
    popular: true,
    hasFlavourChoice: true,
    includesSide: true,
    sideOptions: SIDES_LIST,
    badge: 'FAMILY VALUE',
  },

  // ── SEAFOOD ────────────────────────────────────────────────────────────────
  {
    id: 'seafood-fish-chips',
    categoryId: 'seafood',
    name: 'Fish & Chips with Tartar Sauce & Lemon',
    description: 'Golden crispy hake fillet seasoned and fried to perfection, served with hot chips, rich tartar sauce, and a fresh lemon wedge.',
    price: 59.90,
    image: '/images/menu/fish-and-chips.webp',
    badge: 'CRISPY & FRESH',
  },

  // ── TOASTED SANDWICHES ─────────────────────────────────────────────────────
  {
    id: 'toast-cheese',
    categoryId: 'sandwiches',
    name: 'Toasted Cheese Sandwich',
    description: 'Thick white bread toasted to golden perfection with melted mature cheddar, served with a small portion of chips or side salad.',
    price: 34.90,
    image: '/images/menu/toasted-cheese.webp',
    sideOptions: ['Small Chips', 'Side Salad'],
  },
  {
    id: 'toast-cheese-tomato',
    categoryId: 'sandwiches',
    name: 'Toasted Cheese & Tomato',
    description: 'Golden toasted bread layered with melted cheddar cheese and juicy fresh tomato slices, served with chips or salad.',
    price: 34.90,
    image: '/images/menu/toasted-cheese-tomato.webp',
    sideOptions: ['Small Chips', 'Side Salad'],
  },
  {
    id: 'toast-chic-mayo',
    categoryId: 'sandwiches',
    name: 'Toasted Chicken & Mayo',
    description: 'Shredded roasted chicken tossed in creamy seasoned mayonnaise on golden toasted bread, served with chips or salad.',
    price: 35.90,
    image: '/images/menu/toasted-chicken-mayo.webp',
    popular: true,
    sideOptions: ['Small Chips', 'Side Salad'],
    badge: 'POPULAR',
  },
  {
    id: 'toast-bacon-cheese',
    categoryId: 'sandwiches',
    name: 'Toasted Bacon & Cheese',
    description: 'Crispy savoury bacon rashers melted under rich cheddar cheese between toasted bread, served with chips or salad.',
    price: 35.90,
    image: '/images/menu/toasted-bacon-cheese.webp',
    sideOptions: ['Small Chips', 'Side Salad'],
  },

  // ── REGULAR SIDES ──────────────────────────────────────────────────────────
  {
    id: 'side-chips',
    categoryId: 'sides',
    name: 'Hot Golden Chips',
    description: 'Crispy on the outside, fluffy on the inside potato chips dusted in our signature spice seasoning.',
    price: 29.00,
  },
  {
    id: 'side-rice',
    categoryId: 'sides',
    name: 'Spicy Savoury Rice',
    description: 'Fragrant yellow rice tossed with peppers, herbs, and warm South African peri-spices.',
    price: 29.00,
  },
  {
    id: 'side-coleslaw',
    categoryId: 'sides',
    name: 'Creamy Coleslaw',
    description: 'Fresh shredded red and white cabbage and crisp carrots folded in our house creamy dressing.',
    price: 29.00,
  },

  // ── KIDS MENU ──────────────────────────────────────────────────────────────
  {
    id: 'kids-nuggets-chips',
    categoryId: 'kids',
    name: 'Kids Chicken Nuggets & Chips',
    description: 'Tender golden-fried chicken breast nuggets served with a small portion of chips and sweet dip.',
    price: 39.90,
    badge: 'KIDS MEAL',
  },
  {
    id: 'kids-fish-fingers',
    categoryId: 'kids',
    name: 'Kids Fish Fingers & Chips',
    description: 'Crispy breaded fish fingers served with hot golden chips and tartar dip.',
    price: 39.90,
    badge: 'KIDS MEAL',
  },

  // ── DRINKS ─────────────────────────────────────────────────────────────────
  {
    id: 'drink-buddy',
    categoryId: 'drinks',
    name: 'Buddy Bottle Soft Drink (440ml)',
    description: 'Ice-cold Coca-Cola, Sprite, Fanta Orange, or Stoney ginger beer.',
    price: 18.00,
  },
  {
    id: 'drink-1-5l',
    categoryId: 'drinks',
    name: '1.5 Litre Soft Drink',
    description: 'Large sharing bottle of Coca-Cola, Sprite, or Fanta Orange.',
    price: 25.00,
  },
  {
    id: 'drink-water',
    categoryId: 'drinks',
    name: 'Still Spring Water (500ml)',
    description: 'Pure, refreshing still mineral water.',
    price: 15.00,
  },
];
