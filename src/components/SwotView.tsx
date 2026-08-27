import { useState } from 'react';
import { Shield, Zap, TrendingUp, AlertOctagon, Columns2, Square } from 'lucide-react';
import { OptionAnalysis } from '../types';

interface SwotViewProps {
  options: OptionAnalysis[];
}

export function SwotView({ options }: SwotViewProps) {
  const [activeTab, setActiveTab] = useState<string>(options[0]?.id || '');
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  const currentOption = options.find((o) => o.id === activeTab) || options[0];

  const renderSwotGrid = (opt: OptionAnalysis) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Strengths (Internal Positive) */}
      <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-emerald-200/70">
          <div className="p-1 rounded-lg bg-emerald-200/80 text-emerald-900">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">
              Сильні сторони (Внутрішні переваги)
            </h4>
            <span className="text-[10px] text-emerald-700 font-medium">Власні якості та переваги</span>
          </div>
        </div>
        <ul className="space-y-2 text-xs text-stone-800">
          {opt.swot.strengths.map((s, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              <span className="leading-relaxed font-medium">{s}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Weaknesses (Internal Negative) */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-amber-200/70">
          <div className="p-1 rounded-lg bg-amber-200/80 text-amber-900">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
              Слабкі сторони (Внутрішні недоліки)
            </h4>
            <span className="text-[10px] text-amber-700 font-medium">Внутрішні обмеження та вразливості</span>
          </div>
        </div>
        <ul className="space-y-2 text-xs text-stone-800">
          {opt.swot.weaknesses.map((w, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
              <span className="leading-relaxed font-medium">{w}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Opportunities (External Positive) */}
      <div className="bg-sky-50/70 border border-sky-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-sky-200/70">
          <div className="p-1 rounded-lg bg-sky-200/80 text-sky-900">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-sky-950">
              Можливості (Зовнішній потенціал)
            </h4>
            <span className="text-[10px] text-sky-700 font-medium">Перспективи зростання та сприятливі умови</span>
          </div>
        </div>
        <ul className="space-y-2 text-xs text-stone-800">
          {opt.swot.opportunities.map((o, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600 mt-1.5 shrink-0" />
              <span className="leading-relaxed font-medium">{o}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Threats (External Negative) */}
      <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-rose-200/70">
          <div className="p-1 rounded-lg bg-rose-200/80 text-rose-900">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-950">
              Загрози (Зовнішні ризики)
            </h4>
            <span className="text-[10px] text-rose-700 font-medium">Зовнішні фактори ризику та залежності</span>
          </div>
        </div>
        <ul className="space-y-2 text-xs text-stone-800">
          {opt.swot.threats.map((t, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
              <span className="leading-relaxed font-medium">{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div id="swot-view-root" className="space-y-6">
      {/* Top Bar Switchers */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-stone-100/90 rounded-2xl border border-stone-200">
        <div className="flex flex-wrap gap-1">
          {options.map((opt, idx) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setActiveTab(opt.id);
                setViewMode('single');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'single' && currentOption?.id === opt.id
                  ? 'bg-white text-stone-950 shadow-xs border border-stone-200'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <span className="w-4 h-4 rounded bg-stone-900 text-white flex items-center justify-center text-[9px]">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="truncate max-w-[150px]">{opt.optionName}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 pr-1">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'single' ? 'all' : 'single')}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg cursor-pointer transition-all"
          >
            {viewMode === 'single' ? (
              <>
                <Columns2 className="w-3.5 h-3.5" />
                <span>Показати всі поруч</span>
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5" />
                <span>Показати один варіант</span>
              </>
            )}
          </button>
        </div>
      </div>

      {viewMode === 'single' && currentOption && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-stone-900">{currentOption.optionName}</h3>
              <p className="text-xs text-stone-500 italic">{currentOption.tagline}</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 border border-stone-200">
              Стратегічний SWOT-аналіз
            </span>
          </div>

          {renderSwotGrid(currentOption)}
        </div>
      )}

      {viewMode === 'all' && (
        <div className="space-y-8">
          {options.map((opt, idx) => (
            <div key={opt.id} className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
                <span className="w-6 h-6 rounded-md bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>
                <h3 className="text-lg font-black text-stone-900">{opt.optionName}</h3>
                <span className="text-xs text-stone-500 italic">— {opt.tagline}</span>
              </div>
              {renderSwotGrid(opt)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
