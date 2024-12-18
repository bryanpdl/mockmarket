export type Asset = {
  id: string;
  name: string;
  symbol: string;
  basePrice: number;
  currentPrice: number;
  volatility: number;
  type: 'stock' | 'commodity' | 'crypto';
  unlockPrice: number;
  description: string;
  priceHistory: {
    price: number;
    timestamp: number;
  }[];
};

export type Portfolio = {
  cash: number;
  assets: {
    assetId: string;
    quantity: number;
    averagePrice: number;
  }[];
};

export type Transaction = {
  id: string;
  assetId: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: number;
  status: 'filled' | 'cancelled';
};

export type XPStats = {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  idleBonus: number;
  unlockedFeatures: UnlockedFeature[];
};

export type UnlockedFeature = {
  name: string;
  description: string;
  levelRequired: number;
  type: 'idle_bonus' | 'market_insight' | 'trading_feature' | 'idle_speed';
};

export type Order = {
  id: string;
  assetId: string;
  type: 'buy' | 'sell';
  quantity: number;
  targetPrice: number;
  createdAt: number;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  condition: (state: GameState) => boolean;
  reward: number;
  category: 'profit' | 'level' | 'cash' | 'portfolio' | 'trading';
};

export type AchievementProgress = {
  id: string;
  unlocked: boolean;
  rewardClaimed: boolean;
  unlockedAt?: number;
};

export type MarketBoost = {
  id: string;
  name: string;
  description: string;
  duration: number; // in milliseconds
  cost: number;    // in boost tokens
  multiplier: number;
  type: 'idle_speed' | 'idle_income' | 'xp_gain' | 'price_volatility';
};

export type ActiveBoost = MarketBoost & {
  startTime: number;
  endTime: number;
};

export type GameState = {
  portfolio: Portfolio;
  transactions: Transaction[];
  lastUpdate: number;
  unlockedAssets: string[];
  xpStats: XPStats;
  assets: {
    id: string;
    currentPrice: number;
    priceHistory: {
      price: number;
      timestamp: number;
    }[];
  }[];
  orders: Order[];
  achievements: AchievementProgress[];
  boostTokens: number;
  activeBoosts: ActiveBoost[];
}; 