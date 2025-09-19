export class TodoStore {
    constructor() {
        this.todos = [];
    }
    get active() {
        return this.todos.filter((t) => !t.done);
    }
    get done() {
        return this.todos.filter((t) => t.done);
    }
    add(title) {
        const todo = {
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
    complete(id) {
        this.todos = this.todos.map((t) => (t.id === id ? Object.assign(Object.assign({}, t), { done: true }) : t));
    }
    remove(id) {
        this.todos = this.todos.filter((t) => t.id !== id);
    }
    createId() {
        const id = typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        return `t_${id}`;
    }
}
