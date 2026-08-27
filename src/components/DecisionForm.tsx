import { useState, type FormEvent } from 'react';
import { Plus, Trash2, Sparkles, BookOpen, ArrowRight, Lightbulb } from 'lucide-react';
import { DECISION_PRESETS, POPULAR_PRIORITIES } from '../data/presets';
import { DecisionPreset } from '../types';

interface DecisionFormProps {
  onSubmit: (data: {
    title: string;
    context: string;
    options: string[];
    priorities: string[];
  }) => void;
  isLoading: boolean;
  loadingStep: string;
}

export function DecisionForm({ onSubmit, isLoading, loadingStep }: DecisionFormProps) {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [priorities, setPriorities] = useState<string[]>([
    'Фінансовий дохід і витрати',
    'Спокій та низький рівень стресу',
    'Довгострокові кар\'єрні перспективи',
  ]);
  const [customPriority, setCustomPriority] = useState('');
  const [showPresetsModal, setShowPresetsModal] = useState(false);

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  };

  const togglePriority = (priority: string) => {
    if (priorities.includes(priority)) {
      setPriorities(priorities.filter((p) => p !== priority));
    } else {
      setPriorities([...priorities, priority]);
    }
  };

  const handleAddCustomPriority = (e: FormEvent) => {
    e.preventDefault();
    if (customPriority.trim() && !priorities.includes(customPriority.trim())) {
      setPriorities([...priorities, customPriority.trim()]);
      setCustomPriority('');
    }
  };

  const loadPreset = (preset: DecisionPreset) => {
    setTitle(preset.title);
    setOptions([...preset.options]);
    setContext(preset.context);
    setPriorities([...preset.priorities]);
    setShowPresetsModal(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!title.trim()) return;
    if (validOptions.length < 2) return;

    onSubmit({
      title: title.trim(),
      context: context.trim(),
      options: validOptions,
      priorities,
    });
  };

  return (
    <div id="decision-form-container" className="w-full max-w-4xl mx-auto">
      {/* Top Presets trigger banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 bg-amber-50/80 border border-amber-200/70 rounded-xl">
        <div className="flex items-center gap-2 text-amber-900 text-sm font-medium">
          <BookOpen className="w-4 h-4 text-amber-700" />
          <span>Потрібне натхнення? Спробуйте готові приклади дилем:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {DECISION_PRESETS.slice(0, 3).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => loadPreset(preset)}
              className="px-3 py-1 text-xs font-medium text-amber-950 bg-white/90 hover:bg-white border border-amber-300 rounded-lg shadow-2xs transition-all hover:scale-102 cursor-pointer"
            >
              {preset.category}: {preset.options[0].split(' ')[0]} проти {preset.options[1].split(' ')[0]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowPresetsModal(true)}
            className="px-2.5 py-1 text-xs font-semibold text-amber-800 hover:text-amber-950 underline underline-offset-2 cursor-pointer"
          >
            Переглянути всі 5
          </button>
        </div>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-stone-200/90 rounded-2xl shadow-xs p-6 md:p-8 space-y-7">
        {/* Decision Title */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="decision-title" className="block text-sm font-semibold text-stone-900">
              Яке рішення ви намагаєтесь прийняти? <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-stone-600 font-medium">Будьте якомога конкретнішими</span>
          </div>
          <input
            id="decision-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="наприклад: Чи варто прийняти пропозицію від стартапу або залишитися на стабільній роботі?"
            className="w-full px-4 py-3 text-base text-stone-900 placeholder:text-stone-600 bg-stone-50/60 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-800 transition-all"
            disabled={isLoading}
          />
        </div>

        {/* Options to Compare */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-stone-900">
              Варіанти для порівняння <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-stone-600 font-medium">від 2 до 5 варіантів</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx);
              return (
                <div key={idx} className="relative flex items-center">
                  <div className="absolute left-3.5 flex items-center justify-center w-6 h-6 rounded-md bg-stone-900 text-white text-xs font-bold pointer-events-none">
                    {letter}
                  </div>
                  <input
                    type="text"
                    required
                    value={option}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Варіант ${letter} (наприклад: ${idx === 0 ? 'Прийняти пропозицію стартапу' : 'Залишитися в поточній компанії'})`}
                    className="w-full pl-12 pr-10 py-3 text-sm text-stone-900 placeholder:text-stone-600 bg-stone-50/60 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-800 transition-all"
                    disabled={isLoading}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      disabled={isLoading}
                      className="absolute right-3 p-1 text-stone-600 hover:text-rose-600 transition-colors"
                      title="Видалити варіант"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {options.length < 5 && (
            <button
              type="button"
              onClick={handleAddOption}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Додати варіант {String.fromCharCode(65 + options.length)}
            </button>
          )}
        </div>

        {/* Situation / Context (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="decision-context" className="block text-sm font-semibold text-stone-900">
              Особистий контекст та ключові деталі <span className="text-xs font-normal text-stone-600">(Необов'язково, але підвищує точність)</span>
            </label>
          </div>
          <textarea
            id="decision-context"
            rows={3}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Опишіть різницю в зарплаті, часові рамки, сімейні обставини, готовність до ризику чи ваші головні хвилювання..."
            className="w-full px-4 py-3 text-sm text-stone-900 placeholder:text-stone-600 bg-stone-50/60 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-800 transition-all resize-y"
            disabled={isLoading}
          />
        </div>

        {/* Priority Values Filter */}
        <div className="space-y-3 pt-1 border-t border-stone-100">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-stone-900">
              Що для вас найважливіше в цьому рішенні?
            </label>
            <span className="text-xs text-stone-600 font-medium">обрано: {priorities.length}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {POPULAR_PRIORITIES.map((p) => {
              const isSelected = priorities.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePriority(p)}
                  disabled={isLoading}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-100'
                  }`}
                >
                  {isSelected && '✓ '}
                  {p}
                </button>
              );
            })}
          </div>

          {/* Add custom priority */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={customPriority}
              onChange={(e) => setCustomPriority(e.target.value)}
              placeholder="Додати свій пріоритет..."
              className="px-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-600 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:border-stone-600"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (customPriority.trim() && !priorities.includes(customPriority.trim())) {
                    setPriorities([...priorities, customPriority.trim()]);
                    setCustomPriority('');
                  }
                }
              }}
            />
            {customPriority.trim() && (
              <button
                type="button"
                onClick={handleAddCustomPriority}
                className="px-3 py-1.5 text-xs font-semibold text-stone-800 bg-stone-200 hover:bg-stone-300 rounded-lg cursor-pointer"
              >
                Додати
              </button>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            id="break-the-tie-btn"
            type="submit"
            disabled={isLoading || !title.trim() || options.filter((o) => o.trim()).length < 2}
            className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold text-base transition-all shadow-md cursor-pointer ${
              isLoading || !title.trim() || options.filter((o) => o.trim()).length < 2
                ? 'bg-stone-200 text-stone-600 cursor-not-allowed shadow-none'
                : 'bg-stone-950 text-white hover:bg-stone-900 active:scale-99'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{loadingStep || 'Оцінка вашого рішення за допомогою Gemini AI...'}</span>
              </div>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Проаналізувати рішення та зробити вибір</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preset Modal */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-stone-900">Готові приклади дилем</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPresetsModal(false)}
                className="p-1.5 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {DECISION_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => loadPreset(preset)}
                  className="p-4 rounded-xl border border-stone-200 hover:border-stone-800 hover:bg-stone-50/80 transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                      {preset.category}
                    </span>
                    <span className="text-xs font-semibold text-stone-600 group-hover:text-stone-900">
                      Завантажити приклад →
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-stone-900">{preset.title}</h4>
                  <p className="text-xs text-stone-600 leading-relaxed">{preset.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {preset.options.map((opt, i) => (
                      <span key={i} className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-medium">
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
