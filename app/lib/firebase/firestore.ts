import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, DocumentReference, serverTimestamp } from 'firebase/firestore';
import { GameState, UnlockedFeature } from '../../types/game';
import { initialAssets, INITIAL_CASH } from '../../data/initialGameData';
import { auth } from '../firebase';
import { FEATURES_BY_LEVEL } from '../../data/features';

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

// Add validation helper at the top
const validateGameState = (gameState: Partial<GameState>): Partial<GameState> => {
  const validated = { ...gameState };
  
  // Validate assets if present
  if (validated.assets) {
    validated.assets = validated.assets.map(asset => ({
      ...asset,
      currentPrice: isNaN(asset.currentPrice) ? initialAssets.find(a => a.id === asset.id)?.basePrice || 0 : asset.currentPrice,
      priceHistory: asset.priceHistory?.map(ph => ({
        price: isNaN(ph.price) ? initialAssets.find(a => a.id === asset.id)?.basePrice || 0 : ph.price,
        timestamp: ph.timestamp
      })) || []
    }));
  }

  return validated;
};

export async function saveGameState(
  userId: string, 
  gameState: Partial<GameState>
): Promise<void> {
  try {
    const userRef = getUserRef(userId);
    const userDoc = await getDoc(userRef);

    // Clean expired boosts and validate state before saving
    const cleanedGameState = cleanExpiredBoosts(gameState);
    const validatedGameState = validateGameState(cleanedGameState);

    if (!userDoc.exists()) {
      // Create new user document with initial state and profile
      const user = auth.currentUser;
      await setDoc(userRef, {
        profile: {
          displayName: user?.displayName || 'Guest',
          email: user?.email || 'anonymous',
          photoURL: user?.photoURL || null,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          isAnonymous: user?.isAnonymous || false
        },
        gameState: {
          ...initialGameState,
          ...validatedGameState,
          lastUpdate: serverTimestamp()
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Get current state and merge with updates
      const currentData = userDoc.data();
      const currentGameState = validateGameState(currentData.gameState);
      
      await updateDoc(userRef, {
        gameState: {
          ...currentGameState,
          ...validatedGameState,
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
      // Initialize new user with default game state and profile
      const user = auth.currentUser;
      await setDoc(userRef, {
        profile: {
          displayName: user?.displayName || 'Guest',
          email: user?.email || 'anonymous',
          photoURL: user?.photoURL || null,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          isAnonymous: user?.isAnonymous || false
        },
        gameState: initialGameState,
        updatedAt: serverTimestamp()
      });
      return initialGameState;
    }

    const data = userDoc.data();
    const gameState = data.gameState as GameState;
    
    // Validate and fix any corrupted data on load
    const validatedGameState = validateGameState(gameState) as GameState;
    
    // If we had to fix any data, save it back
    if (JSON.stringify(gameState) !== JSON.stringify(validatedGameState)) {
      await updateDoc(userRef, {
        gameState: validatedGameState,
        updatedAt: serverTimestamp()
      });
    }
    
    return cleanExpiredBoosts(validatedGameState) as GameState;
  } catch (error) {
    console.error('Error loading game state:', error);
    throw error;
  }
}

// Helper function to get user document reference
export function getUserRef(userId: string): DocumentReference {
  return doc(db, 'users', userId);
} 