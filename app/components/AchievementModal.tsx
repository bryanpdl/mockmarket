import { motion, AnimatePresence } from 'framer-motion';
import { Achievement, AchievementProgress } from '../types/game';
import { ACHIEVEMENTS } from '../data/achievements';
import { useGameStore } from '../store/gameStore';

const MotionDiv = motion.div as React.ComponentType<React.HTMLAttributes<HTMLDivElement> & { 
  initial?: any;
  animate?: any;
  exit?: any;
}>;

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AchievementModal({ isOpen, onClose }: AchievementModalProps) {
  const { achievements, boostTokens, claimAchievementReward } = useGameStore();

  const achievementsByCategory = ACHIEVEMENTS.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const getAchievementProgress = (id: string): AchievementProgress | undefined => {
    return achievements.find(a => a.id === id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#111111] rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden relative z-10"
          >
            <div className="p-6 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold mb-1">Achievements</h2>
                  <p className="text-sm text-gray-400">Complete achievements to earn boost tokens</p>
                </div>
                <div className="flex items-center gap-2 bg-[#1C1C1C] px-3 py-1.5 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  <span className="font-bold">{boostTokens}</span>
                  <span className="text-sm text-gray-400">Tokens</span>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)] custom-scrollbar">
              <div className="space-y-8">
                {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
                  <div key={category}>
                    <h3 className="text-lg font-bold mb-4 capitalize">{category} Achievements</h3>
                    <div className="space-y-4">
                      {categoryAchievements.map((achievement) => {
                        const progress = getAchievementProgress(achievement.id);
                        const isUnlocked = progress?.unlocked ?? false;
                        const isRewardClaimed = progress?.rewardClaimed ?? false;

                        return (
                          <div
                            key={achievement.id}
                            className={`bg-[#161616] p-4 rounded-lg relative overflow-hidden ${
                              isUnlocked ? 'border border-yellow-500/20' : ''
                            }`}
                          >
                            {isUnlocked && (
                              <div className="absolute inset-0 bg-yellow-500/5" />
                            )}
                            <div className="flex justify-between items-start relative">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold">{achievement.name}</h4>
                                  {isUnlocked && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500">
                                      Unlocked!
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-400">{achievement.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm text-gray-400">
                                  {achievement.reward} Tokens
                                </div>
                                {isUnlocked && !isRewardClaimed && (
                                  <button
                                    onClick={() => claimAchievementReward(achievement.id)}
                                    className="bg-yellow-500 text-black px-3 py-1 rounded text-sm font-medium hover:bg-yellow-400 transition-colors"
                                  >
                                    Claim
                                  </button>
                                )}
                                {isRewardClaimed && (
                                  <span className="text-xs px-2 py-1 rounded bg-[#1C1C1C] text-gray-400">
                                    Claimed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-800">
              <button
                onClick={onClose}
                className="w-full bg-[#1C1C1C] px-4 py-2 rounded hover:bg-[#242424] transition-colors"
              >
                Close
              </button>
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
} 