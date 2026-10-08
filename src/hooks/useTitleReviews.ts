import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { Title, ReviewWithProfile } from "../types";

export function useTitleReviews(source: string, externalId: string) {
  const [title, setTitle] = useState<Title | null>(null); // null = nessuno l'ha ancora votato
  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: t } = await supabase
      .from("titles")
      .select("*")
      .eq("source", source)
      .eq("external_id", externalId)
      .maybeSingle();

    setTitle((t as Title | null) ?? null);

    if (t) {
      const { data: r } = await supabase
        .from("reviews")
        .select("*, profiles(display_name, avatar_url)")
        .eq("title_id", t.id)
        .order("updated_at", { ascending: false });
      setReviews((r as unknown as ReviewWithProfile[]) ?? []);
    } else {
      setReviews([]);
    }
    setLoading(false);
  }, [source, externalId]);

  useEffect(() => {
    load();
  }, [load]);

  return { title, reviews, loading, reload: load };
}
