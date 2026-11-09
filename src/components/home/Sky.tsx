// Starscapes' night sky: a scatter of stars and one green constellation, the
// way the app joins its letters. Decoration only.
const stars: [number, number, number, number][] = [
  [22, 40, 1.2, 0.8], [64, 118, 0.9, 0.6], [120, 30, 1.5, 0.9], [170, 96, 0.8, 0.5],
  [236, 22, 1.1, 0.7], [300, 70, 1.6, 0.9], [356, 28, 0.9, 0.6], [388, 130, 1.2, 0.7],
  [30, 210, 1.4, 0.8], [96, 268, 0.8, 0.5], [340, 240, 1, 0.7], [380, 300, 1.5, 0.8],
  [18, 330, 0.9, 0.6], [60, 400, 1.3, 0.7], [360, 390, 0.8, 0.5], [250, 330, 0.7, 0.5],
  [140, 350, 1.1, 0.6], [300, 440, 1.2, 0.6], [200, 520, 1, 0.5], [40, 560, 1.3, 0.7],
];
const nodes: [number, number][] = [[70, 80], [140, 150], [60, 250], [330, 120], [350, 260]];

export default function Sky({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 600" preserveAspectRatio="xMidYMin slice" className={className} aria-hidden="true">
      <g fill="#ffffff">
        {stars.map(([x, y, r, o]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} opacity={o} />
        ))}
      </g>
      <path d="M70 80 L140 150 L60 250 M140 150 L330 120 L350 260" stroke="#5cf5a8" strokeWidth="1.6" opacity="0.75" fill="none" />
      <g fill="#07061a" stroke="#5cf5a8" strokeWidth="1.6">
        {nodes.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="6" />
        ))}
      </g>
    </svg>
  );
}
