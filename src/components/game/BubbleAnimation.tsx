/**
 * 对话气泡动画组件
 * 为NPC和玩家对话气泡添加出现动画
 */

import { useEffect, useRef, useState } from 'react';

interface BubbleAnimationProps {
  children: React.ReactNode;
  type: 'npc' | 'player' | 'system';
  delay?: number;
  className?: string;
}

export function BubbleAnimation({
  children,
  type,
  delay = 0,
  className = '',
}: BubbleAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 延迟显示动画
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  // 根据类型获取动画类名
  const getAnimationClass = () => {
    switch (type) {
      case 'npc':
        return 'bubble-npc-appear';
      case 'player':
        return 'bubble-player-appear';
      case 'system':
        return 'bubble-system-appear';
      default:
        return 'bubble-npc-appear';
    }
  };

  return (
    <div
      ref={bubbleRef}
      className={`bubble-animation ${className} ${
        isVisible ? getAnimationClass() : 'bubble-hidden'
      }`}
    >
      {children}
    </div>
  );
}

/**
 * 打字机效果组件
 * 为文本添加逐字出现的打字机效果
 */
interface TypewriterEffectProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

export function TypewriterEffect({
  text,
  speed = 30,
  delay = 0,
  className = '',
  onComplete,
}: TypewriterEffectProps) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    // 延迟开始
    const startTimer = setTimeout(() => {
      // 打字机效果
      const typeInterval = setInterval(() => {
        if (indexRef.current < text.length) {
          setDisplayText(text.slice(0, indexRef.current + 1));
          indexRef.current += 1;
        } else {
          clearInterval(typeInterval);
          setIsComplete(true);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(typeInterval);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [text, speed, delay, onComplete]);

  return (
    <span className={`typewriter-effect ${className}`}>
      {displayText}
      {!isComplete && <span className="typewriter-cursor">|</span>}
    </span>
  );
}

/**
 * 脉冲动画组件
 * 为重要元素添加脉冲效果，吸引用户注意
 */
interface PulseAnimationProps {
  children: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
  duration?: number;
  className?: string;
}

export function PulseAnimation({
  children,
  intensity = 'medium',
  duration = 2000,
  className = '',
}: PulseAnimationProps) {
  const getIntensityClass = () => {
    switch (intensity) {
      case 'low':
        return 'pulse-low';
      case 'high':
        return 'pulse-high';
      default:
        return 'pulse-medium';
    }
  };

  return (
    <div
      className={`pulse-animation ${getIntensityClass()} ${className}`}
      style={{ animationDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * 震动动画组件
 * 用于警告或重要提示时的震动效果
 */
interface ShakeAnimationProps {
  children: React.ReactNode;
  trigger?: boolean;
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

export function ShakeAnimation({
  children,
  trigger = false,
  intensity = 'medium',
  className = '',
}: ShakeAnimationProps) {
  const getIntensityClass = () => {
    switch (intensity) {
      case 'low':
        return 'shake-low';
      case 'high':
        return 'shake-high';
      default:
        return 'shake-medium';
    }
  };

  return (
    <div
      className={`shake-animation ${trigger ? getIntensityClass() : ''} ${className}`}
    >
      {children}
    </div>
  );
}
