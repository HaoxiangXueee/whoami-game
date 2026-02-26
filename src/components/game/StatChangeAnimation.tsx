/**
 * 数值变化动画组件
 * 当威势值或暴露度变化时显示浮动动画
 */

import { useEffect, useState } from 'react';

interface StatChangeAnimationProps {
  value: number;
  type: 'authority' | 'suspicion';
  className?: string;
}

interface FloatingNumber {
  id: string;
  value: number;
  x: number;
  y: number;
}

export function StatChangeAnimation({
  value,
  type,
  className = '',
}: StatChangeAnimationProps) {
  const [prevValue, setPrevValue] = useState(value);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);

  useEffect(() => {
    const delta = value - prevValue;

    if (delta !== 0) {
      // 创建新的浮动数字
      const newFloatingNumber: FloatingNumber = {
        id: `${Date.now()}_${Math.random()}`,
        value: delta,
        x: Math.random() * 40 - 20, // -20 到 20 的随机偏移
        y: 0,
      };

      setFloatingNumbers((prev) => [...prev, newFloatingNumber]);

      // 3秒后移除
      setTimeout(() => {
        setFloatingNumbers((prev) =>
          prev.filter((item) => item.id !== newFloatingNumber.id)
        );
      }, 3000);
    }

    setPrevValue(value);
  }, [value, prevValue]);

  // 获取颜色样式
  const getColorClass = (value: number) => {
    if (type === 'authority') {
      return value >= 0 ? 'stat-change-positive' : 'stat-change-negative';
    } else {
      return value >= 0 ? 'stat-change-negative' : 'stat-change-positive';
    }
  };

  return (
    <div className={`stat-change-animation ${className}`}>
      {floatingNumbers.map((item) => (
        <div
          key={item.id}
          className={`floating-number ${getColorClass(item.value)}`}
          style={{
            transform: `translate(${item.x}px, ${item.y}px)`,
          }}
        >
          {item.value > 0 ? '+' : ''}
          {item.value}
        </div>
      ))}
    </div>
  );
}
