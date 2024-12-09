import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  isVisible: boolean;
  onClose: () => void;
}

const MotionDiv = motion.div as React.ComponentType<React.HTMLAttributes<HTMLDivElement> & { 
  initial?: any;
  animate?: any;
  exit?: any;
  onAnimationComplete?: () => void;
}>;

export default function Toast({ message, type, isVisible, onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <MotionDiv
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50"
          onAnimationComplete={() => {
            setTimeout(onClose, 3000); // Auto-close after 3 seconds
          }}
        >
          <div className={`px-4 py-2 rounded-lg shadow-lg ${
            type === 'error' 
              ? 'bg-[#E71151] text-white' 
              : 'bg-[#00B57C] text-white'
          }`}>
            {message}
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
} 