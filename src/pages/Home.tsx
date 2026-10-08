import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import TitleCard from "../components/TitleCard";
import type { ReviewWithTitle } from "../types";

export default function Home() {
  const [items, setItems] = useState<ReviewWithTitle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("reviews")
      .select("*, titles(*), profiles(display_name)")
      .order("updated_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setItems((data as unknown as ReviewWithTitle[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="search-message">Carico le ultime recensioni…</p>;

  return (
    <div className="feed-page">
      <header className="page-heading">
        <p className="eyebrow">IL NOSTRO DIARIO</p>
        <h1>Le ultime recensioni.</h1>
        <p>Film, serie e videogiochi: un’opera, tante prospettive.</p>
      </header>
      <div className="feed-list">
        {items.length === 0 && (
          <p className="search-message">Ancora niente: vai su Cerca e lascia la prima recensione.</p>
        )}
        {items.map(
          (r) =>
            r.titles && (
              <TitleCard
                key={r.id}
                title={r.titles}
                score={r.score}
                note={`${r.profiles?.display_name ?? "Qualcuno"} ha votato`}
              />
            ),
        )}
      </div>
    </div>
  );
}
