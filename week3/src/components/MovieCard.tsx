import { IMG_BASE } from "../api/tmdb";
import type { Movie } from "../types/movie";

type Props = { movie: Movie };

export default function MovieCard({ movie }: Props) {
  return (
    <article className="group relative overflow-hidden rounded-2xl shadow-lg border border-black/5 bg-white">
      {movie.poster_path ? (
        <img
          src={`${IMG_BASE}${movie.poster_path}`}
          alt={movie.title || movie.name || "poster"}
          className="h-64 w-full object-cover transition duration-300 group-hover:blur-[2px]"
          loading="lazy"
        />
      ) : (
        <div className="h-64 w-full grid place-items-center bg-gray-100 text-gray-400">이미지 없음</div>
      )}

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="rounded-xl bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
          <h3 className="text-white font-semibold text-base leading-tight line-clamp-2">{movie.title || movie.name}</h3>
          <p className="mt-2 text-white/80 text-xs leading-snug max-h-14 overflow-hidden">{movie.overview}</p>
        </div>
      </div>
    </article>
  );
}
