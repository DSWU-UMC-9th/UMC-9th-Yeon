import { TodoProvider } from "./context/TodoContext";
import TodoInput from "./components/TodoInput";
import TodoList from "./components/TodoList";
import TodoSection from "./components/TodoSection";

export default function App() {
  return (
    <TodoProvider>
      <div className="min-h-screen bg-slate-100 text-neutral-900 flex items-center justify-center">
        <main className="w-[500px] max-w-full mx-auto p-7 sm:p-8 bg-white rounded-2xl shadow-[0_6px_32px_rgba(0,0,0,0.11),0_1.5px_5px_rgba(0,0,0,0.04)] text-center">
          <h1 className="mb-4 text-2xl font-semibold">Yeon TODO</h1>

          <TodoInput />

          <div className="mt-6 flex justify-around gap-2.5">
            <TodoSection title="할 일">
              <TodoList mode="todo" />
            </TodoSection>

            <TodoSection title="완료">
              <TodoList mode="done" />
            </TodoSection>
          </div>
        </main>
      </div>
    </TodoProvider>
  );
}
