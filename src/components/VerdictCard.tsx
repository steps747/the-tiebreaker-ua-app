import { useState } from 'react';
import { Award, Clock, AlertTriangle, ShieldAlert, CheckCircle2, Flame, ArrowRight, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FullDecisionAnalysis } from '../types';

interface VerdictCardProps {
  decision: FullDecisionAnalysis;
  onCommitChoice: (choice: string) => void;
}

export function VerdictCard({ decision, onCommitChoice }: VerdictCardProps) {
  const { verdict, options } = decision;
  const [selectedCommit, setSelectedCommit] = useState(decision.userChoice || verdict.recommendedOption);
  const [hasCommitted, setHasCommitted] = useState(Boolean(decision.userChoice));

  const handleCommit = (choice: string) => {
    setSelectedCommit(choice);
    setHasCommitted(true);
    onCommitChoice(choice);

    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0f172a', '#f59e0b', '#10b981', '#6366f1'],
    });
  };

  return (
    <div id="verdict-card-root" className="space-y-6">
      {/* Primary Verdict Hero Banner */}
      <div className="bg-stone-950 text-white rounded-2xl p-6 md:p-8 border border-stone-800 shadow-lg relative overflow-hidden">
        {/* Subtle accent backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-semibold uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              Вердикт The Tiebreaker
            </div>
            <div className="flex items-center gap-2 bg-stone-800/80 px-3.5 py-1 rounded-full border border-stone-700">
              <span className="text-xs text-stone-400 font-medium">Рівень впевненості:</span>
              <span className="text-sm font-bold text-amber-400">{verdict.confidenceScore}%</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-1">
              Головний рекомендований шлях
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {verdict.recommendedOption}
            </h2>
          </div>

          <p className="text-stone-300 text-sm md:text-base leading-relaxed max-w-3xl">
            {verdict.coreRationale}
          </p>

          {/* Commit to decision action */}
          <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span>Готові подолати параліч рішень?</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleCommit(opt.optionName)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                    hasCommitted && selectedCommit === opt.optionName
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                      : 'bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700 hover:text-white'
                  }`}
                >
                  {hasCommitted && selectedCommit === opt.optionName && (
                    <Check className="w-3.5 h-3.5 text-white" />
                  )}
                  {hasCommitted && selectedCommit === opt.optionName ? 'Зафіксовано: ' : 'Я обираю '}
                  {opt.optionName}
                </button>
              ))}
            </div>
          </div>

          {hasCommitted && (
            <div className="mt-2 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Рішення зафіксовано:</strong> Ви обрали <u>{selectedCommit}</u>. Сфокусуйтеся на перевагах та дійте з упевненістю!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* The 10/10/10 Rule Perspective */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
          <Clock className="w-5 h-5 text-stone-700" />
          <h3 className="text-base font-bold text-stone-900">
            Правило 10/10/10 (Часова перспектива)
          </h3>
        </div>
        <p className="text-xs text-stone-500">
          Як це рішення сприйматиметься на трьох різних часових горизонтах?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* 10 Minutes */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Миттєво</span>
              <span className="text-xs font-bold text-stone-800 px-2 py-0.5 bg-stone-200 rounded-md">10 Хвилин</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed font-medium">
              {verdict.tenTenTenRule.tenMinutes}
            </p>
          </div>

          {/* 10 Months */}
          <div className="bg-amber-50/70 rounded-xl p-4 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Середньостроково</span>
              <span className="text-xs font-bold text-amber-900 px-2 py-0.5 bg-amber-200/80 rounded-md">10 Місяців</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed font-medium">
              {verdict.tenTenTenRule.tenMonths}
            </p>
          </div>

          {/* 10 Years */}
          <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Довгостроково</span>
              <span className="text-xs font-bold text-emerald-900 px-2 py-0.5 bg-emerald-200/80 rounded-md">10 Років</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed font-medium">
              {verdict.tenTenTenRule.tenYears}
            </p>
          </div>
        </div>
      </div>

      {/* Conditional Guidance ("If you value X...") */}
      {verdict.conditionalAdvice && verdict.conditionalAdvice.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <Flame className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-stone-900">
              Умовні правила прийняття рішення (з урахуванням цінностей)
            </h3>
          </div>

          <div className="space-y-3">
            {verdict.conditionalAdvice.map((advice, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="text-stone-500 font-semibold">
                    ЯКЩО: <span className="text-stone-900 font-bold">{advice.condition}</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed">{advice.explanation}</p>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 rounded-lg font-bold text-stone-900 self-start md:self-center">
                  <span>Обирайте:</span>
                  <span className="text-stone-950 underline underline-offset-2">{advice.chooseOption}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Devil's Advocate & Blind Spots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Devil's Advocate */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-stone-900">
              Адвокат диявола (Стрес-тестування)
            </h3>
          </div>
          <p className="text-xs text-stone-500">
            Киньте виклик власній упередженості перед тим, як рухатися далі:
          </p>

          <div className="space-y-3">
            {verdict.devilsAdvocate.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2">
                <div className="text-xs font-bold text-rose-900">
                  Об'єкт: {item.targetOption}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  {item.challenge}
                </p>
                <div className="pt-1.5 border-t border-rose-200/60 text-xs font-semibold text-rose-950 flex items-start gap-1.5">
                  <span className="shrink-0">💬 Внутрішній тест:</span>
                  <span className="italic">"{item.gutCheckQuestion}"</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blind Spots & Immediate Action Steps */}
        <div className="space-y-6">
          {/* Blind spots */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-bold text-stone-900">
                Приховані сліпі зони та припущення
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-stone-700">
              {verdict.blindSpots.map((spot, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{spot}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Steps */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-stone-900">
                Невідкладні наступні кроки (протягом 48 год)
              </h3>
            </div>
            <ol className="space-y-2 text-xs text-stone-700">
              {verdict.actionSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
