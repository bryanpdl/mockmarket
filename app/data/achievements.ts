import { Achievement, GameState } from '../types/game';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'newbie',
    name: 'Newbie',
    description: 'Make your first $100 profit',
    condition: (state: GameState) => {
      const totalProfit = state.portfolio.assets.reduce((profit, holding) => {
        const asset = state.assets.find(a => a.id === holding.assetId);
        if (!asset) return profit;
        return profit + ((asset.currentPrice - holding.averagePrice) * holding.quantity);
      }, 0);
      return totalProfit >= 100;
    },
    reward: 1,
    category: 'profit'
  },
  {
    id: 'market_apprentice',
    name: 'Market Apprentice',
    description: 'Reach Level 10',
    condition: (state: GameState) => state.xpStats.level >= 10,
    reward: 5,
    category: 'level'
  },
  {
    id: 'market_mage',
    name: 'Market Mage',
    description: 'Reach Level 20',
    condition: (state: GameState) => state.xpStats.level >= 20,
    reward: 15,
    category: 'level'
  },
  {
    id: 'market_master',
    name: 'Market Master',
    description: 'Reach Level 50',
    condition: (state: GameState) => state.xpStats.level >= 50,
    reward: 50,
    category: 'level'
  },
  {
    id: 'first_thousand',
    name: 'First Grand',
    description: 'Hold $1,000 in cash',
    condition: (state: GameState) => state.portfolio.cash >= 1000,
    reward: 3,
    category: 'cash'
  },
  {
    id: 'high_roller',
    name: 'High Roller',
    description: 'Hold $100,000 in cash',
    condition: (state: GameState) => state.portfolio.cash >= 100000,
    reward: 30,
    category: 'cash'
  },
  {
    id: 'baller',
    name: 'Baller',
    description: 'Hold $1,000,000 in cash',
    condition: (state: GameState) => state.portfolio.cash >= 1000000,
    reward: 100,
    category: 'cash'
  },
  {
    id: 'diversified',
    name: 'Diversified',
    description: 'Own 5 different assets',
    condition: (state: GameState) => state.portfolio.assets.length >= 5,
    reward: 10,
    category: 'portfolio'
  },
  {
    id: 'portfolio_master',
    name: 'Portfolio Master',
    description: 'Have a portfolio worth $500,000',
    condition: (state: GameState) => {
      const portfolioValue = state.portfolio.assets.reduce((total, holding) => {
        const asset = state.assets.find(a => a.id === holding.assetId);
        if (!asset) return total;
        return total + (asset.currentPrice * holding.quantity);
      }, 0);
      return portfolioValue >= 500000;
    },
    reward: 50,
    category: 'portfolio'
  },
  {
    id: 'day_trader',
    name: 'Day Trader',
    description: 'Complete 100 transactions',
    condition: (state: GameState) => state.transactions.length >= 100,
    reward: 20,
    category: 'trading'
  }
]; 