import { useState, useEffect, type MouseEvent } from 'react';
import { History, Trash2, Calendar, CheckCircle2, ChevronRight, Search, Plus } from 'lucide-react';
import { FullDecisionAnalysis } from '../types';
import { getSavedDecisions, deleteSavedDecision } from '../utils/storage';

interface DecisionHistoryDrawerProps {
  onSelectDecision: (decision: FullDecisionAnalysis) => void;
  onNewDecision: () => void;
  onClose: () => void;
}

export function DecisionHistoryDrawer({ onSelectDecision, onNewDecision, onClose }: DecisionHistoryDrawerProps) {
  const [decisions, setDecisions] = useState<FullDecisionAnalysis[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setDecisions(getSavedDecisions());
  }, []);

  const handleDelete = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    const updated = deleteSavedDecision(id);
    setDecisions(updated);
  };

  const filtered = decisions.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.options.some((o) => o.optionName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-stone-200 flex flex-col p-6 space-y-5 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-stone-800" />
            <h3 className="text-base font-bold text-stone-900">Збережені рішення</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Start Fresh Button */}
        <button
          type="button"
          onClick={() => {
            onNewDecision();
            onClose();
          }}
          className="w-full py-2.5 px-4 bg-stone-950 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Нове рішення або дилема</span>
        </button>

        {/* Search */}
        {decisions.length > 0 && (
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук у збережених рішеннях..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-800"
            />
          </div>
        )}

        {/* Decision List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {decisions.length === 0 ? (
            <div className="text-center py-12 space-y-2 text-stone-400">
              <History className="w-8 h-8 mx-auto stroke-1" />
              <p className="text-xs font-medium">Ще немає збережених рішень.</p>
              <p className="text-[11px] text-stone-400">Проаналізовані рішення автоматично зберігаються локально для перегляду в майбутньому.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-stone-400">
              Рішень за запитом не знайдено.
            </div>
          ) : (
            filtered.map((d) => (
              <div
                key={d.id}
                onClick={() => {
                  onSelectDecision(d);
                  onClose();
                }}
                className="p-4 rounded-xl border border-stone-200 hover:border-stone-900 bg-stone-50/50 hover:bg-white transition-all cursor-pointer space-y-2.5 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-stone-900 leading-snug group-hover:text-stone-950">
                    {d.title}
                  </h4>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(d.id, e)}
                    className="p-1 text-stone-300 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Видалити збережене рішення"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-stone-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(d.timestamp).toLocaleDateString('uk-UA')}
                  </span>
                  <span>•</span>
                  <span>{d.options.length} варіант(и)</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-[11px]">
                  <div className="flex items-center gap-1.5 text-stone-700 font-semibold truncate max-w-[220px]">
                    <span className="text-amber-600 font-black">Вердикт:</span>
                    <span className="truncate">{d.verdict.recommendedOption}</span>
                  </div>
                  {d.userChoice && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Обрано
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
