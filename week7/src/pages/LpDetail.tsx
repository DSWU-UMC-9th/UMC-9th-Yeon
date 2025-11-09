import React from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import api from "../api/client";
import { useAuth } from "../hooks/useAuth";
import ListSkeleton, { CommentsSkeleton } from "../components/ListSkeleton";
import editIcon from "../assets/edit.svg";
import trashIcon from "../assets/trash.svg";
import likeIcon from "../assets/like.svg";
import moreIcon from "../assets/more.svg";

/**
 * Types
 */
type LpDetail = {
  id: number;
  title: string;
  description?: string;
  body?: string;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  coverUrl?: string | null;
  likes?: any[];
  totalLikes?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  author?: {
    id: number;
    email: string;
    name: string;
    profileImageUrl?: string | null;
    role?: string;
  };
  category?: { id: number; name: string };
  /** tags can be strings or objects with name */
  tags?: Array<string | { id?: number; name: string }>;
  createdAt: string;
  updatedAt?: string;
};

type LpComment = {
  id: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
  author?: {
    id?: number;
    email?: string;
    name?: string;
    profileImageUrl?: string | null;
    role?: string;
  };
};

/**
 * API helpers
 */
async function fetchLp(id: string, token?: string | null) {
  const { data } = await api.get(`/lps/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const payload: any = data?.data ?? data;
  const lp: any = payload?.lp ?? payload?.data ?? payload;
  return lp as LpDetail;
}

async function fetchCommentsCount(lpId: string, token?: string | null): Promise<number> {
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

async function fetchCommentsPage(
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

async function createComment(lpId: string, content: string, token?: string | null) {
  const { data } = await api.post(
    `/lps/${lpId}/comments`,
    { content },
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
  );
  return data;
}

// PATCH comment (preferred route) with fallback to /comments/:id if backend differs
async function updateComment(lpId: string, commentId: number, content: string, token?: string | null) {
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
async function removeComment(lpId: string, commentId: number, token?: string | null) {
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

// Update / Delete LP (author only)
async function updateLp(
  lpId: string,
  body: { title?: string; content?: string; thumbnail?: string; published?: boolean; tags?: string[] },
  token?: string | null
) {
  const { data } = await api.patch(`/lps/${lpId}`, body, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data;
}

async function deleteLp(lpId: string, token?: string | null) {
  const { data } = await api.delete(`/lps/${lpId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data;
}

// Like/unlike LP
async function likeLp(lpId: string, token?: string | null) {
  const { data } = await api.post(`/lps/${lpId}/likes`, null, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data;
}

async function unlikeLp(lpId: string, token?: string | null) {
  const { data } = await api.delete(`/lps/${lpId}/likes`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return data;
}

// Image upload helper
async function uploadImage(file: File, token?: string | null) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post(`/uploads`, form, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "multipart/form-data",
    },
  });
  // Swagger shows the server returns { status, message, statusCode, data: { imageUrl: "..." } }
  // so prefer data.imageUrl, with safe fallbacks for other common shapes.
  const payload: any = data?.data ?? data;
  const url = payload?.imageUrl ?? payload?.url ?? payload?.location ?? payload?.fileUrl ?? payload?.path ?? "";
  return url as string;
}

// Normalize tag names from either ["a","b"] or [{name:"a"},...] shapes
function extractTagNames(src: any): string[] {
  if (!src) return [];
  if (Array.isArray(src)) {
    return src
      .map((t: any) => (typeof t === "string" ? t : t?.name))
      .filter((s: any) => typeof s === "string" && s.trim().length > 0)
      .map((s: string) => s.trim());
  }
  return [];
}

/** utils */
function formatRelative(iso: string) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function LpDetail() {
  const params = useParams();
  const lpid = (params as any)?.lpid ?? (params as any)?.lpId ?? (params as any)?.LPId;
  const { token, user } = useAuth() as { token?: string | null; user?: { id?: number; email?: string } };

  // derive my identity (id/email) from hook or JWT payload as fallback
  const myIdentity = React.useMemo(() => {
    let myId: number | null = typeof user?.id === "number" ? Number(user!.id) : null;
    let myEmail: string | null = (user as any)?.email ?? null;

    if ((!myId || !myEmail) && token) {
      try {
        const payloadStr = atob(token.split(".")[1] || "");
        const payload = JSON.parse(payloadStr);
        // common fields seen in tokens
        const candId = payload?.userId ?? payload?.id ?? (typeof payload?.sub === "string" ? payload.sub : undefined);
        const parsedId = Number(candId);
        if (!myId && Number.isFinite(parsedId)) myId = parsedId;

        if (!myEmail) {
          myEmail =
            payload?.email ??
            (typeof payload?.sub === "string" && payload.sub.includes("@") ? payload.sub : null) ??
            null;
        }
      } catch {
        // ignore decode errors
      }
    }
    return { myId, myEmail };
  }, [token, user]);

  const qc = useQueryClient();
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const [order, setOrder] = React.useState<"new" | "old">("new");
  const [commentText, setCommentText] = React.useState("");

  // per-comment UI state
  const [menuOpenId, setMenuOpenId] = React.useState<number | null>(null);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editingText, setEditingText] = React.useState("");

  // LP inline edit state
  const [isLpEditing, setIsLpEditing] = React.useState(false);
  const [lpTitle, setLpTitle] = React.useState<string>("");
  const [lpContent, setLpContent] = React.useState<string>("");
  const [lpThumb, setLpThumb] = React.useState<string>("");
  const [lpTags, setLpTags] = React.useState<string[]>([]);
  const [newTagText, setNewTagText] = React.useState<string>("");

  // Image upload state/refs for LP editing
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const onPickFile = () => {
    fileInputRef.current?.click();
  };

  const onChangeFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setIsUploading(true);
      const url = await uploadImage(f, token);
      if (url) setLpThumb(url);
    } finally {
      setIsUploading(false);
      // allow picking the same file again
      try {
        e.target.value = "";
      } catch {}
    }
  };

  const enabled = Boolean(token && lpid);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["lp", lpid],
    queryFn: () => fetchLp(lpid!, token),
    enabled,
    retry: (failureCount, err) => {
      const status = (err as AxiosError)?.response?.status ?? 0;
      return status !== 401 && status !== 404 && failureCount < 2;
    },
    staleTime: 60_000,
    keepPreviousData: true,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const PAGE_SIZE = 3;
  const {
    data: commentsPages,
    isLoading: commentsLoading,
    error: commentsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchComments,
  } = useInfiniteQuery({
    queryKey: ["lpComments", lpid, order, token],
    queryFn: ({ pageParam = 0 }) =>
      fetchCommentsPage(lpid!, pageParam as number, PAGE_SIZE, order === "new" ? "desc" : "asc", token),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    enabled: Boolean(token && lpid),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    retry: (failureCount, err) => {
      const status = (err as AxiosError)?.response?.status ?? 0;
      return status !== 401 && failureCount < 2;
    },
  });

  const { data: totalCount } = useQuery({
    queryKey: ["lpCommentsCount", lpid, token],
    queryFn: () => fetchCommentsCount(lpid!, token),
    enabled: Boolean(token && lpid),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  // owner check (by id or email) – kept for reference
  const isOwner =
    (myIdentity.myId && data?.author?.id && Number(myIdentity.myId) === Number(data.author.id)) ||
    (!!myIdentity.myEmail && !!data?.author?.email && myIdentity.myEmail === data.author.email) ||
    false;

  // Allow managing *anyone's* LP (UI level). Set to false to restore owner-only behavior.
  const canManageLp = true || isOwner;

  // LP update
  const { mutate: mutateLpUpdate, isPending: isLpUpdating } = useMutation({
    mutationFn: (payload: { title?: string; content?: string; thumbnail?: string; published?: boolean }) =>
      updateLp(lpid!, payload, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lp", lpid] });
      setIsLpEditing(false);
    },
  });

  // LP delete with robust error handling for 401/403
  const { mutate: mutateLpDelete, isPending: isLpDeleting } = useMutation({
    mutationFn: () => deleteLp(lpid!, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lp", lpid] });
      qc.invalidateQueries({ queryKey: ["lps"] });
      window.location.href = "/";
    },
    onError: (err: AxiosError | any) => {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        alert("삭제 권한이 없습니다.");
        return;
      }
      alert("삭제에 실패했습니다.");
    },
  });

  // Toggle like – ALWAYS try POST first. If server says already-liked (409/400/422), then DELETE to cancel.
  const { mutate: toggleLike, isPending: isTogglingLike } = useMutation({
    mutationFn: async () => {
      try {
        // 1) 좋아요 먼저 시도
        return await likeLp(lpid!, token);
      } catch (err: any) {
        const status = err?.response?.status;
        // 2) 이미 좋아요 상태라면(중복/제약) → 취소 시도
        if (status === 409 || status === 400 || status === 422) {
          try {
            return await unlikeLp(lpid!, token);
          } catch (e2: any) {
            // 취소 대상이 없으면(404) 그냥 노옵
            if (e2?.response?.status === 404) return {};
            throw e2;
          }
        }
        // 그 외는 그대로 에러 전파
        throw err;
      }
    },
    onMutate: async () => {
      const key = ["lp", lpid];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key);
      qc.setQueryData(key, (old: any) => {
        if (!old) return old;
        const next: any = { ...old };
        const wasLiked = Boolean(old.isLiked);
        const willBeLiked = !wasLiked;
        next.isLiked = willBeLiked;
        if (typeof old.totalLikes === "number") {
          next.totalLikes = Math.max(0, (old.totalLikes || 0) + (willBeLiked ? 1 : -1));
        } else if (Array.isArray(old.likes)) {
          const newLen = Math.max(0, old.likes.length + (willBeLiked ? 1 : -1));
          next.likes = new Array(newLen).fill(0);
        }
        return next;
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["lp", lpid], ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["lp", lpid] });
    },
  });

  const { mutate: submitComment, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      if (!commentText.trim()) return Promise.reject(new Error("내용을 입력하세요"));
      return createComment(lpid!, commentText.trim(), token);
    },
    onSuccess: () => {
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["lpComments", lpid] });
      qc.invalidateQueries({ queryKey: ["lpCommentsCount", lpid] });
      refetchComments();
    },
  });

  // edit & delete mutations
  const { mutate: mutateEdit, isPending: isEditing } = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => updateComment(lpid!, id, content, token),
    onSuccess: () => {
      setEditingId(null);
      setEditingText("");
      qc.invalidateQueries({ queryKey: ["lpComments", lpid] });
      qc.invalidateQueries({ queryKey: ["lpCommentsCount", lpid] });
    },
  });

  const { mutate: mutateDelete, isPending: isDeleting } = useMutation({
    mutationFn: ({ id }: { id: number }) => removeComment(lpid!, id, token),
    onSuccess: () => {
      setMenuOpenId(null);
      qc.invalidateQueries({ queryKey: ["lpComments", lpid] });
      qc.invalidateQueries({ queryKey: ["lpCommentsCount", lpid] });
    },
  });

  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!commentsOpen) return;
    const el = bottomRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: null, rootMargin: "0px", threshold: 1.0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [commentsOpen, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading)
    return (
      <section className="p-6">
        <ListSkeleton />
      </section>
    );

  if (isError) {
    const status = (error as AxiosError | any)?.response?.status;
    return (
      <section className="p-6">
        <div className="rounded border border-red-900/40 bg-red-950/30 p-4 space-y-2">
          <div className="text-red-300 font-medium">
            {status === 404 ? "존재하지 않는 게시글입니다." : "불러오기 오류"}
          </div>
          {error && <pre className="text-xs text-red-400 whitespace-pre-wrap">{(error as Error).message}</pre>}
          {status !== 404 && (
            <button onClick={() => refetch()} className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700">
              재시도
            </button>
          )}
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="p-6">
        <div className="rounded border border-yellow-900/40 bg-yellow-950/30 p-4 text-yellow-200">
          데이터를 찾을 수 없습니다.
        </div>
      </section>
    );
  }

  const imageUrl =
    (data as any)?.thumbnail ??
    (data as any)?.thumbnailUrl ??
    (data as any)?.imageUrl ??
    (data as any)?.coverUrl ??
    null;

  const contentText = (data as any)?.content ?? data?.body ?? data?.description ?? "";
  const likeCount =
    typeof data?.totalLikes === "number" ? data.totalLikes : Array.isArray(data?.likes) ? data!.likes!.length : 0;

  const authorName = data?.author?.name ?? "작성자";
  const authorImage = data?.author?.profileImageUrl ?? null;
  const timeText = data?.createdAt ? formatRelative(data.createdAt) : "";
  const tags = extractTagNames((data as any)?.tags);

  const _pages = commentsPages?.pages ?? [];
  const commentList: LpComment[] = _pages.flatMap((p: any) => p.items as LpComment[]);
  const preloadedFirst = commentsPages?.pages?.[0];
  const firstPageTotal = preloadedFirst?.total as number | undefined;
  const firstHasMore = Boolean(preloadedFirst?.hasMore ?? preloadedFirst?.hasNext);
  const preloadedLen = Array.isArray(preloadedFirst?.items) ? preloadedFirst!.items.length : 0;
  const totalKnown = typeof totalCount === "number" && Number.isFinite(totalCount as number);
  const commentCountText = totalKnown
    ? String(totalCount)
    : preloadedFirst
    ? `${preloadedLen}${firstHasMore ? "+" : ""}`
    : "0";

  return (
    <article className="relative  max-w-3xl mx-auto rounded-2xl border border-neutral-800 bg-neutral-900/50 shadow-xl">
      {/* Card header */}
      <header className="flex items-center justify-between px-6 pt-5">
        <div className="relative">
          <div className="flex items-center gap-3">
            {authorImage ? (
              <img src={authorImage} alt={authorName} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-neutral-700 text-neutral-200 grid place-items-center text-xs">
                {initials(authorName)}
              </div>
            )}
            <div className="leading-tight">
              <div className="text-sm text-neutral-200">{authorName}</div>
              <div className="text-xs text-neutral-500">{timeText}</div>
            </div>
          </div>
        </div>
        {canManageLp && (
          <div className="flex items-center gap-3 text-neutral-400">
            {!isLpEditing ? (
              <>
                <button
                  className="hover:opacity-90"
                  title="수정"
                  aria-label="수정"
                  onClick={() => {
                    setLpTitle(data.title ?? "");
                    setLpContent(contentText ?? "");
                    setLpThumb((data as any)?.thumbnail ?? (data as any)?.thumbnailUrl ?? "");
                    setLpTags(extractTagNames((data as any)?.tags));
                    setIsLpEditing(true);
                  }}
                >
                  <img src={editIcon} alt="수정" className="h-5 w-5" />
                </button>
                <button
                  className="hover:opacity-90"
                  title="삭제"
                  aria-label="삭제"
                  onClick={() => {
                    if (confirm("이 LP를 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.")) {
                      mutateLpDelete();
                    }
                  }}
                  disabled={isLpDeleting}
                >
                  <img src={trashIcon} alt="삭제" className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  className="px-3 py-1 rounded bg-pink-600 hover:bg-pink-500 text-white text-sm"
                  title="저장"
                  aria-label="저장"
                  onClick={() =>
                    mutateLpUpdate({
                      title: lpTitle.trim() || undefined,
                      content: lpContent.trim() || undefined,
                      thumbnail: lpThumb.trim() || undefined,
                      tags: lpTags.length ? lpTags : undefined,
                    })
                  }
                  disabled={isLpUpdating}
                >
                  {isLpUpdating ? "저장 중..." : "저장"}
                </button>
                <button
                  className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-sm"
                  title="취소"
                  aria-label="취소"
                  onClick={() => {
                    setIsLpEditing(false);
                    setLpTitle("");
                    setLpContent("");
                    setLpThumb("");
                    setLpTags([]);
                    setNewTagText("");
                  }}
                  disabled={isLpUpdating}
                >
                  취소
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Title */}
      <div className="px-6 mt-3">
        {!isLpEditing ? (
          <h1 className="text-xl font-semibold text-neutral-100">{data.title}</h1>
        ) : (
          <input
            value={lpTitle}
            onChange={(e) => setLpTitle(e.target.value)}
            placeholder="제목"
            className="w-full rounded-md bg-neutral-800/70 border border-neutral-700 px-3 py-2 outline-none focus:border-neutral-500 text-neutral-100"
          />
        )}
      </div>

      {/* Media */}
      <div className="px-6 mt-4">
        <div className="mx-auto max-w-md">
          <div
            className={`relative aspect-square overflow-hidden rounded-xl shadow-lg bg-neutral-800 ${
              isLpEditing ? "cursor-pointer group" : ""
            }`}
            onClick={isLpEditing ? onPickFile : undefined}
            role={isLpEditing ? "button" : undefined}
            aria-label={isLpEditing ? "이미지 변경" : undefined}
            title={isLpEditing ? "클릭하여 이미지 변경" : undefined}
          >
            {(isLpEditing ? lpThumb : imageUrl) ? (
              <img
                src={isLpEditing ? lpThumb : (imageUrl as string)}
                alt={data.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-neutral-500">이미지 없음</div>
            )}
            {isLpEditing && (
              <div className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/40 text-neutral-100 text-sm">
                {isUploading ? "업로드 중..." : "클릭해서 이미지 변경"}
              </div>
            )}
          </div>

          {isLpEditing && (
            <>
              {/* 실제 파일 선택 인풋 (숨김) */}
              <input type="file" accept="image/*" ref={fileInputRef} onChange={onChangeFile} className="sr-only" />
              {/* 직접 URL을 붙여 넣어도 동작하도록 유지 */}
              <input
                value={lpThumb}
                onChange={(e) => setLpThumb(e.target.value)}
                placeholder="썸네일 URL"
                className="hidden mt-3 w-full rounded-md bg-neutral-800/70 border border-neutral-700 px-3 py-2 outline-none focus:border-neutral-500 text-neutral-100"
              />
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="px-6 mt-5">
        {!isLpEditing ? (
          <div className="text-sm leading-6 text-neutral-300 justify-center text-center">
            {contentText || "설명이 없습니다."}
          </div>
        ) : (
          <textarea
            value={lpContent}
            onChange={(e) => setLpContent(e.target.value)}
            placeholder="내용"
            rows={4}
            className="resize-none w-full rounded-md bg-neutral-800/70 border border-neutral-700 px-3 py-2 outline-none focus:border-neutral-500 text-neutral-100"
          />
        )}
      </div>

      {/* Tags */}
      <div className="px-6 mt-4">
        {!isLpEditing ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {(tags.length ? tags : []).map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full bg-neutral-800/70 px-2.5 py-1 text-xs text-neutral-300 border border-neutral-700"
              >
                #{t}
              </span>
            ))}
            {tags.length === 0 && <span className="text-xs text-neutral-500">태그 없음</span>}
          </div>
        ) : (
          <div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <input
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = newTagText.trim();
                    if (v && !lpTags.includes(v)) setLpTags((arr) => [...arr, v]);
                    setNewTagText("");
                  }
                }}
                placeholder="LP tag"
                className="w-[92%] rounded-md bg-neutral-800/70 border border-neutral-700 px-3 py-2 outline-none focus:border-neutral-500 text-neutral-100"
              />
              <button
                type="button"
                className="w-fit px-3 py-2 rounded bg-neutral-700 hover:bg-neutral-600 text-sm"
                onClick={() => {
                  const v = newTagText.trim();
                  if (v && !lpTags.includes(v)) setLpTags((arr) => [...arr, v]);
                  setNewTagText("");
                }}
              >
                추가
              </button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mt-5">
              {lpTags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-neutral-800/70 px-2.5 py-1 text-xs text-neutral-200 border border-neutral-700"
                >
                  #{t}
                  <button
                    type="button"
                    className="ml-1 rounded px-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700"
                    aria-label={`태그 ${t} 삭제`}
                    onClick={() => setLpTags((arr) => arr.filter((x) => x !== t))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="px-6 py-5 flex items-center justify-center gap-6">
        <button
          type="button"
          className={`flex items-center gap-2 rounded px-2 py-1 ${
            data?.isLiked ? "text-pink-400" : "text-neutral-200"
          } ${isTogglingLike ? "opacity-60" : "hover:opacity-90"}`}
          aria-pressed={Boolean(data?.isLiked)}
          aria-label={data?.isLiked ? "좋아요 취소" : "좋아요"}
          onClick={() => toggleLike()}
          disabled={isTogglingLike}
        >
          <img src={likeIcon} alt="좋아요" className="h-5 w-5" />
          <span className="font-medium">{likeCount}</span>
        </button>
        <button
          className="flex items-center gap-2 text-neutral-200 hover:opacity-90"
          onClick={() => {
            if (!commentsOpen) {
              qc.removeQueries({ queryKey: ["lpComments", lpid], exact: false });
            }
            setCommentsOpen((v) => !v);
          }}
          aria-label="댓글 보기"
          title="댓글 보기"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M20 2H4a2 2 0 0 0-2 2v14l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
          </svg>
          <span className="font-medium">{commentCountText}</span>
        </button>
      </footer>

      {/* Overlay for comments */}
      {commentsOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setCommentsOpen(false)} />

          <div className="absolute top-[-10px] left-[-5px] inset-0 z-50" role="dialog" aria-label="댓글 패널">
            <div className="rounded-2xl absolute inset-0 bg-neutral-800 w-[101%] z-0 pointer-events-none" />
            <div className="relative z-10 h-full flex flex-col p-4">
              <header className="flex items-center justify-between mb-3">
                <h2 className="text-m font-medium text-neutral-200">댓글</h2>
                <div className="inline-flex rounded-md border border-neutral-700 overflow-hidden">
                  <button
                    className={`px-3 py-1 text-sm ${
                      order === "old" ? "text-neutral-800 bg-neutral-100" : "text-neutral-300 hover:bg-neutral-800/50"
                    }`}
                    onClick={() => setOrder("old")}
                  >
                    오래된순
                  </button>
                  <button
                    className={`px-3 py-1 text-sm border-l border-neutral-700 ${
                      order === "new" ? "text-neutral-800 bg-neutral-100" : "text-neutral-300 hover:bg-neutral-800/50"
                    }`}
                    onClick={() => setOrder("new")}
                  >
                    최신순
                  </button>
                </div>
              </header>

              {/* 입력란 */}
              <div className="mb-4 flex items-center gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="댓글을 입력해주세요"
                  className="flex-1 rounded-md bg-neutral-800/70 border border-neutral-700 px-3 py-2 outline-none focus:border-neutral-500"
                />
                <button
                  disabled={isSubmitting}
                  onClick={() => submitComment()}
                  className="px-5 py-2 rounded bg-neutral-600 hover:bg-neutral-700 text-sm disabled:opacity-60"
                >
                  작성
                </button>
              </div>

              {/* 목록 영역: 카드 전체를 가리는 스크롤 영역 */}
              <div className="flex-1 overflow-y-auto pr-1">
                {commentsLoading ? (
                  <CommentsSkeleton count={6} />
                ) : commentsError ? (
                  <div className="text-sm text-red-400">댓글을 불러오지 못했습니다.</div>
                ) : commentList.length ? (
                  <ul className="space-y-4">
                    {commentList.map((c) => {
                      const isMine = true;
                      const inEdit = editingId === c.id;
                      return (
                        <li key={c.id} className="flex items-start gap-3">
                          {c.author?.profileImageUrl ? (
                            <img
                              src={c.author.profileImageUrl}
                              alt={c.author?.name ?? "작성자"}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-neutral-700" />
                          )}
                          <div className="flex-1">
                            <div className="text-sm text-neutral-200 flex items-center gap-2">
                              <span>{c.author?.name ?? "익명"}</span>
                              <span className="text-xs text-neutral-500">{formatRelative(c.createdAt)}</span>
                            </div>
                            {inEdit ? (
                              <div className="mt-1 flex items-center gap-2">
                                <input
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      mutateEdit({ id: c.id, content: editingText.trim() });
                                    }
                                  }}
                                  className="flex-1 rounded-md bg-neutral-800/70 border border-neutral-700 px-3 py-2 outline-none focus:border-neutral-500"
                                />
                                <button
                                  disabled={isEditing}
                                  onClick={() => mutateEdit({ id: c.id, content: editingText.trim() })}
                                  className="px-3 py-2 rounded bg-neutral-600 hover:bg-neutral-700 text-sm disabled:opacity-60"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditingText("");
                                  }}
                                  className="px-3 py-2 rounded bg-neutral-700 hover:bg-neutral-600 text-sm"
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <div
                                className={`text-sm text-neutral-300 mt-1 ${
                                  isMine ? "cursor-text hover:bg-neutral-800/30 rounded px-1 -mx-1" : ""
                                }`}
                                onClick={() => {
                                  if (isMine) {
                                    setEditingId(c.id);
                                    setEditingText(c.content);
                                    setMenuOpenId(null);
                                  }
                                }}
                                title={isMine ? "클릭하여 수정" : undefined}
                                role={isMine ? "button" : undefined}
                                aria-label={isMine ? "댓글 수정" : undefined}
                              >
                                {c.content}
                              </div>
                            )}
                          </div>

                          {isMine && (
                            <div className="relative self-start">
                              <button
                                className="p-1 rounded hover:bg-neutral-800"
                                title={menuOpenId === c.id ? "수정/삭제" : "더보기"}
                                aria-label={menuOpenId === c.id ? "수정/삭제" : "더보기"}
                                onClick={() => setMenuOpenId((v) => (v === c.id ? null : c.id))}
                              >
                                <img
                                  src={menuOpenId === c.id ? editIcon : moreIcon}
                                  alt={menuOpenId === c.id ? "수정/삭제" : "더보기"}
                                  className="h-4 w-4"
                                />
                              </button>
                              {menuOpenId === c.id && (
                                <div className="absolute right-0 mt-1 w-28 rounded-md border border-neutral-700 bg-neutral-800 shadow-lg z-10">
                                  <button
                                    className="block w-full text-left px-3 py-2 text-sm hover:bg-neutral-700"
                                    onClick={() => {
                                      setEditingId(c.id);
                                      setEditingText(c.content);
                                      setMenuOpenId(null);
                                    }}
                                  >
                                    수정
                                  </button>
                                  <button
                                    className="block w-full text-left px-3 py-2 text-sm text-red-300 hover:bg-neutral-700"
                                    onClick={() => {
                                      setMenuOpenId(null);
                                      if (confirm("정말 삭제하시겠습니까?")) {
                                        mutateDelete({ id: c.id });
                                      }
                                    }}
                                  >
                                    삭제
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                    <div ref={bottomRef} />
                    {isFetchingNextPage && <CommentsSkeleton count={6} />}
                  </ul>
                ) : (
                  <div className="text-sm text-neutral-400">아직 댓글이 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </article>
  );
}
