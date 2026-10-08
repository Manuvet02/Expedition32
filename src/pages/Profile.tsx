import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";
import TitleCard from "../components/TitleCard";
import type { ReviewWithTitle } from "../types";

export default function Profile() {
  const { id } = useParams();
  const [name, setName] = useState("");
  const [items, setItems] = useState<ReviewWithTitle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("reviews")
        .select("*, titles(*), profiles(display_name)")
        .eq("user_id", id)
        .order("updated_at", { ascending: false }),
    ]).then(([p, r]) => {
      setName(p.data?.display_name ?? "");
      setItems((r.data as unknown as ReviewWithTitle[]) ?? []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <p>Carico…</p>;

  return (
    <>
      <h2>{name || "Profilo"}</h2>
      <small>{items.length} voti</small>
      {items.map(
        (r) =>
          r.titles && (
            <TitleCard
              key={r.id}
              title={r.titles}
              score={r.score}
              note={r.body ?? undefined}
            />
          ),
      )}
    </>
  );
}
