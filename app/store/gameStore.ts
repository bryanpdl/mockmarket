import { create } from 'zustand';
import { GameState, Transaction, Asset, UnlockedFeature, Order, ActiveBoost } from '../types/game';
import { initialAssets, INITIAL_CASH, IDLE_INCOME_RATE } from '../data/initialGameData';
import { loadGameState, saveGameState } from '../lib/firebase/firestore';
import { ACHIEVEMENTS } from '../data/achievements';
import { MARKET_BOOSTS } from '../data/marketBoosts';
import { FEATURES_BY_LEVEL } from '../data/features';
import { debounce } from 'lodash';

const calculateXPForLevel = (level: number) => Math.floor(500 * Math.pow(1.2, level - 1));
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

// Helper function to fix XP requirements for existing users
const fixXPRequirements = (state: GameState) => {
  const currentLevel = state.xpStats.level;
  const nextLevelXP = calculateXPForLevel(currentLevel + 1);
  
  return {
    ...state,
    xpStats: {
      ...state.xpStats,
      xpToNextLevel: nextLevelXP
    }
  };
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
    assets: initialAssets.map(asset => ({
      id: asset.id,
      name: asset.name,
      symbol: asset.symbol,
      basePrice: asset.basePrice,
      currentPrice: asset.currentPrice,
      volatility: asset.volatility,
      type: asset.type,
      unlockPrice: asset.unlockPrice,
      description: asset.description,
      priceHistory: []
    })),
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
            status: 'filled'
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
      
      orders.forEach(order => {
        const asset = assets.find(a => a.id === order.assetId);
        if (!asset) return;

        if (order.type === 'buy' && asset.currentPrice <= order.targetPrice) {
          // Execute buy order at target price
          const totalCost = order.quantity * order.targetPrice;
          if (state.portfolio.cash >= totalCost) {
            const existingAsset = state.portfolio.assets.find(a => a.assetId === order.assetId);
            
            set(state => {
              const newTransaction: Transaction = {
                id: generateUniqueId(),
                assetId: order.assetId,
                type: order.type,
                quantity: order.quantity,
                price: order.targetPrice,
                timestamp: Date.now(),
                status: 'filled' as const
              };

              return {
                portfolio: {
                  cash: state.portfolio.cash - totalCost,
                  assets: existingAsset
                    ? state.portfolio.assets.map(a =>
                        a.assetId === order.assetId
                          ? {
                              ...a,
                              quantity: a.quantity + order.quantity,
                              averagePrice:
                                (a.averagePrice * a.quantity + totalCost) / (a.quantity + order.quantity),
                            }
                          : a
                      )
                    : [
                        ...state.portfolio.assets,
                        {
                          assetId: order.assetId,
                          quantity: order.quantity,
                          averagePrice: order.targetPrice,
                        },
                      ],
                },
                transactions: [newTransaction, ...state.transactions]
              };
            });

            ordersToRemove.push(order.id);
          }
        } else if (order.type === 'sell' && asset.currentPrice >= order.targetPrice) {
          // Execute sell order at target price
          const holding = state.portfolio.assets.find(a => a.assetId === order.assetId);
          if (holding && holding.quantity >= order.quantity) {
            const totalValue = order.quantity * order.targetPrice;
            const profit = totalValue - (holding.averagePrice * order.quantity);
            const xpGained = calculateXPFromProfit(profit);

            set(state => {
              const newTransaction: Transaction = {
                id: generateUniqueId(),
                assetId: order.assetId,
                type: order.type,
                quantity: order.quantity,
                price: order.targetPrice,
                timestamp: Date.now(),
                status: 'filled' as const
              };

              const newXP = state.xpStats.currentXP + xpGained;
              let newLevel = state.xpStats.level;
              let remainingXP = newXP;
              let nextLevelXP = state.xpStats.xpToNextLevel;

              while (remainingXP >= nextLevelXP) {
                newLevel++;
                remainingXP -= nextLevelXP;
                nextLevelXP = calculateXPForLevel(newLevel + 1);
              }

              // Get all features that should be unlocked up to the new level
              const newFeatures = [];
              for (let level = state.xpStats.level + 1; level <= newLevel; level++) {
                const featuresForLevel = FEATURES_BY_LEVEL.filter(
                  feature => feature.levelRequired === level
                );
                newFeatures.push(...featuresForLevel);
              }

              const allUnlockedFeatures = [...state.xpStats.unlockedFeatures, ...newFeatures];
              const idleBonus = calculateIdleBonus(newLevel, allUnlockedFeatures, state.activeBoosts);

              return {
                portfolio: {
                  cash: state.portfolio.cash + totalValue,
                  assets: state.portfolio.assets
                    .map(a =>
                      a.assetId === order.assetId
                        ? {
                            ...a,
                            quantity: a.quantity - order.quantity,
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
                transactions: [newTransaction, ...state.transactions]
              };
            });

            ordersToRemove.push(order.id);
          }
        }
      });

      if (ordersToRemove.length > 0) {
        set(state => ({
          orders: state.orders.filter(o => !ordersToRemove.includes(o.id))
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

          // Add a rare chance (0.1%) for a significant price movement
          const isSignificantMove = Math.random() < 0.001;
          
          let totalChange;
          if (isSignificantMove) {
            // Generate a strong upward movement that could potentially reach max price
            const maxPriceRatio = 10; // maximum price is 10x base price
            const currentRatio = asset.currentPrice / asset.basePrice;
            const remainingRatio = maxPriceRatio - currentRatio;
            
            // Calculate a random portion (50-100%) of the remaining distance to max price
            const movePercentage = 0.5 + (Math.random() * 0.5);
            totalChange = (remainingRatio * movePercentage) * (asset.currentPrice / asset.basePrice);
          } else {
            // Normal price movement
            const randomChange = (Math.random() - 0.5) * 2 * asset.volatility * volatilityMultiplier;
            totalChange = randomChange + meanReversionPull;
          }

          const minPrice = asset.basePrice * 0.1;  // 10% of base price
          const maxPrice = asset.basePrice * 10;   // 1000% of base price
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

        return {
          assets: newAssets,
          lastUpdate: Date.now()
        };
      });
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

          // Fix XP requirements for existing users
          const fixedGameState = fixXPRequirements(gameState);

          // Recalculate idle bonus based on unlocked features
          const updatedIdleBonus = calculateIdleBonus(
            fixedGameState.xpStats?.level || 1,
            fixedGameState.xpStats?.unlockedFeatures || [],
            fixedGameState.activeBoosts || []
          );

          const newState = {
            ...fixedGameState,
            assets: updatedAssets,
            xpStats: {
              ...fixedGameState.xpStats,
              idleBonus: updatedIdleBonus
            },
            isLoading: false
          };

          set(newState);

          // Save the fixed XP requirements
          debouncedSave(userId, {
            xpStats: newState.xpStats
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
        const gameStateToSave = getSerializableState({
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
          orders: state.orders,
          achievements: state.achievements,
          boostTokens: state.boostTokens,
          activeBoosts: state.activeBoosts
        });

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
      const newTransaction: Transaction = {
        id: generateUniqueId(),
        assetId,
        type: 'buy',
        quantity,
        price: asset.currentPrice,
        timestamp: Date.now(),
        status: 'filled'
      };

      set(state => {
        const newState = {
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
          },
          transactions: [newTransaction, ...state.transactions]
        };

        // Save the updated state to Firestore
        const userId = get().userId;
        if (userId) {
          debouncedSave(userId, newState);
        }

        return newState;
      });
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

      const newTransaction: Transaction = {
        id: generateUniqueId(),
        assetId,
        type: 'sell',
        quantity,
        price: asset.currentPrice,
        timestamp: Date.now(),
        status: 'filled'
      };

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

        // Get all features that should be unlocked up to the new level
        const newFeatures = [];
        for (let level = state.xpStats.level + 1; level <= newLevel; level++) {
          const featuresForLevel = FEATURES_BY_LEVEL.filter(
            feature => feature.levelRequired === level
          );
          newFeatures.push(...featuresForLevel);
        }

        const allUnlockedFeatures = [...state.xpStats.unlockedFeatures, ...newFeatures];
        const idleBonus = calculateIdleBonus(newLevel, allUnlockedFeatures, state.activeBoosts);

        const newState = {
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
          transactions: [newTransaction, ...state.transactions]
        };

        // Save state to Firestore
        const userId = get().userId;
        if (userId) {
          debouncedSave(userId, newState);
        }

        return newState;
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