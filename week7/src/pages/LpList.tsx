/// <reference types="react" />

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import api from "../api/client";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { AxiosError } from "axios";

type Lp = {
  id: number;
  title: string;
  thumbnailUrl?: string;
  likes?: number;
  createdAt: string;
};

type PagePayload = {
  items: Lp[];
  nextCursor?: number | null;
  hasNext?: boolean;
};

/** 상대 시간 포맷터 */
function formatRelative(iso: string) {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

async function fetchLpPage({
  token,
  cursor,
  limit,
  search,
  order,
}: {
  token?: string | null;
  cursor?: number | null;
  limit: number;
  search: string;
  order: "asc" | "desc";
}): Promise<PagePayload> {
  try {
    const res = await api.get("/lps", {
      params: {
        cursor: cursor ?? undefined,
        limit,
        search: search ? search : undefined,
        order,
      },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    console.log("[LP][/lps] status:", res?.status);
    try {
      console.log("[LP][/lps] headers:", res?.headers);
    } catch {}
    console.log("[LP][/lps] raw:", res?.data);

    // ---- Shape detection helpers ----
    const root: any = res?.data ?? {};
    const box: any = root?.data ?? root ?? {};

    // Debug keys to quickly see real server shape
    try {
      console.log("[LP][/lps] keys(root):", Object.keys(root || {}));
      console.log("[LP][/lps] keys(root.data):", Object.keys(root?.data || {}));
    } catch {}

    // Try common locations for an array payload
    const candidates: any[] = [];
    if (Array.isArray(box?.data)) candidates.push(box.data); // { data: [...] }
    if (Array.isArray(box?.items)) candidates.push(box.items); // { items: [...] }
    if (Array.isArray(root?.items)) candidates.push(root.items); // { items: [...] } (top-level)
    if (Array.isArray(root?.data?.items)) candidates.push(root.data.items); // { data: { items: [...] } }
    if (Array.isArray(root?.data?.data)) candidates.push(root.data.data); // { data: { data: [...] } }
    if (Array.isArray(root)) candidates.push(root);

    const list: any[] = (candidates.find((a) => Array.isArray(a)) as any[]) || [];

    // Meta source: try the same boxes for nextCursor/hasNext
    const metaSource: any = root?.data ?? root ?? {};
    let nextCursor: number | null | undefined = metaSource && "nextCursor" in metaSource ? metaSource.nextCursor : null;
    let hasNextRaw: unknown = metaSource && "hasNext" in metaSource ? metaSource.hasNext : undefined;
    let hasNextNorm = typeof hasNextRaw === "boolean" ? hasNextRaw : nextCursor != null;

    console.log("[LP][/lps] detected length:", Array.isArray(list) ? list.length : "n/a");

    // If nothing came back, try unauthenticated fallback once (some servers gate data by headers)
    if ((Array.isArray(list) ? list.length : 0) === 0) {
      try {
        const fb = await api.get("/lps");
        console.log("[LP][/lps] fallback raw:", fb?.data);
        const fbRoot: any = fb?.data ?? {};
        const fbBox: any = fbRoot?.data ?? fbRoot ?? {};
        const fbCandidates: any[] = [];
        if (Array.isArray(fbBox?.data)) fbCandidates.push(fbBox.data);
        if (Array.isArray(fbBox?.items)) fbCandidates.push(fbBox.items);
        if (Array.isArray(fbRoot?.data?.items)) fbCandidates.push(fbRoot.data.items);
        if (Array.isArray(fbRoot?.data?.data)) fbCandidates.push(fbRoot.data.data);
        const fbList: any[] = (fbCandidates.find((a) => Array.isArray(a)) as any[]) || [];
        console.log("[LP][/lps] fallback detected length:", fbList.length);
        if (fbList.length > 0) {
          list.splice(0, list.length, ...fbList);
          const ms: any = fbRoot?.data ?? fbRoot ?? {};
          nextCursor = "nextCursor" in ms ? ms.nextCursor : null;
          hasNextRaw = "hasNext" in ms ? ms.hasNext : undefined;
          hasNextNorm = typeof hasNextRaw === "boolean" ? hasNextRaw : nextCursor != null;
        }
      } catch (e) {
        console.log("[LP][/lps] fallback error:", e);
      }
    }

    // Normalize list items to our UI shape
    const normalized = (list as any[]).map((it: any) => ({
      id: it.id,
      title: it.title ?? it.name ?? "제목 없음",
      thumbnailUrl: it.thumbnail ?? it.thumbnailUrl ?? it.imageUrl ?? it.thumbUrl ?? "",
      likes: Array.isArray(it.likes) ? it.likes.length : typeof it.likes === "number" ? it.likes : 0,
      createdAt: it.createdAt ?? it.created_at ?? new Date().toISOString(),
    }));

    console.log("[LP][/lps] normalized length:", normalized.length, { nextCursor, hasNext: hasNextNorm });

    return { items: normalized, nextCursor, hasNext: hasNextNorm };
  } catch (err) {
    const ax = err as AxiosError<any>;
    const serverMsg = ax.response?.data?.message || ax.response?.data?.error || ax.message;
    throw new Error(`[GET /lps] ${ax.response?.status ?? ""} ${serverMsg ?? ""}`.trim());
  }
}

export default function LpList() {
  // 최신순/오래된순 - 서버의 asc|desc와 매핑
  const [order, setOrder] = useState<"asc" | "desc">("desc"); // desc=최신순
  const [search, setSearch] = useState("");
  const { token } = useAuth();

  const { data, isLoading, isError, error, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ["lps", token, search, order],
      queryFn: ({ pageParam }) =>
        fetchLpPage({
          token,
          cursor: pageParam ?? null,
          limit: 20,
          search,
          order,
        }),
      initialPageParam: null as number | null,
      getNextPageParam: (last) => (last.hasNext ? last.nextCursor ?? null : undefined),
      enabled: true,
      retry: (failureCount, err) => {
        const status = (err as AxiosError)?.response?.status ?? 0;
        return status !== 401 && failureCount < 2;
      },
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      onSuccess: (data) => {
        try {
          console.log(
            "[LP][query] onSuccess pages:",
            data.pages.length,
            "first items:",
            data.pages?.[0]?.items?.length ?? 0
          );
        } catch {}
      },
    });

  // 무한 스크롤 옵저버
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!token) {
    return (
      <section className="p-6 rounded bg-neutral-900 text-neutral-300">목록을 보려면 먼저 로그인해주세요.</section>
    );
  }

  const is401 = (error as AxiosError | undefined)?.response?.status === 401;
  if (is401) {
    return (
      <section className="p-6 rounded bg-neutral-900 text-neutral-300">
        권한이 없어요. (401) 로그인 세션이 맞는지 확인해주세요.
        <button onClick={() => refetch()} className="ml-2 underline">
          다시 시도
        </button>
      </section>
    );
  }

  const allItems = (data?.pages ?? []).flatMap((p) => p.items);
  console.log("[LP][render] pages:", data?.pages?.length ?? 0, "items:", allItems.length, {
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
  });
  const isInitialLoading = isLoading || (!data && isFetching);

  return (
    <section className="min-h-0 h-full overflow-y-auto overscroll-contain pr-1">
      <div className="mb-4 flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="검색어 입력"
          className="px-3 py-1 rounded bg-neutral-800 border border-neutral-700 w-[220px]"
        />
        <button
          onClick={() => setOrder((o) => (o === "desc" ? "asc" : "desc"))}
          className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
        >
          정렬: {order === "desc" ? "최신순" : "오래된순"} {isFetching && "…"}
        </button>
        <button onClick={() => refetch()} className="px-3 py-1 rounded border border-neutral-700">
          새로고침
        </button>
      </div>

      {isInitialLoading && <ListSkeleton />}

      {isError && !is401 && (
        <div className="p-6 rounded bg-neutral-800">
          오류가 발생했습니다.{" "}
          <button onClick={() => refetch()} className="underline">
            다시 시도
          </button>
        </div>
      )}

      {!isInitialLoading && !isError && allItems.length === 0 && (
        <div className="p-6 rounded bg-neutral-900 text-neutral-300">표시할 LP가 없습니다.</div>
      )}

      <ul className="flex flex-wrap gap-4">
        {allItems.map((lp) => (
          <li key={lp.id} className="w-[180px] overflow-hidden">
            <Link to={`/lp/${lp.id}`} className="group block">
              <div className="relative w-[180px] h-[180px] overflow-hidden rounded bg-neutral-800 border-0 outline-none">
                {lp.thumbnailUrl ? (
                  <img
                    src={lp.thumbnailUrl}
                    alt={lp.title}
                    className="block h-full w-full object-cover border-0 outline-none transform-gpu transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-neutral-500 select-none">이미지 없음</div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3">
                  <div className="rounded-md backdrop-blur-sm px-2 py-1 text-[11px] sm:text-xs text-neutral-200 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    <div className="truncate font-medium">{lp.title}</div>
                    <div className="mt-1 flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-300">
                      <span>{formatRelative(lp.createdAt)}</span>
                      <span className="inline-flex items-center gap-1">
                        <span aria-hidden>♥</span>
                        <span className="tabular-nums">{lp.likes ?? 0}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* 하단 무한 스크롤 센티넬 & 추가 로딩 스켈레톤 */}
      <div ref={sentinelRef} className="h-6"></div>
      {isFetchingNextPage && <BottomSkeleton />}
    </section>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-wrap gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-2 w-[180px]">
          <div className="w-[180px] h-[180px] rounded bg-neutral-800" />
          <div className="h-3 w-[135px] bg-neutral-800 rounded" />
          <div className="h-3 w-[90px] bg-neutral-800 rounded" />
        </div>
      ))}
    </div>
  );
}

function BottomSkeleton() {
  return (
    <div className="mt-6 flex flex-wrap gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-2 w-[180px]">
          <div className="w-[180px] h-[180px] rounded bg-neutral-800/70" />
          <div className="h-3 w-[135px] bg-neutral-800/70 rounded" />
          <div className="h-3 w-[90px] bg-neutral-800/70 rounded" />
        </div>
      ))}
    </div>
  );
}
