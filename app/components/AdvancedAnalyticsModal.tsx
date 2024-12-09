import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useEffect, useState } from 'react';
import { Asset } from '../types/game';
import { Line } from 'react-chartjs-2';
import { PRICE_UPDATE_INTERVAL } from '../data/initialGameData';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MotionDiv = motion.div as React.ComponentType<React.HTMLAttributes<HTMLDivElement> & { 
  initial?: any;
  animate?: any;
  exit?: any;
}>;

interface AdvancedAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
}

export default function AdvancedAnalyticsModal({ isOpen, onClose, asset }: AdvancedAnalyticsModalProps) {
  // Add a force update counter
  const [updateCounter, setUpdateCounter] = useState(0);

  // Set up the update interval
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setUpdateCounter(prev => prev + 1);
    }, PRICE_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Calculate analytics metrics - now depends on updateCounter
  const metrics = useMemo(() => {
    const priceHistory = asset.priceHistory || [];
    if (priceHistory.length < 2) return null;

    // Only use last hour of data
    const oneHourAgo = Date.now() - 3600000;
    const recentHistory = priceHistory
      .filter(p => p.timestamp >= oneHourAgo)
      .sort((a, b) => a.timestamp - b.timestamp); // Sort by time ascending

    // If we don't have an hour of data, we'll use what we have
    const timeSpanMinutes = (recentHistory.length > 0)
      ? Math.round((recentHistory[recentHistory.length - 1].timestamp - recentHistory[0].timestamp) / 60000)
      : 0;

    // Calculate volatility (standard deviation of price changes)
    const priceChanges = recentHistory.slice(0, -1).map((p, i) => {
      const change = ((recentHistory[i + 1].price - p.price) / p.price) * 100;
      return change;
    });
    
    const avgChange = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
    const volatility = Math.sqrt(
      priceChanges.reduce((a, b) => a + Math.pow(b - avgChange, 2), 0) / priceChanges.length
    );

    // Calculate momentum (rate of price change)
    const momentum = recentHistory.length > 1
      ? ((recentHistory[recentHistory.length - 1].price - recentHistory[0].price) / 
         recentHistory[0].price) * 100
      : 0;

    // Calculate support/resistance levels
    const prices = recentHistory.map(h => h.price);
    const support = Math.min(...prices);
    const resistance = Math.max(...prices);

    // Format time labels
    const formatTimeLabel = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return {
      volatility: volatility.toFixed(2),
      momentum: momentum.toFixed(2),
      support: support.toFixed(2),
      resistance: resistance.toFixed(2),
      timeSpanMinutes,
      priceData: {
        labels: recentHistory.map(p => formatTimeLabel(p.timestamp)),
        datasets: [{
          label: 'Price',
          data: recentHistory.map(p => p.price),
          borderColor: '#00B57C',
          backgroundColor: 'rgba(0, 181, 124, 0.1)',
          tension: 0.4,
          fill: true,
        }],
      },
    };
  }, [asset.priceHistory, asset.currentPrice, updateCounter]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (tooltipItems: any) => {
            return `Time: ${tooltipItems[0].label}`;
          },
          label: (context: any) => {
            return `Price: $${context.raw.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#666',
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#666',
          callback: (value: number) => `$${value.toFixed(2)}`,
        },
      },
    },
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
            className="relative bg-[#161616] p-6 rounded-lg w-full max-w-2xl shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">{asset.name}</h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-400">
                    {asset.symbol} • Last {metrics?.timeSpanMinutes || 0} minutes
                  </p>
                  <span className="text-sm px-2 py-0.5 rounded bg-[#1C1C1C]">
                    <span className="text-gray-400">Current Price: </span>
                    <span className="font-bold text-white">
                      ${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </span>
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

            {metrics ? (
              <>
                {/* Price Chart */}
                <div className="h-64 mb-6">
                  <Line data={metrics.priceData} options={chartOptions as any} />
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#1C1C1C] p-4 rounded-lg">
                    <h3 className="text-sm text-gray-400 mb-1">Volatility</h3>
                    <p className="text-xl font-bold">{metrics.volatility}%</p>
                  </div>
                  <div className="bg-[#1C1C1C] p-4 rounded-lg">
                    <h3 className="text-sm text-gray-400 mb-1">Momentum</h3>
                    <p className={`text-xl font-bold ${
                      Number(metrics.momentum) >= 0 ? 'text-[#00B57C]' : 'text-[#E71151]'
                    }`}>
                      {metrics.momentum}%
                    </p>
                  </div>
                  <div className="bg-[#1C1C1C] p-4 rounded-lg">
                    <h3 className="text-sm text-gray-400 mb-1">Support Level</h3>
                    <p className="text-xl font-bold">${metrics.support}</p>
                  </div>
                  <div className="bg-[#1C1C1C] p-4 rounded-lg">
                    <h3 className="text-sm text-gray-400 mb-1">Resistance Level</h3>
                    <p className="text-xl font-bold">${metrics.resistance}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400 py-8">
                Not enough price data available
              </div>
            )}
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
} 