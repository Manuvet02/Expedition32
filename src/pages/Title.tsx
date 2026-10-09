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
          // L'URL contiene gli identificatori canonici restituiti dalla ricerca.
          // I dettagli API servono per i metadati e potrebbero usare un formato diverso.
          source,
          external_id: externalId,
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
          .eq("source", source)
          .eq("external_id", externalId)
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
    console.log("save review", { error });
    if (error) alert("Salvataggio non riuscito, riprova.");
    else reload();
  }

  if (loading) return <p className="search-message">Carico voti e recensioni…</p>;
  if (detailsError) return <p className="search-message">Non riesco a caricare questo titolo.</p>;
  if (!details) return <p className="search-message">Carico i dettagli…</p>;

  const avg = reviews.length
    ? Math.round(reviews.reduce((s, r) => s + r.score, 0) / reviews.length)
    : null;
  const ratingScale = details.rating_scale ?? (
    details.source === "rawg_game" ? 5 :
    details.source === "anilist_anime" || details.source === "anilist_manga" ? 100 : 10
  );
  const ratingSource = details.source.startsWith("anilist_")
    ? "AniList"
    : details.source === "rawg_game" ? "RAWG" : "TMDB";
  const sourceRating = typeof details.rating === "number"
    ? `${details.rating.toFixed(1)}/${ratingScale} ${ratingSource}`
    : null;
  const detailFacts = [
    details.year ? String(details.year) : null,
    details.meta,
    sourceRating,
    typeof details.metacritic === "number" ? `Metacritic ${details.metacritic}/100` : null,
    details.esrb_rating ? `Classificazione ${details.esrb_rating}` : null,
    details.format,
    details.status,
    details.chapter_count != null ? `${details.chapter_count} capitoli` : null,
    details.volume_count != null ? `${details.volume_count} volumi` : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <article className="title-page">
      <div className="title-detail-hero">
        {details.poster_url && (
          <img className="title-poster" src={details.poster_url} alt={`Copertina di ${details.name}`} />
        )}
        <div className="title-info">
          <p className="eyebrow">SCHEDA OPERA</p>
          <h1>{details.name}</h1>
          <div className="title-meta">
            {detailFacts.map((fact) => <span key={fact}>{fact}</span>)}
          </div>
          {details.genres?.length > 0 && <p className="title-genres">{details.genres.join(" · ")}</p>}
          {details.rating_count != null && <p className="title-source-count">Valutazione esterna · {details.rating_count.toLocaleString("it-IT")} voti</p>}
          {details.popularity != null && <p className="title-source-count">Nelle liste di {details.popularity.toLocaleString("it-IT")} utenti AniList</p>}
          <div className="title-group-score">
            <ScoreBadge score={avg} size={56} />
            <small>{reviews.length} {reviews.length === 1 ? "voto del gruppo" : "voti del gruppo"}</small>
          </div>
        </div>
      </div>

      {details.overview && <p className="title-overview">{details.overview}</p>}

      {(details.director || details.creators?.length || details.cast?.length || details.platforms?.length || details.developers?.length || details.publishers?.length || details.episode_count != null || details.trailer_url || details.website || details.studios?.length || details.external_url) && (
        <section className="title-facts" aria-label="Informazioni aggiuntive">
          {details.director && <p><strong>Regia</strong><span>{details.director}</span></p>}
          {!!details.creators?.length && <p><strong>Creato da</strong><span>{details.creators.join(", ")}</span></p>}
          {!!details.developers?.length && <p><strong>Sviluppato da</strong><span>{details.developers.join(", ")}</span></p>}
          {!!details.publishers?.length && <p><strong>Pubblicato da</strong><span>{details.publishers.join(", ")}</span></p>}
          {!!details.studios?.length && <p><strong>Studio</strong><span>{details.studios.join(", ")}</span></p>}
          {!!details.platforms?.length && <p><strong>Piattaforme</strong><span>{details.platforms.join(", ")}</span></p>}
          {details.episode_count != null && <p><strong>Episodi</strong><span>{details.episode_count}</span></p>}
          {!!details.cast?.length && <p><strong>Cast</strong><span>{details.cast.join(", ")}</span></p>}
          <div className="title-external-links">
            {details.trailer_url && <a href={details.trailer_url} target="_blank" rel="noreferrer">Guarda il trailer ↗</a>}
            {details.website && <a href={details.website} target="_blank" rel="noreferrer">Sito ufficiale ↗</a>}
            {details.external_url && <a href={details.external_url} target="_blank" rel="noreferrer">Apri su AniList ↗</a>}
          </div>
        </section>
      )}

      <section className="title-section">
        <p className="eyebrow">IL TUO PUNTO DI VISTA</p>
        <h2>{mine ? "La tua recensione" : "Lascia una recensione"}</h2>
        <div className="review-form">
          <ScoreSlider value={score} onChange={setScore} />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Cosa ti è rimasto? Puoi scrivere un commento o una recensione…"
            rows={3}
            aria-label="La tua recensione"
          />
          <div className="review-form-actions">
            <button onClick={save} disabled={saving}>
              {saving ? "Salvo…" : mine ? "Aggiorna recensione" : "Pubblica recensione"}
            </button>
          </div>
        </div>
      </section>

      <section className="title-section">
        <p className="eyebrow">ALTRI PUNTI DI VISTA</p>
        <h2>Recensioni del gruppo</h2>
        {reviews.length === 0 && <p>Nessun voto ancora: apri tu le danze.</p>}
        <div className="review-list">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </section>
    </article>
  );
}
