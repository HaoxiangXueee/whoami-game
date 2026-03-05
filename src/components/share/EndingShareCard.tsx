/**
 * 结局分享卡片组件
 * 展示精美的结局卡片，用于分享和收藏
 */

import { motion } from 'framer-motion';
import type { EndingType } from '@/types/game';

interface EndingShareCardProps {
  endingType: EndingType;
  endingTitle: string;
  endingSummary: string;
  scenarioName: string;
  turnsUsed: number;
  maxTurns: number;
  className?: string;
}

// 结局类型配置
const endingConfig: Record<EndingType, {
  label: string;
  theme: 'gold' | 'red' | 'purple' | 'gray' | 'crimson' | 'blue';
  gradient: string;
  borderColor: string;
  shadowColor: string;
}> = {
  win_parallel: {
    label: '完美结局',
    theme: 'gold',
    gradient: 'from-amber-500 via-yellow-400 to-amber-600',
    borderColor: 'border-amber-400',
    shadowColor: 'shadow-amber-500/50',
  },
  win_escape: {
    label: '逃亡结局',
    theme: 'blue',
    gradient: 'from-sky-500 via-blue-400 to-indigo-500',
    borderColor: 'border-blue-400',
    shadowColor: 'shadow-blue-500/50',
  },
  win_surrender: {
    label: '投降结局',
    theme: 'gold',
    gradient: 'from-amber-400 via-yellow-300 to-amber-500',
    borderColor: 'border-amber-300',
    shadowColor: 'shadow-amber-400/50',
  },
  lose_coup: {
    label: '政变结局',
    theme: 'red',
    gradient: 'from-red-600 via-red-500 to-rose-600',
    borderColor: 'border-red-500',
    shadowColor: 'shadow-red-600/50',
  },
  lose_imposter: {
    label: '穿帮结局',
    theme: 'purple',
    gradient: 'from-purple-600 via-fuchsia-500 to-purple-700',
    borderColor: 'border-purple-500',
    shadowColor: 'shadow-purple-600/50',
  },
  lose_assassinated: {
    label: '刺杀结局',
    theme: 'crimson',
    gradient: 'from-red-800 via-red-600 to-rose-700',
    borderColor: 'border-red-700',
    shadowColor: 'shadow-red-800/50',
  },
  lose_timeout: {
    label: '超时结局',
    theme: 'gray',
    gradient: 'from-gray-500 via-gray-400 to-slate-500',
    borderColor: 'border-gray-400',
    shadowColor: 'shadow-gray-500/50',
  },
  lose_suicide: {
    label: '自裁结局',
    theme: 'crimson',
    gradient: 'from-red-900 via-red-700 to-rose-800',
    borderColor: 'border-red-800',
    shadowColor: 'shadow-red-900/50',
  },
  lose_exposed: {
    label: '暴露结局',
    theme: 'purple',
    gradient: 'from-violet-600 via-purple-500 to-fuchsia-600',
    borderColor: 'border-violet-500',
    shadowColor: 'shadow-violet-600/50',
  },
  neutral_escape: {
    label: '逃离结局',
    theme: 'blue',
    gradient: 'from-cyan-500 via-blue-400 to-teal-500',
    borderColor: 'border-cyan-400',
    shadowColor: 'shadow-cyan-500/50',
  },
  win_correct_answer: {
    label: '真相大白',
    theme: 'gold',
    gradient: 'from-amber-500 via-yellow-400 to-amber-600',
    borderColor: 'border-amber-400',
    shadowColor: 'shadow-amber-500/50',
  },
  lose_wrong_answer: {
    label: '身份迷失',
    theme: 'purple',
    gradient: 'from-purple-600 via-fuchsia-500 to-purple-700',
    borderColor: 'border-purple-500',
    shadowColor: 'shadow-purple-600/50',
  },
  lose_overthrown: {
    label: '推翻结局',
    theme: 'red',
    gradient: 'from-red-600 via-red-500 to-rose-600',
    borderColor: 'border-red-500',
    shadowColor: 'shadow-red-600/50',
  },
  special_hidden: {
    label: '隐藏结局',
    theme: 'purple',
    gradient: 'from-violet-600 via-purple-500 to-fuchsia-600',
    borderColor: 'border-violet-500',
    shadowColor: 'shadow-violet-600/50',
  },
};

// 祥云装饰组件
function CloudDecoration({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 30 Q10 30 10 20 Q10 10 25 10 Q30 0 45 5 Q60 0 70 10 Q85 10 85 20 Q85 30 75 30"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EndingShareCard({
  endingType,
  endingTitle,
  endingSummary,
  scenarioName,
  turnsUsed,
  maxTurns,
  className = '',
}: EndingShareCardProps) {
  const config = endingConfig[endingType];

  // 安全检查：如果配置不存在，使用默认配置
  if (!config) {
    console.error(`Unknown ending type: ${endingType}`);
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`
        relative overflow-hidden rounded-xl sm:rounded-2xl border-2 ${config.borderColor} ${config.shadowColor} shadow-2xl
        bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
        ${className}
      `}
    >
      {/* 背景光效 */}
      <div className={`
        absolute inset-0 opacity-20 bg-gradient-to-br ${config.gradient}
        blur-3xl
      `} />

      {/* 顶部祥云装饰 - 左侧 */}
      <div className={`absolute top-3 left-3 w-16 h-8 text-white/20`}>
        <CloudDecoration />
      </div>

      {/* 顶部祥云装饰 - 右侧（翻转） */}
      <div className={`absolute top-3 right-3 w-16 h-8 text-white/20 scale-x-[-1]`}>
        <CloudDecoration />
      </div>

      {/* 内容区域 */}
      <div className="relative z-10 p-5 sm:p-7">
        {/* 顶部品牌标识 */}
        <div className="text-center mb-4 sm:mb-5">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg sm:text-xl">🏛️</span>
            <span className="text-sm sm:text-base font-bold text-amber-400/80 tracking-widest">
              朕到底是谁
            </span>
            <span className="text-lg sm:text-xl">🏛️</span>
          </div>
        </div>

        {/* 分隔线 - 上 */}
        <div className={`
          h-px bg-gradient-to-r from-transparent via-white/30 to-transparent
          mb-4 sm:mb-5
        `} />

        {/* 结局类型标签 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-3 sm:mb-4"
        >
          <span className={`
            inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium
            bg-gradient-to-r ${config.gradient} text-white shadow-lg
          `}>
            <span>「{config.label}」</span>
          </span>
        </motion.div>

        {/* 结局标题 */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-3 sm:mt-4 text-xl sm:text-3xl font-bold text-center text-white tracking-wide"
          style={{
            background: `linear-gradient(135deg, #fff 0%, #d4b84a 50%, #fff 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {endingTitle}
        </motion.h2>

        {/* 分隔线 - 中 */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className={`
            mt-4 sm:mt-5 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent
          `}
        />

        {/* 结局总结 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 sm:mt-5 text-sm sm:text-base text-slate-300 leading-relaxed text-center"
        >
          {endingSummary}
        </motion.p>

        {/* 分隔线 - 下 */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className={`
            mt-5 sm:mt-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent
          `}
        />

        {/* 底部数据区域 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-4 sm:mt-5 flex flex-wrap justify-center gap-3 sm:gap-6 text-center"
        >
          {/* 剧本名称 */}
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 mb-1">剧本</span>
            <span className="text-sm sm:text-base font-medium text-amber-400/90">
              {scenarioName}
            </span>
          </div>

          {/* 竖线分隔 */}
          <div className="w-px bg-slate-600 hidden sm:block" />

          {/* 回合数 */}
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 mb-1">回合</span>
            <span className="text-sm sm:text-base font-medium text-white">
              {turnsUsed}/{maxTurns}
            </span>
          </div>
        </motion.div>

        {/* 底部祥云装饰 - 左侧 */}
        <div className={`absolute bottom-3 left-3 w-12 h-6 text-white/10`}>
          <CloudDecoration />
        </div>

        {/* 底部祥云装饰 - 右侧（翻转） */}
        <div className={`absolute bottom-3 right-3 w-12 h-6 text-white/10 scale-x-[-1]`}>
          <CloudDecoration />
        </div>
      </div>
    </motion.div>
  );
}

export default EndingShareCard;
