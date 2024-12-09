import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Asset, Transaction } from '../types/game';
import { useGameStore } from '../store/gameStore';

const MotionDiv = motion.div as React.ComponentType<React.HTMLAttributes<HTMLDivElement> & { 
  initial?: any;
  animate?: any;
  exit?: any;
}>;

interface ActiveOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'active' | 'history';

export default function ActiveOrdersModal({ isOpen, onClose }: ActiveOrdersModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const { orders, assets, cancelOrder, transactions } = useGameStore();

  const getAssetDetails = (assetId: string): Asset | undefined => {
    return assets.find(a => a.id === assetId);
  };

  const TabButton = ({ tab, label }: { tab: TabType; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-[#1C1C1C] text-white'
          : 'text-gray-400 hover:text-white hover:bg-[#161616]'
      }`}
    >
      {label}
    </button>
  );

  const renderActiveOrders = () => (
    <div className="space-y-4">
      {orders.map((order) => {
        const asset = getAssetDetails(order.assetId);
        if (!asset) return null;

        const totalValue = order.quantity * order.targetPrice;
        const isPriceReached = order.type === 'buy' 
          ? asset.currentPrice <= order.targetPrice
          : asset.currentPrice >= order.targetPrice;

        return (
          <div
            key={order.id}
            className="bg-[#1C1C1C] p-4 rounded-lg relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300" />
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold">{asset.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    order.type === 'buy'
                      ? 'bg-[#00B57C]/20 text-[#00B57C]'
                      : 'bg-[#E71151]/20 text-[#E71151]'
                  }`}>
                    {order.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  {order.quantity} {asset.symbol} @ ${order.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">
                  Total Value: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">
                  Current Price: ${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className={`text-xs ${isPriceReached ? 'text-[#00B57C]' : 'text-gray-500'}`}>
                  {isPriceReached ? 'Target price reached!' : 'Waiting for target price...'}
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                cancelOrder(order.id);
              }}
              className="mt-2 text-sm text-red-400 hover:text-red-300 transition-colors cursor-pointer relative z-10"
            >
              Cancel Order
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderOrderHistory = () => (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        const asset = getAssetDetails(transaction.assetId);
        if (!asset) return null;

        const totalValue = transaction.quantity * transaction.price;
        const date = new Date(transaction.timestamp);
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString();

        return (
          <div
            key={transaction.id}
            className="bg-[#1C1C1C] p-4 rounded-lg relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300" />
            
            <div className="flex justify-between items-start relative">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold">{asset.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    transaction.type === 'buy'
                      ? 'bg-[#00B57C]/20 text-[#00B57C]'
                      : 'bg-[#E71151]/20 text-[#E71151]'
                  }`}>
                    {transaction.type.toUpperCase()}
                  </span>
                  {'status' in transaction && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      transaction.status === 'filled'
                        ? 'bg-[#00B57C]/20 text-[#00B57C]'
                        : 'bg-[#E71151]/20 text-[#E71151]'
                    }`}>
                      {transaction.status === 'filled' ? 'Filled' : 'Cancelled'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  {transaction.quantity} {asset.symbol} @ ${transaction.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">
                  Total Value: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-400">
                  {formattedDate}
                </p>
                <p className="text-xs text-gray-500">
                  {formattedTime}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

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
            className="relative bg-[#161616] p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold">Orders</h2>
                <div className="flex gap-2 bg-[#111111] p-1 rounded-lg">
                  <TabButton tab="active" label="Active Orders" />
                  <TabButton tab="history" label="Order History" />
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {activeTab === 'active' ? (
                orders.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    No active orders
                  </div>
                ) : (
                  renderActiveOrders()
                )
              ) : (
                transactions.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    No order history
                  </div>
                ) : (
                  renderOrderHistory()
                )
              )}
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
} 