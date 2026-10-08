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

  if (loading) return <p>Carico…</p>;

  return (
    <>
      <h2>Ultimi voti</h2>
      {items.length === 0 && (
        <p>Ancora niente: vai su Cerca e vota il primo titolo.</p>
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
    </>
  );
}
