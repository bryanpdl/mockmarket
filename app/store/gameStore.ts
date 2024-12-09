import { create } from 'zustand';
import { GameState, Transaction, Asset, UnlockedFeature, Order } from '../types/game';
import { initialAssets, INITIAL_CASH, IDLE_INCOME_RATE } from '../data/initialGameData';
import { loadGameState, saveGameState } from '../lib/firebase/firestore';

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
  }
];

const calculateXPForLevel = (level: number) => 1000 + (level - 1) * 1000;
const calculateXPFromProfit = (profit: number) => Math.max(0, Math.floor(profit * 10));

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
}

export const useGameStore = create<GameStore>((set, get) => ({
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

  createOrder: (order) => {
    set(state => ({
      orders: [
        ...state.orders,
        { ...order, id: Date.now().toString() }
      ]
    }));
  },

  cancelOrder: (orderId) => {
    set(state => ({
      orders: state.orders.filter(order => order.id !== orderId)
    }));
  },

  checkOrders: () => {
    const state = get();
    const { orders, assets } = state;
    
    orders.forEach(order => {
      const asset = assets.find(a => a.id === order.assetId);
      if (!asset) return;

      if (order.type === 'buy' && asset.currentPrice <= order.targetPrice) {
        // Execute buy order
        get().buyAsset(order.assetId, order.quantity);
        get().cancelOrder(order.id);
      } else if (order.type === 'sell' && asset.currentPrice >= order.targetPrice) {
        // Execute sell order
        get().sellAsset(order.assetId, order.quantity);
        get().cancelOrder(order.id);
      }
    });
  },

  updatePrices: () => {
    set(state => {
      const newAssets = state.assets.map(asset => {
        // Mean reversion factor (pulls price back towards base price)
        const meanReversionStrength = 0.1;
        const priceDeviation = (asset.currentPrice - asset.basePrice) / asset.basePrice;
        const meanReversionPull = -priceDeviation * meanReversionStrength;

        // Random walk with volatility
        const randomChange = (Math.random() - 0.5) * 2 * asset.volatility;
        
        // Combine mean reversion and random walk
        const totalChange = randomChange + meanReversionPull;
        
        // Apply change with a minimum price floor
        const minPrice = asset.basePrice * 0.2;
        const maxPrice = asset.basePrice * 10;
        const newPrice = Math.min(maxPrice, Math.max(minPrice, 
          asset.currentPrice * (1 + totalChange)
        ));
        
        // Add current price to history
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

      // Check for orders that should be executed
      get().checkOrders();

      // Get current user ID and save state
      const userId = get().userId;
      if (userId) {
        useGameStore.getState().saveUserGameState(userId);
      }

      return {
        assets: newAssets,
        lastUpdate: Date.now(),
      };
    });
  },

  processIdleIncome: () => {
    const state = get();
    const totalPortfolioValue = state.portfolio.assets.reduce((total, holding) => {
      const asset = state.assets.find(a => a.id === holding.assetId);
      return total + (asset?.currentPrice ?? 0) * holding.quantity;
    }, 0);

    const idleIncome = totalPortfolioValue * 0.001;

    set(state => ({
      portfolio: {
        ...state.portfolio,
        cash: state.portfolio.cash + idleIncome,
      },
    }));
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

        set({
          ...gameState,
          assets: updatedAssets,
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
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      assetId,
      type: 'buy',
      quantity,
      price: asset.currentPrice,
      timestamp: Date.now(),
    };

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
      },
      transactions: [newTransaction, ...state.transactions],
    }));
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
      id: Date.now().toString(),
      assetId,
      type: 'sell',
      quantity,
      price: asset.currentPrice,
      timestamp: Date.now(),
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

      const newFeatures = FEATURES_BY_LEVEL.filter(
        feature => 
          feature.levelRequired <= newLevel && 
          !state.xpStats.unlockedFeatures.find(f => f.name === feature.name)
      );

      const idleBonus = IDLE_INCOME_RATE + Math.min(0.01 * Math.floor(newLevel / 2), 0.05);

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
        transactions: [newTransaction, ...state.transactions],
        xpStats: {
          level: newLevel,
          currentXP: remainingXP,
          xpToNextLevel: nextLevelXP,
          idleBonus,
          unlockedFeatures: [...state.xpStats.unlockedFeatures, ...newFeatures],
        },
      };
    });
  },
})); 