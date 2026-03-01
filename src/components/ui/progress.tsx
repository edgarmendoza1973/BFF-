import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  showLabel?: boolean;
}

function Progress({ className, value = 0, max = 100, showLabel, ...props }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-gray-100', className)} {...props}>
      <div
        className="h-full bg-indigo-600 transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
      {showLabel && (
        <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-700 font-medium">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

export { Progress };
