import { scoreColor } from "../lib/scoreColor";

interface Props {
  score: number | null;
  size?: number;
}

export default function ScoreBadge({ score, size = 44 }: Props) {
  return (
    <div
      style={{
        background: scoreColor(score),
        width: size,
        height: size,
        borderRadius: 8,
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
