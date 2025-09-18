import type { Todo, TodoId } from "./types";

export class TodoStore {
  private todos: Todo[] = [];

  get active(): readonly Todo[] {
    return this.todos.filter((t) => !t.done);
  }
  get done(): readonly Todo[] {
    return this.todos.filter((t) => t.done);
  }

  add(title: string): Todo {
    const todo: Todo = {
      id: this.createId(),
      title: title.trim(),
      createdAt: new Date(),
      done: false,
    };
    if (!todo.title) {
      throw new Error("빈 제목은 추가할 수 없습니다.");
    }
    this.todos = [todo, ...this.todos];
    return todo;
  }

  complete(id: TodoId): void {
    this.todos = this.todos.map((t) => (t.id === id ? { ...t, done: true } : t));
  }

  remove(id: TodoId): void {
    this.todos = this.todos.filter((t) => t.id !== id);
  }

  private createId(): TodoId {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    return `t_${id}` as TodoId;
  }
}
