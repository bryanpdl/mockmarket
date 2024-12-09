import { motion, MotionProps } from 'framer-motion';
import { XPStats as XPStatsType, UnlockedFeature } from '../types/game';

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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">Level {stats.level}</span>
          <span className="text-gray-400 text-sm">
            {stats.currentXP.toLocaleString()} / {stats.xpToNextLevel.toLocaleString()} XP
          </span>
        </div>
        <div className="text-blue-400 text-sm">
          +{(stats.idleBonus * 100).toFixed(1)}% Idle Bonus
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="relative h-2 bg-[#1C1C1C] rounded-full overflow-hidden">
        <MotionDiv
          className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Latest Unlocked Feature */}
      {stats.unlockedFeatures.length > 0 && (
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">Latest unlock:</span>
          <span className={`text-xs ${getFeatureColor(stats.unlockedFeatures[stats.unlockedFeatures.length - 1].type)}`}>
            {stats.unlockedFeatures[stats.unlockedFeatures.length - 1].name}
          </span>
        </div>
      )}
    </div>
  );
} 