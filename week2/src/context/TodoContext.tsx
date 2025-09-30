import { createContext, useContext, useState, type ReactNode } from "react";

export type Task = { id: number; text: string };

type TodoContextType = {
  input: string;
  setInput: (v: string) => void;
  todos: Task[];
  doneTasks: Task[];
  add: () => void;
  complete: (task: Task) => void;
  remove: (task: Task) => void;
};

const TodoContext = createContext<TodoContextType | null>(null);

export function useTodo() {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error("useTodo must be used within <TodoProvider>");
  return ctx;
}

export function TodoProvider({ children }: { children: ReactNode }) {
  const [input, setInput] = useState("");
  const [todos, setTodos] = useState<Task[]>([]);
  const [doneTasks, setDoneTasks] = useState<Task[]>([]);

  const add = () => {
    const text = input.trim();
    if (!text) return;
    setTodos((prev) => [...prev, { id: Date.now(), text }]);
    setInput("");
  };

  const complete = (task: Task) => {
    setTodos((prev) => prev.filter((t) => t.id !== task.id));
    setDoneTasks((prev) => [...prev, task]);
  };

  const remove = (task: Task) => {
    setDoneTasks((prev) => prev.filter((t) => t.id !== task.id));
  };

  return (
    <TodoContext.Provider value={{ input, setInput, todos, doneTasks, add, complete, remove }}>
      {children}
    </TodoContext.Provider>
  );
}
