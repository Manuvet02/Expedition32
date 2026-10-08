import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../hooks/useAuth";
import { useTitleReviews } from "../hooks/useTitleReviews";
import ScoreBadge from "../components/ScoreBadge";
import ScoreSlider from "../components/ScoreSlider";
import ReviewCard from "../components/ReviewCard";
import type { TitleDetails } from "../types";

export default function Title() {
  const { source = "", externalId = "" } = useParams();
  const { user } = useAuth();
  const { title, reviews, loading, reload } = useTitleReviews(
    source,
    externalId,
  );

  // dati live dalle API
  const [details, setDetails] = useState<TitleDetails | null>(null);
  const [detailsError, setDetailsError] = useState(false);

  useEffect(() => {
    setDetails(null);
    setDetailsError(false);
    supabase.functions
      .invoke("title-details", { body: { source, id: externalId } })
      .then(({ data, error }) => {
        if (error || !data) setDetailsError(true);
        else setDetails(typeof data === "string" ? JSON.parse(data) : data);
      });
  }, [source, externalId]);

  // il mio voto
  const mine = reviews.find((r) => r.user_id === user?.id);
  const [score, setScore] = useState(50);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mine) {
      setScore(mine.score);
      setBody(mine.body ?? "");
    }
  }, [mine]);

  async function save() {
    if (!user || !details) return;
    setSaving(true);

    // 1) se nessuno l'ha mai votato, creo la riga minima del titolo
    let titleId = title?.id;
    if (!titleId) {
      const { data, error } = await supabase
        .from("titles")
        .insert({
          source: details.source,
          external_id: details.external_id,
          name: details.name,
          year: details.year,
          poster_url: details.poster_url,
        })
        .select()
        .single();

      if (error) {
        // forse un amico l'ha appena creata: la recupero
        const { data: again } = await supabase
          .from("titles")
          .select("id")
          .eq("source", details.source)
          .eq("external_id", details.external_id)
          .maybeSingle();
        titleId = again?.id;
      } else {
        titleId = data.id;
      }
    }

    if (!titleId) {
      alert("Non riesco a salvare il titolo, riprova.");
      setSaving(false);
      return;
    }

    // 2) salvo o aggiorno il mio voto
    const { error } = await supabase.from("reviews").upsert(
      {
        user_id: user.id,
        title_id: titleId,
        score,
        body: body.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,title_id" },
    );

    setSaving(false);
    if (error) alert("Salvataggio non riuscito, riprova.");
    else reload();
  }

  if (loading) return <p>Carico…</p>;
  if (detailsError) return <p>Non riesco a caricare questo titolo.</p>;
  if (!details) return <p>Carico i dettagli…</p>;

  const avg = reviews.length
    ? Math.round(reviews.reduce((s, r) => s + r.score, 0) / reviews.length)
    : null;

  return (
    <>
      <div style={{ display: "flex", gap: 16 }}>
        {details.poster_url && (
          <img src={details.poster_url} alt="" width={120} />
        )}
        <div>
          <h2 style={{ marginTop: 0 }}>{details.name}</h2>
          <small>
            {[details.year, details.meta].filter(Boolean).join(" · ")}
          </small>
          {details.genres.length > 0 && <p>{details.genres.join(", ")}</p>}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <ScoreBadge score={avg} size={56} />
            <small>{reviews.length} voti del gruppo</small>
          </div>
        </div>
      </div>

      {details.overview && <p>{details.overview}</p>}

      <section>
        <h3>{mine ? "Il tuo voto" : "Lascia il tuo voto"}</h3>
        <ScoreSlider value={score} onChange={setScore} />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Due righe, se ti va (puoi anche aggiungerle dopo)"
          rows={3}
          style={{ width: "100%", marginTop: 8, boxSizing: "border-box" }}
        />
        <button onClick={save} disabled={saving}>
          {saving ? "Salvo…" : mine ? "Aggiorna" : "Salva voto"}
        </button>
      </section>

      <section>
        <h3>Voti del gruppo</h3>
        {reviews.length === 0 && <p>Nessun voto ancora: apri tu le danze.</p>}
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </section>
    </>
  );
}
