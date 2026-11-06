const CATEGORY_META = {
  'career-pivot': { label: 'Career Pivot', color: 'bg-primary/10 text-primary border-primary/20' },
  upskilling: {
    label: 'Upskilling',
    color: 'bg-success/10 text-success border-success/20',
  },
  'micro-business': {
    label: 'Micro-Business',
    color: 'bg-warning/10 text-warning border-warning/20',
  },
} as const;

interface CategoryBadgeProps {
  category: keyof typeof CATEGORY_META;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}
