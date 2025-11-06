import { useState } from "react";
import { fetchPopularMovies } from "../api/tmdb";
import MovieCard from "../components/MovieCard";
import Spinner from "../components/Spinner";
import Pager from "../components/Pager";
import { useMovies } from "../hooks/useMovies";

export default function Popular() {
  const [page, setPage] = useState(1);
  const { movies, isLoading, error } = useMovies(fetchPopularMovies, page);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Pager page={page} setPage={setPage} isLoading={isLoading} />
      {isLoading && <Spinner />}
      {!isLoading && error && <div className="text-red-500">에러: {error}</div>}
      {!isLoading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {movies.map((m) => (
            <MovieCard key={m.id} movie={m} />
          ))}
        </div>
      )}
    </main>
  );
}
