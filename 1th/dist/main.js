import { TodoStore } from "./store.js";
import { assertNever } from "./types.js";
const qs = (sel, parent = document) => {
  const el = parent.querySelector(sel);
  if (!el) throw new Error(`선택자 '${sel}' 요소를 찾을 수 없습니다.`);
  return el;
};
const store = new TodoStore();
const form = qs("#todo-form");
const input = qs("#todo-input");
const todoList = qs("#todo-list");
const doneList = qs("#done-list");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    store.add(input.value);
    input.value = "";
    render();
  } catch (err) {
    alert(err.message);
  }
});
function render() {
  renderList(todoList, store.active, "active");
  renderList(doneList, store.done, "done");
}
function renderList(container, items, kind) {
  container.innerHTML = "";
  for (const t of items) {
    container.appendChild(renderItem(t, kind));
  }
}
function renderItem(todo, kind) {
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
    assertNever(kind);
  }
  li.append(title, actions);
  return li;
}
render();
