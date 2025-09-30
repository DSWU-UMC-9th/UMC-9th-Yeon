import { type ReactNode } from "react";

export default function TodoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6 w-full">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <ul className="list-none p-0 m-0 grid gap-2">{children}</ul>
    </section>
  );
}
