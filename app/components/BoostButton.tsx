import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import MarketBoostModal from './MarketBoostModal';

const MotionDiv = motion.div as React.FC<any>;

export default function BoostButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { boostTokens, activeBoosts } = useGameStore();

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="relative flex items-center gap-2 h-10 px-4 bg-[#1C1C1C] rounded-full hover:bg-[#242424] transition-colors duration-200"
      >
        <div className="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{boostTokens}</span>
        </div>
        
        {activeBoosts.length > 0 && (
          <MotionDiv
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center"
          >
            {activeBoosts.length}
          </MotionDiv>
        )}
      </button>

      <MarketBoostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
} 