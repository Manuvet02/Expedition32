import { Link } from "react-router-dom";
import ScoreBadge from "./ScoreBadge";
import { formatDate } from "../lib/format";
import type { ReviewWithProfile } from "../types";

export default function ReviewCard({ review }: { review: ReviewWithProfile }) {
  return (
    <article className="review-card">
      <ScoreBadge score={review.score} />
      <div className="review-card-copy">
        <Link className="review-card-author" to={`/u/${review.user_id}`}>
          <strong>{review.profiles?.display_name ?? "Anonimo"}</strong>
        </Link>
        <small className="review-card-date"> · {formatDate(review.updated_at)}</small>
        {review.body && <p>{review.body}</p>}
      </div>
    </article>
  );
}
