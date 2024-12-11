import { motion, MotionProps } from 'framer-motion';
import { XPStats as XPStatsType, UnlockedFeature } from '../types/game';
import { formatLargeNumber } from '../lib/utils';

interface XPStatsProps {
  stats: XPStatsType;
}

const MotionDiv = motion.div as React.FC<MotionProps & React.HTMLProps<HTMLDivElement>>;

export default function XPStats({ stats }: XPStatsProps) {
  const progressPercent = (stats.currentXP / stats.xpToNextLevel) * 100;

  const getFeatureColor = (type: UnlockedFeature['type']) => {
    switch (type) {
      case 'idle_bonus':
        return 'text-blue-400';
      case 'market_insight':
        return 'text-purple-400';
      case 'trading_feature':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg sm:text-xl font-bold">Level {stats.level}</span>
          <span className="text-xs sm:text-sm text-gray-400">
            {formatLargeNumber(stats.currentXP)} / {formatLargeNumber(stats.xpToNextLevel)} XP
          </span>
        </div>
        <div className="text-xs sm:text-sm text-blue-400">
          +{(stats.idleBonus * 100).toFixed(1)}% Idle Bonus
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="relative h-1.5 sm:h-2 bg-[#1C1C1C] rounded-full overflow-hidden">
        <MotionDiv
          className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Latest Unlocked Feature */}
      {stats.unlockedFeatures.length > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[10px] sm:text-xs text-gray-400">Latest unlock:</span>
          <span className={`text-[10px] sm:text-xs ${getFeatureColor(stats.unlockedFeatures[stats.unlockedFeatures.length - 1].type)}`}>
            {stats.unlockedFeatures[stats.unlockedFeatures.length - 1].name}
          </span>
        </div>
      )}
    </div>
  );
} 