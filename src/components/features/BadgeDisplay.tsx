'use client';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  earned?: boolean;
  earned_at?: string;
}

interface BadgeDisplayProps {
  badges: Badge[];
  earnedIds?: number[];
  compact?: boolean;
}

export function BadgeDisplay({ badges, earnedIds = [], compact = false }: BadgeDisplayProps) {
  if (badges.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="text-4xl mb-2">🏅</div>
        <p className="text-sm">No badges yet. Keep growing!</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-5' : 'grid-cols-2 sm:grid-cols-3'}`}>
      {badges.map(badge => {
        const isEarned = badge.earned || earnedIds.includes(badge.id);
        return (
          <div
            key={badge.id}
            title={`${badge.name}: ${badge.description}`}
            className={`flex ${compact ? 'flex-col items-center p-2' : 'items-center gap-3 p-3'} rounded-xl border-2 transition-all
              ${isEarned
                ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                : 'border-gray-100 bg-gray-50 opacity-50 grayscale'
              }`}
          >
            <span className={compact ? 'text-2xl' : 'text-3xl shrink-0'}>{badge.icon}</span>
            {!compact && (
              <div className="min-w-0">
                <p className={`text-sm font-semibold truncate ${isEarned ? 'text-indigo-800' : 'text-gray-500'}`}>
                  {badge.name}
                </p>
                <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{badge.description}</p>
                {isEarned && badge.earned_at && (
                  <p className="text-xs text-indigo-400 mt-0.5">
                    Earned {new Date(badge.earned_at).toLocaleDateString()}
                  </p>
                )}
                {!isEarned && <p className="text-xs text-gray-400 mt-0.5">Locked</p>}
              </div>
            )}
            {compact && (
              <p className={`text-xs text-center truncate w-full mt-0.5 ${isEarned ? 'text-indigo-700 font-medium' : 'text-gray-400'}`}>
                {badge.name}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
