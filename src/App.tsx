import { useGameStore } from '@stores/gameStore';

function App() {
  const { status, stats, startGame, resetGame } = useGameStore();

  return (
    <div className="game-container">
      <div className="glass-card">
        <h1 className="text-gold">
          朕到底是谁
        </h1>
        <p>
          历史生存推理文字游戏
        </p>

        {status === 'start_menu' && (
          <div>
            <button
              onClick={() => startGame('scenario_1')}
              className="gold-border"
            >
              登基为帝
            </button>

            <div className="button-container">
              <button
                onClick={() => {}}
                className="secondary"
              >
                游戏统计
              </button>

              <button
                onClick={() => {}}
                className="secondary"
              >
                设置
              </button>
            </div>
          </div>
        )}

        {status === 'playing' && (
          <div>
            <div className="game-status">
              <div className="status-item">
                <div className="label">威势值</div>
                <div className="value text-gold">{stats.authority}</div>
              </div>
              <div className="status-item">
                <div className="label">暴露度</div>
                <div className="value" style={{ color: 'var(--color-accent-red)' }}>{stats.suspicion}</div>
              </div>
            </div>

            <div className="game-in-progress">
              游戏进行中... (演示模式)
            </div>

            <button
              onClick={resetGame}
              className="secondary"
            >
              返回主菜单
            </button>
          </div>
        )}

        <div className="footer">
          <p>版本 1.0.0 | 制作：AI Game Studio</p>
        </div>
      </div>
    </div>
  );
}

export default App;
