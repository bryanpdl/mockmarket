import { motion } from 'framer-motion';
import { useAuthContext } from '../contexts/AuthContext';
import { useState } from 'react';

const MotionDiv = motion.div as React.FC<any>;

export default function SignInModal() {
  const { signInWithGoogle, signInAsGuest } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'google' | 'guest' | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading('google');
      await signInWithGoogle();
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setError(null);
      setLoading('guest');
      await signInAsGuest();
    } catch (err) {
      setError('Guest sign-in is currently unavailable. Please try signing in with Google or try again later.');
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <MotionDiv
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#161616] p-8 rounded-xl max-w-md w-full mx-4 relative overflow-hidden"
      >
        {/* Background Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00B57C] via-transparent to-[#E71151] opacity-[0.15]" />
        
        {/* Content */}
        <div className="relative">
          <h2 className="text-3xl font-bold mb-2">Welcome to MockMarket</h2>
          <p className="text-gray-400 mb-8">Sign in to save your progress and compete on the leaderboard.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading !== null}
              className="w-full bg-white text-black py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'google' ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {loading === 'google' ? 'Signing in...' : 'Continue with Google'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#161616] text-gray-400">or</span>
              </div>
            </div>

            <button
              onClick={handleGuestSignIn}
              disabled={loading !== null}
              className="w-full bg-[#1C1C1C] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#242424] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === 'guest' && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading === 'guest' ? 'Signing in...' : 'Play as Guest'}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6 text-center">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </MotionDiv>
    </div>
  );
} 