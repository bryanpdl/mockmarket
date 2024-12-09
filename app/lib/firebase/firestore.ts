import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp,
  DocumentReference 
} from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { GameState } from '../../types/game';
import { INITIAL_CASH } from '../../data/initialGameData';

export async function initializeUserData(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    const initialData = {
      profile: {
        displayName: user.displayName || 'Player',
        email: user.email,
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      },
      gameState: {
        portfolio: {
          cash: INITIAL_CASH,
          assets: [],
        },
        transactions: [],
        lastUpdate: serverTimestamp(),
        unlockedAssets: ['tech1'],
        xpStats: {
          level: 1,
          currentXP: 0,
          xpToNextLevel: 2000,
          idleBonus: 0,
          unlockedFeatures: [{
            name: 'Basic Trading',
            description: 'Access to basic buy/sell operations',
            levelRequired: 1,
            type: 'trading_feature'
          }]
        }
      }
    };

    await setDoc(userRef, initialData);
  } else {
    // Update last login time
    await updateDoc(userRef, {
      'profile.lastLogin': serverTimestamp()
    });
  }
}

export async function saveGameState(
  userId: string, 
  gameState: Partial<GameState>
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    gameState: {
      ...gameState,
      lastUpdate: serverTimestamp()
    }
  });
}

export async function loadGameState(userId: string): Promise<GameState | null> {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data();
  return data.gameState as GameState;
}

// Helper function to get user document reference
export function getUserRef(userId: string): DocumentReference {
  return doc(db, 'users', userId);
} 