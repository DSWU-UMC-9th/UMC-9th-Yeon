/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { fetchPopularMovies } from "../api/tmdb";
import MovieCard from "../components/MovieCard";
import type { Movie } from "../types/movie";

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const results = await fetchPopularMovies({ signal: controller.signal, language: "ko-KR", page: 1 });
        setMovies(results as Movie[]);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message ?? "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && <div className="text-red-500">에러: {error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {movies.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      )}
    </main>
  );
}
