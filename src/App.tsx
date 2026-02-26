/**
 * 朕到底是谁 - 主应用组件
 * Phase 3: 核心对话界面实现
 */

import { useEffect, useState } from 'react';
import { useGameStore } from '@stores/gameStore';
import { scenarios } from '@config/scenarios';
import { ScenarioSelect } from '@components/game/ScenarioSelect';
import { DialogueContainer } from '@components/game/DialogueContainer';
import { PlayerInput } from '@components/game/PlayerInput';
import type { ChatMessage } from '@types/game';

function App() {
  const {
    status,
    stats,
    currentScenario,
    chatHistory,
    isLoading,
    currentTurn,
    maxTurns,
    startGame,
    resetGame,
    setScenario,
    addMessage,
    setLoading,
    updateStats,
    nextTurn,
  } = useGameStore();

  // 当前选中的剧本ID
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  // 处理加载状态：当状态为 loading 时，自动加载剧本
  useEffect(() => {
    if (status === 'loading' && selectedScenarioId) {
      const scenario = scenarios.find((s) => s.id === selectedScenarioId);
      if (scenario) {
        setScenario(scenario);

        // 添加开场系统消息
        const openingMessage: ChatMessage = {
          id: `system_${Date.now()}`,
          role: 'system',
          content: `${scenario.emperor.dynange}，${scenario.setting.time}。${scenario.setting.atmosphere}`,
          timestamp: Date.now(),
          type: 'narration',
        };

        const firstNPC = scenario.npcs[0];
        if (firstNPC) {
          const introMessage: ChatMessage = {
            id: `npc_${Date.now()}`,
            role: 'assistant',
            content: firstNPC.introduction || '陛下，臣有要事禀报。',
            timestamp: Date.now(),
            type: 'dialogue',
            npcId: firstNPC.id,
            npcName: firstNPC.name,
          };

          // 延迟添加消息，让场景先加载
          setTimeout(() => {
            addMessage(openingMessage);
            setTimeout(() => {
              addMessage(introMessage);
            }, 800);
          }, 500);
        }
      }
    }
  }, [status, selectedScenarioId, setScenario, addMessage]);

  // 处理选择剧本
  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    startGame(scenarioId);
  };

  // 处理发送消息
  const handleSendMessage = async (content: string) => {
    if (!currentScenario || isLoading) return;

    // 添加玩家消息
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
      type: 'dialogue',
    };

    addMessage(userMessage);
    setLoading(true);

    // 模拟API调用（实际项目中这里会调用LLM服务）
    setTimeout(() => {
      // 模拟NPC回复
      const responses = [
        '陛下圣明，臣谨遵旨意。',
        '此事关系重大，还请陛下三思。',
        '臣以为，当下之急在于稳固朝纲。',
        '陛下所言极是，臣这就去办。',
        '此事牵涉甚广，臣不敢妄言。',
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      // 随机更新数值
      const authorityDelta = Math.floor(Math.random() * 10) - 5;
      const suspicionDelta = Math.floor(Math.random() * 6);

      updateStats({
        authority: authorityDelta,
        suspicion: suspicionDelta,
      });

      nextTurn();

      const npcMessage: ChatMessage = {
        id: `npc_${Date.now()}`,
        role: 'assistant',
        content: randomResponse,
        timestamp: Date.now(),
        type: 'dialogue',
        npcId: currentScenario.npcs[0]?.id,
        npcName: currentScenario.npcs[0]?.name,
      };

      addMessage(npcMessage);
      setLoading(false);
    }, 1500);
  };

  // 渲染主菜单
  const renderStartMenu = () => (
    <div className="start-menu">
      <div className="title-section">
        <h1 className="game-title">
          <span className="title-icon">🏛️</span>
          朕到底是谁
        </h1>
        <p className="game-subtitle">历史生存推理文字游戏 | 你的选择将决定命运</p>
      </div>

      <div className="menu-buttons">
        <button className="btn-primary" onClick={() => {}}>
          <span className="btn-icon">👑</span>
          登基为帝
        </button>

        <div className="secondary-buttons">
          <button className="btn-secondary" onClick={() => {}}>
            <span className="btn-icon">📊</span>
            游戏统计
          </button>
          <button className="btn-secondary" onClick={() => {}}>
            <span className="btn-icon">⚙️</span>
            设置
          </button>
        </div>
      </div>

      <footer className="game-footer">
        <p>版本 1.0.0 | 制作：AI Game Studio</p>
      </footer>
    </div>
  );

  // 渲染剧本选择
  const renderScenarioSelect = () => (
    <ScenarioSelect scenarios={scenarios} onSelect={handleSelectScenario} />
  );

  // 渲染加载中
  const renderLoading = () => (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p className="loading-text">正在进入朝堂...</p>
        {currentScenario && (
          <div className="loading-scenario">
            <p className="dynasty-name">{currentScenario.emperor.dynasty}</p>
            <p className="emperor-name">{currentScenario.emperor.name}</p>
          </div>
        )}
      </div>
    </div>
  );

  // 渲染游戏中
  const renderPlaying = () => {
    if (!currentScenario) return null;

    return (
      <div className="game-screen">
        {/* 顶部标题栏 */}
        <header className="game-header">
          <button className="back-btn" onClick={resetGame}>
            ← 返回
          </button>
          <div className="header-title">
            <h2>{currentScenario.emperor.dynasty}</h2>
            <p>{currentScenario.setting.time}</p>
          </div>
          <div className="turn-info">
            <span className="turn-label">回合</span>
            <span className="turn-value">{currentTurn}/{maxTurns}</span>
          </div>
        </header>

        {/* 数值条 */}
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-icon">🏺</span>
            <div className="stat-info">
              <span className="stat-label">威势值</span>
              <span className="stat-value">{stats.authority}</span>
            </div>
            <div className="stat-bar">
              <div
                className="stat-fill authority-fill"
                style={{ width: `${stats.authority}%` }}
              ></div>
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-icon">🐉</span>
            <div className="stat-info">
              <span className="stat-label">暴露度</span>
              <span className="stat-value">{stats.suspicion}</span>
            </div>
            <div className="stat-bar">
              <div
                className="stat-fill suspicion-fill"
                style={{ width: `${stats.suspicion}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 对话区域 */}
        <DialogueContainer
          messages={chatHistory}
          currentScenario={currentScenario}
          isLoading={isLoading}
        />

        {/* 输入区域 */}
        <PlayerInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          placeholder="朕意如何..."
          maxLength={500}
        />
      </div>
    );
  };

  // 主渲染
  return (
    <div className="game-app">
      {status === 'start_menu' && renderScenarioSelect()}
      {status === 'loading' && renderLoading()}
      {status === 'playing' && renderPlaying()}
    </div>
  );
}

export default App;
