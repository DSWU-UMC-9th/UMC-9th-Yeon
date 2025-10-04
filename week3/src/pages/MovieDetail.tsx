/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchMovieCredits, fetchMovieDetails } from "../api/tmdb";
import type { MovieDetails, Credits, Cast } from "../types/movie";
import Spinner from "../components/Spinner";

const IMG = {
  poster: (p?: string | null) => (p ? `https://image.tmdb.org/t/p/w500${p}` : ""),
  backdrop: (p?: string | null) => (p ? `https://image.tmdb.org/t/p/w1280${p}` : ""),
  profile: (p?: string | null) => (p ? `https://image.tmdb.org/t/p/w185${p}` : ""),
};

export default function MovieDetail() {
  const { movieId } = useParams<{ movieId: string }>();
  const [detail, setDetail] = useState<MovieDetails | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId) return;
    const c = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const [d, cr] = await Promise.all([
          fetchMovieDetails(movieId, { signal: c.signal }),
          fetchMovieCredits(movieId, { signal: c.signal }),
        ]);
        setDetail(d);
        setCredits(cr);
      } catch (e: any) {
        if (e.name !== "AbortError") setErr(e?.message ?? "영화 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();

    return () => c.abort();
  }, [movieId]);

  const principalCast = useMemo(() => (credits?.cast ?? []).sort((a, b) => a.order - b.order).slice(0, 12), [credits]);

  if (loading)
    return (
      <div className="py-24">
        <Spinner />
      </div>
    );
  if (err) return <div className="py-12 text-center text-red-500">{err}</div>;
  if (!detail) return null;

  const year = detail.release_date?.slice(0, 4) ?? "";
  const runtime = detail.runtime ? `${detail.runtime}분` : "-";

  return (
    <div className="min-h-screen text-white">
      <div
        className="relative h-[72vh] md:h-[665px] w-full bg-black text-white bg-cover bg-center"
        style={{ backgroundImage: `url(${IMG.backdrop(detail.backdrop_path)})` }}
      >
        <div className="absolute inset-0 [background:linear-gradient(to_right,rgba(0,0,0,0.88)_28%,rgba(0,0,0,0.4)_60%,rgba(0,0,0,0.2)_100%)]"></div>
        <div className="absolute left-6 sm:left-10 bottom-[-1px] max-w-[680px] pr-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-3 md:mb-4">{detail.title}</h1>
          <div className="flex flex-col text-sm md:text-base opacity-90 mb-3 space-y-1">
            <span>평균 {detail.vote_average.toFixed(1)}</span>
            <span>{year}</span>
            <span>{runtime}</span>
          </div>
          <p className="text-xs sm:text-sm md:text-base leading-relaxed text-neutral-200 line-clamp-[10] md:line-clamp-[8]">
            {detail.overview || "줄거리 정보가 없습니다."}
          </p>

          <div className="relative md:mt-16 mt-10">
            <div className="h-[2px] bg-white w-full"></div>
          </div>
        </div>
      </div>

      <div className="bg-black">
        <div className="px-4 md:px-6 py-12 md:py-16 text-white">
          <section>
            <h2 className="text-2xl md:text-3xl font-semibold mb-6">감독/출연</h2>
            <ul className="flex flex-wrap gap-6 md:gap-8">
              {principalCast.map((c: Cast) => (
                <li key={c.id} className="flex flex-col items-center">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden mb-3 border border-neutral-700/60 bg-neutral-800">
                    {c.profile_path ? (
                      <img src={IMG.profile(c.profile_path)} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                  <div className="text-center text-sm md:text-base font-medium">{c.name}</div>
                  <div className="text-center text-xs text-neutral-400 max-w-[8rem] break-words">{c.character}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
