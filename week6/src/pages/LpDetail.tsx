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

type LpDetail = {
  id: number;
  title: string;
  description?: string; // backend uses description
  body?: string; // keep for compatibility
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  coverUrl?: string | null;
  likes?: any[]; // backend returns an array sometimes
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

async function fetchLp(id: string, token?: string | null) {
  const { data } = await api.get(`/lps/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  // Normalize common API envelopes: {data:{...}}, {lp:{...}}, or raw object
  const payload: any = data?.data ?? data;
  const lp: any = payload?.lp ?? payload?.data ?? payload;
  return lp as LpDetail;
}

async function fetchComments(lpId: string, token?: string | null): Promise<LpComment[]> {
  const { data } = await api.get(`/lps/${lpId}/comments`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return (Array.isArray(data) ? data : data?.items ?? data?.content ?? []) as LpComment[];
}

async function createComment(lpId: string, content: string, token?: string | null) {
  const { data } = await api.post(
    `/lps/${lpId}/comments`,
    { content },
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
  );
  return data;
}

// Lightweight count fetcher for comments
async function fetchCommentsCount(lpId: string, token?: string | null): Promise<number> {
  const { data } = await api.get(`/lps/${lpId}/comments`, {
    params: { cursor: 0, limit: 1, order: "asc" },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const payload: any = data?.data ?? data;
  // Prefer explicit totals if the backend provides them
  if (typeof payload?.total === "number") return payload.total as number;
  if (typeof payload?.totalElements === "number") return payload.totalElements as number;
  if (typeof payload?.count === "number") return payload.count as number;

  // Fallback: infer from the items array when no total is provided
  const arr = Array.isArray(payload) ? payload : ((payload?.data ?? payload?.items ?? payload?.content ?? []) as any[]);
  const hasNext = Boolean(payload?.hasNext ?? payload?.hasMore);
  // If there are more pages, signal unknown total with NaN; caller will render `loaded+` style
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

  // swagger-style payload: { status, statusCode, message, data: { data: [], nextCursor, hasNext, total? } }
  const payload: any = data?.data ?? data;
  const items: LpComment[] = (payload?.data ?? payload?.items ?? payload?.content ?? []) as LpComment[];

  const total = (payload?.total ?? payload?.totalElements ?? payload?.count) as number | undefined;
  const hasMore: boolean = Boolean(payload?.hasNext ?? (Array.isArray(items) && items.length === limit));
  const nextCursor: number | undefined = payload?.nextCursor ?? (hasMore ? cursor + limit : undefined);

  return { items, nextCursor, hasMore, total };
}

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
  // Route param can be defined as :lpid or :lpId depending on router config
  const params = useParams();
  const lpid = (params as any)?.lpid ?? (params as any)?.lpId ?? (params as any)?.LPId;
  const { token } = useAuth();

  const qc = useQueryClient();
  const [commentsOpen, setCommentsOpen] = React.useState(false);
  const [order, setOrder] = React.useState<"new" | "old">("new");
  const [commentText, setCommentText] = React.useState("");

  const enabled = Boolean(token && lpid);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["lp", lpid],
    queryFn: () => fetchLp(lpid!, token),
    enabled,
    retry: (failureCount, err) => {
      const status = (err as AxiosError)?.response?.status ?? 0;
      // do not retry on 404/401; retry others up to 2 times
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

  const { mutate: submitComment, isPending: isSubmitting } = useMutation({
    mutationFn: async () => {
      if (!commentText.trim()) return Promise.reject(new Error("내용을 입력하세요"));
      return createComment(lpid!, commentText.trim(), token);
    },
    onSuccess: () => {
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["lpComments", lpid] });
      refetchComments();
    },
  });

  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!commentsOpen) return; // only observe when panel is open
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

  console.log("[LpDetail] data", data);
  console.log("[LpDetail] error", error);

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
  const tags = [authorName, data?.category?.name, ...(data?.title ? [data.title] : [])].filter(Boolean) as string[];

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
        <div className="flex items-center gap-3 text-neutral-400">
          <button className="hover:opacity-90" title="수정" aria-label="수정">
            <img src={editIcon} alt="수정" className="h-5 w-5" />
          </button>
          <button className="hover:opacity-90" title="삭제" aria-label="삭제">
            <img src={trashIcon} alt="삭제" className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Title */}
      <h1 className="px-6 mt-3 text-xl font-semibold text-neutral-100">{data.title}</h1>

      {/* Media */}
      <div className="px-6 mt-4">
        <div className="mx-auto max-w-md">
          <div className="relative aspect-square overflow-hidden rounded-xl shadow-lg bg-neutral-800">
            {imageUrl ? (
              <img src={imageUrl} alt={data.title} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-neutral-500">이미지 없음</div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-6 mt-5 text-sm leading-6 text-neutral-300 justify-center text-center">
        {contentText || "설명이 없습니다."}
      </div>

      {/* Tags */}
      <div className="px-6 mt-4 flex flex-wrap gap-2 justify-center">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center rounded-full bg-neutral-800/70 px-2.5 py-1 text-xs text-neutral-300 border border-neutral-700"
          >
            #{t}
          </span>
        ))}
      </div>

      {/* Footer */}
      <footer className="px-6 py-5 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2 text-neutral-200">
          <img src={likeIcon} alt="좋아요" className="h-5 w-5" />
          <span className="font-medium">{likeCount}</span>
        </div>
        <button
          className="flex items-center gap-2 text-neutral-200 hover:opacity-90"
          onClick={() => {
            if (!commentsOpen) {
              // remove only the list cache so opening shows skeleton, count query remains
              qc.removeQueries({ queryKey: ["lpComments", lpid], exact: false });
            }
            setCommentsOpen((v) => !v);
          }}
          aria-label="댓글 보기"
          title="댓글 보기"
        >
          {/* simple inline comment bubble icon */}
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M20 2H4a2 2 0 0 0-2 2v14l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
          </svg>
          <span className="font-medium">{commentCountText}</span>
        </button>
      </footer>

      {/* Overlay for comments */}
      {commentsOpen && (
        <>
          {/* anywhere outside the card closes the panel */}
          <div className="fixed inset-0 z-40" onClick={() => setCommentsOpen(false)} />

          {/* card-bounded overlay */}
          <div className="absolute top-[-10px] left-[-5px] inset-0 z-50" role="dialog" aria-label="댓글 패널">
            {/* overlay background inside the card */}
            <div className="rounded-2xl absolute inset-0 bg-neutral-800 w-[101%] z-0 pointer-events-none" />
            <div className="relative z-10 h-full flex flex-col p-4">
              <header className="flex items-center justify-between mb-3">
                <h2 className="text-m font-medium text-neutral-200">댓글</h2>
                {/* Segmented control */}
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
                  // 초기 로딩은 상단에만 스켈레톤
                  <CommentsSkeleton count={6} />
                ) : commentsError ? (
                  <div className="text-sm text-red-400">댓글을 불러오지 못했습니다.</div>
                ) : commentList.length ? (
                  <ul className="space-y-4">
                    {commentList.map((c) => (
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
                          <div className="text-sm text-neutral-200">{c.author?.name ?? "익명"}</div>
                          <div className="text-xs text-neutral-500 mb-1">{formatRelative(c.createdAt)}</div>
                          <div className="text-sm text-neutral-300">{c.content}</div>
                        </div>
                        <button
                          className="self-start p-1 rounded hover:bg-neutral-800"
                          title="더보기"
                          aria-label="더보기"
                        >
                          <img src={moreIcon} alt="더보기" className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                    {/* 바닥 감지 센티넬 */}
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
