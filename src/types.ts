export type TitleSource = "TMDB_Movie" | "TMDB_Tv" | "RAWG_Game";

// Quello che restituisce la funzione di ricerca (non ancora salvato nel db)
export interface SearchResult {
  source: TitleSource;
  external_id: string;
  name: string;
  year: number | null;
  poster_url: string | null;
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
}
