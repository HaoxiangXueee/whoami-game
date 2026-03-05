/**
 * 结局展示页面组件
 * 在游戏结束时向玩家展示不同的结局内容
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { EndingCard } from './EndingCard';
import type { EndingType } from '@/types/game';
import type { GameStats } from '@/types/game';

interface EndingScreenProps {
  type: EndingType;
  title: string;
  summary: string;
  epilogue?: string;
  initialStats: GameStats;
  finalStats: GameStats;
  currentTurn: number;
  maxTurns: number;
  onRestart: () => void;
  onReturnToMenu: () => void;
}

// 数字计数动画组件
function AnimatedNumber({ value, duration = 1.5, delay = 0 }: { value: number; duration?: number; delay?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(value * easeOut));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [value, duration, delay]);

  return <span>{displayValue}</span>;
}

// 背景粒子效果
function ParticleBackground({ type }: { type: EndingType }) {
  const isWin = type.startsWith('win');
  const particleCount = isWin ? 30 : 20;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(particleCount)].map((_, i) => {
        const size = Math.random() * 4 + 2;
        const duration = Math.random() * 10 + 10;
        const delay = Math.random() * 5;

        return (
          <motion.div
            key={i}
            className={`absolute rounded-full ${
              isWin ? 'bg-yellow-300/30' : 'bg-white/10'
            }`}
            style={{
              width: size,
              height: size,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}

// 主组件
export function EndingScreen({
  type,
  title,
  summary,
  epilogue,
  initialStats,
  finalStats,
  currentTurn,
  maxTurns,
  onRestart,
  onReturnToMenu,
}: EndingScreenProps) {
  const [showStats, setShowStats] = useState(false);
  const [showEpilogue, setShowEpilogue] = useState(false);
  const controls = useAnimation();


  useEffect(() => {
    const sequence = async () => {
      await controls.start('visible');
      setTimeout(() => setShowStats(true), 1500);
      if (epilogue) {
        setTimeout(() => setShowEpilogue(true), 2500);
      }
    };
    sequence();
  }, [controls, epilogue]);

  // 计算数值变化
  const authorityChange = finalStats.authority - initialStats.authority;
  const suspicionChange = finalStats.suspicion - initialStats.suspicion;
  const turnsUsed = currentTurn;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-2 sm:p-4">
      {/* 背景粒子 */}
      <ParticleBackground type={type} />

      {/* 主要内容 */}
      <motion.div
        initial="hidden"
        animate={controls}
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: {
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            },
          },
        }}
        className="relative w-full max-w-4xl z-10 px-2 sm:px-4"
      >
        {/* 结局卡片 */}
        <EndingCard
          type={type}
          title={title}
          summary={summary}
          className="mb-6"
        />

        {/* 统计数据 */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 p-6 mb-6"
            >
              <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <span>📊</span>
                <span>本局数据</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {/* 威势值变化 */}
                <div className="bg-slate-700/50 rounded-lg p-3 sm:p-4">
                  <div className="text-slate-400 text-xs sm:text-sm mb-1">威势值</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-white">
                      <AnimatedNumber value={finalStats.authority} delay={0.2} />
                    </span>
                    <span className={`text-xs sm:text-sm ${authorityChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {authorityChange >= 0 ? '+' : ''}{authorityChange}
                    </span>
                  </div>
                  <div className="mt-1 sm:mt-2 text-xs text-slate-500">
                    初始: {initialStats.authority}
                  </div>
                </div>

                {/* 暴露度变化 */}
                <div className="bg-slate-700/50 rounded-lg p-3 sm:p-4">
                  <div className="text-slate-400 text-xs sm:text-sm mb-1">暴露度</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-white">
                      <AnimatedNumber value={finalStats.suspicion} delay={0.4} />
                    </span>
                    <span className={`text-xs sm:text-sm ${suspicionChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {suspicionChange > 0 ? '+' : ''}{suspicionChange}
                    </span>
                  </div>
                  <div className="mt-1 sm:mt-2 text-xs text-slate-500">
                    初始: {initialStats.suspicion}
                  </div>
                </div>

                {/* 回合使用情况 */}
                <div className="bg-slate-700/50 rounded-lg p-3 sm:p-4">
                  <div className="text-slate-400 text-xs sm:text-sm mb-1">使用回合</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-white">
                      <AnimatedNumber value={turnsUsed} delay={0.6} />
                    </span>
                    <span className="text-xs sm:text-sm text-slate-400">/ {maxTurns}</span>
                  </div>
                  <div className="mt-1 sm:mt-2 w-full bg-slate-600 rounded-full h-1.5">
                    <motion.div
                      className="bg-gradient-to-r from-blue-400 to-cyan-400 h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(turnsUsed / maxTurns) * 100}%` }}
                      transition={{ duration: 1, delay: 0.8 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 尾声 */}
        {epilogue && (
          <AnimatePresence>
            {showEpilogue && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-6"
              >
                <h3 className="text-xs sm:text-sm font-medium text-slate-400 mb-2 sm:mb-3 uppercase tracking-wider">
                  尾声
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed italic">
                  {epilogue}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* 操作按钮 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRestart}
            className="group relative px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 rounded-xl font-bold text-white shadow-lg shadow-amber-600/30 transition-all duration-300"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">🔄</span>
              <span>再来一局</span>
            </span>
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReturnToMenu}
            className="group px-8 py-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 rounded-xl font-semibold text-slate-200 transition-all duration-300"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-xl">🏠</span>
              <span>返回主菜单</span>
            </span>
          </motion.button>
        </motion.div>

        {/* 底部装饰 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="mt-8 sm:mt-12 text-center"
        >
          <p className="text-slate-500 text-xs sm:text-sm px-4">
            每一次选择，都将改变历史的走向
          </p>
          <div className="mt-2 flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-slate-600"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default EndingScreen;
