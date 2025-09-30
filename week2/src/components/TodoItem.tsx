import { useTodo, type Task } from "../context/TodoContext";
import { useTheme } from "../context/ThemeContext";

export default function TodoItem({ task, mode }: { task: Task; mode: "todo" | "done" }) {
  const { complete, remove } = useTodo();
  const isDone = mode === "done";
  const label = isDone ? "삭제" : "완료";
  const onClick = isDone ? () => remove(task) : () => complete(task);

  const { dark } = useTheme();

  return (
    <li
      className={`transition-colors flex items-center justify-between gap-3 px-4 py-3 ${
        dark ? "bg-gray-600" : "bg-gray-100"
      } rounded-lg shadow-sm`}
    >
      <span className="text-sm">{task.text}</span>
      <button
        type="button"
        onClick={onClick}
        className={`transition-colors px-4 py-2 rounded-md text-sm font-medium text-white ${
          isDone ? (dark ? "bg-red-800" : "bg-red-600 ") : dark ? "bg-green-800" : "bg-green-600"
        }`}
      >
        {label}
      </button>
    </li>
  );
}
