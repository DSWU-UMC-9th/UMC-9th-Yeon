import { type ChangeEvent, type FormEvent } from "react";
import { useTodo } from "../context/TodoContext";

export default function TodoInput() {
  const { input, setInput, add } = useTodo();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value);
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    add();
  };

  return (
    <form className="flex gap-2 mb-6" onSubmit={handleSubmit}>
      <input
        type="text"
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none"
        placeholder="할 일 입력"
        value={input}
        onChange={handleChange}
        required
      />
      <button
        type="submit"
        className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium transition-colors"
      >
        할 일 추가
      </button>
    </form>
  );
}
