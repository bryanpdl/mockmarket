import { MarketBoost } from '../types/game';

export const MARKET_BOOSTS: MarketBoost[] = [
  {
    id: 'quick_income',
    name: 'Quick Income',
    description: '2x faster idle income for 30 seconds',
    duration: 30000,
    cost: 5,
    multiplier: 2,
    type: 'idle_speed'
  },
  {
    id: 'income_surge',
    name: 'Income Surge',
    description: '3x idle income rate for 1 minute',
    duration: 60000,
    cost: 15,
    multiplier: 3,
    type: 'idle_income'
  },
  {
    id: 'xp_rush',
    name: 'XP Rush',
    description: '2.5x XP from all profits for 2 minutes',
    duration: 120000,
    cost: 30,
    multiplier: 2.5,
    type: 'xp_gain'
  },
  {
    id: 'market_frenzy',
    name: 'Market Frenzy',
    description: '2x price volatility for massive profit potential for 1 minute',
    duration: 60000,
    cost: 50,
    multiplier: 2,
    type: 'price_volatility'
  }
]; 