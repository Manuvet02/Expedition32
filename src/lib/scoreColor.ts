export function scoreColor(score: number | null): string {
  if (score == null) return "var(--muted)";
  if (score >= 90) return "var(--gold)";
  if (score >= 75) return "var(--green)";
  if (score >= 50) return "var(--yellow)";
  return "var(--red)";
}
