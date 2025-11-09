const getStatus = (e: any): number | undefined => {
  try {
    return e?.response?.status;
  } catch {
    return undefined;
  }
};
import type { LpDetail } from "../types/lp";
import api from "./client";

export async function fetchLp(id: string, token?: string | null) {
  const { data } = await api.get(`/lps/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const payload: any = data?.data ?? data;
  const lp: any = payload?.lp ?? payload?.data ?? payload;
  return lp as LpDetail;
}

export async function updateLp(
  lpId: string,
  body: { title?: string; content?: string; thumbnail?: string; published?: boolean; tags?: string[] },
  token?: string | null
) {
  const { data } = await api.patch(`/lps/${lpId}`, body, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data;
}

export async function deleteLp(lpId: string, token?: string | null) {
  const { data } = await api.delete(`/lps/${lpId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data;
}

export async function createLp(
  body: { title: string; content: string; thumbnail?: string; tags?: string[]; published?: boolean },
  token?: string | null
) {
  const { data } = await api.post("/lps", body, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data;
}

export async function likeLp(lpId: string, token?: string | null) {
  if (!token) {
    console.warn("[LIKE API] token missing; aborting request");
    throw new Error("AUTH_MISSING");
  }
  console.log("[LIKE API] token prefix:", token.slice(0, 10));
  try {
    const { data } = await api.post(`/lps/${lpId}/likes`, null, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { ok: true, liked: true, data } as const;
  } catch (e) {
    // If the user already liked it, some backends return 409 Conflict.
    if (getStatus(e) === 409) {
      const { data } = await api.delete(`/lps/${lpId}/likes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { ok: true, liked: false, data } as const;
    }
    throw e;
  }
}

export async function unlikeLp(lpId: string, token?: string | null) {
  if (!token) {
    console.warn("[LIKE API] token missing; aborting request");
    throw new Error("AUTH_MISSING");
  }
  console.log("[LIKE API] token prefix:", token.slice(0, 10));
  try {
    const { data } = await api.delete(`/lps/${lpId}/likes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { ok: true, liked: false, data } as const;
  } catch (e) {
    // If like doesn't exist yet, some backends return 404 Not Found – create it instead
    if (getStatus(e) === 404) {
      const { data } = await api.post(`/lps/${lpId}/likes`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { ok: true, liked: true, data } as const;
    }
    throw e;
  }
}
