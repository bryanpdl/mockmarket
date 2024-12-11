import { Achievement, GameState } from '../types/game';

// Helper function to calculate total profit
const calculateTotalProfit = (state: GameState) => {
  return state.portfolio.assets.reduce((profit, holding) => {
    const asset = state.assets.find(a => a.id === holding.assetId);
    if (!asset) return profit;
    return profit + ((asset.currentPrice - holding.averagePrice) * holding.quantity);
  }, 0);
};

// Helper function to calculate portfolio value
const calculatePortfolioValue = (state: GameState) => {
  return state.portfolio.assets.reduce((total, holding) => {
    const asset = state.assets.find(a => a.id === holding.assetId);
    if (!asset) return total;
    return total + (asset.currentPrice * holding.quantity);
  }, 0);
};

export const ACHIEVEMENTS: Achievement[] = [
  // Profit Category
  {
    id: 'newbie',
    name: 'Newbie',
    description: 'Make your first $100 profit',
    condition: (state: GameState) => calculateTotalProfit(state) >= 100,
    reward: 1,
    category: 'profit'
  },
  {
    id: 'profit_hunter',
    name: 'Profit Hunter',
    description: 'Make $10,000 in profit',
    condition: (state: GameState) => calculateTotalProfit(state) >= 10000,
    reward: 10,
    category: 'profit'
  },
  {
    id: 'profit_master',
    name: 'Profit Master',
    description: 'Make $100,000 in profit',
    condition: (state: GameState) => calculateTotalProfit(state) >= 100000,
    reward: 50,
    category: 'profit'
  },
  {
    id: 'profit_legend',
    name: 'Profit Legend',
    description: 'Make $1,000,000 in profit',
    condition: (state: GameState) => calculateTotalProfit(state) >= 1000000,
    reward: 200,
    category: 'profit'
  },
  {
    id: 'profit_god',
    name: 'Profit God',
    description: 'Make $10,000,000 in profit',
    condition: (state: GameState) => calculateTotalProfit(state) >= 10000000,
    reward: 500,
    category: 'profit'
  },
  {
    id: 'profit_titan',
    name: 'Profit Titan',
    description: 'Make $1,000,000,000 in profit',
    condition: (state: GameState) => calculateTotalProfit(state) >= 1000000000,
    reward: 1000,
    category: 'profit'
  },
  {
    id: 'profit_emperor',
    name: 'Profit Emperor',
    description: 'Make $10,000,000,000 in profit',
    condition: (state: GameState) => calculateTotalProfit(state) >= 10000000000,
    reward: 1500,
    category: 'profit'
  },
  {
    id: 'profit_sovereign',
    name: 'Profit Sovereign',
    description: 'Make $100,000,000,000 in profit',
    condition: (state: GameState) => calculateTotalProfit(state) >= 100000000000,
    reward: 2000,
    category: 'profit'
  },
  {
    id: 'profit_immortal',
    name: 'Profit Immortal',
    description: 'Make $500,000,000,000 in profit',
    condition: (state: GameState) => calculateTotalProfit(state) >= 500000000000,
    reward: 2500,
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
  {
    id: 'market_titan',
    name: 'Market Titan',
    description: 'Reach Level 300',
    condition: (state: GameState) => state.xpStats.level >= 300,
    reward: 1000,
    category: 'level'
  },
  {
    id: 'market_emperor',
    name: 'Market Emperor',
    description: 'Reach Level 500',
    condition: (state: GameState) => state.xpStats.level >= 500,
    reward: 1500,
    category: 'level'
  },
  {
    id: 'market_sovereign',
    name: 'Market Sovereign',
    description: 'Reach Level 750',
    condition: (state: GameState) => state.xpStats.level >= 750,
    reward: 2000,
    category: 'level'
  },
  {
    id: 'market_immortal',
    name: 'Market Immortal',
    description: 'Reach Level 1000',
    condition: (state: GameState) => state.xpStats.level >= 1000,
    reward: 2500,
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
  {
    id: 'cash_titan',
    name: 'Cash Titan',
    description: 'Hold $1,000,000,000 in cash',
    condition: (state: GameState) => state.portfolio.cash >= 1000000000,
    reward: 1000,
    category: 'cash'
  },
  {
    id: 'cash_overlord',
    name: 'Cash Overlord',
    description: 'Hold $10,000,000,000 in cash',
    condition: (state: GameState) => state.portfolio.cash >= 10000000000,
    reward: 1500,
    category: 'cash'
  },
  {
    id: 'cash_sovereign',
    name: 'Cash Sovereign',
    description: 'Hold $100,000,000,000 in cash',
    condition: (state: GameState) => state.portfolio.cash >= 100000000000,
    reward: 2000,
    category: 'cash'
  },
  {
    id: 'cash_immortal',
    name: 'Cash Immortal',
    description: 'Hold $1,000,000,000,000 in cash',
    condition: (state: GameState) => state.portfolio.cash >= 1000000000000,
    reward: 2500,
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
    condition: (state: GameState) => calculatePortfolioValue(state) >= 1000000,
    reward: 100,
    category: 'portfolio'
  },
  {
    id: 'portfolio_master',
    name: 'Portfolio Master',
    description: 'Have a portfolio worth $10,000,000',
    condition: (state: GameState) => calculatePortfolioValue(state) >= 10000000,
    reward: 250,
    category: 'portfolio'
  },
  {
    id: 'portfolio_legend',
    name: 'Portfolio Legend',
    description: 'Have a portfolio worth $100,000,000',
    condition: (state: GameState) => calculatePortfolioValue(state) >= 100000000,
    reward: 500,
    category: 'portfolio'
  },
  {
    id: 'portfolio_titan',
    name: 'Portfolio Titan',
    description: 'Have a portfolio worth $1,000,000,000',
    condition: (state: GameState) => calculatePortfolioValue(state) >= 1000000000,
    reward: 1000,
    category: 'portfolio'
  },
  {
    id: 'portfolio_emperor',
    name: 'Portfolio Emperor',
    description: 'Have a portfolio worth $10,000,000,000',
    condition: (state: GameState) => calculatePortfolioValue(state) >= 10000000000,
    reward: 1500,
    category: 'portfolio'
  },
  {
    id: 'portfolio_sovereign',
    name: 'Portfolio Sovereign',
    description: 'Have a portfolio worth $100,000,000,000',
    condition: (state: GameState) => calculatePortfolioValue(state) >= 100000000000,
    reward: 2000,
    category: 'portfolio'
  },
  {
    id: 'portfolio_immortal',
    name: 'Portfolio Immortal',
    description: 'Have a portfolio worth $1,000,000,000,000',
    condition: (state: GameState) => calculatePortfolioValue(state) >= 1000000000000,
    reward: 2500,
    category: 'portfolio'
  },

  // Trading Category
  {
    id: 'first_trade',
    name: 'First Trade',
    description: 'Complete your first transaction',
    condition: (state: GameState) => state.transactions.length >= 1,
    reward: 1,
    category: 'trading'
  },
  {
    id: 'active_trader',
    name: 'Active Trader',
    description: 'Complete 100 transactions',
    condition: (state: GameState) => state.transactions.length >= 100,
    reward: 50,
    category: 'trading'
  },
  {
    id: 'trading_expert',
    name: 'Trading Expert',
    description: 'Complete 1,000 transactions',
    condition: (state: GameState) => state.transactions.length >= 1000,
    reward: 200,
    category: 'trading'
  },
  {
    id: 'trading_master',
    name: 'Trading Master',
    description: 'Complete 10,000 transactions',
    condition: (state: GameState) => state.transactions.length >= 10000,
    reward: 500,
    category: 'trading'
  },
  {
    id: 'trading_titan',
    name: 'Trading Titan',
    description: 'Complete 25,000 transactions',
    condition: (state: GameState) => state.transactions.length >= 25000,
    reward: 1000,
    category: 'trading'
  },
  {
    id: 'trading_emperor',
    name: 'Trading Emperor',
    description: 'Complete 50,000 transactions',
    condition: (state: GameState) => state.transactions.length >= 50000,
    reward: 1500,
    category: 'trading'
  },
  {
    id: 'trading_sovereign',
    name: 'Trading Sovereign',
    description: 'Complete 100,000 transactions',
    condition: (state: GameState) => state.transactions.length >= 100000,
    reward: 2000,
    category: 'trading'
  },
  {
    id: 'trading_immortal',
    name: 'Trading Immortal',
    description: 'Complete 250,000 transactions',
    condition: (state: GameState) => state.transactions.length >= 250000,
    reward: 2500,
    category: 'trading'
  }
]; 