import { useTodo, type Task } from "../context/TodoContext";

export default function TodoItem({ task, mode }: { task: Task; mode: "todo" | "done" }) {
  const { complete, remove } = useTodo();
  const isDone = mode === "done";
  const label = isDone ? "삭제" : "완료";
  const onClick = isDone ? () => remove(task) : () => complete(task);

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-100 rounded-lg shadow-sm">
      <span className="text-sm">{task.text}</span>
      <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 rounded-md text-sm font-medium ${
          isDone ? "bg-red-600 text-white" : "bg-green-600 text-white"
        }`}
      >
        {label}
      </button>
    </li>
  );
}
