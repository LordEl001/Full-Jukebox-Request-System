import React from 'react';
import { QueueItem } from '../types';
import { Trophy, Medal, Award, Sparkles, Music, Star, Edit2 } from 'lucide-react';

interface LeaderboardProps {
  completedQueue: QueueItem[];
  isHost?: boolean;
  onEditScore?: (queueId: string, currentScore: number) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  completedQueue,
  isHost,
  onEditScore,
}) => {
  // 1. Filter completed items that have been assigned a numeric score
  // 2. Sort by score descending (100% -> 1%)
  // 3. Tie-breaker: earlier performance ranks higher (timestamp ascending)
  const top10Entries = React.useMemo(() => {
    const scored = completedQueue.filter((item) => typeof item.score === 'number' && item.score >= 1);
    scored.sort((a, b) => {
      if (b.score! !== a.score!) {
        return b.score! - a.score!;
      }
      return (a.timestamp || 0) - (b.timestamp || 0);
    });
    return scored.slice(0, 10);
  }, [completedQueue]);

  return (
    <div
      id="competition-leaderboard"
      className="space-y-4 pt-6 border-t border-white/10"
    >
      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500/15 via-[#141414] to-[#111111] border border-amber-500/30 shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-md">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white truncate">
                Top 10 Competition Leaderboard
              </h3>
              <span className="text-[10px] sm:text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-white/50 truncate mt-0.5">
              Ranked by singing score (1% - 100%) • Earlier performances break ties
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono font-bold text-amber-400 bg-black/50 px-3 py-1.5 rounded-full border border-amber-500/30">
            {top10Entries.length} / 10 Ranked
          </span>
        </div>
      </div>

      {/* Leaderboard Content */}
      {top10Entries.length === 0 ? (
        <div className="py-12 px-6 text-center bg-white/5 border border-white/5 rounded-2xl sm:rounded-3xl">
          <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-white/20 mx-auto mb-3" />
          <p className="text-sm sm:text-base text-white/80 font-bold">
            No Competition Scores Yet
          </p>
          <p className="text-xs sm:text-sm text-white/40 mt-1 max-w-md mx-auto">
            Once singers complete their songs and the host assigns scores (1% to 100%), the top 10 performances will appear here dynamically.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {top10Entries.map((item, index) => {
            const rank = index + 1;
            const isFirst = rank === 1;
            const isSecond = rank === 2;
            const isThird = rank === 3;
            const isPodium = rank <= 3;

            return (
              <div
                key={`leaderboard-${item.queueId}-${rank}`}
                className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-200 border flex items-center justify-between gap-3 min-w-0 ${
                  isFirst
                    ? 'bg-gradient-to-r from-amber-500/20 via-[#18150f] to-[#121212] border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : isSecond
                    ? 'bg-gradient-to-r from-slate-300/15 via-[#161616] to-[#121212] border-slate-300/30 shadow-md'
                    : isThird
                    ? 'bg-gradient-to-r from-orange-500/15 via-[#161311] to-[#121212] border-orange-500/30 shadow-md'
                    : 'bg-white/5 hover:bg-white/[0.07] border-white/10'
                }`}
              >
                {/* Left: Rank & Singer Details */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  {/* Rank Icon / Number */}
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 font-mono font-black text-sm shadow-sm ${
                      isFirst
                        ? 'bg-amber-400 text-black shadow-amber-400/30 ring-2 ring-amber-400/40'
                        : isSecond
                        ? 'bg-slate-200 text-black shadow-slate-200/20 ring-1 ring-slate-300/30'
                        : isThird
                        ? 'bg-orange-400 text-black shadow-orange-400/20 ring-1 ring-orange-400/30'
                        : 'bg-white/10 text-white/50 border border-white/15'
                    }`}
                  >
                    {isFirst ? (
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                    ) : isSecond ? (
                      <Medal className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                    ) : isThird ? (
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                    ) : (
                      <span>#{rank < 10 ? `0${rank}` : rank}</span>
                    )}
                  </div>

                  {/* Singer & Song info */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="text-sm sm:text-base font-black text-white truncate max-w-[160px] xs:max-w-[220px] sm:max-w-xs">
                        {item.requestedBy}
                      </span>
                      {isFirst && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 shrink-0 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          <span>Leader</span>
                        </span>
                      )}
                      {item.song.genre && (
                        <span className="text-[10px] font-bold text-white/50 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 shrink-0">
                          {item.song.genre}
                        </span>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-white/60 truncate">
                      <span className="text-white/80 font-bold">{item.song.title}</span>
                      <span className="text-white/30 mx-1.5">·</span>
                      <span>{item.song.artist}</span>
                    </p>
                  </div>
                </div>

                {/* Right: Score percentage & Host Edit */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="text-right">
                    <div
                      className={`font-mono font-black text-base sm:text-xl tracking-tight ${
                        isFirst
                          ? 'text-amber-400'
                          : isSecond
                          ? 'text-slate-200'
                          : isThird
                          ? 'text-orange-400'
                          : 'text-white'
                      }`}
                    >
                      {item.score}%
                    </div>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono block">
                      Score
                    </span>
                  </div>

                  {isHost && onEditScore && (
                    <button
                      onClick={() => onEditScore(item.queueId, item.score || 0)}
                      title="Edit Score"
                      className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
