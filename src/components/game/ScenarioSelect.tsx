/**
 * 剧本选择页面组件
 * 显示所有可用剧本卡片，供玩家选择
 */

import type { ScenarioConfig } from '@types/game';

interface ScenarioSelectProps {
  scenarios: ScenarioConfig[];
  onSelect: (scenarioId: string) => void;
}

/**
 * 获取难度标签样式
 */
function getDifficultyClass(difficulty: string): string {
  switch (difficulty) {
    case 'hard':
      return 'difficulty-hard';
    case 'medium':
      return 'difficulty-medium';
    case 'easy':
      return 'difficulty-easy';
    default:
      return 'difficulty-medium';
  }
}

/**
 * 获取难度显示文本
 */
function getDifficultyText(difficulty: string): string {
  switch (difficulty) {
    case 'hard':
      return '地狱级';
    case 'medium':
      return '中等难度';
    case 'easy':
      return '入门难度';
    default:
      return '中等难度';
  }
}

export function ScenarioSelect({ scenarios, onSelect }: ScenarioSelectProps) {
  return (
    <div className="scenario-select">
      <h2 className="scenario-select-title">选择你的命运</h2>
      <p className="scenario-select-subtitle">每一个时代都有属于它的传奇</p>

      <div className="scenario-grid">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="scenario-card"
            onClick={() => onSelect(scenario.id)}
          >
            <div className="scenario-card-header">
              <span className={`difficulty-badge ${getDifficultyClass(scenario.difficulty)}`}>
                {getDifficultyText(scenario.difficulty)}
              </span>
            </div>

            <div className="scenario-card-content">
              <h3 className="emperor-name">{scenario.emperor.name}</h3>
              <p className="emperor-title">{scenario.emperor.dynasty} · {scenario.emperor.title}</p>

              <div className="scenario-setting">
                <p className="setting-time">{scenario.setting.time}</p>
                <p className="setting-location">{scenario.setting.location}</p>
              </div>

              <p className="scenario-atmosphere">{scenario.setting.atmosphere}</p>
            </div>

            <div className="scenario-card-footer">
              <span className="turns-info">{scenario.maxTurns} 回合</span>
              <button className="enter-button">进入朝堂</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
