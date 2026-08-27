import { useState, type FormEvent } from 'react';
import { ThumbsUp, ThumbsDown, Plus, Sparkles, Trash2, Check } from 'lucide-react';
import { OptionAnalysis, ProConItem } from '../types';
import { getCategoryBadgeColor } from '../utils/storage';

interface ProsConsViewProps {
  decisionTitle: string;
  options: OptionAnalysis[];
  onOptionsChange: (updatedOptions: OptionAnalysis[]) => void;
}

export function ProsConsView({ decisionTitle, options, onOptionsChange }: ProsConsViewProps) {
  const [activeTab, setActiveTab] = useState<string>(options[0]?.id || '');
  const [newPointType, setNewPointType] = useState<'pro' | 'con'>('pro');
  const [newPointText, setNewPointText] = useState('');
  const [newPointDetail, setNewPointDetail] = useState('');
  const [newPointImpact, setNewPointImpact] = useState(3);
  const [newPointCategory, setNewPointCategory] = useState<ProConItem['category']>('strategic');
  const [isAddingOpen, setIsAddingOpen] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const currentOption = options.find((o) => o.id === activeTab) || options[0];

  const calculateNetScore = (option: OptionAnalysis) => {
    const prosSum = option.pros.reduce((acc, p) => acc + p.impact, 0);
    const consSum = option.cons.reduce((acc, c) => acc + c.impact, 0);
    return { prosSum, consSum, net: prosSum - consSum };
  };

  const handleImpactChange = (optionId: string, itemId: string, isPro: boolean, newImpact: number) => {
    const updated = options.map((opt) => {
      if (opt.id !== optionId) return opt;
      if (isPro) {
        return {
          ...opt,
          pros: opt.pros.map((p) => (p.id === itemId ? { ...p, impact: newImpact } : p)),
        };
      } else {
        return {
          ...opt,
          cons: opt.cons.map((c) => (c.id === itemId ? { ...c, impact: newImpact } : c)),
        };
      }
    });
    onOptionsChange(updated);
  };

  const handleDeleteItem = (optionId: string, itemId: string, isPro: boolean) => {
    const updated = options.map((opt) => {
      if (opt.id !== optionId) return opt;
      return {
        ...opt,
        pros: isPro ? opt.pros.filter((p) => p.id !== itemId) : opt.pros,
        cons: !isPro ? opt.cons.filter((c) => c.id !== itemId) : opt.cons,
      };
    });
    onOptionsChange(updated);
  };

  const handleAddCustomPoint = (e: FormEvent) => {
    e.preventDefault();
    if (!newPointText.trim() || !currentOption) return;

    const newItem: ProConItem = {
      id: `custom-${Date.now()}`,
      text: newPointText.trim(),
      detail: newPointDetail.trim() || undefined,
      impact: newPointImpact,
      category: newPointCategory,
      isCustom: true,
    };

    const updated = options.map((opt) => {
      if (opt.id !== currentOption.id) return opt;
      return {
        ...opt,
        pros: newPointType === 'pro' ? [...opt.pros, newItem] : opt.pros,
        cons: newPointType === 'con' ? [...opt.cons, newItem] : opt.cons,
      };
    });

    onOptionsChange(updated);
    setNewPointText('');
    setNewPointDetail('');
    setIsAddingOpen(false);
  };

  const handleSuggestPoints = async (type: 'pro' | 'con') => {
    if (!currentOption || isSuggesting) return;
    setIsSuggesting(true);

    try {
      const existingPoints = (type === 'pro' ? currentOption.pros : currentOption.cons).map((p) => p.text);
      const res = await fetch('/api/suggest-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: decisionTitle,
          optionName: currentOption.optionName,
          type,
          existingPoints,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to suggest points (${res.status})`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Invalid response from server');
      }

      const data = await res.json();
      if (data.points && Array.isArray(data.points)) {
        const newItems: ProConItem[] = data.points.map((pt: any, idx: number) => ({
          id: `ai-suggest-${Date.now()}-${idx}`,
          text: pt.text,
          detail: pt.detail,
          impact: pt.impact || 3,
          category: pt.category || 'strategic',
          isCustom: true,
        }));

        const updated = options.map((opt) => {
          if (opt.id !== currentOption.id) return opt;
          return {
            ...opt,
            pros: type === 'pro' ? [...opt.pros, ...newItems] : opt.pros,
            cons: type === 'con' ? [...opt.cons, ...newItems] : opt.cons,
          };
        });

        onOptionsChange(updated);
      }
    } catch (err) {
      console.error('Error suggesting points:', err);
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div id="pros-cons-view-root" className="space-y-6">
      {/* Option Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-stone-100/90 rounded-2xl border border-stone-200">
        <div className="flex flex-wrap gap-1">
          {options.map((opt, idx) => {
            const { net } = calculateNetScore(opt);
            const isActive = (currentOption?.id === opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActiveTab(opt.id)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-stone-950 shadow-xs border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <span className="w-5 h-5 rounded-md bg-stone-900 text-white flex items-center justify-center text-[10px]">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="truncate max-w-[160px] sm:max-w-[220px]">{opt.optionName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    net > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : net < 0
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {net > 0 ? `+${net}` : net}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-stone-500 pr-2">
          Натискайте на точки ваги, щоб змінити особистий вплив
        </div>
      </div>

      {currentOption && (
        <div className="space-y-6">
          {/* Header Summary for Current Option */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-stone-950">{currentOption.optionName}</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200">
                  Попередня оцінка: {currentOption.score}/100
                </span>
              </div>
              <p className="text-xs text-stone-600 italic">{currentOption.tagline}</p>
              <p className="text-xs text-stone-700 leading-relaxed pt-1">{currentOption.overallSummary}</p>
            </div>

            {/* Net Balance Tally */}
            <div className="shrink-0 flex items-center gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <div className="text-center px-2">
                <div className="text-[10px] uppercase font-bold text-emerald-700">Вплив плюсів</div>
                <div className="text-base font-black text-emerald-600">
                  +{calculateNetScore(currentOption).prosSum}
                </div>
              </div>
              <div className="h-8 w-px bg-stone-300" />
              <div className="text-center px-2">
                <div className="text-[10px] uppercase font-bold text-rose-700">Тягар мінусів</div>
                <div className="text-base font-black text-rose-600">
                  -{calculateNetScore(currentOption).consSum}
                </div>
              </div>
              <div className="h-8 w-px bg-stone-300" />
              <div className="text-center px-2">
                <div className="text-[10px] uppercase font-bold text-stone-500">Чистий баланс</div>
                <div className="text-base font-black text-stone-900">
                  {calculateNetScore(currentOption).net > 0 ? `+${calculateNetScore(currentOption).net}` : calculateNetScore(currentOption).net}
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-side Pros & Cons Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PROS COLUMN */}
            <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <ThumbsUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">Переваги та плюси</h4>
                    <span className="text-[11px] text-emerald-800 font-medium">
                      {currentOption.pros.length} ключових переваг визначено
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSuggestPoints('pro')}
                  disabled={isSuggesting}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  title="Згенерувати більше переваг за допомогою AI"
                >
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  <span>{isSuggesting ? 'Генерація...' : 'AI пошук +'}</span>
                </button>
              </div>

              {/* Pros List */}
              <div className="space-y-3">
                {currentOption.pros.map((pro) => {
                  const badge = getCategoryBadgeColor(pro.category);
                  return (
                    <div
                      key={pro.id}
                      className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-100 hover:border-emerald-300 transition-all space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900">{pro.text}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${badge.bg} ${badge.border}`}>
                              {pro.category}
                            </span>
                            {pro.isCustom && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-medium">
                                власне
                              </span>
                            )}
                          </div>
                          {pro.detail && (
                            <p className="text-xs text-stone-600 leading-relaxed">{pro.detail}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(currentOption.id, pro.id, true)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 transition-all cursor-pointer"
                          title="Видалити пункт"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Interactive Impact Slider/Stars */}
                      <div className="flex items-center justify-between pt-1 border-t border-emerald-100/60 text-[11px] text-stone-500">
                        <span>Особиста важливість:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleImpactChange(currentOption.id, pro.id, true, lvl)}
                              className={`w-5 h-5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                lvl <= pro.impact
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-stone-200 text-stone-500 hover:bg-emerald-200'
                              }`}
                              title={`Встановити важливість ${lvl}/5`}
                            >
                              +{lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CONS COLUMN */}
            <div className="bg-white border border-rose-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-100 text-rose-800">
                    <ThumbsDown className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-950">Ризики, витрати та мінуси</h4>
                    <span className="text-[11px] text-rose-800 font-medium">
                      {currentOption.cons.length} потенційних точок напруги
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSuggestPoints('con')}
                  disabled={isSuggesting}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  title="Виявити більше прихованих ризиків за допомогою AI"
                >
                  <Sparkles className="w-3 h-3 text-rose-700" />
                  <span>{isSuggesting ? 'Генерація...' : 'AI ризик-тест +'}</span>
                </button>
              </div>

              {/* Cons List */}
              <div className="space-y-3">
                {currentOption.cons.map((con) => {
                  const badge = getCategoryBadgeColor(con.category);
                  return (
                    <div
                      key={con.id}
                      className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-100 hover:border-rose-300 transition-all space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900">{con.text}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${badge.bg} ${badge.border}`}>
                              {con.category}
                            </span>
                            {con.isCustom && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-medium">
                                власне
                              </span>
                            )}
                          </div>
                          {con.detail && (
                            <p className="text-xs text-stone-600 leading-relaxed">{con.detail}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(currentOption.id, con.id, false)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 transition-all cursor-pointer"
                          title="Видалити пункт"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Interactive Impact Slider/Stars */}
                      <div className="flex items-center justify-between pt-1 border-t border-rose-100/60 text-[11px] text-stone-500">
                        <span>Тяжкість ризику:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleImpactChange(currentOption.id, con.id, false, lvl)}
                              className={`w-5 h-5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                lvl <= con.impact
                                  ? 'bg-rose-600 text-white shadow-2xs'
                                  : 'bg-stone-200 text-stone-500 hover:bg-rose-200'
                              }`}
                              title={`Встановити тяжкість ризику ${lvl}/5`}
                            >
                              -{lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Add Custom Pro or Con Accordion */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            {!isAddingOpen ? (
              <button
                type="button"
                onClick={() => setIsAddingOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-stone-800 hover:text-stone-950 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Додати власний фактор до варіанту: {currentOption.optionName}
              </button>
            ) : (
              <form onSubmit={handleAddCustomPoint} className="space-y-3 p-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900">Додати фактор до варіанту: {currentOption.optionName}</h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingOpen(false)}
                    className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                  >
                    Скасувати
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPointType('pro')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      newPointType === 'pro'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    + Перевага (Плюс)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPointType('con')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      newPointType === 'con'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    - Ризик / Витрата (Мінус)
                  </button>
                </div>

                <input
                  type="text"
                  required
                  value={newPointText}
                  onChange={(e) => setNewPointText(e.target.value)}
                  placeholder="наприклад: Більший потенціал зростання частки або сумнівна репутація керівника"
                  className="w-full px-3 py-2 text-xs text-stone-900 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-800"
                />

                <input
                  type="text"
                  value={newPointDetail}
                  onChange={(e) => setNewPointDetail(e.target.value)}
                  placeholder="Додаткові деталі/контекст (необов'язково)..."
                  className="w-full px-3 py-2 text-xs text-stone-900 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-800"
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-stone-600">Категорія:</label>
                    <select
                      value={newPointCategory}
                      onChange={(e) => setNewPointCategory(e.target.value as any)}
                      className="px-2 py-1 text-xs bg-stone-50 border border-stone-300 rounded-lg"
                    >
                      <option value="financial">Фінанси</option>
                      <option value="emotional">Емоції / Стрес</option>
                      <option value="strategic">Стратегія</option>
                      <option value="time">Час / Свобода</option>
                      <option value="risk">Ризик / Невизначеність</option>
                      <option value="growth">Кар'єра / Зростання</option>
                      <option value="other">Інше</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-stone-600">Вплив (1-5):</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setNewPointImpact(lvl)}
                          className={`w-5 h-5 rounded text-xs font-bold ${
                            newPointImpact === lvl ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg cursor-pointer"
                  >
                    Додати пункт
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
