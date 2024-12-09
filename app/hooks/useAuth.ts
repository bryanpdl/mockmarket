import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signInAnonymously, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User } from 'firebase/auth';
import { useGameStore } from '../store/gameStore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setUserId, loadUserGameState } = useGameStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setUserId(user?.uid || null);
      
      if (user) {
        await loadUserGameState(user.uid);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInAsGuest = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  };

  const signOut = () => firebaseSignOut(auth);

  return {
    user,
    loading,
    signInWithGoogle,
    signInAsGuest,
    signOut,
    isAuthenticated: !!user,
    isAnonymous: user?.isAnonymous ?? false
  };
} 