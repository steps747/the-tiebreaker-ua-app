import { useState, useEffect } from 'react';
import {
  Scale,
  Sparkles,
  LayoutGrid,
  ListCheck,
  Table,
  ShieldAlert,
  Award,
  Coins,
  History,
  Share2,
  Plus,
  RefreshCcw,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { AnalysisViewMode, FullDecisionAnalysis, OptionAnalysis, ComparisonDimension } from './types';
import { DecisionForm } from './components/DecisionForm';
import { VerdictCard } from './components/VerdictCard';
import { ProsConsView } from './components/ProsConsView';
import { ComparisonTableView } from './components/ComparisonTableView';
import { SwotView } from './components/SwotView';
import { CoinFlipModal } from './components/CoinFlipModal';
import { DecisionHistoryDrawer } from './components/DecisionHistoryDrawer';
import { ExportModal } from './components/ExportModal';
import { getSavedDecisions, saveDecision } from './utils/storage';

export default function App() {
  const [activeDecision, setActiveDecision] = useState<FullDecisionAnalysis | null>(null);
  const [viewMode, setViewMode] = useState<AnalysisViewMode>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedForm, setLastSubmittedForm] = useState<{
    title: string;
    context: string;
    options: string[];
    priorities: string[];
  } | null>(null);

  const [showCoinFlip, setShowCoinFlip] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // Load latest decision on startup if available
  useEffect(() => {
    const saved = getSavedDecisions();
    if (saved.length > 0) {
      setActiveDecision(saved[0]);
    }
  }, []);

  const handleAnalyzeDecision = async (formData: {
    title: string;
    context: string;
    options: string[];
    priorities: string[];
  }) => {
    setIsLoading(true);
    setError(null);
    setLastSubmittedForm(formData);

    const steps = [
      'Аналіз дилеми та формування ключових варіантів...',
      'Оцінка прямих і прихованих плюсів, мінусів та ризиків...',
      'Побудова стратегічної SWOT-матриці для кожного вибору...',
      'Калібрування багатокритеріальної матриці порівняння...',
      'Формування фінального вердикту та плану дій...',
    ];

    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      setLoadingStep(steps[stepIdx]);
    }, 1800);

    try {
      const res = await fetch('/api/analyze-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        let message = `Помилка сервера (${res.status})`;
        try {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errData = await res.json();
            if (errData.error) {
              message = errData.error;
            }
          } else {
            const textData = await res.text();
            if (textData && !textData.includes('<!doctype') && !textData.includes('<html')) {
              message = textData.slice(0, 200);
            }
          }
        } catch {
          // fallback to default status message
        }

        // Clean up nested raw JSON error strings if present
        try {
          if (message.startsWith('{') && message.endsWith('}')) {
            const parsedErr = JSON.parse(message);
            if (parsedErr.error?.message) {
              message = parsedErr.error.message;
            }
          }
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Сервер повернув неочікуваний формат відповіді. Спробуйте ще раз.');
      }

      const data: FullDecisionAnalysis = await res.json();
      setActiveDecision(data);
      saveDecision(data);
      setViewMode('all');
    } catch (err: any) {
      console.error('Analysis failed:', err);
      let userMsg = err?.message || 'Не вдалося проаналізувати рішення. Перевірте дані та повторіть спробу.';
      if (userMsg.includes('503') || userMsg.includes('high demand') || userMsg.includes('UNAVAILABLE')) {
        userMsg = 'Модель ШІ тимчасово перевантажена запитами. Будь ласка, натисніть "Повторити аналіз" нижче.';
      }
      setError(userMsg);
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  const handleUpdateOptions = (updatedOptions: OptionAnalysis[]) => {
    if (!activeDecision) return;
    const updated: FullDecisionAnalysis = {
      ...activeDecision,
      options: updatedOptions,
    };
    setActiveDecision(updated);
    saveDecision(updated);
  };

  const handleUpdateMatrix = (updatedMatrix: ComparisonDimension[]) => {
    if (!activeDecision) return;
    const updated: FullDecisionAnalysis = {
      ...activeDecision,
      comparisonMatrix: updatedMatrix,
    };
    setActiveDecision(updated);
    saveDecision(updated);
  };

  const handleCommitChoice = (choice: string) => {
    if (!activeDecision) return;
    const updated: FullDecisionAnalysis = {
      ...activeDecision,
      userChoice: choice,
    };
    setActiveDecision(updated);
    saveDecision(updated);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-amber-200">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div
            onClick={() => setActiveDecision(null)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-stone-950 text-white flex items-center justify-center shadow-xs group-hover:bg-stone-800 transition-colors">
              <Scale className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-stone-950 text-base tracking-tight">The Tiebreaker</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                  ШІ-помічник прийняття рішень
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">Долайте сумніви зі структурованою ясністю</p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            {activeDecision && (
              <>
                <button
                  type="button"
                  onClick={() => setShowCoinFlip(true)}
                  className="px-3 py-1.5 text-xs font-bold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Тест інтуїції монетою"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden md:inline">Кидок монети</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowExport(true)}
                  className="px-3 py-1.5 text-xs font-bold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Експорт або копіювання звіту"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Експорт</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="px-3 py-1.5 text-xs font-bold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Історія</span>
            </button>

            {activeDecision && (
              <button
                type="button"
                onClick={() => setActiveDecision(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-stone-950 hover:bg-stone-800 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Нове рішення</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs font-medium flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" />
              <span>{error}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {lastSubmittedForm && !isLoading && (
                <button
                  type="button"
                  onClick={() => handleAnalyzeDecision(lastSubmittedForm)}
                  className="px-3 py-1.5 bg-rose-900 hover:bg-rose-950 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>Повторити аналіз</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setError(null)}
                className="px-2.5 py-1.5 text-rose-700 hover:text-rose-950 hover:bg-rose-100 rounded-lg font-semibold cursor-pointer transition-colors"
              >
                Закрити
              </button>
            </div>
          </div>
        )}

        {/* View Mode 1: Initial Input & Formulation */}
        {!activeDecision ? (
          <div className="space-y-6">
            {/* Hero Introduction */}
            <div className="text-center max-w-2xl mx-auto space-y-3 py-4">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-800 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Стратегічне прийняття рішень</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-stone-950 tracking-tight">
                Вагаєтеся між варіантами? <br className="hidden sm:inline" />
                Знайдіть правильне рішення.
              </h1>
              <p className="text-sm text-stone-600 leading-relaxed">
                Опишіть свою дилему. The Tiebreaker зважить усі плюси та мінуси, проведе багатокритеріальне порівняння, складе SWOT-аналіз і сформує обґрунтований вердикт.
              </p>
            </div>

            <DecisionForm
              onSubmit={handleAnalyzeDecision}
              isLoading={isLoading}
              loadingStep={loadingStep}
            />
          </div>
        ) : (
          /* View Mode 2: Active Analyzed Decision Dashboard */
          <div className="space-y-8">
            {/* Decision Title Bar */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Аналіз рішення
                  </span>
                  <span className="text-xs text-stone-600 font-medium">
                    {new Date(activeDecision.timestamp).toLocaleDateString('uk-UA', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {activeDecision.userChoice && (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      Обрано: {activeDecision.userChoice}
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-stone-950 tracking-tight">
                  {activeDecision.title}
                </h1>
                {activeDecision.context && (
                  <p className="text-xs text-stone-600 leading-relaxed pt-1 max-w-3xl">
                    <strong className="text-stone-800">Контекст:</strong> {activeDecision.context}
                  </p>
                )}
              </div>

              {/* Quick Switch to Reset / Edit */}
              <div className="shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDecision(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>Аналізувати інше</span>
                </button>
              </div>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-stone-200/70 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'all'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Повний огляд</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('verdict')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'verdict'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-600" />
                <span>Вердикт і план дій</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('pros_cons')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'pros_cons'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ListCheck className="w-3.5 h-3.5" />
                <span>Плюси та мінуси</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('comparison')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'comparison'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Таблиця порівняння</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('swot')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'swot'
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>SWOT-аналіз</span>
              </button>
            </div>

            {/* View Renderings */}
            {viewMode === 'all' && (
              <div className="space-y-12">
                {/* Section 1: Verdict */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-stone-200">
                    <Award className="w-5 h-5 text-amber-600" />
                    <h2 className="text-lg font-black text-stone-900">1. Вердикт The Tiebreaker та аргументація</h2>
                  </div>
                  <VerdictCard
                    decision={activeDecision}
                    onCommitChoice={handleCommitChoice}
                  />
                </section>

                {/* Section 2: Pros & Cons */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-stone-200">
                    <ListCheck className="w-5 h-5 text-stone-800" />
                    <h2 className="text-lg font-black text-stone-900">2. Детальні плюси та мінуси з динамічною вагою</h2>
                  </div>
                  <ProsConsView
                    decisionTitle={activeDecision.title}
                    options={activeDecision.options}
                    onOptionsChange={handleUpdateOptions}
                  />
                </section>

                {/* Section 3: Comparison Table */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-stone-200">
                    <Table className="w-5 h-5 text-stone-800" />
                    <h2 className="text-lg font-black text-stone-900">3. Багатокритеріальна матриця порівняння</h2>
                  </div>
                  <ComparisonTableView
                    options={activeDecision.options}
                    matrix={activeDecision.comparisonMatrix}
                    onMatrixChange={handleUpdateMatrix}
                  />
                </section>

                {/* Section 4: SWOT Analysis */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-stone-200">
                    <ShieldAlert className="w-5 h-5 text-stone-800" />
                    <h2 className="text-lg font-black text-stone-900">4. Стратегічна SWOT-матриця</h2>
                  </div>
                  <SwotView options={activeDecision.options} />
                </section>
              </div>
            )}

            {viewMode === 'verdict' && (
              <VerdictCard
                decision={activeDecision}
                onCommitChoice={handleCommitChoice}
              />
            )}

            {viewMode === 'pros_cons' && (
              <ProsConsView
                decisionTitle={activeDecision.title}
                options={activeDecision.options}
                onOptionsChange={handleUpdateOptions}
              />
            )}

            {viewMode === 'comparison' && (
              <ComparisonTableView
                options={activeDecision.options}
                matrix={activeDecision.comparisonMatrix}
                onMatrixChange={handleUpdateMatrix}
              />
            )}

            {viewMode === 'swot' && (
              <SwotView options={activeDecision.options} />
            )}
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      {showCoinFlip && activeDecision && (
        <CoinFlipModal
          options={activeDecision.options}
          onClose={() => setShowCoinFlip(false)}
          onCommitChoice={(choice) => {
            handleCommitChoice(choice);
            setShowCoinFlip(false);
          }}
        />
      )}

      {showHistory && (
        <DecisionHistoryDrawer
          onSelectDecision={(d) => {
            setActiveDecision(d);
            setViewMode('all');
          }}
          onNewDecision={() => {
            setActiveDecision(null);
          }}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showExport && activeDecision && (
        <ExportModal
          decision={activeDecision}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-stone-400">
          The Tiebreaker • Раціональний аналіз рішень за допомогою Gemini 3.7 Flash • Усі дані зберігаються локально
        </div>
      </footer>
    </div>
  );
}
