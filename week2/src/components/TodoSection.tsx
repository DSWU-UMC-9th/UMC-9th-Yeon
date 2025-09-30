import { type ReactNode } from "react";
import { useTheme } from "../context/ThemeContext";

export default function TodoSection({ title, children }: { title: string; children: ReactNode }) {
  const { dark } = useTheme();

  return (
    <section className={`mt-6 w-full`}>
      <h2 className={`mb-2 text-lg font-semibold ${dark ? "text-slate-100" : "text-neutral-900"}`}>{title}</h2>
      <ul className={`list-none p-0 m-0 grid gap-2 ${dark ? "text-slate-100" : "text-neutral-900"}`}>{children}</ul>
    </section>
  );
}
