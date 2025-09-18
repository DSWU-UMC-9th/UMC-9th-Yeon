import { TodoStore } from "./store.js";
import type { Todo } from "./types.js";
import { assertNever } from "./types.js";

const qs = <T extends Element>(sel: string, parent: ParentNode = document) => {
  const el = parent.querySelector(sel);
  if (!el) throw new Error(`선택자 '${sel}' 요소를 찾을 수 없습니다.`);
  return el as T;
};

const store = new TodoStore();

const form = qs<HTMLFormElement>("#todo-form");
const input = qs<HTMLInputElement>("#todo-input");
const todoList = qs<HTMLUListElement>("#todo-list");
const doneList = qs<HTMLUListElement>("#done-list");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    store.add(input.value);
    input.value = "";
    render();
  } catch (err) {
    alert((err as Error).message);
  }
});

function render() {
  renderList(todoList, store.active, "active");
  renderList(doneList, store.done, "done");
}

function renderList(container: HTMLUListElement, items: readonly Todo[], kind: "active" | "done") {
  container.innerHTML = "";
  for (const t of items) {
    container.appendChild(renderItem(t, kind));
  }
}

function renderItem(todo: Todo, kind: "active" | "done") {
  const li = document.createElement("li");
  li.className = "todo-item";

  const title = document.createElement("span");
  title.className = "todo-item__title";
  title.textContent = todo.title;

  const actions = document.createElement("div");
  actions.className = "todo-item__actions";

  if (kind === "active") {
    const completeBtn = document.createElement("button");
    completeBtn.className = "todo-item__btn todo-item__btn--complete";
    completeBtn.textContent = "완료";
    completeBtn.addEventListener("click", () => {
      store.complete(todo.id);
      render();
    });
    actions.appendChild(completeBtn);
  } else if (kind === "done") {
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "todo-item__btn todo-item__btn--delete";
    deleteBtn.textContent = "삭제";
    deleteBtn.addEventListener("click", () => {
      store.remove(todo.id);
      render();
    });
    actions.appendChild(deleteBtn);
  } else {
    // 컴파일 시 never 체크 (noFallthrough + 안전성)
    assertNever(kind);
  }

  li.append(title, actions);
  return li;
}

// 최초 렌더
render();
