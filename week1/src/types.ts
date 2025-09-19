type Brand<T, B extends string> = T & { readonly __brand: B };
export type TodoId = Brand<string, "TodoId">;

export interface Todo {
  readonly id: TodoId;
  readonly title: string;
  readonly createdAt: Date;
  readonly done: boolean;
}

export function assertNever(x: never): never {
  throw new Error(`Unreachable: ${x}`);
}
