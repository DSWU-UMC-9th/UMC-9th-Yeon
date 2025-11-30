import { useEffect } from "react";
import { useCartStore } from "@store/cartStore";
import { useModalStore } from "@store/modalStore";
import CartItemCard from "@components/CartItemCard";
import Modal from "@components/Modal";

export default function PlaylistPage() {
  const { cartItems, amount, total, calculateTotals } = useCartStore();
  const { isOpen, open } = useModalStore();

  useEffect(() => {
    calculateTotals();
  }, [cartItems, calculateTotals]);
  return (
    <div className="relative w-full pb-8">
      <header className="flex items-center justify-between px-5 py-3 text-white bg-gray-800">
        <h1 className="text-3xl font-bold">Ohtani Ahn</h1>
        <div className="flex items-center gap-2 text-xl">
          <span>🛒</span>
          <span>{amount}</span>
        </div>
      </header>

      {cartItems.length === 0 ? (
        <div className="py-20 text-center px-44">
          <p className="mb-6 text-lg font-semibold">장바구니가 비어있습니다.</p>

          <button
            onClick={open}
            className="px-5 py-2 border rounded-md hover:bg-gray-100"
          >
            전체 삭제
          </button>
        </div>
      ) : (
        <div className="px-44">
          <div>
            {cartItems.map((item) => (
              <CartItemCard key={item.id} {...item} />
            ))}
          </div>

          <div className="flex justify-center my-10">
            <button
              onClick={open}
              className="px-5 py-2 border rounded-md hover:bg-gray-100"
            >
              전체 삭제
            </button>
          </div>

          <div className="text-2xl font-bold text-center">
            총 금액: ₩{total.toLocaleString()}
          </div>
        </div>
      )}

      {isOpen && <Modal />}
    </div>
  );
}