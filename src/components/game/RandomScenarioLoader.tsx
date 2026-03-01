/**
 * RandomScenarioLoader - 随机剧本加载器
 *
 * v2.0 核心组件：实现随机分配剧本，隐藏身份信息
 * - 使用 useScenarios hook 从 JSON 动态加载剧本
 * - 支持剧本缓存和预加载
 * - 替代原有的 ScenarioSelect 组件，确保玩家不知道自己是谁
 */

import { useEffect, useState, useCallback } from 'react';
import { useScenarios } from '@hooks/useScenarios';
import type { ScenarioConfig } from '@types/scenario';

/**
 * 组件 Props
 */
interface RandomScenarioLoaderProps {
  onComplete: (scenario: ScenarioConfig) => void;
}

/**
 * 加载步骤枚举
 */
type LoadingStep =
  | 'initializing'   // 初始化
  | 'connecting'     // 连接时空
  | 'transferring'   // 意识传输
  | 'synchronizing'  // 同步记忆
  | 'complete';      // 完成

const stepMessages: Record<LoadingStep, string> = {
  initializing: '正在初始化时空坐标...',
  connecting: '连接历史时空节点...',
  transferring: '传输意识至目标时空...',
  synchronizing: '同步环境感知数据...',
  complete: '穿越完成！',
};

const stepProgress: Record<LoadingStep, number> = {
  initializing: 10,
  connecting: 30,
  transferring: 60,
  synchronizing: 85,
  complete: 100,
};

export function RandomScenarioLoader({ onComplete }: RandomScenarioLoaderProps) {
  const [currentStep, setCurrentStep] = useState<LoadingStep>('initializing');
  const [displayText, setDisplayText] = useState('');
  const [showGlitch, setShowGlitch] = useState(false);

  // v2.0: 使用 useScenarios hook 从 JSON 动态加载剧本
  const {
    index,
    getRandomScenario,
    loadIndex,
    isLoadingIndex,
    error,
  } = useScenarios({
    enablePreload: true,
    preloadCount: 3,
  });

  /**
   * 初始化：加载剧本索引
   */
  useEffect(() => {
    if (!index && !isLoadingIndex && currentStep === 'initializing') {
      loadIndex().catch(console.error);
    }
  }, [index, isLoadingIndex, currentStep, loadIndex]);

  /**
   * 打字机效果
   */
  useEffect(() => {
    const text = stepMessages[currentStep];
    let index = 0;
    setDisplayText('');

    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [currentStep]);

  /**
   * 步骤推进逻辑
   */
  useEffect(() => {
    const stepOrder: LoadingStep[] = [
      'initializing',
      'connecting',
      'transferring',
      'synchronizing',
      'complete',
    ];

    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentStep === 'complete') {
      // v2.0: 使用 getRandomScenario 从 JSON 加载随机剧本
      const loadRandomScenario = async () => {
        try {
          const scenario = await getRandomScenario();
          if (scenario) {
            // 短暂延迟后通过回调传出选中的剧本
            setTimeout(() => {
              onComplete(scenario);
            }, 800);
          } else if (error) {
            // 加载失败时的回退逻辑
            console.error('[RandomScenarioLoader] 加载剧本失败:', error);
            // 可以在这里添加错误提示或重试逻辑
          }
        } catch (err) {
          console.error('[RandomScenarioLoader] 加载剧本异常:', err);
        }
      };

      loadRandomScenario();
      return;
    }

    // 推进到下一步
    const nextIndex = currentIndex + 1;
    const delay = 1200 + Math.random() * 600; // 1.2-1.8秒随机延迟

    const timer = setTimeout(() => {
      setCurrentStep(stepOrder[nextIndex] as LoadingStep);

      // 特定步骤触发 glitch 效果
      if (stepOrder[nextIndex] === 'transferring') {
        setShowGlitch(true);
        setTimeout(() => setShowGlitch(false), 300);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete, getRandomScenario, error]);

  const progress = stepProgress[currentStep];

  // 错误状态显示
  if (error && currentStep === 'complete') {
    return (
      <div className="random-scenario-loader">
        <div className="loader-container">
          <div className="loader-background">
            <div className="loader-noise"></div>
            <div className="loader-vignette"></div>
          </div>
          <div className="loader-content">
            <h1 className="loader-title text-red-400">
              <span className="title-icon">⚠️</span>
              时空连接失败
            </h1>
            <p className="text-slate-300 mt-4 mb-6">{error}</p>
            <button
              onClick={() => {
                clearError?.();
                loadIndex();
                setCurrentStep('initializing');
              }}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold transition-colors"
            >
              重试连接
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 初始加载状态
  if (isLoadingIndex && currentStep === 'initializing') {
    return (
      <div className="random-scenario-loader">
        <div className="loader-container">
          <div className="loader-background">
            <div className="loader-noise"></div>
            <div className="loader-vignette"></div>
          </div>
          <div className="loader-content">
            <h1 className="loader-title">
              <span className="title-icon">📡</span>
              连接时空网络...
            </h1>
            <div className="loader-progress-container mt-8">
              <div className="loader-progress-bar">
                <div className="loader-progress-fill animate-pulse" style={{ width: '50%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="random-scenario-loader">
      <div className={`loader-container ${showGlitch ? 'glitch' : ''}`}>
        {/* 背景效果 */}
        <div className="loader-background">
          <div className="loader-noise"></div>
          <div className="loader-vignette"></div>
        </div>

        {/* 主内容 */}
        <div className="loader-content">
          {/* 标题 */}
          <h1 className="loader-title">
            <span className="title-icon">⏳</span>
            正在穿越时空
          </h1>

          {/* 状态文本 */}
          <div className="loader-status">
            <p className="status-text">{displayText}</p>
            <span className="status-cursor">|</span>
          </div>

          {/* 进度条 */}
          <div className="loader-progress-container">
            <div className="loader-progress-bar">
              <div
                className="loader-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="loader-progress-text">{progress}%</span>
          </div>

          {/* 装饰元素 */}
          <div className="loader-decorations">
            <div className="decoration-ring ring-1"></div>
            <div className="decoration-ring ring-2"></div>
            <div className="decoration-ring ring-3"></div>
          </div>

          {/* 提示文本 */}
          <p className="loader-hint">
            当你醒来时，你将不知道自己是谁...
          </p>
        </div>
      </div>
    </div>
  );
}
