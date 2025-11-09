import React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import api from "../api/client";
import { useAuth } from "../hooks/useAuth";
import ListSkeleton, { CommentsSkeleton } from "../components/ListSkeleton";
import editIcon from "../assets/edit.svg";
import trashIcon from "../assets/trash.svg";
import likeIcon from "../assets/like.svg";
import moreIcon from "../assets/more.svg";
import unlikeIcon from "../assets/unlike.svg";

import type { LpDetail, LpComment } from "../types/lp";
/**
 * Types
 */
// ⬇️ 기존 API helper 함수들 전부 삭제하고, 아래 import 추가
import { fetchLp, updateLp, deleteLp, likeLp, unlikeLp } from "../api/lps";
import { fetchCommentsCount, fetchCommentsPage, createComment, updateComment, removeComment } from "../api/comments";
import { uploadImage } from "../api/uploads";

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

// Extract author identity defensively from various backend shapes
function getAuthorIdentity(lp: any): { id: number | null; email: string | null } {
  if (!lp) return { id: null, email: null };
  // direct id fields that some backends use
  const idCandidates = [
    lp?.author?.id,
    lp?.authorId,
    lp?.user?.id,
    lp?.userId,
    lp?.ownerId,
    lp?.createdById,
    typeof lp?.author?.userId !== "undefined" ? lp?.author?.userId : undefined,
  ];
  let id: number | null = null;
  for (const cand of idCandidates) {
    const n = Number(cand);
    if (Number.isFinite(n) && n > 0) {
      id = n;
      break;
    }
  }

  const emailCandidates = [lp?.author?.email, lp?.user?.email, lp?.ownerEmail, lp?.createdByEmail];
  let email: string | null = null;
  for (const e of emailCandidates) {
    if (typeof e === "string" && e.includes("@")) {
      email = e;
      break;
    }
  }
  return { id, email };
}

export default function LpDetail() {
  const params = useParams();
  const lpid = (params as any)?.lpid ?? (params as any)?.lpId ?? (params as any)?.LPId;
  const { token, user } = useAuth() as { token?: string | null; user?: { id?: number; email?: string } };
  const navigate = useNavigate();
  const location = useLocation();

  // derive my identity (id/email) from hook, /users/me, or JWT payload as fallbacks (sticky to avoid flicker)
  const { data: me } = useQuery({
    queryKey: ["me", token],
    queryFn: async () => {
      const res = await api.get("/users/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const payload: any = res.data?.data ?? res.data;
      return payload;
    },
    enabled: Boolean(token),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const rawIdentity = React.useMemo(() => {
    // 1) from useAuth()
    let myId: number | null = typeof user?.id === "number" ? Number(user!.id) : null;
    let myEmail: string | null = (user as any)?.email ?? null;

    // 2) from /users/me
    if (!myId && me?.id) myId = Number(me.id);
    if (!myEmail && typeof me?.email === "string") myEmail = me.email as string;

    // 3) decode token (last resort)
    if ((!myId || !myEmail) && token) {
      try {
        const payloadStr = atob(token.split(".")[1] || "");
        const payload = JSON.parse(payloadStr);
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
  }, [token, user, me]);

  // keep the last known non-null identity to prevent owner UI from flickering false
  const lastIdentityRef = React.useRef<{ myId: number | null; myEmail: string | null }>({ myId: null, myEmail: null });
  if (rawIdentity.myId || rawIdentity.myEmail) {
    lastIdentityRef.current = rawIdentity;
  }
  const myIdentity = lastIdentityRef.current;

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
  // 서버 응답보다 클라이언트를 우선하도록 만드는 상태
  const [likedOverride, setLikedOverride] = React.useState<boolean | null>(null);
  // prevent accidental double fire on fast clicks (or bubbling)
  const likeLockRef = React.useRef(false);

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

  // Derive liked with client-side override to prevent flicker
  const serverLiked = Boolean((data as any)?.isLiked);
  const liked = likedOverride !== null ? likedOverride : serverLiked;

  // When server value catches up to the override, clear the override
  React.useEffect(() => {
    if (likedOverride === null) return;
    if (serverLiked === likedOverride) setLikedOverride(null);
  }, [serverLiked, likedOverride]);

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

  // owner check (by id or email) — robust to various backend shapes, prefer backend flags if present
  const authorIdentity = React.useMemo(() => getAuthorIdentity(data), [data]);
  const dataIsOwner = Boolean(
    (data as any)?.isOwner ?? (data as any)?.owner ?? (data as any)?.canEdit ?? (data as any)?.editable
  );
  const prevOwnerRef = React.useRef<boolean>(false);
  const isOwner = React.useMemo(() => {
    const byBackend = Boolean(
      (data as any)?.isOwner ?? (data as any)?.owner ?? (data as any)?.canEdit ?? (data as any)?.editable
    );
    const byId = Number.isFinite(Number(myIdentity.myId)) && Number(myIdentity.myId) === Number(authorIdentity.id);
    const byEmail = !!myIdentity.myEmail && !!authorIdentity.email && myIdentity.myEmail === authorIdentity.email;
    const resolved = Boolean(byBackend || byId || byEmail || prevOwnerRef.current);
    prevOwnerRef.current = resolved;
    return resolved;
  }, [data, myIdentity, authorIdentity]);

  const canManageLp = isOwner;

  if (import.meta?.env?.MODE !== "production") {
    console.log("[LP OWNER CHECK]", {
      dataIsOwner,
      myIdentity,
      authorIdentity,
      resolvedIsOwner: isOwner,
    });
  }

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
      // 우선적으로 이전 라우트 정보(state.from)를 사용하고,
      // 없으면 브라우저 히스토리로 한 단계 뒤로 이동,
      // 그것도 불가하면 기본 경로로 보냅니다.
      const from: string | undefined = (location.state as any)?.from;
      if (from?.startsWith("/my")) {
        navigate("/my", { replace: true });
      } else if (from === "/") {
        navigate("/", { replace: true });
      } else if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/", { replace: true });
      }
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

  // Toggle like with optimistic UI using React Query cache
  const { mutate: toggleLike, isPending: isTogglingLike } = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("AUTH_MISSING");

      // 캐시에서 현재 상태를 읽어 실제 요청을 결정
      const cur = qc.getQueryData<any>(["lp", lpid]);
      const currentlyLiked = Boolean(cur?.isLiked);

      if (currentlyLiked) {
        try {
          return await unlikeLp(lpid!, token);
        } catch (e: any) {
          const st = e?.response?.status;
          if (st === 404) return { status: true } as any; // 이미 해제되어 있었음 → 성공 처리
          throw e;
        }
      } else {
        try {
          return await likeLp(lpid!, token);
        } catch (e: any) {
          const st = e?.response?.status;
          if (st === 409) return { status: true } as any; // 이미 좋아요였음 → 성공 처리
          throw e;
        }
      }
    },
    // --- REPLACED onMutate ---
    onMutate: async () => {
      if (!token) {
        return { previous: qc.getQueryData(["lp", lpid]) } as any;
      }
      const key = ["lp", lpid] as const;
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<any>(key);

      // 현재 캐시 기준으로 낙관적 토글
      const prevLiked = Boolean(previous?.isLiked);
      const baseCount =
        typeof previous?.totalLikes === "number"
          ? previous.totalLikes
          : Array.isArray(previous?.likes)
          ? previous.likes.length
          : 0;

      const nextLiked = !prevLiked;
      const nextTotal = Math.max(0, baseCount + (nextLiked ? 1 : -1));

      setLikedOverride(nextLiked);
      qc.setQueryData<any>(key, (p) => (p ? { ...p, isLiked: nextLiked, totalLikes: nextTotal } : p));
      // nextLiked/nextTotal을 컨텍스트로 넘겨 성공시 동일 값으로 고정
      return { previous, nextLiked, nextTotal } as any;
    },
    // --- REPLACED onError ---
    onError: (err: any, _vars, ctx: any) => {
      if (ctx?.previous) {
        qc.setQueryData(["lp", lpid], ctx.previous);
      }
      setLikedOverride(null);
      const status = err?.response?.status;
      if (status === 401) {
        console.warn("[LIKE] 401 Unauthorized — 세션 유지, UI 롤백");
        alert("권한이 없거나 세션이 만료되었습니다. 다시 로그인 후 시도해주세요.");
      }
    },
    // --- ADDED/MODIFIED onSuccess ---
    onSuccess: (_res, _vars, ctx: any) => {
      const key = ["lp", lpid] as const;
      if (ctx && typeof ctx.nextLiked === "boolean") {
        // 서버 응답 유무/형태와 무관하게 캐시를 확정값으로 고정
        qc.setQueryData<any>(key, (p) => (p ? { ...p, isLiked: ctx.nextLiked, totalLikes: ctx.nextTotal } : p));
      }
      // override 해제하여 깜빡임 방지 (캐시 이미 확정값)
      setLikedOverride(null);
    },
    // --- REPLACED onSettled ---
    onSettled: () => {
      // 즉시 무효화하지 않고, 비활성 쿼리에 한해 가볍게 동기화 (UI 깜빡임 방지)
      setTimeout(() => {
        try {
          qc.invalidateQueries({ queryKey: ["lp", lpid], refetchType: "inactive" as any });
        } catch {
          // 일부 버전 호환: refetchType 미지원 시 일반 invalidation (지연 시점이므로 flicker 없음)
          qc.invalidateQueries({ queryKey: ["lp", lpid] });
        }
      }, 1200);
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

  // Compute displayed like count with override applied to prevent visual jump
  const displayedLikeCount =
    likedOverride === null
      ? Math.max(0, likeCount ?? 0)
      : Math.max(0, (likeCount ?? 0) + (likedOverride === serverLiked ? 0 : likedOverride ? 1 : -1));

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
          className={`flex items-center gap-2 rounded px-2 py-1 ${liked ? "text-pink-400" : "text-neutral-200"} ${
            isTogglingLike ? "opacity-60" : "hover:opacity-90"
          }`}
          aria-pressed={liked}
          aria-label={liked ? "좋아요 취소" : "좋아요"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!token) {
              alert("로그인이 필요합니다. 세션이 만료되었을 수 있어요.");
              return;
            }
            if (likeLockRef.current || isTogglingLike) return; // 중복 방지
            likeLockRef.current = true;
            toggleLike(undefined, {
              onSettled: () => {
                likeLockRef.current = false;
              },
            });
          }}
          disabled={isTogglingLike}
        >
          <img src={liked ? likeIcon : unlikeIcon} alt={liked ? "좋아요 취소" : "좋아요"} className="h-5 w-5" />
          <span className="font-medium">{displayedLikeCount}</span>
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
