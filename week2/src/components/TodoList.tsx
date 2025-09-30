import { useTodo } from "../context/TodoContext";
import TodoItem from "./TodoItem";

export default function TodoList({ mode }: { mode: "todo" | "done" }) {
  const { todos, doneTasks } = useTodo();
  const list = mode === "todo" ? todos : doneTasks;

  return (
    <ul className="list-none p-0 m-0 grid gap-2">
      {list.map((task) => (
        <TodoItem key={task.id} task={task} mode={mode} />
      ))}
    </ul>
  );
}
