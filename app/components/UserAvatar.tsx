import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthContext } from '../contexts/AuthContext';

const MotionDiv = motion.div as React.FC<any>;

export default function UserAvatar() {
  const { user, signOut, isAnonymous } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center h-10 gap-2 bg-[#1C1C1C] rounded-full hover:bg-[#242424] transition-colors duration-200"
      >
        <div className="w-10 h-10  sm:w-8 sm:h-8 rounded-full overflow-hidden bg-[#242424] flex items-center justify-center flex-shrink-0">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="User avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-6 h-6 sm:w-5 sm:h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          )}
        </div>
        <span className="hidden sm:block text-sm font-medium pr-4">
          {isAnonymous
            ? 'Guest'
            : user?.displayName?.split(' ')[0] || 'User'}
        </span>
      </button>

      {isOpen && (
        <MotionDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 sm:right-0 mt-2 w-48 bg-[#1C1C1C] rounded-lg shadow-lg py-1 z-50 transform -translate-x-1/2 sm:translate-x-0 left-1/2 sm:left-auto"
        >
          <div className="px-3 py-2 border-b border-gray-700">
            <p className="text-sm font-medium truncate">
              {isAnonymous
                ? 'Playing as Guest'
                : user?.displayName || 'User'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {isAnonymous ? 'Anonymous User' : user?.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-[#242424] transition-colors duration-200"
          >
            Sign Out
          </button>
        </MotionDiv>
      )}
    </div>
  );
} 