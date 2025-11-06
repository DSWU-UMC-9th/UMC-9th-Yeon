export type Movie = {
  id: number;
  title: string;
  name?: string;
  poster_path: string | null;
  overview: string;
};

export interface Genre {
  id: number;
  name: string;
}
export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string; // "YYYY-MM-DD"
  runtime: number | null;
  genres: Genre[];
  production_companies: ProductionCompany[];
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  known_for_department?: string;
}

export interface Crew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Credits {
  id: number;
  cast: Cast[];
  crew: Crew[];
}
