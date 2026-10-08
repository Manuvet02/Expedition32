import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { SearchResult, TitleSource } from "../types";

const SECTIONS: { key: string; label: string; sources: TitleSource[] }[] = [
  { key: "movie", label: "Film", sources: ["tmdb_movie"] },
  { key: "tv", label: "Serie TV", sources: ["tmdb_tv"] },
  { key: "game", label: "Giochi", sources: ["rawg_game"] },
];

const KNOWN_SOURCES: string[] = SECTIONS.flatMap((s) => s.sources);

interface Props {
  onPick: (result: SearchResult) => void;
}

export default function SearchTitles({ onPick }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false; // ignora le risposte vecchie se nel frattempo hai digitato altro
    setLoading(true);

    const timer = setTimeout(async () => {
      const { data, error } = await supabase.functions.invoke("search-titles", {
        body: { q: query.trim() },
      });
      if (cancelled) return;

      if (error) {
        setError("La ricerca non è riuscita. Riprova tra poco.");
        setResults([]);
      } else {
        // a volte la risposta arriva come testo invece che come JSON già letto
        const parsed: unknown =
          typeof data === "string" ? JSON.parse(data) : data;
        setError(null);
        setResults(Array.isArray(parsed) ? (parsed as SearchResult[]) : []);
      }
      setSearched(true);
      setLoading(false);
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const others = results.filter((r) => !KNOWN_SOURCES.includes(r.source));

  const renderItem = (r: SearchResult) => (
    <li className="search-result-item"
      key={r.source + r.external_id}
    >
      <button className="search-result" type="button" onClick={() => onPick(r)}>
        {r.poster_url && <img src={r.poster_url} alt="" width={48} />}
        <span className="search-result-copy">
          <span className="search-result-name">{r.name}</span>
          <span className="search-result-details">
            {r.year ?? "Anno sconosciuto"}
            {r.platforms?.length ? ` · ${r.platforms.join(", ")}` : ""}
          </span>
        </span>
        <span className="search-result-ratings">
          {typeof r.rating === "number" && (
            <small title={`Valutazione della fonte · ${r.rating_count ?? 0} voti`}>
              ★ {r.rating.toFixed(1)}{r.source === "tmdb_movie" || r.source === "tmdb_tv" ? "/10" : "/5"}
            </small>
          )}
          {typeof r.metacritic === "number" && (
            <small title="Punteggio Metacritic">MC {r.metacritic}</small>
          )}
        </span>
      </button>
    </li>
  );

  return (
    <div className="search-panel">
      <input
        className="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cerca un film, una serie o un gioco…"
        aria-label="Cerca un film, una serie o un gioco"
      />

      {loading && <p className="search-message">Cerco…</p>}
      {error && <p className="search-message" role="alert">{error}</p>}
      {searched && !loading && !error && results.length === 0 && (
        <p className="search-message">Nessun risultato per “{query}”.</p>
      )}
      {results.length > 0 && <p className="search-results-count">{results.length} risultati</p>}

      {SECTIONS.map(({ key, label, sources }) => {
        const items = results.filter((r) => sources.includes(r.source));
        if (!items.length) return null;
        return (
        <section className="search-group" key={key}>
            <h3>{label}</h3>
            <ul className="search-list">
              {items.map(renderItem)}
            </ul>
          </section>
        );
      })}

      {others.length > 0 && (
        <section className="search-group">
          <h3>Altri risultati</h3>
          <ul className="search-list">
            {others.map(renderItem)}
          </ul>
        </section>
      )}
    </div>
  );
}
