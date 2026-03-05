import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameState, GameStats, ScenarioConfig, ChatMessage, EndingInfo, AnswerState } from '@/types/game';

const initialStats: GameStats = {
  authority: 50,
  suspicion: 0,
};

const initialAnswerState: AnswerState = {
  emperorGuess: '',
  dynastyGuess: '',
  emperorAttempts: 0,
  dynastyAttempts: 0,
  emperorCorrect: null,
  dynastyCorrect: null,
  isSubmitting: false,
};

const initialState: GameState = {
  status: 'start_menu',
  currentScenario: null,
  stats: initialStats,
  chatHistory: [],
  currentTurn: 0,
  maxTurns: 10,
  ending: null,
  isLoading: false,
  error: null,
  answerState: initialAnswerState,
  isAnsweringQuestions: false,
};

interface GameStore extends GameState {
  // Actions
  startGame: (scenarioId: string) => void;
  setScenario: (scenario: ScenarioConfig) => void;
  resetGame: () => void;
  sendMessage: (content: string) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  clearHistory: () => void;
  updateStats: (delta: Partial<GameStats>) => void;
  setStats: (stats: GameStats) => void;
  nextTurn: () => void;
  setMaxTurns: (turns: number) => void;
  setEnding: (ending: EndingInfo | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  // 答案相关方法
  submitAnswer: (type: 'emperor' | 'dynasty', answer: string) => void;
  setAnsweringQuestions: (isAnswering: boolean) => void;
  resetAnswerState: () => void;
  incrementAnswerAttempt: (type: 'emperor' | 'dynasty') => void;
  setAnswerCorrect: (type: 'emperor' | 'dynasty', isCorrect: boolean) => void;
}

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    ...initialState,

    startGame: (scenarioId: string) => {
      set((state) => {
        state.status = 'loading';
        state.currentTurn = 0;
        state.chatHistory = [];
        state.ending = null;
        state.error = null;
      });
      console.log(`Starting game with scenario: ${scenarioId}`);
    },

    setScenario: (scenario: ScenarioConfig) => {
      set((state) => {
        state.currentScenario = scenario;
        state.stats = { ...scenario.initialStats };
        state.maxTurns = scenario.maxTurns;
        state.status = 'playing';
      });
    },

    resetGame: () => {
      set(() => initialState);
    },

    sendMessage: async (content: string) => {
      const { currentScenario, currentTurn, maxTurns } = get();

      if (!currentScenario || currentTurn >= maxTurns) {
        return;
      }

      // Add user message
      set((state) => {
        state.chatHistory.push({
          id: `msg_${Date.now()}`,
          role: 'user',
          content,
          timestamp: Date.now(),
          type: 'dialogue',
        });
        state.isLoading = true;
      });

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        set((state) => {
          state.chatHistory.push({
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: '这是NPC的回复...',
            npcId: 'npc_1',
            npcName: '王承恩',
            timestamp: Date.now(),
            type: 'dialogue',
          });
          state.isLoading = false;
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Unknown error';
          state.isLoading = false;
        });
      }
    },

    addMessage: (message: ChatMessage) => {
      set((state) => {
        state.chatHistory.push(message);
      });
    },

    clearHistory: () => {
      set((state) => {
        state.chatHistory = [];
      });
    },

    updateStats: (delta: Partial<GameStats>) => {
      set((state) => {
        state.stats.authority = Math.max(
          0,
          Math.min(100, state.stats.authority + (delta.authority || 0))
        );
        state.stats.suspicion = Math.max(
          0,
          Math.min(100, state.stats.suspicion + (delta.suspicion || 0))
        );
      });
    },

    setStats: (stats: GameStats) => {
      set((state) => {
        state.stats = stats;
      });
    },

    nextTurn: () => {
      set((state) => {
        state.currentTurn += 1;
      });
    },

    setMaxTurns: (turns: number) => {
      set((state) => {
        state.maxTurns = turns;
      });
    },

    setEnding: (ending: EndingInfo | null) => {
      set((state) => {
        state.ending = ending;
        if (ending) {
          state.status = 'game_over';
        }
      });
    },

    setLoading: (isLoading: boolean) => {
      set((state) => {
        state.isLoading = isLoading;
      });
    },

    setError: (error: string | null) => {
      set((state) => {
        state.error = error;
      });
    },

    // 答案相关方法实现
    submitAnswer: (type: 'emperor' | 'dynasty', answer: string) => {
      set((state) => {
        if (type === 'emperor') {
          state.answerState.emperorGuess = answer;
          state.answerState.emperorAttempts += 1;
        } else {
          state.answerState.dynastyGuess = answer;
          state.answerState.dynastyAttempts += 1;
        }
        state.answerState.isSubmitting = true;
      });
    },

    setAnsweringQuestions: (isAnswering: boolean) => {
      set((state) => {
        state.isAnsweringQuestions = isAnswering;
      });
    },

    resetAnswerState: () => {
      set((state) => {
        state.answerState = { ...initialAnswerState };
      });
    },

    incrementAnswerAttempt: (type: 'emperor' | 'dynasty') => {
      set((state) => {
        if (type === 'emperor') {
          state.answerState.emperorAttempts += 1;
        } else {
          state.answerState.dynastyAttempts += 1;
        }
      });
    },

    setAnswerCorrect: (type: 'emperor' | 'dynasty', isCorrect: boolean) => {
      set((state) => {
        if (type === 'emperor') {
          state.answerState.emperorCorrect = isCorrect;
        } else {
          state.answerState.dynastyCorrect = isCorrect;
        }
      });
    },
  }))
);
