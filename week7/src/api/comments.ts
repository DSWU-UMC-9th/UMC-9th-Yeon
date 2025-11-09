import type { LpComment } from "../types/lp";
import api from "./client";

export async function fetchCommentsCount(lpId: string, token?: string | null): Promise<number> {
  const { data } = await api.get(`/lps/${lpId}/comments`, {
    params: { cursor: 0, limit: 1, order: "asc" },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const payload: any = data?.data ?? data;
  if (typeof payload?.total === "number") return payload.total as number;
  if (typeof payload?.totalElements === "number") return payload.totalElements as number;
  if (typeof payload?.count === "number") return payload.count as number;
  const arr = Array.isArray(payload) ? payload : ((payload?.data ?? payload?.items ?? payload?.content ?? []) as any[]);
  const hasNext = Boolean(payload?.hasNext ?? payload?.hasMore);
  return hasNext ? Number.NaN : Array.isArray(arr) ? arr.length : 0;
}

export async function fetchCommentsPage(
  lpId: string,
  cursor: number,
  limit: number,
  order: "asc" | "desc",
  token?: string | null
) {
  const params: Record<string, any> = { cursor, limit, order };
  const { data } = await api.get(`/lps/${lpId}/comments`, {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const payload: any = data?.data ?? data;
  const items: LpComment[] = (payload?.data ?? payload?.items ?? payload?.content ?? []) as LpComment[];
  const total = (payload?.total ?? payload?.totalElements ?? payload?.count) as number | undefined;
  const hasMore: boolean = Boolean(payload?.hasNext ?? (Array.isArray(items) && items.length === limit));
  const nextCursor: number | undefined = payload?.nextCursor ?? (hasMore ? cursor + limit : undefined);
  return { items, nextCursor, hasMore, total };
}

export async function createComment(lpId: string, content: string, token?: string | null) {
  const { data } = await api.post(
    `/lps/${lpId}/comments`,
    { content },
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
  );
  return data;
}

// PATCH comment (preferred route) with fallback to /comments/:id if backend differs
export async function updateComment(lpId: string, commentId: number, content: string, token?: string | null) {
  try {
    const { data } = await api.patch(
      `/lps/${lpId}/comments/${commentId}`,
      { content },
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
    );
    return data;
  } catch (e) {
    const { data } = await api.patch(
      `/comments/${commentId}`,
      { content },
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
    );
    return data;
  }
}

// DELETE comment with same fallback strategy
export async function removeComment(lpId: string, commentId: number, token?: string | null) {
  try {
    const { data } = await api.delete(`/lps/${lpId}/comments/${commentId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return data;
  } catch (e) {
    const { data } = await api.delete(`/comments/${commentId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return data;
  }
}
