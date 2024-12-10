import { create } from 'zustand';
import { GameState, Transaction, Asset, UnlockedFeature, Order, ActiveBoost } from '../types/game';
import { initialAssets, INITIAL_CASH, IDLE_INCOME_RATE } from '../data/initialGameData';
import { loadGameState, saveGameState } from '../lib/firebase/firestore';
import { ACHIEVEMENTS } from '../data/achievements';
import { MARKET_BOOSTS } from '../data/marketBoosts';
import { debounce } from 'lodash';

const FEATURES_BY_LEVEL: UnlockedFeature[] = [
  {
    name: 'Basic Trading',
    description: 'Access to basic buy/sell operations',
    levelRequired: 1,
    type: 'trading_feature'
  },
  {
    name: 'Idle Bonus +0.5%',
    description: 'Increased idle income rate',
    levelRequired: 2,
    type: 'idle_bonus'
  },
  {
    name: 'Market Trends',
    description: 'Basic market trend indicators',
    levelRequired: 3,
    type: 'market_insight'
  },
  {
    name: 'Idle Bonus +1%',
    description: 'Further increased idle income rate',
    levelRequired: 5,
    type: 'idle_bonus'
  },
  {
    name: 'Sell/Buy Orders',
    description: 'Automatic selling/buying at specified price threshold',
    levelRequired: 7,
    type: 'trading_feature'
  },
  {
    name: 'Advanced Analytics',
    description: 'Detailed market analysis tools',
    levelRequired: 10,
    type: 'market_insight'
  },
  {
    name: 'Idle Bonus +1%',
    description: 'Level 15 idle income boost',
    levelRequired: 15,
    type: 'idle_bonus'
  },
  {
    name: 'Idle Bonus +1%',
    description: 'Level 25 idle income boost',
    levelRequired: 25,
    type: 'idle_bonus'
  },
  {
    name: 'Faster Idle Income I',
    description: 'Reduce idle income interval by 5 seconds',
    levelRequired: 30,
    type: 'idle_speed'
  },
  {
    name: 'Faster Idle Income II',
    description: 'Reduce idle income interval by another 5 seconds',
    levelRequired: 40,
    type: 'idle_speed'
  },
  {
    name: 'Faster Idle Income III',
    description: 'Reduce idle income interval by another 5 seconds',
    levelRequired: 50,
    type: 'idle_speed'
  },
  {
    name: 'Faster Idle Income IV',
    description: 'Reduce idle income interval by another 5 seconds',
    levelRequired: 60,
    type: 'idle_speed'
  },
  {
    name: 'Faster Idle Income V',
    description: 'Reduce idle income interval by another 5 seconds',
    levelRequired: 70,
    type: 'idle_speed'
  },
  {
    name: 'Faster Idle Income VI (Max)',
    description: 'Reduce idle income interval to minimum (5 seconds)',
    levelRequired: 80,
    type: 'idle_speed'
  },
  {
    name: 'Idle Bonus +1%',
    description: 'Level 35 idle income boost',
    levelRequired: 35,
    type: 'idle_bonus'
  },
  {
    name: 'Idle Bonus +1%',
    description: 'Level 45 idle income boost',
    levelRequired: 45,
    type: 'idle_bonus'
  },
  {
    name: 'Idle Bonus +1%',
    description: 'Level 55 idle income boost',
    levelRequired: 55,
    type: 'idle_bonus'
  },
  {
    name: 'Idle Bonus +1%',
    description: 'Level 65 idle income boost',
    levelRequired: 65,
    type: 'idle_bonus'
  },
  {
    name: 'Idle Bonus +1%',
    description: 'Level 75 idle income boost',
    levelRequired: 75,
    type: 'idle_bonus'
  },
  {
    name: 'Idle Bonus +1%',
    description: 'Level 85 idle income boost',
    levelRequired: 85,
    type: 'idle_bonus'
  },
  {
    name: 'Idle Bonus +1%',
    description: 'Level 95 idle income boost',
    levelRequired: 95,
    type: 'idle_bonus'
  },
  {
    name: 'Idle Bonus +1%',
    description: 'Level 105 idle income boost',
    levelRequired: 105,
    type: 'idle_bonus'
  },
  {
    name: 'Idle Bonus +1%',
    description: 'Level 115 idle income boost',
    levelRequired: 115,
    type: 'idle_bonus'
  },
  {
    name: 'Idle Bonus +1%',
    description: 'Level 125 idle income boost',
    levelRequired: 125,
    type: 'idle_bonus'
  },
  {
    name: 'Idle Bonus +1%',
    description: 'Level 135 idle income boost',
    levelRequired: 135,
    type: 'idle_bonus'
  },
  {
    name: 'Idle Bonus +1%',
    description: 'Level 145 idle income boost',
    levelRequired: 145,
    type: 'idle_bonus'
  },
];

const calculateXPForLevel = (level: number) => 500 * level;
const calculateXPFromProfit = (profit: number) => Math.max(0, Math.floor(profit / 10));

const PRICE_HISTORY_LIMIT = 30; // Keep last 30 seconds of price data

interface GameStore extends GameState {
  buyAsset: (assetId: string, quantity: number) => void;
  sellAsset: (assetId: string, quantity: number) => void;
  updatePrices: () => void;
  processIdleIncome: () => void;
  assets: Asset[];
  isLoading: boolean;
  error: string | null;
  userId: string | null;
  setUserId: (userId: string | null) => void;
  loadUserGameState: (userId: string) => Promise<void>;
  saveUserGameState: (userId: string) => Promise<void>;
  createOrder: (order: Omit<Order, 'id'>) => void;
  cancelOrder: (orderId: string) => void;
  checkOrders: () => void;
  checkAchievements: () => void;
  claimAchievementReward: (achievementId: string) => void;
  forceSave: () => void;
  activateBoost: (boostId: string) => void;
}

const calculateIdleBonus = (level: number, unlockedFeatures: UnlockedFeature[], activeBoosts: ActiveBoost[]) => {
  // Base idle rate (0.1%)
  let bonus = IDLE_INCOME_RATE;
  
  // Count all idle bonus features
  unlockedFeatures.forEach(feature => {
    if (feature.type === 'idle_bonus') {
      if (feature.name === 'Idle Bonus +0.5%') {
        bonus += 0.005; // +0.5%
      } else if (feature.name === 'Idle Bonus +1%') {
        bonus += 0.01;  // +1%
      }
    }
  });

  // Apply active boosts
  const idleBoost = activeBoosts.find(b => b.type === 'idle_income');
  if (idleBoost) {
    bonus *= idleBoost.multiplier;
  }
  
  // Cap at 25%
  return Math.min(bonus, 0.25);
};

// Add this function to clean expired boosts
const cleanExpiredBoosts = (boosts: ActiveBoost[]) => {
  const now = Date.now();
  return boosts.filter(boost => boost.endTime > now);
};

const generateUniqueId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Add this helper function to clean state before saving
const getSerializableState = (state: Partial<GameState>) => {
  const cleanState: Partial<GameState> = {};
  
  if (state.portfolio) cleanState.portfolio = state.portfolio;
  if (state.transactions) cleanState.transactions = state.transactions;
  if (state.lastUpdate) cleanState.lastUpdate = state.lastUpdate;
  if (state.unlockedAssets) cleanState.unlockedAssets = state.unlockedAssets;
  if (state.assets) cleanState.assets = state.assets;
  if (state.orders) cleanState.orders = state.orders;
  if (state.xpStats) cleanState.xpStats = state.xpStats;
  if (state.achievements) cleanState.achievements = state.achievements;
  if (typeof state.boostTokens === 'number') cleanState.boostTokens = state.boostTokens;
  if (state.activeBoosts) cleanState.activeBoosts = state.activeBoosts;

  return cleanState;
};

export const calculateIdleInterval = (unlockedFeatures: UnlockedFeature[]) => {
  const BASE_INTERVAL = 30000; // 30 seconds
  const REDUCTION_PER_LEVEL = 5000; // 5 seconds
  const MIN_INTERVAL = 5000; // 5 seconds minimum

  const speedFeatures = unlockedFeatures.filter(f => f.type === 'idle_speed').length;
  const reduction = speedFeatures * REDUCTION_PER_LEVEL;
  
  return Math.max(BASE_INTERVAL - reduction, MIN_INTERVAL);
};

export const useGameStore = create<GameStore>((set, get) => {
  // Create a debounced save function
  const debouncedSave = debounce((userId: string, state: Partial<GameState>) => {
    saveGameState(userId, getSerializableState(state));
  }, 5000);

  return {
    portfolio: {
      cash: INITIAL_CASH,
      assets: [],
    },
    transactions: [],
    lastUpdate: Date.now(),
    unlockedAssets: ['tech1'],
    assets: initialAssets.map(asset => ({ ...asset, priceHistory: [] })),
    isLoading: false,
    error: null,
    userId: null,
    orders: [],
    xpStats: {
      level: 1,
      currentXP: 0,
      xpToNextLevel: calculateXPForLevel(2),
      idleBonus: 0,
      unlockedFeatures: [FEATURES_BY_LEVEL[0]],
    },
    achievements: [],
    boostTokens: 0,
    activeBoosts: [],

    createOrder: (order) => {
      set(state => ({
        orders: [
          ...state.orders,
          { ...order, id: Date.now().toString() }
        ]
      }));
    },

    cancelOrder: (orderId: string) => {
      set(state => {
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
          const newTransaction: Transaction = {
            id: generateUniqueId(),
            assetId: order.assetId,
            type: order.type,
            quantity: order.quantity,
            price: order.targetPrice,
            timestamp: Date.now(),
            status: 'cancelled'
          };
          return {
            orders: state.orders.filter(o => o.id !== orderId),
            transactions: [newTransaction, ...state.transactions]
          };
        }
        return { orders: state.orders.filter(o => o.id !== orderId) };
      });
    },

    checkOrders: () => {
      const state = get();
      const { orders, assets } = state;
      let ordersToRemove: string[] = [];
      let newTransactions: Transaction[] = [];
      
      orders.forEach(order => {
        const asset = assets.find(a => a.id === order.assetId);
        if (!asset) return;

        if (order.type === 'buy' && asset.currentPrice <= order.targetPrice) {
          // Execute buy order at target price
          const totalCost = order.quantity * order.targetPrice;
          if (state.portfolio.cash >= totalCost) {
            get().buyAsset(order.assetId, order.quantity);
            ordersToRemove.push(order.id);
            newTransactions.push({
              id: generateUniqueId(),
              assetId: order.assetId,
              type: order.type,
              quantity: order.quantity,
              price: order.targetPrice,
              timestamp: Date.now(),
              status: 'filled'
            });
          }
        } else if (order.type === 'sell' && asset.currentPrice >= order.targetPrice) {
          // Execute sell order at target price
          const holding = state.portfolio.assets.find(a => a.assetId === order.assetId);
          if (holding && holding.quantity >= order.quantity) {
            get().sellAsset(order.assetId, order.quantity);
            ordersToRemove.push(order.id);
            newTransactions.push({
              id: generateUniqueId(),
              assetId: order.assetId,
              type: order.type,
              quantity: order.quantity,
              price: order.targetPrice,
              timestamp: Date.now(),
              status: 'filled'
            });
          }
        }
      });

      if (ordersToRemove.length > 0) {
        set(state => ({
          orders: state.orders.filter(o => !ordersToRemove.includes(o.id)),
          transactions: [...newTransactions, ...state.transactions]
        }));
      }
    },

    updatePrices: () => {
      set(state => {
        const currentBoosts = cleanExpiredBoosts(state.activeBoosts);
        const volatilityBoost = currentBoosts.find(b => b.type === 'price_volatility');
        const volatilityMultiplier = volatilityBoost ? volatilityBoost.multiplier : 1;

        const newAssets = state.assets.map(asset => {
          const meanReversionStrength = 0.1;
          const priceDeviation = (asset.currentPrice - asset.basePrice) / asset.basePrice;
          const meanReversionPull = -priceDeviation * meanReversionStrength;

          // Apply volatility boost to random changes
          const randomChange = (Math.random() - 0.5) * 2 * asset.volatility * volatilityMultiplier;
          
          const totalChange = randomChange + meanReversionPull;
          const minPrice = asset.basePrice * 0.2;
          const maxPrice = asset.basePrice * 10;
          const newPrice = Math.min(maxPrice, Math.max(minPrice, 
            asset.currentPrice * (1 + totalChange)
          ));
          
          const now = Date.now();
          const newHistory = [
            { price: asset.currentPrice, timestamp: now },
            ...(asset.priceHistory || [])
          ].slice(0, PRICE_HISTORY_LIMIT);

          return {
            ...asset,
            currentPrice: newPrice,
            priceHistory: newHistory
          };
        });

        if (currentBoosts.length !== state.activeBoosts.length) {
          return {
            assets: newAssets,
            lastUpdate: Date.now(),
            activeBoosts: currentBoosts
          };
        }

        return {
          assets: newAssets,
          lastUpdate: Date.now(),
        };
      });
      get().checkOrders();
      get().checkAchievements();
    },

    processIdleIncome: () => {
      const state = get();
      const totalPortfolioValue = state.portfolio.assets.reduce((total, holding) => {
        const asset = state.assets.find(a => a.id === holding.assetId);
        return total + (asset?.currentPrice ?? 0) * holding.quantity;
      }, 0);

      // Clean expired boosts and update state
      const currentBoosts = cleanExpiredBoosts(state.activeBoosts);
      if (currentBoosts.length !== state.activeBoosts.length) {
        set({ activeBoosts: currentBoosts });
      }

      // Apply speed boost if active
      const speedBoost = currentBoosts.find(b => b.type === 'idle_speed');
      const speedMultiplier = speedBoost ? speedBoost.multiplier : 1;

      const idleIncome = totalPortfolioValue * calculateIdleBonus(
        state.xpStats.level,
        state.xpStats.unlockedFeatures,
        currentBoosts
      ) * speedMultiplier;

      set(state => ({
        portfolio: {
          ...state.portfolio,
          cash: state.portfolio.cash + idleIncome,
        },
      }));
      get().checkAchievements();
    },

    setUserId: (userId: string | null) => set({ userId }),

    loadUserGameState: async (userId: string) => {
      set({ isLoading: true, error: null });
      try {
        const gameState = await loadGameState(userId);
        if (gameState) {
          const updatedAssets = initialAssets.map(asset => {
            const savedAsset = gameState.assets?.find(a => a.id === asset.id);
            return {
              ...asset,
              currentPrice: savedAsset?.currentPrice ?? asset.currentPrice,
              priceHistory: savedAsset?.priceHistory ?? []
            };
          });

          // Recalculate idle bonus based on unlocked features
          const updatedIdleBonus = calculateIdleBonus(
            gameState.xpStats?.level || 1,
            gameState.xpStats?.unlockedFeatures || [],
            gameState.activeBoosts || []
          );

          set({
            ...gameState,
            assets: updatedAssets,
            xpStats: {
              ...gameState.xpStats,
              idleBonus: updatedIdleBonus
            },
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Error loading game state:', error);
        set({ error: 'Failed to load game state. Please try again.', isLoading: false });
      }
    },

    saveUserGameState: async (userId: string) => {
      try {
        const state = get();
        const gameStateToSave = {
          portfolio: state.portfolio,
          transactions: state.transactions,
          lastUpdate: state.lastUpdate,
          unlockedAssets: state.unlockedAssets,
          xpStats: state.xpStats,
          assets: state.assets.map(({ id, currentPrice, priceHistory }) => ({
            id,
            currentPrice,
            priceHistory
          })),
          orders: state.orders
        };

        await saveGameState(userId, gameStateToSave);
      } catch (error) {
        console.error('Error saving game state:', error);
        set({ error: 'Failed to save game state.' });
      }
    },

    buyAsset: (assetId: string, quantity: number) => {
      const state = get();
      const asset = state.assets.find(a => a.id === assetId);
      if (!asset) return;

      const totalCost = asset.currentPrice * quantity;
      if (state.portfolio.cash < totalCost) return;

      const existingAsset = state.portfolio.assets.find(a => a.assetId === assetId);

      set(state => ({
        portfolio: {
          cash: state.portfolio.cash - totalCost,
          assets: existingAsset
            ? state.portfolio.assets.map(a =>
                a.assetId === assetId
                  ? {
                      ...a,
                      quantity: a.quantity + quantity,
                      averagePrice:
                        (a.averagePrice * a.quantity + totalCost) / (a.quantity + quantity),
                    }
                  : a
              )
            : [
                ...state.portfolio.assets,
                {
                  assetId,
                  quantity,
                  averagePrice: asset.currentPrice,
                },
              ],
        }
      }));
      get().checkAchievements();
    },

    sellAsset: (assetId: string, quantity: number) => {
      const state = get();
      const asset = state.assets.find(a => a.id === assetId);
      if (!asset) return;

      const existingAsset = state.portfolio.assets.find(a => a.assetId === assetId);
      if (!existingAsset || existingAsset.quantity < quantity) return;

      const totalValue = asset.currentPrice * quantity;
      const profit = totalValue - (existingAsset.averagePrice * quantity);
      const xpGained = calculateXPFromProfit(profit);

      set(state => {
        const newXP = state.xpStats.currentXP + xpGained;
        let newLevel = state.xpStats.level;
        let remainingXP = newXP;
        let nextLevelXP = state.xpStats.xpToNextLevel;

        while (remainingXP >= nextLevelXP) {
          newLevel++;
          remainingXP -= nextLevelXP;
          nextLevelXP = calculateXPForLevel(newLevel + 1);
        }

        const newFeatures = FEATURES_BY_LEVEL.filter(
          feature => 
            feature.levelRequired <= newLevel && 
            !state.xpStats.unlockedFeatures.find(f => f.name === feature.name)
        );

        const allUnlockedFeatures = [...state.xpStats.unlockedFeatures, ...newFeatures];
        const idleBonus = calculateIdleBonus(newLevel, allUnlockedFeatures, state.activeBoosts);

        return {
          portfolio: {
            cash: state.portfolio.cash + totalValue,
            assets: state.portfolio.assets
              .map(a =>
                a.assetId === assetId
                  ? {
                      ...a,
                      quantity: a.quantity - quantity,
                    }
                  : a
              )
              .filter(a => a.quantity > 0),
          },
          xpStats: {
            level: newLevel,
            currentXP: remainingXP,
            xpToNextLevel: nextLevelXP,
            idleBonus,
            unlockedFeatures: allUnlockedFeatures,
          },
        };
      });
      get().checkAchievements();
    },

    checkAchievements: () => {
      set(state => {
        const newAchievements = [...state.achievements];
        let newBoostTokens = state.boostTokens;
        let achievementsChanged = false;

        ACHIEVEMENTS.forEach(achievement => {
          const existingProgress = newAchievements.find(a => a.id === achievement.id);
          
          if (!existingProgress) {
            // Initialize achievement progress if it doesn't exist
            newAchievements.push({
              id: achievement.id,
              unlocked: false,
              rewardClaimed: false
            });
            achievementsChanged = true;
          } else if (!existingProgress.unlocked && achievement.condition(state)) {
            // Achievement newly unlocked
            existingProgress.unlocked = true;
            existingProgress.unlockedAt = Date.now();
            achievementsChanged = true;
          }
        });

        if (achievementsChanged) {
          const newState = {
            achievements: newAchievements,
            boostTokens: newBoostTokens
          };

          // Save with debounce
          const userId = get().userId;
          if (userId) {
            debouncedSave(userId, newState);
          }

          return newState;
        }
        return state;
      });
    },

    claimAchievementReward: (achievementId: string) => {
      set(state => {
        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
        const progress = state.achievements.find(a => a.id === achievementId);

        if (!achievement || !progress || !progress.unlocked || progress.rewardClaimed) {
          return state;
        }

        const newAchievements = state.achievements.map(a => 
          a.id === achievementId 
            ? { ...a, rewardClaimed: true }
            : a
        );

        const newState = {
          achievements: newAchievements,
          boostTokens: state.boostTokens + achievement.reward
        };

        // Save with debounce
        const userId = get().userId;
        if (userId) {
          debouncedSave(userId, newState);
        }

        return newState;
      });
    },

    // Add a function to force save (useful before unmounting)
    forceSave: () => {
      const state = get();
      const userId = state.userId;
      if (userId) {
        debouncedSave.cancel(); // Cancel any pending debounced saves
        saveGameState(userId, getSerializableState(state));
      }
    },

    activateBoost: (boostId: string) => {
      const state = get();
      const boost = MARKET_BOOSTS.find(b => b.id === boostId);
      
      if (!boost || state.boostTokens < boost.cost) return;

      const now = Date.now();
      const activeBoost = {
        ...boost,
        startTime: now,
        endTime: now + boost.duration
      };

      set(state => {
        const newState = {
          activeBoosts: [...state.activeBoosts, activeBoost],
          boostTokens: state.boostTokens - boost.cost
        };

        // Save the updated state to Firestore
        const userId = state.userId;
        if (userId) {
          debouncedSave(userId, newState);
        }

        return newState;
      });
    }
  };
}); 