import PlusIcon from "../../assets/plus.svg";
import { useNavigate } from "react-router-dom";
export default function Fab() {
  const nav = useNavigate();
  return (
    <button
      onClick={() => nav("/lp/new")}
      className="fixed bottom-6 right-6 z-30 h-12 w-12 rounded-full bg-pink-600 hover:bg-pink-500 flex items-center justify-center text-2xl"
      aria-label="create"
    >
      <img src={PlusIcon} alt="create" className="w-5 h-5" />
    </button>
  );
}
