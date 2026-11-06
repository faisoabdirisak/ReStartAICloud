import { type FeasibilityTier, getFeasibilityTier } from '@restart-ai/shared';

const TIER_COLOR: Record<FeasibilityTier, string> = {
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
};

const TIER_TRACK: Record<FeasibilityTier, string> = {
  green: 'rgba(16,185,129,0.15)',
  amber: 'rgba(245,158,11,0.15)',
  red: 'rgba(239,68,68,0.15)',
};

interface FeasibilityRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function FeasibilityRing({ score, size = 72, strokeWidth = 6 }: FeasibilityRingProps) {
  const tier = getFeasibilityTier(score);
  const color = TIER_COLOR[tier];
  const track = TIER_TRACK[tier];
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`Feasibility score ${score} out of 100`}
        role="img"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </svg>
      <span
        className="absolute text-sm font-bold tabular-nums"
        style={{ color }}
        aria-hidden="true"
      >
        {score}
      </span>
    </div>
  );
}
