import { Achievement, GameState } from '../types/game';

export const ACHIEVEMENTS: Achievement[] = [
  // Profit Category
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
    id: 'profit_hunter',
    name: 'Profit Hunter',
    description: 'Make $10,000 in profit',
    condition: (state: GameState) => {
      const totalProfit = state.portfolio.assets.reduce((profit, holding) => {
        const asset = state.assets.find(a => a.id === holding.assetId);
        if (!asset) return profit;
        return profit + ((asset.currentPrice - holding.averagePrice) * holding.quantity);
      }, 0);
      return totalProfit >= 10000;
    },
    reward: 10,
    category: 'profit'
  },
  {
    id: 'profit_master',
    name: 'Profit Master',
    description: 'Make $100,000 in profit',
    condition: (state: GameState) => {
      const totalProfit = state.portfolio.assets.reduce((profit, holding) => {
        const asset = state.assets.find(a => a.id === holding.assetId);
        if (!asset) return profit;
        return profit + ((asset.currentPrice - holding.averagePrice) * holding.quantity);
      }, 0);
      return totalProfit >= 100000;
    },
    reward: 50,
    category: 'profit'
  },
  {
    id: 'profit_legend',
    name: 'Profit Legend',
    description: 'Make $1,000,000 in profit',
    condition: (state: GameState) => {
      const totalProfit = state.portfolio.assets.reduce((profit, holding) => {
        const asset = state.assets.find(a => a.id === holding.assetId);
        if (!asset) return profit;
        return profit + ((asset.currentPrice - holding.averagePrice) * holding.quantity);
      }, 0);
      return totalProfit >= 1000000;
    },
    reward: 200,
    category: 'profit'
  },
  {
    id: 'profit_god',
    name: 'Profit God',
    description: 'Make $10,000,000 in profit',
    condition: (state: GameState) => {
      const totalProfit = state.portfolio.assets.reduce((profit, holding) => {
        const asset = state.assets.find(a => a.id === holding.assetId);
        if (!asset) return profit;
        return profit + ((asset.currentPrice - holding.averagePrice) * holding.quantity);
      }, 0);
      return totalProfit >= 10000000;
    },
    reward: 500,
    category: 'profit'
  },

  // Level Category
  {
    id: 'market_apprentice',
    name: 'Market Apprentice',
    description: 'Reach Level 10',
    condition: (state: GameState) => state.xpStats.level >= 10,
    reward: 5,
    category: 'level'
  },
  {
    id: 'market_adept',
    name: 'Market Adept',
    description: 'Reach Level 25',
    condition: (state: GameState) => state.xpStats.level >= 25,
    reward: 15,
    category: 'level'
  },
  {
    id: 'market_expert',
    name: 'Market Expert',
    description: 'Reach Level 50',
    condition: (state: GameState) => state.xpStats.level >= 50,
    reward: 50,
    category: 'level'
  },
  {
    id: 'market_master',
    name: 'Market Master',
    description: 'Reach Level 100',
    condition: (state: GameState) => state.xpStats.level >= 100,
    reward: 200,
    category: 'level'
  },
  {
    id: 'market_legend',
    name: 'Market Legend',
    description: 'Reach Level 200',
    condition: (state: GameState) => state.xpStats.level >= 200,
    reward: 500,
    category: 'level'
  },

  // Cash Category
  {
    id: 'first_grand',
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
    id: 'cash_baron',
    name: 'Cash Baron',
    description: 'Hold $1,000,000 in cash',
    condition: (state: GameState) => state.portfolio.cash >= 1000000,
    reward: 100,
    category: 'cash'
  },
  {
    id: 'cash_mogul',
    name: 'Cash Mogul',
    description: 'Hold $10,000,000 in cash',
    condition: (state: GameState) => state.portfolio.cash >= 10000000,
    reward: 250,
    category: 'cash'
  },
  {
    id: 'cash_emperor',
    name: 'Cash Emperor',
    description: 'Hold $100,000,000 in cash',
    condition: (state: GameState) => state.portfolio.cash >= 100000000,
    reward: 500,
    category: 'cash'
  },

  // Portfolio Category
  {
    id: 'diversified',
    name: 'Diversified',
    description: 'Own 5 different assets',
    condition: (state: GameState) => state.portfolio.assets.length >= 5,
    reward: 10,
    category: 'portfolio'
  },
  {
    id: 'well_diversified',
    name: 'Well Diversified',
    description: 'Own 10 different assets',
    condition: (state: GameState) => state.portfolio.assets.length >= 10,
    reward: 25,
    category: 'portfolio'
  },
  {
    id: 'portfolio_expert',
    name: 'Portfolio Expert',
    description: 'Have a portfolio worth $1,000,000',
    condition: (state: GameState) => {
      const portfolioValue = state.portfolio.assets.reduce((total, holding) => {
        const asset = state.assets.find(a => a.id === holding.assetId);
        if (!asset) return total;
        return total + (asset.currentPrice * holding.quantity);
      }, 0);
      return portfolioValue >= 1000000;
    },
    reward: 100,
    category: 'portfolio'
  },
  {
    id: 'portfolio_master',
    name: 'Portfolio Master',
    description: 'Have a portfolio worth $10,000,000',
    condition: (state: GameState) => {
      const portfolioValue = state.portfolio.assets.reduce((total, holding) => {
        const asset = state.assets.find(a => a.id === holding.assetId);
        if (!asset) return total;
        return total + (asset.currentPrice * holding.quantity);
      }, 0);
      return portfolioValue >= 10000000;
    },
    reward: 250,
    category: 'portfolio'
  },
  {
    id: 'portfolio_legend',
    name: 'Portfolio Legend',
    description: 'Have a portfolio worth $100,000,000',
    condition: (state: GameState) => {
      const portfolioValue = state.portfolio.assets.reduce((total, holding) => {
        const asset = state.assets.find(a => a.id === holding.assetId);
        if (!asset) return total;
        return total + (asset.currentPrice * holding.quantity);
      }, 0);
      return portfolioValue >= 100000000;
    },
    reward: 500,
    category: 'portfolio'
  },

  // Trading Category
  {
    id: 'day_trader',
    name: 'Day Trader',
    description: 'Complete 100 transactions',
    condition: (state: GameState) => state.transactions.length >= 100,
    reward: 20,
    category: 'trading'
  },
  {
    id: 'active_trader',
    name: 'Active Trader',
    description: 'Complete 500 transactions',
    condition: (state: GameState) => state.transactions.length >= 500,
    reward: 50,
    category: 'trading'
  },
  {
    id: 'trading_expert',
    name: 'Trading Expert',
    description: 'Complete 2,500 transactions',
    condition: (state: GameState) => state.transactions.length >= 2500,
    reward: 150,
    category: 'trading'
  },
  {
    id: 'trading_master',
    name: 'Trading Master',
    description: 'Complete 10,000 transactions',
    condition: (state: GameState) => state.transactions.length >= 10000,
    reward: 300,
    category: 'trading'
  },
  {
    id: 'trading_legend',
    name: 'Trading Legend',
    description: 'Complete 50,000 transactions',
    condition: (state: GameState) => state.transactions.length >= 50000,
    reward: 500,
    category: 'trading'
  }
]; 