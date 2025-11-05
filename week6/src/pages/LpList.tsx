import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { AxiosError } from "axios";

type Lp = {
  id: number;
  title: string;
  thumbnailUrl: string;
  likes: number;
  createdAt: string;
};

type Category = {
  id: number;
  name: string;
};

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

async function fetchLps(token?: string | null, categoryId?: number) {
  try {
    const { data } = await api.get("/lps", {
      params: { categoryId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    // Normalize responses: allow [Lp], { list: Lp[] }, or { content: Lp[] }
    const list: Lp[] = Array.isArray(data) ? (data as Lp[]) : data?.list ?? data?.content ?? [];

    return list;
  } catch (err) {
    const ax = err as AxiosError<any>;
    const serverMsg = ax.response?.data?.message || ax.response?.data?.error || ax.message;
    throw new Error(`[GET /lps] ${ax.response?.status ?? ""} ${serverMsg ?? ""}`.trim());
  }
}

async function fetchCategories(token?: string | null) {
  try {
    const { data } = await api.get("/categories", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    // Normalize: allow [Category] or { list: Category[] } or { content: Category[] }
    const list: Category[] = Array.isArray(data) ? (data as Category[]) : data?.list ?? data?.content ?? [];
    return list;
  } catch (err) {
    // If categories endpoint doesn't exist, fail silently with empty list
    return [] as Category[];
  }
}

export default function LpList() {
  const [sort, setSort] = useState<"latest" | "oldest">("latest");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const { token } = useAuth();

  const enabled = useMemo(() => Boolean(token), [token]);

  const { data: categories } = useQuery({
    queryKey: ["categories", token],
    queryFn: () => fetchCategories(token),
    enabled,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (categories && categories.length > 0 && categoryId === undefined) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const { data, isLoading, isError, isFetching, error, refetch } = useQuery({
    queryKey: ["lps", token, categoryId],
    queryFn: () => fetchLps(token, categoryId),
    enabled,
    retry: (failureCount, err) => {
      const status = (err as AxiosError)?.response?.status ?? 0;
      return status !== 401 && failureCount < 2;
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  const sortedData = useMemo(() => {
    if (!data) return [] as Lp[];
    const arr = [...data];
    return arr.sort((a, b) =>
      sort === "latest"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [data, sort]);

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

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        {categories && categories.length > 0 && (
          <select
            value={categoryId ?? (categories && categories.length > 0 ? categories[0].id : "")}
            onChange={(e) => {
              setCategoryId(Number(e.target.value));
            }}
            className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => setSort((s) => (s === "latest" ? "oldest" : "latest"))}
          className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
        >
          정렬: {sort === "latest" ? "최신순" : "오래된순"} {isFetching && "…"}
        </button>
        <button onClick={() => refetch()} className="px-3 py-1 rounded border border-neutral-700">
          새로고침
        </button>
      </div>

      {categories && categories.length === 0 && (
        <p className="mb-3 text-sm text-neutral-500">
          카테고리가 없어요. 카테고리를 먼저 생성해야 목록이 보일 수 있습니다.
        </p>
      )}

      {isLoading && <ListSkeleton />}

      {isError && !is401 && (
        <div className="p-6 rounded bg-neutral-800">
          오류가 발생했습니다.{" "}
          <button onClick={() => refetch()} className="underline">
            다시 시도
          </button>
        </div>
      )}

      <ul className="flex flex-wrap gap-4">
        {sortedData.map((lp) => (
          <li key={lp.id} className="w-[180px]">
            <Link to={`/lp/${lp.id}`} className="group block">
              <div className="relative w-[180px] h-[180px] overflow-hidden rounded bg-neutral-800 border-0 outline-none transform-gpu transition-transform duration-300 group-hover:scale-[1.1]">
                {lp.thumbnailUrl ? (
                  <img
                    src={lp.thumbnailUrl}
                    alt={lp.title}
                    className="block h-full w-full object-cover border-0 outline-none"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-neutral-500 select-none">이미지 없음</div>
                )}
                {/* gradient overlay: darker bottom -> transparent top */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                {/* meta overlay */}
                <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3">
                  <div className="rounded-md  backdrop-blur-sm px-2 py-1 text-[11px] sm:text-xs text-neutral-200 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
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
