'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '@/types/product';

export interface WholesaleCartItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  productNumber: number;
  quantity: number;
}

interface WholesaleCartContextType {
  items: WholesaleCartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  getItemQuantity: (id: string) => number;
  itemCount: number;
  total: number;
}

const WholesaleCartContext = createContext<WholesaleCartContextType | undefined>(undefined);

const WHOLESALE_CART_KEY = 'jimmy-potters-wholesale-cart';

export function WholesaleCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WholesaleCartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WHOLESALE_CART_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const migrated = parsed.map((item: WholesaleCartItem) => ({
          ...item,
          quantity: item.quantity || 1,
        }));
        setItems(migrated);
      }
    } catch {
      // ignore parse errors
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(WHOLESALE_CART_KEY, JSON.stringify(items));
    }
  }, [items, loaded]);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.images[0],
          productNumber: product.productNumber,
          quantity: 1,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback(
    (id: string) => items.some((item) => item.id === id),
    [items]
  );

  const getItemQuantity = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      return item ? item.quantity : 0;
    },
    [items]
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <WholesaleCartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, isInCart, getItemQuantity, itemCount, total }}
    >
      {children}
    </WholesaleCartContext.Provider>
  );
}

export function useWholesaleCart() {
  const context = useContext(WholesaleCartContext);
  if (!context) {
    throw new Error('useWholesaleCart must be used within a WholesaleCartProvider');
  }
  return context;
}
