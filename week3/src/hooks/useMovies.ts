/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import type { Movie } from "../types/movie";

type FetchFn = (params: { signal: AbortSignal; language: string; page: number }) => Promise<Movie[]>;

export function useMovies(fetchFn: FetchFn, page: number) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const c = new AbortController();
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const results = await fetchFn({ signal: c.signal, language: "ko-KR", page });
        setMovies(results);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message ?? "알 수 없는 오류");
      } finally {
        setIsLoading(false);
      }
    })();

    return () => c.abort();
  }, [fetchFn, page]);

  return { movies, isLoading, error };
}
