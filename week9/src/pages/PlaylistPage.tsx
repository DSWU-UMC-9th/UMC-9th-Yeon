import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@store/store";
import {
  clearCart,
  calculateTotals,
} from "@features/cart/cartSlice";
import CartItemCard from "@components/CartItemCard";

export default function PlaylistPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { cartItems, amount, total } = useSelector(
    (state: RootState) => state.cart
  );

  useEffect(() => {
    dispatch(calculateTotals());
  }, [cartItems, dispatch]);

  return (
    <div className="w-full pb-8">
      <header className="flex items-center justify-between px-6 py-3 text-white bg-gray-800">
        <h1 className="text-3xl font-bold">Ohtani Ahn</h1>

        <div className="flex items-center gap-2 text-xl">
          <span>🛒</span>
          <span>{amount}</span>
        </div>
      </header>

      <div className="px-44">
        {cartItems.map(item => (
          <CartItemCard key={item.id} {...item} />
        ))}
      </div>

      <div className="flex justify-center my-10">
        <button
          onClick={() => dispatch(clearCart())}
          className="px-5 py-2 border rounded-md hover:bg-gray-100"
        >
          전체 삭제
        </button>
      </div>

      <div className="text-2xl font-bold text-center">
        총 금액: ₩{total.toLocaleString()}
      </div>
    </div>
  );
}