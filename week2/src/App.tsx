import { TodoProvider } from "./context/TodoContext";
import TodoInput from "./components/TodoInput";
import TodoList from "./components/TodoList";
import TodoSection from "./components/TodoSection";

import { useTheme } from "./context/ThemeContext";

function ThemeToggleButton() {
  const { dark, toggle } = useTheme();

  return (
    <div
      onClick={toggle}
      className={`transition-colors border-0 flex items-center justify-end ${dark ? "bg-slate-800" : "bg-slate-100"}`}
    >
      <button
        className={`transition-colors mt-[42px] mr-[42px] mb-[-54px] ml-0 border-4 rounded-[10px] px-2.5 py-1.5 ${
          dark ? "bg-white border-white" : "bg-slate-800 border-slate-800 text-slate-100"
        }`}
      >
        {dark ? "☀️ 라이트 모드" : "🌙 다크 모드"}
      </button>
    </div>
  );
}

export default function App() {
  const { dark } = useTheme();

  return (
    <TodoProvider>
      <ThemeToggleButton />

      <div
        className={`transition-colors min-h-screen flex items-center justify-center border-0 ${
          dark ? "bg-gray-800 text-slate-100" : "bg-slate-100 text-neutral-900"
        }`}
      >
        <main
          className={`w-[500px] max-w-full mx-auto p-7 sm:p-8 ${
            dark ? "bg-gray-500" : "bg-white"
          } rounded-2xl shadow-[0_6px_32px_rgba(0,0,0,0.11),0_1.5px_5px_rgba(0,0,0,0.04)] text-center`}
        >
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
