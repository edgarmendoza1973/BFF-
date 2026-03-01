'use client';

interface ProgressEntry {
  action_type: string;
  points_earned: number;
  created_at: string;
}

interface ProgressChartProps {
  history: ProgressEntry[];
  faithPoints: number;
  memberLevel: string;
}

const ACTION_LABELS: Record<string, string> = {
  daily_login:              '🌅 Daily Login',
  journal_entry_private:    '📝 Private Journal',
  journal_entry_leader:     '📝 Shared with Leader',
  journal_entry_group:      '📝 Group Journal',
  journal_entry_community:  '📝 Community Journal',
  event_attendance:         '📅 Event Attended',
  prayer_prayed:            '🙏 Prayer Prayed',
  prayer_shared:            '🙏 Prayer Shared',
  volunteer_hour:           '🤝 Volunteer Hour',
  referral:                 '👤 Referral',
  bible_verse_note:         '📖 Verse Note',
  bible_bookmark:           '🔖 Bookmark',
  group_joined:             '👥 Joined Group',
  first_message:            '💬 First Message',
  sermon_played:            '🎵 Sermon Played',
};

const LEVEL_ORDER = ['new_member', 'growing', 'established', 'leader_track', 'shepherd'];
const LEVEL_THRESHOLDS = { new_member: 0, growing: 100, established: 300, leader_track: 700, shepherd: 1500 };
const LEVEL_LABELS: Record<string, string> = {
  new_member: 'New Member', growing: 'Growing', established: 'Established',
  leader_track: 'Leader Track', shepherd: 'Shepherd',
};

export function ProgressChart({ history, faithPoints, memberLevel }: ProgressChartProps) {
  // Group by action type for summary
  const summary: Record<string, { label: string; count: number; points: number }> = {};
  for (const entry of history) {
    const key = entry.action_type;
    if (!summary[key]) summary[key] = { label: ACTION_LABELS[key] || key, count: 0, points: 0 };
    summary[key].count++;
    summary[key].points += entry.points_earned;
  }

  const summaryEntries = Object.entries(summary).sort((a, b) => b[1].points - a[1].points);
  const currentIdx = LEVEL_ORDER.indexOf(memberLevel);
  const nextLevel = LEVEL_ORDER[currentIdx + 1];
  const nextThreshold = nextLevel ? (LEVEL_THRESHOLDS as any)[nextLevel] : null;
  const currentThreshold = (LEVEL_THRESHOLDS as any)[memberLevel] || 0;
  const progressPct = nextThreshold
    ? Math.min(((faithPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100, 100)
    : 100;

  return (
    <div className="space-y-5">
      {/* Level progress bar */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-indigo-800">{LEVEL_LABELS[memberLevel] || memberLevel}</span>
          <span className="text-sm font-bold text-indigo-600">{faithPoints.toLocaleString()} pts</span>
        </div>
        <div className="w-full bg-white rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {nextLevel && (
          <p className="text-xs text-gray-500 mt-1.5">
            {(nextThreshold - faithPoints).toLocaleString()} pts to {LEVEL_LABELS[nextLevel]}
          </p>
        )}
      </div>

      {/* Activity summary */}
      {summaryEntries.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm">Start earning faith points to see your progress here!</p>
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Activity Breakdown</p>
          <div className="space-y-2">
            {summaryEntries.slice(0, 8).map(([key, val]) => {
              const maxPts = summaryEntries[0]?.[1].points || 1;
              const barWidth = (val.points / maxPts) * 100;
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-36 shrink-0 text-xs text-gray-600 truncate">{val.label}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 shrink-0 w-16 text-right">
                    {val.count}× · {val.points}pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {history.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {history.slice(0, 20).map((entry, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0">
                <span className="text-xs text-gray-600">{ACTION_LABELS[entry.action_type] || entry.action_type}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-indigo-600">+{entry.points_earned}</span>
                  <span className="text-xs text-gray-400">{new Date(entry.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
