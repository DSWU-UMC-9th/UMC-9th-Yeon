import  { useCartStore } from "@/store/cartStore";
import { useModalStore } from "@/store/modalStore";

export default function Modal() {
  const close = useModalStore((state) => state.close);
  const clearCart = useCartStore((state) => state.clearCart);

  const handleYes = () => {
    clearCart();
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-64 p-6 text-center bg-white rounded-lg shadow-lg">
        <p className="mb-6 text-lg font-semibold">정말 삭제하시겠습니까?</p>

        <div className="flex justify-between gap-3">
          <button
            onClick={close}
            className="w-full py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            아니요
          </button>

          <button
            onClick={handleYes}
            className="w-full py-2 text-white bg-red-500 rounded hover:bg-red-600"
          >
            네
          </button>
        </div>
      </div>
    </div>
  );
}