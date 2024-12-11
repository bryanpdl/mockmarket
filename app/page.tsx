'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { useGameStore, calculateIdleInterval } from './store/gameStore';
import { PRICE_UPDATE_INTERVAL, IDLE_INCOME_INTERVAL } from './data/initialGameData';
import { Asset } from './types/game';
import XPStats from './components/xpStats';
import TrendIndicator from './components/trendIndicator';
import SignInModal from './components/SignInModal';
import OrderModal from './components/OrderModal';
import ActiveOrdersModal from './components/ActiveOrdersModal';
import { useAuthContext } from './contexts/AuthContext';
import UserAvatar from './components/UserAvatar';
import AdvancedAnalyticsModal from './components/AdvancedAnalyticsModal';
import AchievementModal from './components/AchievementModal';
import BoostButton from './components/BoostButton';

const MotionDiv = motion.div as React.FC<MotionProps & React.HTMLProps<HTMLDivElement>>;
const MotionSection = motion.section as React.FC<MotionProps & React.HTMLProps<HTMLElement>>;

type AssetType = 'stock' | 'crypto' | 'commodity';

export default function Home() {
  const { isAuthenticated, user } = useAuthContext();
  const { 
    portfolio, 
    buyAsset, 
    sellAsset, 
    updatePrices, 
    processIdleIncome, 
    assets, 
    xpStats,
    isLoading,
    error,
    loadUserGameState,
    orders,
    boostTokens,
    forceSave
  } = useGameStore();
  const [selectedType, setSelectedType] = useState<AssetType>('stock');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showActiveOrdersModal, setShowActiveOrdersModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedAnalyticsAsset, setSelectedAnalyticsAsset] = useState<Asset | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [isBuyMenuOpen, setIsBuyMenuOpen] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if market trends feature is unlocked
  const hasTrendFeature = xpStats.unlockedFeatures.some(
    feature => feature.name === 'Market Trends'
  );

  // Check if orders feature is unlocked
  const hasOrdersFeature = xpStats.unlockedFeatures.some(
    feature => feature.name === 'Sell/Buy Orders'
  );

  // Check if advanced analytics feature is unlocked
  const hasAdvancedAnalytics = xpStats.unlockedFeatures.some(
    feature => feature.name === 'Advanced Analytics'
  );

  // Load game state when user authenticates
  useEffect(() => {
    if (user?.uid) {
      loadUserGameState(user.uid);
    }
  }, [user?.uid, loadUserGameState]);

  useEffect(() => {
    const priceInterval = setInterval(updatePrices, PRICE_UPDATE_INTERVAL);
    const currentIdleInterval = calculateIdleInterval(xpStats.unlockedFeatures);
    const idleInterval = setInterval(processIdleIncome, currentIdleInterval);

    return () => {
      clearInterval(priceInterval);
      clearInterval(idleInterval);
    };
  }, [updatePrices, processIdleIncome, xpStats.unlockedFeatures]);

  // Auto-save game state periodically
  useEffect(() => {
    if (user?.uid) {
      const saveInterval = setInterval(() => {
        useGameStore.getState().saveUserGameState(user.uid);
      }, 30000); // Save every 30 seconds

      return () => clearInterval(saveInterval);
    }
  }, [user?.uid]);

  // Add cleanup effect
  useEffect(() => {
    // Save on unmount
    return () => {
      forceSave();
    };
  }, [forceSave]);

  const totalPortfolioValue = portfolio.assets.reduce((total, holding) => {
    const asset = assets.find(a => a.id === holding.assetId);
    return total + (asset?.currentPrice ?? 0) * holding.quantity;
  }, 0) + portfolio.cash;

  const filteredAssets = assets.filter(asset => asset.type === selectedType);

  const TabButton = ({ type, label }: { type: AssetType; label: string }) => (
    <button
      onClick={() => setSelectedType(type)}
      className={`px-4 py-2 rounded-lg transition-colors ${
        selectedType === type
          ? 'bg-[#1C1C1C] text-white'
          : 'text-gray-400 hover:text-white hover:bg-[#161616]'
      }`}
    >
      {label}
    </button>
  );

  // Add order buttons to market items
  const renderOrderButtons = (asset: Asset) => {
    if (!hasOrdersFeature) return null;

    return (
      <div className="flex gap-2">
        <button
          onClick={() => {
            setSelectedAsset(asset);
            setOrderType('buy');
            setShowOrderModal(true);
          }}
          className="bg-[#1C1C1C] px-4 py-1 rounded text-sm hover:bg-[#242424] transition-colors text-[#00B57C]"
        >
          Buy Order
        </button>
        <button
          onClick={() => {
            setSelectedAsset(asset);
            setOrderType('sell');
            setShowOrderModal(true);
          }}
          className="bg-[#1C1C1C] px-4 py-1 rounded text-sm hover:bg-[#242424] transition-colors text-[#E71151]"
        >
          Sell Order
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0C0C0C]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#00B57C] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0C0C0C]">
        <div className="bg-[#161616] p-8 rounded-lg max-w-md text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => user?.uid && loadUserGameState(user.uid)}
            className="bg-[#1C1C1C] px-4 py-2 rounded hover:bg-[#242424] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isAuthenticated && <SignInModal />}
      <AchievementModal
        isOpen={showAchievementModal}
        onClose={() => setShowAchievementModal(false)}
      />

      <main className="container mx-auto px-4 py-8">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div className="w-full md:w-auto">
              <h1 className="text-2xl font-bold mb-2 flex items-center gap-2 text-gray-300">
                <span>MockMarket</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                <div className="text-2xl md:text-3xl font-bold text-[#00B57C]">
                  ${portfolio.cash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm md:text-base text-gray-400">
                  Total Value: ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowAchievementModal(true)}
                  className="flex items-center justify-center w-10 h-10 bg-[#1C1C1C] rounded-full hover:bg-[#242424] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
                <BoostButton />
                <UserAvatar />
                <div className="flex-1">
                  <XPStats stats={xpStats} />
                </div>
              </div>
            </div>
          </div>
        </MotionDiv>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Market Section */}
          <MotionSection
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#111111] p-6 rounded-lg flex flex-col h-[600px] sm:h-[600px]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Market</h2>
              <div className="sm:flex gap-2 bg-[#161616] p-1 rounded-lg hidden">
                <TabButton type="stock" label="Stocks" />
                <TabButton type="crypto" label="Crypto" />
                <TabButton type="commodity" label="Commodities" />
              </div>
              <div className="relative sm:hidden" ref={filterRef}>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 bg-[#161616] px-4 py-2 rounded-lg hover:bg-[#1C1C1C] transition-colors"
                >
                  <span className="text-sm">
                    {selectedType === 'stock' ? 'Stocks' : 
                     selectedType === 'crypto' ? 'Crypto' : 'Commodities'}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-[#161616] rounded-lg shadow-lg py-1 z-50">
                    <button
                      onClick={() => {
                        setSelectedType('stock');
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#1C1C1C] transition-colors ${
                        selectedType === 'stock' ? 'text-[#00B57C]' : 'text-gray-400'
                      }`}
                    >
                      Stocks
                    </button>
                    <button
                      onClick={() => {
                        setSelectedType('crypto');
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#1C1C1C] transition-colors ${
                        selectedType === 'crypto' ? 'text-[#00B57C]' : 'text-gray-400'
                      }`}
                    >
                      Crypto
                    </button>
                    <button
                      onClick={() => {
                        setSelectedType('commodity');
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-[#1C1C1C] transition-colors ${
                        selectedType === 'commodity' ? 'text-[#00B57C]' : 'text-gray-400'
                      }`}
                    >
                      Commodities
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {filteredAssets.map((asset) => {
                const priceChange = ((asset.currentPrice - asset.basePrice) / asset.basePrice) * 100;
                const volatilityText = 
                  asset.volatility <= 0.20 ? "Low Risk" :
                  asset.volatility <= 0.30 ? "Medium Risk" : "High Risk";
                
                const isLocked = totalPortfolioValue < asset.unlockPrice;
                
                return (
                  <MotionDiv
                    key={asset.id}
                    className="bg-[#161616] p-4 rounded-lg group relative overflow-hidden"
                    whileHover={{ scale: isLocked ? 1 : 1.02, y: isLocked ? 0 : -2 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300" />
                    <div className="flex flex-col gap-2 relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold group-hover:text-white transition-colors duration-200">{asset.name}</h3>
                            <span className="text-xs px-2 py-1 rounded bg-[#1C1C1C] text-gray-300 group-hover:bg-[#222222] transition-colors duration-200">
                              {volatilityText}
                            </span>
                            {hasTrendFeature && !isLocked && (
                              <TrendIndicator 
                                priceHistory={asset.priceHistory || []}
                                volatility={asset.volatility}
                              />
                            )}
                            {hasAdvancedAnalytics && !isLocked && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAnalyticsAsset(asset);
                                  setShowAnalyticsModal(true);
                                }}
                                className="bg-[#1C1C1C] p-1.5 rounded hover:bg-[#242424] transition-colors group-hover:bg-[#242424]"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#00B57C]" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{asset.symbol}</p>
                          {!isLocked && (
                            <div className="h-0 group-hover:h-[20px] transition-all duration-300 overflow-hidden">
                              <p className="text-xs text-gray-500">{asset.description}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold group-hover:text-white transition-colors duration-200">
                            ${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className={`text-sm ${priceChange >= 0 ? 'text-[#00B57C]' : 'text-red-400'}`}>
                            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      {!isLocked && (
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out h-0 ${
                          isBuyMenuOpen 
                            ? 'group-hover:h-[240px] sm:group-hover:h-[240px]' 
                            : 'group-hover:h-[60px] sm:group-hover:h-[60px]'
                        }`}>
                          <div className="transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out flex flex-col gap-3 sm:gap-2 pt-3 sm:pt-2 pb-2">
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <button
                                  onClick={() => setIsBuyMenuOpen(!isBuyMenuOpen)}
                                  className="w-full bg-[#00B57C] px-4 py-2 rounded text-sm transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,181,124,0.3)] hover:bg-[#00C98A] flex items-center justify-between"
                                >
                                  <span>Buy {asset.symbol}</span>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`h-4 w-4 transition-transform duration-200 ${isBuyMenuOpen ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                                {isBuyMenuOpen && (
                                  <div className="absolute left-0 right-0 mt-2 bg-[#161616] rounded-lg shadow-lg py-2 z-50">
                                    <div className="grid grid-cols-3 gap-1 px-2 mb-2">
                                      <button
                                        onClick={() => {
                                          buyAsset(asset.id, 1);
                                        }}
                                        className="text-center px-2 py-2 text-sm bg-[#1C1C1C] hover:bg-[#242424] transition-colors rounded flex flex-col items-center"
                                      >
                                        <span>Buy 1</span>
                                        <span className="text-gray-400 text-xs">${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          buyAsset(asset.id, 10);
                                        }}
                                        className="text-center px-2 py-2 text-sm bg-[#1C1C1C] hover:bg-[#242424] transition-colors rounded flex flex-col items-center"
                                      >
                                        <span>Buy 10</span>
                                        <span className="text-gray-400 text-xs">${(10 * asset.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          buyAsset(asset.id, 100);
                                        }}
                                        className="text-center px-2 py-2 text-sm bg-[#1C1C1C] hover:bg-[#242424] transition-colors rounded flex flex-col items-center"
                                      >
                                        <span>Buy 100</span>
                                        <span className="text-gray-400 text-xs">${(100 * asset.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      </button>
                                    </div>
                                    <div className="px-2">
                                      <button
                                        onClick={() => {
                                          const maxQuantity = Math.floor(portfolio.cash / asset.currentPrice);
                                          const halfMaxQuantity = Math.floor(maxQuantity / 2);
                                          if (halfMaxQuantity > 0) {
                                            buyAsset(asset.id, halfMaxQuantity);
                                          }
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-[#1C1C1C] transition-colors flex justify-between items-center rounded"
                                      >
                                        <span>Buy 50% ({Math.floor(Math.floor(portfolio.cash / asset.currentPrice) / 2)} {asset.symbol})</span>
                                        <span className="text-gray-400">${(Math.floor(Math.floor(portfolio.cash / asset.currentPrice) / 2) * asset.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          const maxQuantity = Math.floor(portfolio.cash / asset.currentPrice);
                                          if (maxQuantity > 0) {
                                            buyAsset(asset.id, maxQuantity);
                                          }
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-[#1C1C1C] transition-colors flex justify-between items-center rounded"
                                      >
                                        <span>Buy Max ({Math.floor(portfolio.cash / asset.currentPrice)} {asset.symbol})</span>
                                        <span className="text-gray-400">${(Math.floor(portfolio.cash / asset.currentPrice) * asset.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      </button>
                                    </div>
                                    {hasOrdersFeature && (
                                      <>
                                        <div className="my-1 border-t border-gray-800"></div>
                                        <div className="px-1">
                                          <button
                                            onClick={() => {
                                              setSelectedAsset(asset);
                                              setOrderType('buy');
                                              setShowOrderModal(true);
                                              setIsBuyMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm hover:bg-[#1C1C1C] transition-colors text-[#00B57C] flex items-center gap-2 rounded"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span>Create Buy Order</span>
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {isLocked && (
                        <p className="text-xs text-yellow-400 mt-1">
                          Unlocks at ${asset.unlockPrice.toLocaleString()} portfolio value
                        </p>
                      )}
                    </div>
                  </MotionDiv>
                );
              })}
            </div>
          </MotionSection>

          {/* Portfolio Section */}
          <MotionSection
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#111111] p-6 rounded-lg flex flex-col h-[600px]"
          >
            <div className="flex mt-2 justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">Portfolio</h2>
                <span className="text-sm px-2 py-1 rounded bg-[#1C1C1C] text-gray-400">
                  Assets: {portfolio.assets.length}
                </span>
                {hasOrdersFeature && (
                  <button
                    onClick={() => setShowActiveOrdersModal(true)}
                    className="flex items-center gap-2 bg-[#1C1C1C] px-3 py-1 rounded hover:bg-[#242424] transition-colors text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Active Orders</span>
                  </button>
                )}
              </div>
              <p className="text-gray-400">
                Holdings: ${portfolio.assets.reduce((total, holding) => {
                  const asset = assets.find(a => a.id === holding.assetId);
                  return total + (asset?.currentPrice ?? 0) * holding.quantity;
                }, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {portfolio.assets.map((holding) => {
                const asset = assets.find((a) => a.id === holding.assetId);
                if (!asset) return null;

                const currentValue = asset.currentPrice * holding.quantity;
                const totalCost = holding.averagePrice * holding.quantity;
                const profit = currentValue - totalCost;
                const profitPercentage = (profit / totalCost) * 100;

                // Calculate locked quantity from active sell orders
                const lockedQuantity = orders.reduce((total, order) => {
                  if (order.type === 'sell' && order.assetId === asset.id) {
                    return total + order.quantity;
                  }
                  return total;
                }, 0);

                const availableQuantity = holding.quantity - lockedQuantity;

                return (
                  <MotionDiv
                    key={holding.assetId}
                    className="bg-[#161616] p-4 rounded-lg group relative overflow-hidden"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300" />
                    <div className="flex flex-col gap-2 relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold mb-2 group-hover:text-white transition-colors duration-200">{asset.name}</h3>
                          <p className="text-sm text-gray-400">
                            {holding.quantity} {asset.symbol}
                            {lockedQuantity > 0 && (
                              <span className="text-[#E71151] ml-2">
                                ({lockedQuantity} locked)
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            Avg: ${holding.averagePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold group-hover:text-white transition-colors duration-200">
                            ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className={`text-sm ${profit >= 0 ? 'text-[#00B57C]' : 'text-red-400'}`}>
                            {profit >= 0 ? '+' : ''}{profitPercentage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                          </p>
                          <p className="text-xs text-gray-500">
                            P/L: ${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className="flex mt-2 gap-2">
                        <button
                          onClick={() => sellAsset(asset.id, 1)}
                          disabled={availableQuantity < 1}
                          className={`bg-[#E71151] px-6 py-1 rounded text-sm transition-all duration-200 ${
                            availableQuantity < 1 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:shadow-[0_0_15px_rgba(231,17,81,0.3)] hover:bg-[#FF1259]'
                          }`}
                        >
                          Sell 1
                        </button>
                        <button
                          onClick={() => sellAsset(asset.id, availableQuantity)}
                          disabled={availableQuantity === 0}
                          className={`bg-[#E71151] px-6 py-1 rounded text-sm transition-all duration-200 ${
                            availableQuantity === 0 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:shadow-[0_0_15px_rgba(231,17,81,0.3)] hover:bg-[#FF1259]'
                          }`}
                        >
                          Sell Max
                        </button>
                        {hasOrdersFeature && (
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setOrderType('sell');
                              setShowOrderModal(true);
                            }}
                            disabled={availableQuantity === 0}
                            className={`bg-[#1C1C1C] px-4 py-1 rounded text-sm transition-colors ${
                              availableQuantity === 0 
                                ? 'opacity-50 cursor-not-allowed text-gray-400' 
                                : 'hover:bg-[#242424] text-[#E71151]'
                            }`}
                          >
                            Sell Order
                          </button>
                        )}
                      </div>
                    </div>
                  </MotionDiv>
                );
              })}
            </div>
          </MotionSection>
        </div>
      </main>

      {/* Add the OrderModal */}
      {selectedAsset && (
        <OrderModal
          isOpen={showOrderModal}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedAsset(null);
          }}
          asset={selectedAsset}
          type={orderType}
        />
      )}

      <ActiveOrdersModal
        isOpen={showActiveOrdersModal}
        onClose={() => setShowActiveOrdersModal(false)}
      />

      {selectedAnalyticsAsset && (
        <AdvancedAnalyticsModal
          isOpen={showAnalyticsModal}
          onClose={() => {
            setShowAnalyticsModal(false);
            setSelectedAnalyticsAsset(null);
          }}
          asset={selectedAnalyticsAsset}
        />
      )}
    </>
  );
}
