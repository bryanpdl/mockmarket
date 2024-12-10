import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, DocumentReference, serverTimestamp } from 'firebase/firestore';
import { GameState, UnlockedFeature } from '../../types/game';
import { initialAssets, INITIAL_CASH } from '../../data/initialGameData';

const FEATURES_BY_LEVEL = [
  {
    name: 'Basic Trading',
    description: 'Access to basic buy/sell operations',
    levelRequired: 1,
    type: 'trading_feature'
  }
];

const initialGameState: GameState = {
  portfolio: {
    cash: INITIAL_CASH,
    assets: [],
  },
  transactions: [],
  lastUpdate: Date.now(),
  unlockedAssets: ['tech1'],
  assets: initialAssets.map(asset => ({ 
    id: asset.id, 
    currentPrice: asset.currentPrice,
    priceHistory: []
  })),
  orders: [],
  xpStats: {
    level: 1,
    currentXP: 0,
    xpToNextLevel: 1000,
    idleBonus: 0,
    unlockedFeatures: [FEATURES_BY_LEVEL[0] as UnlockedFeature],
  },
  achievements: [],
  boostTokens: 0,
  activeBoosts: []
};

// Add helper function to clean expired boosts
const cleanExpiredBoosts = (gameState: Partial<GameState>) => {
  if (gameState.activeBoosts) {
    const now = Date.now();
    gameState.activeBoosts = gameState.activeBoosts.filter(boost => boost.endTime > now);
  }
  return gameState;
};

export async function saveGameState(
  userId: string, 
  gameState: Partial<GameState>
): Promise<void> {
  try {
    const userRef = getUserRef(userId);
    const userDoc = await getDoc(userRef);

    // Clean expired boosts before saving
    const cleanedGameState = cleanExpiredBoosts(gameState);

    if (!userDoc.exists()) {
      // Create new user document with initial state
      await setDoc(userRef, {
        gameState: {
          ...initialGameState,
          ...cleanedGameState,
          lastUpdate: serverTimestamp()
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Get current state and merge with updates
      const currentData = userDoc.data();
      const currentGameState = currentData.gameState;
      
      await updateDoc(userRef, {
        gameState: {
          ...currentGameState,
          ...cleanedGameState,
          lastUpdate: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error saving game state:', error);
    throw error;
  }
}

export async function loadGameState(userId: string): Promise<GameState | null> {
  try {
    const userRef = getUserRef(userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Initialize new user with default game state
      await setDoc(userRef, {
        gameState: initialGameState,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return initialGameState;
    }

    const data = userDoc.data();
    const gameState = data.gameState as GameState;
    return cleanExpiredBoosts(gameState) as GameState;
  } catch (error) {
    console.error('Error loading game state:', error);
    throw error;
  }
}

// Helper function to get user document reference
export function getUserRef(userId: string): DocumentReference {
  return doc(db, 'users', userId);
} 