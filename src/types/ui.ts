/**
 * UI 相关类型定义
 */

import type { ReactNode } from 'react';

// 主题类型
export type Theme = 'dark' | 'light' | 'system';

// 颜色变体
export type ColorVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'ghost';

// 尺寸
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// 按钮 props
export interface ButtonProps {
  variant?: ColorVariant;
  size?: Size;
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

// 对话框 props
export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: Size;
}

// 卡片 props
export interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  className?: string;
  isHoverable?: boolean;
}

// 输入框 props
export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  type?: 'text' | 'password' | 'email' | 'number';
  autoFocus?: boolean;
  maxLength?: number;
}

// 进度条 props
export interface ProgressProps {
  value: number;
  max?: number;
  min?: number;
  variant?: ColorVariant;
  size?: 'sm' | 'md' | 'lg';
  isAnimated?: boolean;
  label?: string;
  showValue?: boolean;
  className?: string;
}

// 徽章 props
export interface BadgeProps {
  children: ReactNode;
  variant?: ColorVariant;
  size?: Size;
  isPill?: boolean;
  className?: string;
}

// 工具提示 props
export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

// 加载状态
export interface LoadingProps {
  size?: Size;
  color?: ColorVariant;
  text?: string;
  className?: string;
}

// 空状态
export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

// 错误边界状态
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// 错误边界状态
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// 动画变体
export interface AnimationVariants {
  hidden: Record<string, number | string | object>;
  visible: Record<string, number | string | object>;
  exit?: Record<string, number | string | object>;
}
