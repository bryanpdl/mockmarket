import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Asset } from '../types/game';
import { useGameStore } from '../store/gameStore';
import Toast from './Toast';
import { formatLargeNumber } from '../lib/utils';

const MotionDiv = motion.div as React.ComponentType<React.HTMLAttributes<HTMLDivElement> & { 
  initial?: any;
  animate?: any;
  exit?: any;
}>;

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
  type: 'buy' | 'sell';
}

export default function OrderModal({ isOpen, onClose, asset: initialAsset, type }: OrderModalProps) {
  const [quantity, setQuantity] = useState('1');
  const [targetPrice, setTargetPrice] = useState(initialAsset.currentPrice.toFixed(2));
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { createOrder, portfolio, orders, assets } = useGameStore();

  // Get real-time asset data from the store
  const asset = assets.find(a => a.id === initialAsset.id) || initialAsset;

  const totalValue = useMemo(() => {
    const qty = parseInt(quantity) || 0;
    const price = parseFloat(targetPrice) || 0;
    return qty * price;
  }, [quantity, targetPrice]);

  // Calculate locked quantity from active sell orders
  const lockedQuantity = useMemo(() => {
    return orders.reduce((total, order) => {
      if (order.type === 'sell' && order.assetId === asset.id) {
        return total + order.quantity;
      }
      return total;
    }, 0);
  }, [orders, asset.id]);

  const calculateMaxQuantity = () => {
    if (type === 'buy') {
      const price = parseFloat(targetPrice) || 0;
      if (price <= 0) return '0';
      const maxQty = Math.floor(portfolio.cash / price);
      return maxQty.toString();
    } else {
      const holding = portfolio.assets.find(a => a.assetId === asset.id);
      if (!holding) return '0';
      const availableQuantity = holding.quantity - lockedQuantity;
      return Math.max(0, availableQuantity).toString();
    }
  };

  const handleMaxClick = () => {
    const maxQty = calculateMaxQuantity();
    setQuantity(maxQty);
  };

  const validateOrder = () => {
    const qty = parseInt(quantity);
    const price = parseFloat(targetPrice);
    
    if (type === 'buy') {
      if (totalValue > portfolio.cash) {
        setToastMessage("You don't have enough cash for this order");
        setShowToast(true);
        return false;
      }
    } else {
      const holding = portfolio.assets.find(a => a.assetId === asset.id);
      if (!holding) {
        setToastMessage(`You don't have any ${asset.symbol}`);
        setShowToast(true);
        return false;
      }

      const availableQuantity = holding.quantity - lockedQuantity;
      if (availableQuantity < qty) {
        if (lockedQuantity > 0) {
          setToastMessage(`You only have ${availableQuantity} ${asset.symbol} available (${lockedQuantity} locked in other orders)`);
        } else {
          setToastMessage(`You don't have enough ${asset.symbol}`);
        }
        setShowToast(true);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOrder()) return;

    const order = {
      assetId: asset.id,
      type,
      quantity: parseInt(quantity),
      targetPrice: parseFloat(targetPrice),
      createdAt: Date.now()
    };
    createOrder(order);
    onClose();
  };

  // Add handler for target price changes
  const handleTargetPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow typing by setting the raw value
    setTargetPrice(value);
  };

  // Format to 2 decimal places on blur
  const handleTargetPriceBlur = () => {
    const parsed = parseFloat(targetPrice);
    if (!isNaN(parsed)) {
      setTargetPrice(parsed.toFixed(2));
    } else {
      setTargetPrice('0.00');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Backdrop */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />

          {/* Modal */}
          <MotionDiv
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-[#161616] p-6 rounded-lg w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-1">
              {type === 'buy' ? 'Buy Order' : 'Sell Order'}
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              for <span className="font-bold">{asset.name}</span>
            </p>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Current Price:</span>
                <span>${formatLargeNumber(asset.currentPrice)}</span>
              </div>
              {type === 'sell' && lockedQuantity > 0 && (
                <div className="text-sm text-[#E71151] mt-1">
                  {lockedQuantity} {asset.symbol} locked in other orders
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Quantity</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="flex-1 bg-[#1C1C1C] border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-[#00B57C]"
                  />
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className={`px-3 py-2 rounded text-sm transition-all duration-200 ${
                      type === 'buy'
                        ? 'bg-[#00B57C]/20 text-[#00B57C] hover:bg-[#00B57C]/30'
                        : 'bg-[#E71151]/20 text-[#E71151] hover:bg-[#E71151]/30'
                    }`}
                  >
                    Max
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Target Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={targetPrice}
                  onChange={handleTargetPriceChange}
                  onBlur={handleTargetPriceBlur}
                  className="w-full bg-[#1C1C1C] border border-gray-700 rounded px-3 py-2 focus:outline-none focus:border-[#00B57C]"
                />
              </div>

              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Total Value:</span>
                <span className={`font-bold ${type === 'buy' ? 'text-[#00B57C]' : 'text-[#E71151]'}`}>
                  ${formatLargeNumber(totalValue)}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-[#1C1C1C] px-4 py-2 rounded hover:bg-[#242424] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 rounded transition-all duration-200 ${
                    type === 'buy'
                      ? 'bg-[#00B57C] hover:shadow-[0_0_15px_rgba(0,181,124,0.3)] hover:bg-[#00C98A]'
                      : 'bg-[#E71151] hover:shadow-[0_0_15px_rgba(231,17,81,0.3)] hover:bg-[#FF1259]'
                  }`}
                >
                  Place Order
                </button>
              </div>
            </form>
          </MotionDiv>

          <Toast
            message={toastMessage}
            type="error"
            isVisible={showToast}
            onClose={() => setShowToast(false)}
          />
        </div>
      )}
    </AnimatePresence>
  );
} 