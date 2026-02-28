/**
 * 结局卡片组件
 * 展示单个结局的可视化效果
 */

import { motion } from 'framer-motion';
import type { EndingType } from '@services/llm/types';

interface EndingCardProps {
  type: EndingType;
  title: string;
  summary: string;
  className?: string;
}

// 结局类型配置
const endingConfig: Record<EndingType, {
  label: string;
  theme: 'gold' | 'red' | 'purple' | 'gray' | 'crimson' | 'blue';
  icon: string;
  gradient: string;
  borderColor: string;
  shadowColor: string;
}> = {
  win_parallel: {
    label: '完美结局',
    theme: 'gold',
    icon: '👑',
    gradient: 'from-amber-500 via-yellow-400 to-amber-600',
    borderColor: 'border-amber-400',
    shadowColor: 'shadow-amber-500/50',
  },
  win_escape: {
    label: '逃亡结局',
    theme: 'blue',
    icon: '🕊️',
    gradient: 'from-sky-500 via-blue-400 to-indigo-500',
    borderColor: 'border-blue-400',
    shadowColor: 'shadow-blue-500/50',
  },
  win_surrender: {
    label: '投降结局',
    theme: 'gold',
    icon: '🏳️',
    gradient: 'from-amber-400 via-yellow-300 to-amber-500',
    borderColor: 'border-amber-300',
    shadowColor: 'shadow-amber-400/50',
  },
  lose_coup: {
    label: '政变结局',
    theme: 'red',
    icon: '⚔️',
    gradient: 'from-red-600 via-red-500 to-rose-600',
    borderColor: 'border-red-500',
    shadowColor: 'shadow-red-600/50',
  },
  lose_imposter: {
    label: '穿帮结局',
    theme: 'purple',
    icon: '🎭',
    gradient: 'from-purple-600 via-fuchsia-500 to-purple-700',
    borderColor: 'border-purple-500',
    shadowColor: 'shadow-purple-600/50',
  },
  lose_assassinated: {
    label: '刺杀结局',
    theme: 'crimson',
    icon: '🗡️',
    gradient: 'from-red-800 via-red-600 to-rose-700',
    borderColor: 'border-red-700',
    shadowColor: 'shadow-red-800/50',
  },
  lose_timeout: {
    label: '超时结局',
    theme: 'gray',
    icon: '⏳',
    gradient: 'from-gray-500 via-gray-400 to-slate-500',
    borderColor: 'border-gray-400',
    shadowColor: 'shadow-gray-500/50',
  },
  lose_suicide: {
    label: '自裁结局',
    theme: 'crimson',
    icon: '💀',
    gradient: 'from-red-900 via-red-700 to-rose-800',
    borderColor: 'border-red-800',
    shadowColor: 'shadow-red-900/50',
  },
  lose_exposed: {
    label: '暴露结局',
    theme: 'purple',
    icon: '👁️',
    gradient: 'from-violet-600 via-purple-500 to-fuchsia-600',
    borderColor: 'border-violet-500',
    shadowColor: 'shadow-violet-600/50',
  },
  neutral_escape: {
    label: '逃离结局',
    theme: 'blue',
    icon: '🌊',
    gradient: 'from-cyan-500 via-blue-400 to-teal-500',
    borderColor: 'border-cyan-400',
    shadowColor: 'shadow-cyan-500/50',
  },
  win_correct_answer: {
    label: '真相大白',
    theme: 'gold',
    icon: '✨',
    gradient: 'from-amber-500 via-yellow-400 to-amber-600',
    borderColor: 'border-amber-400',
    shadowColor: 'shadow-amber-500/50',
  },
  lose_wrong_answer: {
    label: '身份迷失',
    theme: 'purple',
    icon: '🌑',
    gradient: 'from-purple-600 via-fuchsia-500 to-purple-700',
    borderColor: 'border-purple-500',
    shadowColor: 'shadow-purple-600/50',
  },
};

export function EndingCard({ type, title, summary, className = '' }: EndingCardProps) {
  const config = endingConfig[type];

  // 安全检查：如果配置不存在，使用默认配置
  if (!config) {
    console.error(`Unknown ending type: ${type}`);
    return (
      <div className={`p-8 bg-slate-800 rounded-2xl border border-slate-600 ${className}`}>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="mt-4 text-slate-300">{summary}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`
        relative overflow-hidden rounded-2xl border-2 ${config.borderColor} ${config.shadowColor} shadow-2xl
        bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
        ${className}
      `}
    >
      {/* 背景光效 */}
      <div className={`
        absolute inset-0 opacity-30 bg-gradient-to-br ${config.gradient}
        blur-3xl
      `} />

      {/* 粒子效果 */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 rounded-full bg-gradient-to-r ${config.gradient}`}
            initial={{
              x: Math.random() * 100 + '%',
              y: '100%',
              opacity: 0,
            }}
            animate={{
              y: '-100%',
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* 内容区域 */}
      <div className="relative z-10 p-8">
        {/* 结局类型标签 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`
            inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium
            bg-gradient-to-r ${config.gradient} text-white shadow-lg
          `}
        >
          <span>{config.icon}</span>
          <span>「{config.label}」</span>
        </motion.div>

        {/* 结局标题 */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-4xl font-bold text-white tracking-wide"
        >
          {title}
        </motion.h2>

        {/* 分隔线 */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className={`
            mt-6 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent
          `}
        />

        {/* 结局总结 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 text-lg text-slate-300 leading-relaxed"
        >
          {summary}
        </motion.p>
      </div>
    </motion.div>
  );
}
