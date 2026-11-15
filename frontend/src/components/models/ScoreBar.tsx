import { cn } from '@/lib/utils';

function scoreColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 80) return 'bg-blue-500';
  if (score >= 70) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function ScoreBar({
  label,
  score,
  compact = false,
}: {
  label: string;
  score: number | null;
  compact?: boolean;
}) {
  if (score === null) return null;

  return (
    <div className={cn('flex items-center gap-2', compact ? 'text-xs' : 'text-sm')}>
      <span className={cn('shrink-0 text-muted-foreground', compact ? 'w-16' : 'w-20')}>
        {label}
      </span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', scoreColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn('shrink-0 font-medium tabular-nums', compact ? 'w-7' : 'w-8')}>
        {score}
      </span>
    </div>
  );
}
