import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartCustomization, CartItem, MenuItem, OrderMode, StoreLocation } from '../types';
import { STORES } from '../data/stores';
import { logAddToCart, logFlavourSelect } from '../services/analyticsService';

export const DINE_IN_TABLES = ['6', '48', '7', '3', '47'] as const;
export type TableNumber = typeof DINE_IN_TABLES[number];

interface CartContextType {
  items: CartItem[];
  orderMode: OrderMode;
  setOrderMode: (mode: OrderMode) => void;
  tableNumber: string;
  setTableNumber: (table: string) => void;
  selectedStore: StoreLocation;
  setSelectedStore: (store: StoreLocation) => void;
  addItem: (menuItem: MenuItem, quantity: number, customization?: CartCustomization) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  subtotal: number;
  deliveryFee: number;
  tip: number;
  setTip: (tip: number) => void;
  grandTotal: number;
  totalItemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('wrap_wing_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tableNumber, setTableNumberState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlTable = params.get('table') || params.get('tbl') || params.get('t');
        if (urlTable && DINE_IN_TABLES.includes(urlTable as any)) {
          return urlTable;
        }
        const hashMatch = window.location.hash.match(/table[=-](\d+)/i);
        if (hashMatch && DINE_IN_TABLES.includes(hashMatch[1] as any)) {
          return hashMatch[1];
        }
        const saved = localStorage.getItem('wrap_wing_table');
        if (saved && DINE_IN_TABLES.includes(saved as any)) {
          return saved;
        }
      } catch {}
    }
    return '';
  });

  // Support Dine-In and Collection ('delivery' is temporarily coming soon)
  const [orderMode, setOrderModeState] = useState<OrderMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlMode = params.get('mode');
        const urlTable = params.get('table') || params.get('tbl') || params.get('t');
        if (urlTable || urlMode === 'dine-in') {
          return 'dine-in';
        }
        const saved = localStorage.getItem('wrap_wing_mode') as OrderMode;
        if (saved === 'dine-in' || saved === 'collection') {
          return saved;
        }
      } catch {}
    }
    return 'dine-in';
  });

  const setTableNumber = (t: string) => {
    setTableNumberState(t);
    try {
      if (t) localStorage.setItem('wrap_wing_table', t);
      else localStorage.removeItem('wrap_wing_table');
    } catch {}
  };

  const setOrderMode = (mode: OrderMode) => {
    // Delivery is coming soon; customer can select Dine-In or Collection
    if (mode === 'delivery') return;
    setOrderModeState(mode);
    try {
      localStorage.setItem('wrap_wing_mode', mode);
    } catch {}
  };

  const [selectedStore, setSelectedStore] = useState<StoreLocation>(STORES[0]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('wrap_wing_cart', JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('wrap_wing_mode', orderMode);
    } catch {}
  }, [orderMode]);

  const addItem = (menuItem: MenuItem, quantity: number, customization?: CartCustomization) => {
    const extrasTotal = customization?.extras?.reduce((sum, e) => sum + e.price, 0) || 0;
    const singleUnitPrice = menuItem.price + extrasTotal;
    const itemTotal = singleUnitPrice * quantity;

    const lineId = `${menuItem.id}_${customization?.flavour || 'noflav'}_${customization?.side || 'noside'}_${Date.now()}`;

    const newItem: CartItem = {
      id: lineId,
      menuItem,
      quantity,
      customization,
      itemTotal,
    };

    setItems((prev) => [...prev, newItem]);
    setIsCartOpen(true);

    try {
      logAddToCart(menuItem.name);
      if (customization?.flavour) {
        logFlavourSelect(customization.flavour);
      }
      if (customization?.extras && Array.isArray(customization.extras)) {
        for (const ext of customization.extras) {
          if (ext.name && (ext.name.toLowerCase().includes('sauce') || ext.name.toLowerCase().includes('basting'))) {
            logFlavourSelect(ext.name);
          }
        }
      }
    } catch {}
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const singleUnitPrice = item.itemTotal / item.quantity;
            return {
              ...item,
              quantity: newQty,
              itemTotal: singleUnitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const [tip, setTip] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('wrap_wing_tip');
      return saved ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('wrap_wing_tip', String(tip));
    } catch {}
  }, [tip]);

  const clearCart = () => {
    setItems([]);
    setTip(0);
    try {
      localStorage.removeItem('wrap_wing_tip');
    } catch {}
  };

  const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
  // Delivery is coming soon; delivery fees and driver tips do not apply
  const deliveryFee = 0;
  const effectiveTip = 0;
  const grandTotal = subtotal;
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        orderMode,
        setOrderMode,
        tableNumber,
        setTableNumber,
        selectedStore,
        setSelectedStore,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        subtotal,
        deliveryFee,
        tip: effectiveTip,
        setTip,
        grandTotal,
        totalItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
