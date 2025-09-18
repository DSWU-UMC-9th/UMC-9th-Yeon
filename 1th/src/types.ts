// 고유 ID에 대한 브랜드 타입
type Brand<T, B extends string> = T & { readonly __brand: B };
export type TodoId = Brand<string, "TodoId">;

// Todo 모델
export interface Todo {
  readonly id: TodoId;
  readonly title: string;
  readonly createdAt: Date;
  readonly done: boolean;
}

// 유틸: 절대 오면 안 되는 분기 체크용
export function assertNever(x: never): never {
  throw new Error(`Unreachable: ${x}`);
}
