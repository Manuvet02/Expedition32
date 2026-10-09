import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import ScoreBadge from "../components/ScoreBadge";
import { formatDate } from "../lib/format";
import type { ReviewWithTitle } from "../types";

const CATEGORY_SECTIONS = [
  { key: "movie", label: "Film", sources: ["tmdb_movie"] },
  { key: "tv", label: "Serie TV", sources: ["tmdb_tv"] },
  { key: "games", label: "Videogiochi", sources: ["rawg_game"] },
  { key: "anime", label: "Anime", sources: ["anilist_anime"] },
  { key: "manga", label: "Manga", sources: ["anilist_manga"] },
];

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

  const groupedReviews = new Map<string, {
    title: NonNullable<ReviewWithTitle["titles"]>;
    reviews: ReviewWithTitle[];
    reviewers: Set<string>;
  }>();
  for (const review of items) {
    if (!review.titles) continue;
    const titleKey = `${review.titles.source}:${review.titles.external_id}`;
    const group = groupedReviews.get(titleKey);
    if (group) {
      // La query è ordinata dal più recente: se esistono righe duplicate,
      // mantieni per la home la recensione più recente dello stesso utente.
      if (!group.reviewers.has(review.user_id)) {
        group.reviews.push(review);
        group.reviewers.add(review.user_id);
      }
    } else {
      groupedReviews.set(titleKey, {
        title: review.titles,
        reviews: [review],
        reviewers: new Set([review.user_id]),
      });
    }
  }
  const works = [...groupedReviews.values()];

  return (
    <div className="feed-page">
      <header className="page-heading">
        <p className="eyebrow">IL NOSTRO DIARIO</p>
        <h1>Le ultime recensioni.</h1>
        <p>Film, serie, giochi, anime e manga: le storie che ci hanno lasciato qualcosa.</p>
      </header>
      {works.length === 0 ? (
        <p className="search-message">Ancora niente: vai su Cerca e lascia la prima recensione.</p>
      ) : (
        <div className="feed-categories">
          {CATEGORY_SECTIONS.map((category) => {
            const categoryWorks = works.filter((work) =>
              category.sources.includes(work.title.source),
            );
            if (!categoryWorks.length) return null;

            return (
              <section className="feed-category" key={category.key}>
                <header className="feed-category-heading">
                  <p className="eyebrow">SEZIONE</p>
                  <h2>{category.label}</h2>
                  <span>{categoryWorks.length} {categoryWorks.length === 1 ? "opera" : "opere"}</span>
                </header>
                <div className="feed-list">
                  {categoryWorks.map(({ title, reviews }) => {
                    const titlePath = `/title/${title.source}/${title.external_id}`;

                    return (
                      <article className="editorial-review" key={`${title.source}:${title.external_id}`}>
                        <Link className="editorial-review-poster" to={titlePath} aria-label={`Apri ${title.name}`}>
                          {title.poster_url ? (
                            <img src={title.poster_url} alt="" loading="lazy" />
                          ) : (
                            <span aria-hidden="true">✦</span>
                          )}
                        </Link>
                        <div className="editorial-review-copy">
                          <div className="editorial-review-byline">
                            <span>{reviews.length} {reviews.length === 1 ? "recensione" : "recensioni"}</span>
                          </div>
                          <div className="editorial-review-heading">
                            <div>
                              <h3><Link to={titlePath}>{title.name}</Link></h3>
                              <p>{title.year ?? "Anno sconosciuto"}</p>
                            </div>
                          </div>
                          <div className="editorial-review-list">
                            {reviews.map((review) => {
                              const authorName = review.profiles?.display_name ?? "Qualcuno";
                              return (
                                <section className="editorial-review-entry" key={review.id}>
                                  <div className="editorial-review-entry-meta">
                                    <span>Recensione di <Link to={`/u/${review.user_id}`}>{authorName}</Link></span>
                                    <time dateTime={review.updated_at}>{formatDate(review.updated_at)}</time>
                                    <ScoreBadge score={review.score} size={42} />
                                  </div>
                                  <blockquote className={review.body?.trim() ? "" : "editorial-review-empty"}>
                                    {review.body?.trim() || `${authorName} ha lasciato un voto senza aggiungere un commento.`}
                                  </blockquote>
                                </section>
                              );
                            })}
                          </div>
                          <Link className="editorial-review-link" to={titlePath}>Apri la scheda dell’opera <span aria-hidden="true">↗</span></Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
