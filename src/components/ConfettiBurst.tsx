const pieces = Array.from({ length: 26 }, (_, index) => index);

export function ConfettiBurst() {
  return <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">{pieces.map((piece) => <i key={piece} className="confetti-piece" style={{ left: `${(piece * 37) % 100}%`, backgroundColor: ['#22d3ee', '#34d399', '#fbbf24', '#a78bfa'][piece % 4], animationDelay: `${(piece % 8) * 0.06}s` }} />)}</div>;
}
