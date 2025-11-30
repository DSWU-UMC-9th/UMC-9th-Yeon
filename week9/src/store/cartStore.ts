import { create } from "zustand";
import cartItemsData from "@constants/cartItems";

export interface CartItem {
  id: string;
  title: string;
  singer: string;
  price: number;
  img: string;
  amount: number;
}

interface CartState {
  cartItems: CartItem[];
  amount: number;
  total: number;
  increase: (id: string) => void;
  decrease: (id: string) => void;
  clearCart: () => void;
  calculateTotals: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: cartItemsData.map(item => ({
    ...item,
    price: typeof item.price === 'string' ? parseFloat(item.price) : item.price
  })),
  amount: 0,
  total: 0,

  increase: (id) =>
    set((state) => {
      const updated = state.cartItems.map((item) =>
        item.id === id ? { ...item, amount: item.amount + 1 } : item
      );
      return { cartItems: updated };
    }),

  decrease: (id) =>
    set((state) => {
      const target = state.cartItems.find((i) => i.id === id);
      if (!target) return {};

      if (target.amount <= 1) {
        return { cartItems: state.cartItems.filter((i) => i.id !== id) };
      }

      const updated = state.cartItems.map((item) =>
        item.id === id ? { ...item, amount: item.amount - 1 } : item
      );

      return { cartItems: updated };
    }),

  clearCart: () =>
    set(() => ({
      cartItems: [],
      amount: 0,
      total: 0,
    })),

  calculateTotals: () => {
    const { cartItems } = get();
    let amount = 0;
    let total = 0;

    cartItems.forEach((i) => {
      amount += i.amount;
      total += i.amount * i.price;
    });

    set({ amount, total });
  },
}));