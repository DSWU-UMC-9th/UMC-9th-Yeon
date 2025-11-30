import { useDispatch } from "react-redux";
import {
  increase,
  decrease,
} from "@/features/cart/cartSlice";
import {type AppDispatch } from "@/store/store";

interface Props {
  id: string;
  title: string;
  singer: string;
  price: number;
  img: string;
  amount: number;
}

export default function CartItemCard({
  id,
  title,
  singer,
  price,
  img,
  amount,
}: Props) {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div className="flex justify-between py-4 border-b ">
      <div className="flex gap-3">
        <img src={img} className="object-cover w-20 h-20 rounded" />
        <div className="flex flex-col">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-gray-500">{singer}</p>
          <p className="font-bold">${price}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch(decrease(id))}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          -
        </button>

        <div className="px-4 py-1 border rounded">{amount}</div>

        <button
          onClick={() => dispatch(increase(id))}
          className="px-3 py-1 bg-gray-200 rounded"
        >
          +
        </button>
      </div>
    </div>
  );
}