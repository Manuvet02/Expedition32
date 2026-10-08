import { Link } from "react-router-dom";
import ScoreBadge from "./ScoreBadge";
import { formatDate } from "../lib/format";
import type { ReviewWithProfile } from "../types";

export default function ReviewCard({ review }: { review: ReviewWithProfile }) {
  return (
    <article style={{ display: "flex", gap: 12, padding: "12px 0" }}>
      <ScoreBadge score={review.score} />
      <div>
        <Link to={`/u/${review.user_id}`}>
          <strong>{review.profiles?.display_name ?? "Anonimo"}</strong>
        </Link>
        <small> · {formatDate(review.updated_at)}</small>
        {review.body && <p>{review.body}</p>}
      </div>
    </article>
  );
}
