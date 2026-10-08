interface Props {
  value: number;
  onChange: (value: number) => void;
}

export default function ScoreSlider({ value, onChange }: Props) {
  const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n) || 0));
  return (
    <div className="score-slider">
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Voto da 0 a 100"
      />
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        aria-label="Voto numerico"
      />
    </div>
  );
}
