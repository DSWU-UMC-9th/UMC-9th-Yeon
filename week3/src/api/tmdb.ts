import type { Movie } from "../types/movie";

const RAW_KEY = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
const isV4Token = !!RAW_KEY && RAW_KEY.split(".").length >= 3;

const BASE = "https://api.themoviedb.org/3";

type FetchOptions = {
  signal?: AbortSignal;
  language?: string;
  page?: number;
};

async function request(path: string, opts: FetchOptions = {}) {
  if (!RAW_KEY) throw new Error("TMDB 키가 비어 있습니다. .env의 VITE_TMDB_API_KEY 확인");

  const url = new URL(`${BASE}${path}`);
  const language = opts.language ?? "ko-KR";
  const page = String(opts.page ?? 1);

  let res: Response;

  if (isV4Token) {
    url.searchParams.set("language", language);
    url.searchParams.set("page", page);
    res = await fetch(url.toString(), {
      signal: opts.signal,
      headers: {
        Authorization: `Bearer ${RAW_KEY}`,
        Accept: "application/json",
      },
    });
  } else {
    url.searchParams.set("api_key", RAW_KEY);
    url.searchParams.set("language", language);
    url.searchParams.set("page", page);
    res = await fetch(url.toString(), { signal: opts.signal });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
  }

  const json = await res.json();
  return json;
}

export async function fetchPopularMovies(opts?: FetchOptions) {
  const json = await request("/movie/popular", opts);
  if (!json || !Array.isArray(json.results)) {
    throw new Error(json?.status_message || "예상치 못한 응답 형식");
  }
  return json.results as Movie[];
}

export async function fetchUpcomingMovies(opts?: FetchOptions) {
  const json = await request("/movie/upcoming", opts);
  if (!json || !Array.isArray(json.results)) throw new Error(json?.status_message || "예상치 못한 응답 형식");
  return json.results as Movie[];
}
export async function fetchTopRatedMovies(opts?: FetchOptions) {
  const json = await request("/movie/top_rated", opts);
  if (!json || !Array.isArray(json.results)) throw new Error(json?.status_message || "예상치 못한 응답 형식");
  return json.results as Movie[];
}
export async function fetchNowPlayingMovies(opts?: FetchOptions) {
  const json = await request("/movie/now_playing", opts);
  if (!json || !Array.isArray(json.results)) throw new Error(json?.status_message || "예상치 못한 응답 형식");
  return json.results as Movie[];
}

// 이미지 베이스
export const IMG_BASE = "https://image.tmdb.org/t/p/w500";
