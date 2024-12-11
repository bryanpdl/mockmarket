import { useEffect, useState } from 'react';
import { PRICE_UPDATE_INTERVAL } from '../data/initialGameData';
import { useGameStore } from '../store/gameStore';

export default function MarketTickIndicator() {
  const [progress, setProgress] = useState(0);
  const lastUpdate = useGameStore(state => state.lastUpdate);

  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastUpdate;
      const timeUntilNextUpdate = PRICE_UPDATE_INTERVAL - (timeSinceLastUpdate % PRICE_UPDATE_INTERVAL);
      const progressPercent = ((PRICE_UPDATE_INTERVAL - timeUntilNextUpdate) / PRICE_UPDATE_INTERVAL) * 100;
      setProgress(progressPercent);
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const timeUntilNextUpdate = PRICE_UPDATE_INTERVAL - ((Date.now() - lastUpdate) % PRICE_UPDATE_INTERVAL);
  const secondsRemaining = Math.ceil(timeUntilNextUpdate / 1000);

  return (
    <div className="flex items-center gap-2 ml-2">
      <div className="h-1.5 w-12 bg-[#1C1C1C] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#00B57C] transition-all duration-100 ease-linear rounded-full animate-[pulse_0.5s_ease-in-out_infinite] shadow-[0_0_8px_rgba(0,181,124,0.6)]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-gray-400">
        {secondsRemaining}s
      </span>
    </div>
  );
} 