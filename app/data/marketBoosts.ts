import { MarketBoost } from '../types/game';

export const MARKET_BOOSTS: MarketBoost[] = [
  // Tier 1 Boosts (Original)
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
  },

  // Tier 2 Boosts (Improved versions)
  {
    id: 'quick_income_2',
    name: 'Quick Income II',
    description: '4x faster idle income for 20 seconds',
    duration: 20000,
    cost: 100,
    multiplier: 4,
    type: 'idle_speed'
  },
  {
    id: 'income_surge_2',
    name: 'Income Surge II',
    description: '5x idle income rate for 45 seconds',
    duration: 45000,
    cost: 250,
    multiplier: 5,
    type: 'idle_income'
  },
  {
    id: 'xp_rush_2',
    name: 'XP Rush II',
    description: '5x XP from all profits for 2 minutes',
    duration: 120000,
    cost: 500,
    multiplier: 5,
    type: 'xp_gain'
  },
  {
    id: 'market_frenzy_2',
    name: 'Market Frenzy II',
    description: '3x price volatility for massive profit potential for 45 seconds',
    duration: 45000,
    cost: 750,
    multiplier: 3,
    type: 'price_volatility'
  },

  // Tier 3 Boosts (Ultimate versions)
  {
    id: 'quick_income_3',
    name: 'Quick Income III',
    description: '8x faster idle income for 15 seconds',
    duration: 15000,
    cost: 1000,
    multiplier: 8,
    type: 'idle_speed'
  },
  {
    id: 'income_surge_3',
    name: 'Income Surge III',
    description: '10x idle income rate for 30 seconds',
    duration: 30000,
    cost: 2500,
    multiplier: 10,
    type: 'idle_income'
  },
  {
    id: 'xp_rush_3',
    name: 'XP Rush III',
    description: '10x XP from all profits for 1 minute',
    duration: 60000,
    cost: 5000,
    multiplier: 10,
    type: 'xp_gain'
  },
  {
    id: 'market_frenzy_3',
    name: 'Market Frenzy III',
    description: '5x price volatility for massive profit potential for 30 seconds',
    duration: 30000,
    cost: 7500,
    multiplier: 5,
    type: 'price_volatility'
  },

  // Special Ultimate Boost
  {
    id: 'market_mayhem',
    name: 'Market Mayhem',
    description: '3x all boost effects for 15 seconds',
    duration: 15000,
    cost: 10000,
    multiplier: 3,
    type: 'price_volatility'
  }
]; 