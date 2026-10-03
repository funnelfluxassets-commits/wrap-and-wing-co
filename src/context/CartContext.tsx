import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartCustomization, CartItem, MenuItem, OrderMode, StoreLocation } from '../types';
import { STORES } from '../data/stores';

interface CartContextType {
  items: CartItem[];
  orderMode: OrderMode;
  setOrderMode: (mode: OrderMode) => void;
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

  const [orderMode, setOrderMode] = useState<OrderMode>(() => {
    try {
      const saved = localStorage.getItem('wrap_wing_mode');
      return (saved as OrderMode) || 'collection';
    } catch {
      return 'collection';
    }
  });

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

  const clearCart = () => {
    setItems([]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
  const deliveryFee = orderMode === 'delivery' && items.length > 0 ? 25.0 : 0;
  const grandTotal = subtotal + deliveryFee;
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        orderMode,
        setOrderMode,
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
