import { useState, useCallback, useEffect } from 'react';

export interface CartItemModifier {
  id: string;
  name: string;
  priceCents: number;
}

export interface CartItemAddOn {
  id: string;
  variationId: string;
  name: string;
  priceCents: number;
}

export interface CartItem {
  id: string;
  cartKey: string;     // unique key per customization combo
  variationId: string;
  name: string;
  price: number;       // total per unit: base + modifiers + add-ons
  basePrice: number;   // original item price (no extras)
  imageUrl: string | null;
  quantity: number;
  modifiers?: CartItemModifier[];
  addOns?: CartItemAddOn[];
}

function buildCartKey(item: { id: string; modifiers?: CartItemModifier[]; addOns?: CartItemAddOn[] }): string {
  const modKey = (item.modifiers || []).map(m => m.id).sort().join(',');
  const addonKey = (item.addOns || []).map(a => a.id).sort().join(',');
  return `${item.id}|${modKey}|${addonKey}`;
}

const CART_STORAGE_KEY = 'shake_cart';

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [open, setOpen] = useState(false);

  // Persist cart to localStorage on every change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const key = item.cartKey || buildCartKey(item);
      const idx = prev.findIndex((i) => i.cartKey === key);

      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { ...item, cartKey: key, quantity: 1 }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((cartKey: string) => {
    setItems((prev) => prev.filter((i) => i.cartKey !== cartKey));
  }, []);

  const updateQty = useCallback((cartKey: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.cartKey !== cartKey));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.cartKey === cartKey ? { ...i, quantity: qty } : i))
      );
    }
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return { items, count, subtotal, open, setOpen, add, remove, updateQty, clear };
}
