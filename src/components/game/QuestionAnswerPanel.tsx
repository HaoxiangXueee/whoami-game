/**
 * 问题与答案面板组件
 * 玩家可以在回合耗尽前或耗尽后回答两个问题
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { AnswerState, AnswerValidationResult } from '@types/game';

interface QuestionAnswerPanelProps {
  answerState: AnswerState;
  isForced: boolean;
  maxAttempts?: number;
  onSubmitAnswer: (type: 'emperor' | 'dynasty', answer: string) => void;
  onValidateAnswer?: (type: 'emperor' | 'dynasty', answer: string) => Promise<AnswerValidationResult>;
  onComplete?: (finalState: AnswerState) => void;
  onClose?: () => void;
}

export function QuestionAnswerPanel({
  answerState,
  isForced,
  maxAttempts = 3,
  onSubmitAnswer,
  onValidateAnswer,
  onComplete,
  onClose,
}: QuestionAnswerPanelProps) {
  const [emperorInput, setEmperorInput] = useState('');
  const [dynastyInput, setDynastyInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [emperorFeedback, setEmperorFeedback] = useState<string>('');
  const [dynastyFeedback, setDynastyFeedback] = useState<string>('');

  const { emperorAttempts, dynastyAttempts, emperorCorrect, dynastyCorrect } = answerState;

  const maxAttemptsValue = maxAttempts || 3;

  const isEmperorDone = emperorCorrect === true || emperorAttempts >= maxAttemptsValue;
  const isDynastyDone = dynastyCorrect === true || dynastyAttempts >= maxAttemptsValue;
  const isAllDone = isEmperorDone && isDynastyDone;

  // 自动检测：两个都答对后立即触发结算
  useEffect(() => {
    if (emperorCorrect === true && dynastyCorrect === true) {
      console.log('[QuestionAnswerPanel] 两个问题都答对，自动触发结算');
      onComplete?.(answerState);
    }
  }, [emperorCorrect, dynastyCorrect, onComplete, answerState]);

  const handleSubmitEmperor = async () => {
    if (!emperorInput.trim() || validating || isEmperorDone) return;

    setValidating(true);
    onSubmitAnswer('emperor', emperorInput.trim());

    if (onValidateAnswer) {
      const result = await onValidateAnswer('emperor', emperorInput.trim());
      setEmperorFeedback(result.feedback);
    } else {
      setEmperorFeedback(`已提交: ${emperorInput.trim()}`);
    }

    setValidating(false);
    setEmperorInput('');
  };

  const handleSubmitDynasty = async () => {
    if (!dynastyInput.trim() || validating || isDynastyDone) return;

    setValidating(true);
    onSubmitAnswer('dynasty', dynastyInput.trim());

    if (onValidateAnswer) {
      const result = await onValidateAnswer('dynasty', dynastyInput.trim());
      setDynastyFeedback(result.feedback);
    } else {
      setDynastyFeedback(`已提交: ${dynastyInput.trim()}`);
    }

    setValidating(false);
    setDynastyInput('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 rounded-xl shadow-2xl border border-slate-600">
        {/* 头部 */}
        <div className="p-6 border-b border-slate-600 bg-gradient-to-r from-amber-900/30 to-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-amber-400">
                {isForced ? '时间已到' : '身份确认'}
              </h2>
              <p className="mt-1 text-slate-400 text-sm">
                {isForced
                  ? '回合已经耗尽，现在必须回答这两个问题...'
                  : '在回合耗尽前，你可以随时尝试回答这两个问题'}
              </p>
            </div>
            {/* 关闭按钮 - 仅在非强制模式下显示 */}
            {!isForced && onClose && (
              <button
                onClick={onClose}
                className="ml-4 px-3 py-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors text-xl"
                title="关闭"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 问题区域 */}
        <div className="p-6 space-y-6">
          {/* 皇帝问题 */}
          <div className={`p-4 rounded-lg border ${emperorCorrect === true ? 'bg-green-900/30 border-green-600' : emperorCorrect === false && isEmperorDone ? 'bg-red-900/30 border-red-600' : 'bg-slate-700/50 border-slate-600'}`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-slate-200">你是谁？</h3>
              {emperorCorrect === true && <span className="text-green-400 text-sm">✓ 正确</span>}
              {emperorCorrect === false && isEmperorDone && <span className="text-red-400 text-sm">✗ 错误</span>}
            </div>

            {!isEmperorDone ? (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={emperorInput}
                    onChange={(e) => setEmperorInput(e.target.value)}
                    placeholder="请输入皇帝姓名..."
                    disabled={validating}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitEmperor()}
                  />
                  <button
                    onClick={handleSubmitEmperor}
                    disabled={!emperorInput.trim() || validating}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 text-white rounded font-medium transition-colors"
                  >
                    {validating ? '验证中...' : '提交'}
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  剩余机会: {maxAttemptsValue - emperorAttempts}/{maxAttemptsValue} | 已尝试 {emperorAttempts} 次
                </p>

                {/* 反馈显示 */}
                {emperorFeedback && (
                  <div className={`mt-3 p-3 rounded ${emperorFeedback.includes('正确') ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                    {emperorFeedback}
                  </div>
                )}
              </>
            ) : (
              <div className="py-2 text-center">
                {emperorCorrect === true ? (
                  <div className="text-green-400">
                    <div className="font-semibold">回答正确！✓</div>
                    <div className="text-sm mt-1 text-green-300">正确答案：{answerState.emperorGuess}</div>
                  </div>
                ) : (
                  <div className="text-red-400">
                    <div className="font-semibold">回答错误</div>
                    <div className="text-sm mt-1 text-red-300">机会已用尽</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 历史事件问题 */}
          <div className={`p-4 rounded-lg border ${dynastyCorrect === true ? 'bg-green-900/30 border-green-600' : dynastyCorrect === false && isDynastyDone ? 'bg-red-900/30 border-red-600' : 'bg-slate-700/50 border-slate-600'}`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-slate-200">这是什么历史事件？</h3>
              {dynastyCorrect === true && <span className="text-green-400 text-sm">✓ 正确</span>}
              {dynastyCorrect === false && isDynastyDone && <span className="text-red-400 text-sm">✗ 错误</span>}
            </div>

            {!isDynastyDone ? (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dynastyInput}
                    onChange={(e) => setDynastyInput(e.target.value)}
                    placeholder="请输入历史事件..."
                    disabled={validating}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitDynasty()}
                  />
                  <button
                    onClick={handleSubmitDynasty}
                    disabled={!dynastyInput.trim() || validating}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 text-white rounded font-medium transition-colors"
                  >
                    {validating ? '验证中...' : '提交'}
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  剩余机会: {maxAttemptsValue - dynastyAttempts}/{maxAttemptsValue} | 已尝试 {dynastyAttempts} 次
                </p>

                {/* 反馈显示 */}
                {dynastyFeedback && (
                  <div className={`mt-3 p-3 rounded ${dynastyFeedback.includes('正确') ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                    {dynastyFeedback}
                  </div>
                )}
              </>
            ) : (
              <div className="py-2 text-center">
                {dynastyCorrect === true ? (
                  <div className="text-green-400">
                    <div className="font-semibold">回答正确！✓</div>
                    <div className="text-sm mt-1 text-green-300">正确答案：{answerState.dynastyGuess}</div>
                  </div>
                ) : (
                  <div className="text-red-400">
                    <div className="font-semibold">回答错误</div>
                    <div className="text-sm mt-1 text-red-300">机会已用尽</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 底部说明 */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-500">
              <span className="text-amber-500">💡</span> 提示：可以在对话中收集线索
            </div>
            {isAllDone && (
              <button
                onClick={() => onComplete?.(answerState)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
              >
                确认结束
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default QuestionAnswerPanel;