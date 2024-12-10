import { motion, AnimatePresence } from 'framer-motion';
import { MARKET_BOOSTS } from '../data/marketBoosts';
import { useGameStore } from '../store/gameStore';
import { useState } from 'react';

const MotionDiv = motion.div as React.ComponentType<React.HTMLAttributes<HTMLDivElement> & { 
  initial?: any;
  animate?: any;
  exit?: any;
}>;

interface MarketBoostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MarketBoostModal({ isOpen, onClose }: MarketBoostModalProps) {
  const { boostTokens, activeBoosts, activateBoost } = useGameStore();
  const [hoveredBoost, setHoveredBoost] = useState<string | null>(null);

  const formatTime = (ms: number) => {
    if (ms < 60000) return `${ms / 1000}s`;
    return `${ms / 60000}m`;
  };

  const getTimeLeft = (endTime: number) => {
    const now = Date.now();
    const left = endTime - now;
    return left > 0 ? formatTime(left) : '0s';
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
                  <h2 className="text-xl font-bold mb-1">Market Boosts</h2>
                  <p className="text-sm text-gray-400">Use boost tokens to activate powerful temporary effects</p>
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
              {/* Active Boosts */}
              {activeBoosts.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-4">Active Boosts</h3>
                  <div className="space-y-4">
                    {activeBoosts.map((boost) => (
                      <div
                        key={`${boost.id}-${boost.startTime}`}
                        className="bg-[#161616] p-4 rounded-lg relative overflow-hidden border border-yellow-500/20"
                      >
                        <div className="absolute inset-0 bg-yellow-500/5" />
                        <div className="relative">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold mb-1">{boost.name}</h4>
                              <p className="text-sm text-gray-400">{boost.description}</p>
                            </div>
                            <div className="text-sm text-yellow-500">
                              {getTimeLeft(boost.endTime)} left
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Boosts */}
              <div className="space-y-4">
                {MARKET_BOOSTS.map((boost) => {
                  const isActive = activeBoosts.some(ab => ab.id === boost.id);
                  const canAfford = boostTokens >= boost.cost;

                  return (
                    <div
                      key={boost.id}
                      className={`bg-[#161616] p-4 rounded-lg relative overflow-hidden group cursor-pointer transition-all duration-200 ${
                        canAfford ? 'hover:bg-[#1C1C1C]' : 'opacity-50 cursor-not-allowed'
                      }`}
                      onMouseEnter={() => setHoveredBoost(boost.id)}
                      onMouseLeave={() => setHoveredBoost(null)}
                      onClick={() => {
                        if (canAfford && !isActive) {
                          activateBoost(boost.id);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold">{boost.name}</h4>
                            {isActive && (
                              <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{boost.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Duration: {formatTime(boost.duration)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`text-sm ${canAfford ? 'text-yellow-500' : 'text-gray-500'}`}>
                            {boost.cost} Tokens
                          </div>
                          {canAfford && !isActive && hoveredBoost === boost.id && (
                            <div className="animate-pulse">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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