import { Link } from "react-router-dom";
import ScoreBadge from "./ScoreBadge";
import type { Title } from "../types";

interface Props {
  title: Title;
  score?: number | null;
  note?: string;
}

export default function TitleCard({ title, score, note }: Props) {
  return (
    <Link
      to={`/title/${title.source}/${title.external_id}`}
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: "8px 0",
      }}
    >
      {title.poster_url && <img src={title.poster_url} alt="" width={48} />}
      <div style={{ flex: 1 }}>
        <strong>{title.name}</strong> <small>{title.year ?? "—"}</small>
        {note && <p style={{ margin: 0 }}>{note}</p>}
      </div>
      {score !== undefined && <ScoreBadge score={score} />}
    </Link>
  );
}
