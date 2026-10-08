import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { SearchResult, TitleSource } from "../types";

const SECTIONS: { key: string; label: string; sources: TitleSource[] }[] = [
  { key: "movie", label: "Film", sources: ["TMDB_Movie"] },
  { key: "tv", label: "Serie TV", sources: ["TMDB_Tv"] },
  { key: "game", label: "Giochi", sources: ["RAWG_Game"] },
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

      console.log("risposta ricerca:", { data, error }); // toglilo quando tutto funziona

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
    <li
      key={r.source + r.external_id}
      onClick={() => onPick(r)}
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: "8px 0",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {r.poster_url && <img src={r.poster_url} alt="" width={48} />}
      <span style={{ flex: 1 }}>{r.name}</span>
      <small>{r.year ?? "—"}</small>
    </li>
  );

  return (
    <div className="search" style={{ width: "100%" }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cerca un film, una serie o un gioco…"
        style={{
          width: "100%",
          padding: 12,
          fontSize: 16,
          boxSizing: "border-box",
        }}
      />

      {loading && <p>Cerco…</p>}
      {error && <p>{error}</p>}
      {searched && !loading && !error && results.length === 0 && (
        <p>Nessun risultato per “{query}”.</p>
      )}
      {results.length > 0 && <p>{results.length} risultati</p>}

      {SECTIONS.map(({ key, label, sources }) => {
        const items = results.filter((r) => sources.includes(r.source));
        if (!items.length) return null;
        return (
          <section key={key}>
            <h3>{label}</h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {items.map(renderItem)}
            </ul>
          </section>
        );
      })}

      {others.length > 0 && (
        <section>
          <h3>Altri risultati</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {others.map(renderItem)}
          </ul>
        </section>
      )}
    </div>
  );
}
