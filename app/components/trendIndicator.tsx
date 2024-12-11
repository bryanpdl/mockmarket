import { motion } from 'framer-motion';
import React from 'react';

const MotionDiv = motion.div as React.FC<any>;

interface TrendIndicatorProps {
  priceHistory: { price: number; timestamp: number; }[];
  volatility: number;
}

export default function TrendIndicator({ priceHistory, volatility }: TrendIndicatorProps) {
  // Calculate trend based on recent price history
  const calculateTrend = () => {
    if (priceHistory.length < 2) return { priceChange: 0, strength: 0 };

    const recentPrice = priceHistory[0].price;
    const oldestPrice = priceHistory[priceHistory.length - 1].price;
    const priceChange = ((recentPrice - oldestPrice) / oldestPrice) * 100;
    
    // Calculate trend strength (0-3) based on magnitude of change relative to volatility
    const expectedMaxChange = volatility * 100; // Convert volatility to percentage
    const strength = Math.min(3, Math.floor(Math.abs(priceChange) / (expectedMaxChange / 3)));

    return { priceChange, strength };
  };

  const { priceChange, strength } = calculateTrend();
  const isPositive = priceChange >= 0;

  // Generate dots for trend strength
  const dots = Array(3).fill(0).map((_, i) => {
    const isActive = i <= strength - 1;
    const baseColor = isPositive ? '#00B57C' : '#E71151';
    const opacity = isActive ? (1 - (i * 0.2)) : 0.2;

    return (
      <MotionDiv
        key={i}
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: baseColor,
          opacity: opacity
        }}
        initial={{ scale: 0.8 }}
        animate={{ scale: isActive ? [0.8, 1.1, 0.9] : 0.8 }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: i * 0.2
        }}
      />
    );
  });

  // Arrow animation variants
  const arrowVariants = {
    initial: { y: 0 },
    animate: { y: isPositive ? -3 : 3 }
  };

  return (
    <div className="flex items-center gap-2 bg-[#1C1C1C] rounded-full px-3 py-1.5">
      {/* Trend Arrow */}
      <MotionDiv
        className="text-lg"
        variants={arrowVariants}
        initial="initial"
        animate="animate"
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        style={{
          color: isPositive ? '#00B57C' : '#E71151'
        }}
      >
        {isPositive ? '↑' : '↓'}
      </MotionDiv>

      {/* Strength Indicator */}
      <div className="flex gap-1">
        {dots}
      </div>

      {/* Volatility Indicator */}
      <MotionDiv
        className="w-1 h-4 rounded-full overflow-hidden bg-[#2C2C2C]"
        style={{ opacity: 0.5 }}
      >
        <MotionDiv
          className="w-full rounded-full"
          style={{
            backgroundColor: volatility <= 0.2 ? '#00B57C' : 
                           volatility <= 0.3 ? '#FFB800' :
                           volatility <= 0.4 ? '#FF7A00' : '#E71151',
            height: `${Math.min(100, volatility * 250)}%`
          }}
        />
      </MotionDiv>
    </div>
  );
} 