import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import api from "../api/client";
import { useAuth } from "../hooks/useAuth";
import ListSkeleton from "../components/ListSkeleton";
import editIcon from "../assets/edit.svg";
import trashIcon from "../assets/trash.svg";
import likeIcon from "../assets/like.svg";

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

async function fetchLp(id: string, token?: string | null) {
  const { data } = await api.get(`/lps/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  // Allow either { lp: LpDetail } or LpDetail
  return (data?.lp ?? data) as LpDetail;
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
  const { lpid } = useParams<{ lpid: string }>();
  const { token } = useAuth();
  const enabled = Boolean(token && lpid);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["lp", lpid, token],
    queryFn: () => fetchLp(lpid!, token),
    enabled,
    retry: (failureCount, err) => {
      const status = (err as AxiosError)?.response?.status ?? 0;
      return status !== 401 && failureCount < 2;
    },
    staleTime: 60_000,
  });
  console.log("[LpDetail] data", data);
  console.log("[LpDetail] error", error);

  if (isLoading)
    return (
      <section className="p-6">
        <ListSkeleton />
      </section>
    );
  if (isError || !data)
    return (
      <section className="p-6">
        <div className="rounded border border-red-900/40 bg-red-950/30 p-4 space-y-2">
          <div className="text-red-300 font-medium">불러오기 오류</div>
          {error && <pre className="text-xs text-red-400 whitespace-pre-wrap">{(error as Error).message}</pre>}
          <button onClick={() => refetch()} className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700">
            재시도
          </button>
        </div>
      </section>
    );

  const imageUrl = (data as any)?.thumbnailUrl ?? (data as any)?.imageUrl ?? (data as any)?.coverUrl ?? null;
  const contentText = data?.body ?? data?.description ?? "";
  const likeCount =
    typeof data?.totalLikes === "number" ? data.totalLikes : Array.isArray(data?.likes) ? data!.likes!.length : 0;

  const authorName = data?.author?.name ?? "작성자";
  const authorImage = data?.author?.profileImageUrl ?? null;
  const timeText = data?.createdAt ? formatRelative(data.createdAt) : "";
  const tags = [authorName, data?.category?.name, ...(data?.title ? [data.title] : [])].filter(Boolean) as string[];

  return (
    <article className="max-w-3xl mx-auto rounded-2xl border border-neutral-800 bg-neutral-900/50 shadow-xl">
      {/* Card header */}
      <header className="flex items-center justify-between px-6 pt-5">
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
        {imageUrl ? (
          <div className="mx-auto max-w-md">
            <img src={imageUrl} alt={data.title} className="w-full rounded-xl shadow-lg" />
          </div>
        ) : (
          <div className="mx-auto max-w-md aspect-square rounded-xl bg-neutral-800 grid place-items-center text-neutral-500">
            이미지 없음
          </div>
        )}
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
      <footer className="px-6 py-5 flex items-center justify-center gap-2">
        <img src={likeIcon} alt="좋아요" className="h-5 w-5" />
        <span className="font-medium">{likeCount}</span>
      </footer>
    </article>
  );
}
