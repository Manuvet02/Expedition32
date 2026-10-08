import { scoreColor } from "../lib/scoreColor";

interface Props {
  score: number | null;
  size?: number;
}

export default function ScoreBadge({ score, size = 44 }: Props) {
  return (
    <div
      className="score-badge"
      style={{
        background: scoreColor(score),
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        fontWeight: 700,
        color: "#111",
        flexShrink: 0,
      }}
    >
      {score ?? "–"}
    </div>
  );
}
