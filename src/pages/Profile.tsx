import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../supabase";
import { formatDate } from "../lib/format";
import ScoreBadge from "../components/ScoreBadge";
import type { ProfileInfo, Review, Title, TitleSource } from "../types";

type ProfileReview = Review & { titles: Title | null };
type CategoryFilter = "all" | TitleSource;

const CATEGORIES: { source: TitleSource; label: string; icon: string }[] = [
  { source: "tmdb_movie", label: "Film", icon: "▰" },
  { source: "tmdb_tv", label: "Serie TV", icon: "▤" },
  { source: "rawg_game", label: "Giochi", icon: "⌘" },
  { source: "anilist_anime", label: "Anime", icon: "◉" },
  { source: "anilist_manga", label: "Manga", icon: "▥" },
];

export default function Profile() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [items, setItems] = useState<ProfileReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError("");
      const [profileResult, reviewsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("reviews")
          .select("*, titles(*)")
          .eq("user_id", id)
          .order("updated_at", { ascending: false }),
      ]);

      if (cancelled) return;
      if (profileResult.error || reviewsResult.error) {
        setError("Non riesco a caricare il profilo. Riprova tra poco.");
      } else {
        setProfile((profileResult.data as ProfileInfo | null) ?? null);
        setItems((reviewsResult.data as unknown as ProfileReview[]) ?? []);
      }
      setLoading(false);
    }

    if (id) void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isOwnProfile = user?.id === id;
  const ratedItems = useMemo(() => items.filter((item) => item.titles), [items]);
  const average = ratedItems.length
    ? Math.round(
        ratedItems.reduce((sum, item) => sum + item.score, 0) /
          ratedItems.length,
      )
    : null;
  const favoriteCategory = CATEGORIES.map((item) => ({
    ...item,
    count: ratedItems.filter((review) => review.titles?.source === item.source)
      .length,
  })).sort((a, b) => b.count - a.count)[0];

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("it-IT");
    return ratedItems.filter((review) => {
      const matchesCategory =
        category === "all" || review.titles?.source === category;
      const matchesQuery =
        !normalizedQuery ||
        review.titles?.name.toLocaleLowerCase("it-IT").includes(normalizedQuery) ||
        review.body?.toLocaleLowerCase("it-IT").includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [ratedItems, category, query]);

  if (loading) {
    return (
      <div className="profile-page profile-loading" aria-live="polite">
        <span className="profile-spinner" />
        <p>Sto caricando il profilo…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-empty"><p>{error}</p></div>
      </div>
    );
  }

  const displayName = profile?.display_name || (isOwnProfile ? "Il mio profilo" : "Profilo");
  const initial = displayName.trim().charAt(0).toLocaleUpperCase("it-IT") || "?";

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-avatar-wrap">
          {profile?.avatar_url ? (
            <img className="profile-avatar" src={profile.avatar_url} alt={`Avatar di ${displayName}`} />
          ) : (
            <div className="profile-avatar profile-avatar-placeholder" aria-hidden="true">
              {initial}
            </div>
          )}
          <span className="profile-online-dot" title="Membro del gruppo" />
        </div>
        <div className="profile-heading">
          <p className="profile-eyebrow">ARCHIVIO PERSONALE</p>
          <h1>{displayName}</h1>
          <p className="profile-subtitle">
            {isOwnProfile
              ? "Tutto quello che hai valutato, raccolto in un unico posto."
              : "Le recensioni e i voti condivisi con il gruppo."}
          </p>
        </div>
        <Link className="profile-discover-link" to="/search">
          <span aria-hidden="true">＋</span> Aggiungi una recensione
        </Link>
      </section>

      <section className="profile-stats" aria-label="Statistiche del profilo">
        <article className="profile-stat-card">
          <span className="profile-stat-icon">✎</span>
          <div><strong>{ratedItems.length}</strong><span>Recensioni</span></div>
        </article>
        <article className="profile-stat-card">
          <span className="profile-stat-icon">◉</span>
          <div><strong>{average ?? "—"}</strong><span>Media voti</span></div>
        </article>
        <article className="profile-stat-card">
          <span className="profile-stat-icon">✦</span>
          <div>
            <strong>{favoriteCategory?.count ? favoriteCategory.label : "—"}</strong>
            <span>Categoria preferita</span>
          </div>
        </article>
      </section>

      <section className="profile-library">
        <div className="profile-library-heading">
          <div>
            <p className="profile-eyebrow">LA TUA COLLEZIONE</p>
            <h2>{isOwnProfile ? "Le mie recensioni" : "Le recensioni"}</h2>
          </div>
          <label className="profile-search">
            <span aria-hidden="true">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cerca nella collezione"
              aria-label="Cerca titolo o testo della recensione"
            />
          </label>
        </div>

        <div className="profile-filters" role="group" aria-label="Filtra per categoria">
          <button
            className={category === "all" ? "active" : ""}
            onClick={() => setCategory("all")}
          >
            Tutti <span>{ratedItems.length}</span>
          </button>
          {CATEGORIES.map((item) => {
            const count = ratedItems.filter(
              (review) => review.titles?.source === item.source,
            ).length;
            return (
              <button
                key={item.source}
                className={category === item.source ? "active" : ""}
                onClick={() => setCategory(item.source)}
              >
                <span aria-hidden="true">{item.icon}</span> {item.label}
                <span>{count}</span>
              </button>
            );
          })}
        </div>

        {visibleItems.length === 0 ? (
          <div className="profile-empty">
            <span className="profile-empty-icon" aria-hidden="true">⌕</span>
            <h3>{items.length === 0 ? "La collezione è ancora vuota" : "Nessun risultato"}</h3>
            <p>
              {items.length === 0
                ? "Quando valuterai un film, una serie, un gioco, un anime o un manga, lo ritroverai qui."
                : "Prova a cambiare categoria o termine di ricerca."}
            </p>
            {items.length === 0 && isOwnProfile && (
              <Link className="profile-empty-action" to="/search">Cerca qualcosa da recensire</Link>
            )}
          </div>
        ) : (
          <div className="profile-review-list">
            {visibleItems.map((review) => {
              const title = review.titles!;
              const categoryLabel = CATEGORIES.find(
                (item) => item.source === title.source,
              )?.label ?? "Altro";
              return (
                <article className="profile-review" key={review.id}>
                  <Link
                    className="profile-review-poster"
                    to={`/title/${title.source}/${title.external_id}`}
                    aria-label={`Apri ${title.name}`}
                  >
                    {title.poster_url ? (
                      <img src={title.poster_url} alt="" loading="lazy" />
                    ) : (
                      <span aria-hidden="true">✦</span>
                    )}
                  </Link>
                  <div className="profile-review-content">
                    <div className="profile-review-meta">
                      <span className="profile-category-pill">{categoryLabel}</span>
                      <span>{formatDate(review.updated_at)}</span>
                    </div>
                    <Link className="profile-review-title" to={`/title/${title.source}/${title.external_id}`}>
                      {title.name}
                    </Link>
                    <span className="profile-review-year">{title.year ?? "Anno sconosciuto"}</span>
                    {review.body ? (
                      <p className="profile-review-body">{review.body}</p>
                    ) : (
                      <p className="profile-review-body profile-review-no-body">Nessun commento aggiunto.</p>
                    )}
                  </div>
                  <div className="profile-review-score">
                    <ScoreBadge score={review.score} size={54} />
                    <span>IL MIO VOTO</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
