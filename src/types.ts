export type TitleSource = "tmdb_movie" | "tmdb_tv" | "rawg_game";

// Quello che restituisce la funzione di ricerca (non ancora salvato nel db)
export interface SearchResult {
  source: TitleSource;
  external_id: string;
  name: string;
  year: number | null;
  poster_url: string | null;
  /** Punteggio della fonte esterna: TMDB /10, RAWG /5. */
  rating?: number | null;
  rating_count?: number | null;
  /** RAWG: punteggio Metacritic /100. */
  metacritic?: number | null;
  /** RAWG: piattaforme principali restituite dalla ricerca. */
  platforms?: string[];
}

// Riga della tabella titles
export interface Title extends SearchResult {
  id: number;
}

// Riga della tabella reviews
export interface Review {
  id: number;
  user_id: string;
  title_id: number;
  score: number; // 0-100
  body: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileInfo {
  display_name: string;
  avatar_url: string | null;
}

export type ReviewWithProfile = Review & { profiles: ProfileInfo | null };

export type ReviewWithTitle = Review & {
  titles: Title | null;
  profiles: { display_name: string } | null;
};

export interface TitleDetails extends SearchResult {
  backdrop_url: string | null;
  overview: string | null;
  genres: string[];
  meta: string | null;
  runtime_minutes?: number | null;
  season_count?: number | null;
  episode_count?: number | null;
  director?: string | null;
  creators?: string[];
  cast?: string[];
  trailer_url?: string | null;
  developers?: string[];
  publishers?: string[];
  esrb_rating?: string | null;
  website?: string | null;
}
