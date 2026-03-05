/**
 * RandomScenarioLoader - 随机剧本加载器
 *
 * v2.1 版本：使用 ScenarioLoader 加载 JSON 剧本
 * - 从 /scenarios 目录动态加载 JSON 剧本
 * - 支持 30 个历史剧本
 * - 保持穿越动画效果
 */

import { useEffect, useState, useCallback } from 'react';
import { scenarioLoader } from '@services/ScenarioLoader';
import type { ScenarioConfig } from '@/types/scenario';

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
  const [selectedScenario, setSelectedScenario] = useState<ScenarioConfig | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /**
   * 加载随机剧本
   */
  const loadRandomScenario = useCallback(async () => {
    try {
      console.log('[RandomScenarioLoader] 开始加载剧本索引...');
      const index = await scenarioLoader.loadIndex();

      if (index.scenarios.length === 0) {
        throw new Error('没有可用的剧本');
      }

      // 随机选择一个剧本
      const randomIndex = Math.floor(Math.random() * index.scenarios.length);
      const selected = index.scenarios[randomIndex];

      console.log(`[RandomScenarioLoader] 选中剧本: ${selected.name} (${selected.id})`);

      // 加载完整剧本
      const scenario = await scenarioLoader.loadScenario(selected.id);
      setSelectedScenario(scenario);

      console.log('[RandomScenarioLoader] 剧本加载完成');
    } catch (error) {
      console.error('[RandomScenarioLoader] 加载剧本失败:', error);
      const errorMessage = error instanceof Error ? error.message : '加载剧本失败';
      setLoadError(errorMessage);
    }
  }, []);

  /**
   * 开始加载流程
   */
  useEffect(() => {
    loadRandomScenario();
  }, [loadRandomScenario]);

  /**
   * 打字机效果
   */
  useEffect(() => {
    const text = loadError ? `加载失败: ${loadError}` : stepMessages[currentStep];
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
  }, [currentStep, loadError]);

  /**
   * 步骤推进逻辑
   */
  useEffect(() => {
    // 如果有错误，停止推进
    if (loadError) {
      return;
    }

    const stepOrder: LoadingStep[] = [
      'initializing',
      'connecting',
      'transferring',
      'synchronizing',
      'complete',
    ];

    const currentIndex = stepOrder.indexOf(currentStep);

    if (currentStep === 'complete') {
      if (selectedScenario) {
        // 短暂延迟后通过回调传出选中的剧本
        setTimeout(() => {
          onComplete(selectedScenario);
        }, 800);
      }
      return;
    }

    // 推进到下一步
    const nextIndex = currentIndex + 1;
    const delay = 1200 + Math.random() * 600; // 1.2-1.8秒随机延迟

    const timer = setTimeout(() => {
      // 只有在剧本加载完成后才能进入 complete 步骤
      if (stepOrder[nextIndex] === 'complete' && !selectedScenario) {
        // 剧本还没加载完，等待
        console.log('[RandomScenarioLoader] 等待剧本加载完成...');
        return;
      }

      setCurrentStep(stepOrder[nextIndex] as LoadingStep);

      // 特定步骤触发 glitch 效果
      if (stepOrder[nextIndex] === 'transferring') {
        setShowGlitch(true);
        setTimeout(() => setShowGlitch(false), 300);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete, selectedScenario, loadError]);

  // 监听剧本加载完成，如果步骤还没到 complete，等待
  useEffect(() => {
    if (selectedScenario && currentStep === 'synchronizing') {
      // 剧本已加载完成，可以推进到 complete
      console.log('[RandomScenarioLoader] 剧本已准备好，推进到完成步骤');
    }
  }, [selectedScenario, currentStep]);

  const progress = loadError ? 0 : stepProgress[currentStep];

  // 重试按钮
  const handleRetry = () => {
    setLoadError(null);
    setCurrentStep('initializing');
    setSelectedScenario(null);
    loadRandomScenario();
  };

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
            {!loadError && <span className="status-cursor">|</span>}
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

          {/* 重试按钮（出错时显示） */}
          {loadError && (
            <button
              onClick={handleRetry}
              className="mt-4 px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold transition-colors"
            >
              重试
            </button>
          )}

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
