import { useState } from 'react';
import { Trophy, HelpCircle, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { ComparisonDimension, OptionAnalysis } from '../types';

interface ComparisonTableViewProps {
  options: OptionAnalysis[];
  matrix: ComparisonDimension[];
  onMatrixChange: (updatedMatrix: ComparisonDimension[]) => void;
}

export function ComparisonTableView({ options, matrix, onMatrixChange }: ComparisonTableViewProps) {
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);

  const handleWeightChange = (dimId: string, newWeight: number) => {
    const updated = matrix.map((d) => (d.id === dimId ? { ...d, importanceWeight: newWeight } : d));
    onMatrixChange(updated);
  };

  // Calculate weighted aggregate scores for each option
  const totalWeight = matrix.reduce((acc, d) => acc + d.importanceWeight, 0) || 1;
  const weightedScores: Record<string, number> = {};

  options.forEach((opt) => {
    let sum = 0;
    matrix.forEach((dim) => {
      const rating = dim.ratings[opt.optionName]?.score || 5;
      sum += rating * dim.importanceWeight;
    });
    // scale to 0-100
    weightedScores[opt.optionName] = Math.round((sum / (totalWeight * 10)) * 100);
  });

  // Find top weighted option
  let highestWeightedOption = options[0]?.optionName;
  let maxScore = -1;
  Object.entries(weightedScores).forEach(([optName, score]) => {
    if (score > maxScore) {
      maxScore = score;
      highestWeightedOption = optName;
    }
  });

  return (
    <div id="comparison-table-root" className="space-y-6">
      {/* Weighted Score Leaderboard Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-stone-700" />
            <h3 className="text-sm font-bold text-stone-900">Зважений підсумок за критеріями в реальному часі</h3>
          </div>
          <p className="text-xs text-stone-500 pt-0.5">
            Налаштуйте важливість (1-5) для кожного критерію нижче, щоб побачити, як змінюється математична перевага варіантів.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {options.map((opt) => {
            const score = weightedScores[opt.optionName] || 0;
            const isLeader = opt.optionName === highestWeightedOption;
            return (
              <div
                key={opt.id}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                  isLeader
                    ? 'bg-amber-50 text-amber-950 border-amber-300 shadow-2xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200'
                }`}
              >
                {isLeader && <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                <span className="truncate max-w-[140px]">{opt.optionName}</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-black ${
                    isLeader ? 'bg-amber-200 text-amber-950' : 'bg-stone-200 text-stone-800'
                  }`}
                >
                  {score}/100
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Responsive Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-100/90 border-b border-stone-200 text-xs font-bold text-stone-800">
                <th className="py-3.5 px-4 w-[280px]">Критерій оцінки</th>
                <th className="py-3.5 px-3 w-[150px] text-center">Ваша вага (1-5)</th>
                {options.map((opt, idx) => (
                  <th key={opt.id} className="py-3.5 px-4 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-stone-900 text-white flex items-center justify-center text-[10px]">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="truncate">{opt.optionName}</span>
                    </div>
                  </th>
                ))}
                <th className="py-3.5 px-4 text-center w-[160px]">Лідер у критерії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {matrix.map((dim) => {
                const isExpanded = expandedDimension === dim.id;
                return (
                  <tr
                    key={dim.id}
                    className="hover:bg-stone-50/70 transition-colors group"
                  >
                    {/* Dimension Name & Description */}
                    <td className="py-4 px-4 align-top">
                      <div className="space-y-1">
                        <div className="font-bold text-stone-900 flex items-center justify-between">
                          <span>{dim.dimension}</span>
                          <button
                            type="button"
                            onClick={() => setExpandedDimension(isExpanded ? null : dim.id)}
                            className="text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer md:hidden"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-stone-500 leading-tight">
                          {dim.description}
                        </p>
                      </div>
                    </td>

                    {/* Weight Control */}
                    <td className="py-4 px-3 align-top text-center">
                      <div className="inline-flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
                        {[1, 2, 3, 4, 5].map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => handleWeightChange(dim.id, w)}
                            className={`w-5 h-5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              w <= dim.importanceWeight
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-200 text-stone-500 hover:bg-stone-300'
                            }`}
                            title={`Встановити вагу ${w}`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* Ratings for each option */}
                    {options.map((opt) => {
                      const rating = dim.ratings[opt.optionName] || { score: 5, verdict: 'Посередньо' };
                      const isWinner = dim.winnerOption === opt.optionName;
                      return (
                        <td key={opt.id} className="py-4 px-4 align-top">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-black px-2 py-0.5 rounded-md ${
                                  rating.score >= 8
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : rating.score >= 5
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {rating.score}/10
                              </span>
                              {isWinner && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                  Перевага
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-600 leading-relaxed font-medium">
                              {rating.verdict}
                            </p>
                          </div>
                        </td>
                      );
                    })}

                    {/* Winner Option Badge */}
                    <td className="py-4 px-4 align-top text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-900 text-white shadow-2xs">
                        <Trophy className="w-3 h-3 text-amber-300" />
                        <span className="truncate max-w-[110px]">{dim.winnerOption}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
