import { useCartStore, type CartItem } from "@store/cartStore";


export default function CartItemCard(item: CartItem) {
  const increase = useCartStore((state) => state.increase);
  const decrease = useCartStore((state) => state.decrease);

  return (
    <div className="flex justify-between py-4 border-b">
      <div className="flex gap-3">
        <img src={item.img} className="object-cover w-20 h-20 rounded" />

        <div>
          <p className="font-semibold">{item.title}</p>
          <p className="text-sm text-gray-500">{item.singer}</p>
          <p className="mt-1 font-bold">${item.price}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => decrease(item.id)}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          -
        </button>

        <div className="px-4 py-1 border rounded">{item.amount}</div>

        <button
          onClick={() => increase(item.id)}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          +
        </button>
      </div>
    </div>
  );
}