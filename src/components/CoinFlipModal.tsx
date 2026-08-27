import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Heart, ThumbsUp, ThumbsDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { OptionAnalysis } from '../types';

interface CoinFlipModalProps {
  options: OptionAnalysis[];
  onClose: () => void;
  onCommitChoice: (choice: string) => void;
}

export function CoinFlipModal({ options, onClose, onCommitChoice }: CoinFlipModalProps) {
  const [optionA, setOptionA] = useState(options[0]?.optionName || 'Варіант A');
  const [optionB, setOptionB] = useState(options[1]?.optionName || 'Варіант B');
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<'A' | 'B' | null>(null);
  const [gutFeedback, setGutFeedback] = useState<string | null>(null);

  const handleFlip = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setResult(null);
    setGutFeedback(null);

    setTimeout(() => {
      const outcome = Math.random() > 0.5 ? 'A' : 'B';
      setResult(outcome);
      setIsFlipping(false);
    }, 1800);
  };

  const handleGutChoice = (chosenOption: string, feedback: string) => {
    setGutFeedback(feedback);
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });
    onCommitChoice(chosenOption);
  };

  const winnerName = result === 'A' ? optionA : optionB;
  const otherName = result === 'A' ? optionB : optionA;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-6 relative overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer"
        >
          ✕
        </button>

        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Психологічний кидок монети
          </div>
          <h3 className="text-xl font-black text-stone-950">Тест інтуїції (The Gut-Check)</h3>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            «Коли монета в повітрі, ви раптом точно знаєте, на що насправді сподіваєтесь.»
          </p>
        </div>

        {/* Options Assignment */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase text-stone-500">Орел (Варіант 1)</span>
            <select
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              disabled={isFlipping}
              className="w-full text-xs font-bold text-stone-900 bg-transparent border-none focus:outline-none truncate"
            >
              {options.map((opt) => (
                <option key={opt.id} value={opt.optionName}>
                  {opt.optionName}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase text-stone-500">Решка (Варіант 2)</span>
            <select
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              disabled={isFlipping}
              className="w-full text-xs font-bold text-stone-900 bg-transparent border-none focus:outline-none truncate"
            >
              {options.map((opt) => (
                <option key={opt.id} value={opt.optionName}>
                  {opt.optionName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Animated Coin Container */}
        <div className="flex flex-col items-center justify-center py-4">
          <motion.div
            animate={
              isFlipping
                ? { rotateY: [0, 1800], scale: [1, 1.25, 1], y: [0, -40, 0] }
                : { rotateY: 0, scale: 1, y: 0 }
            }
            transition={{ duration: 1.8, ease: 'easeInOut' }}
            className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-amber-100 border-4 border-amber-600 shadow-xl flex items-center justify-center text-center p-3 cursor-pointer select-none"
            onClick={handleFlip}
          >
            <div className="w-full h-full rounded-full border-2 border-dashed border-amber-700/50 flex items-center justify-center">
              <span className="text-amber-950 font-black text-sm tracking-tight">
                {isFlipping ? '...' : result ? (result === 'A' ? 'ОРЕЛ' : 'РЕШКА') : 'КИСНУТИ'}
              </span>
            </div>
          </motion.div>

          <div className="pt-4">
            <button
              type="button"
              onClick={handleFlip}
              disabled={isFlipping}
              className="px-6 py-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFlipping ? 'animate-spin' : ''}`} />
              <span>{isFlipping ? 'Монета в польоті...' : 'Підкинути цифрову монету'}</span>
            </button>
          </div>
        </div>

        {/* Result & Gut Check Discovery */}
        <AnimatePresence>
          {result && !isFlipping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 text-center"
            >
              <div className="text-xs font-semibold text-amber-800">
                Монета випала на: <strong className="text-amber-950 text-sm">{winnerName}</strong>
              </div>

              {!gutFeedback ? (
                <div className="space-y-2 pt-1 border-t border-amber-200/80">
                  <div className="text-xs font-bold text-stone-900">
                    Що ви відчули в першу секунду, коли побачили результат?
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleGutChoice(
                          winnerName,
                          `Ви відчули полегшення або піднесення щодо "${winnerName}". Це і є ваша справжня перевага!`
                        )
                      }
                      className="p-2.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Полегшення / Радість</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleGutChoice(
                          otherName,
                          `Ви відчули легке розчарування щодо "${winnerName}". Ваша підсвідомість насправді прагне "${otherName}"!`
                        )
                      }
                      className="p-2.5 rounded-xl bg-white border border-rose-300 hover:bg-rose-50 text-rose-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all"
                    >
                      <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                      <span>Розчарування / Сумнів</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-amber-300 text-xs font-medium text-stone-800 space-y-1">
                  <div className="flex items-center justify-center gap-1 text-emerald-700 font-bold">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    <span>Сигнал інтуїції розпізнано</span>
                  </div>
                  <p>{gutFeedback}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
