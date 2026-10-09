export function scoreColor(score: number | null): string {
  if (score == null) return "var(--muted)";
  if (score >= 61) return "var(--green)";
  if (score >= 40) return "var(--yellow)";
  return "var(--red)";
}
