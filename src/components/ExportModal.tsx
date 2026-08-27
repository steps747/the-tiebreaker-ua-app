import { useState } from 'react';
import { Copy, Check, FileText, Printer } from 'lucide-react';
import { FullDecisionAnalysis } from '../types';
import { formatDecisionAsMarkdown } from '../utils/storage';

interface ExportModalProps {
  decision: FullDecisionAnalysis;
  onClose: () => void;
}

export function ExportModal({ decision, onClose }: ExportModalProps) {
  const [copied, setCopied] = useState(false);
  const markdownContent = formatDecisionAsMarkdown(decision);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy to clipboard', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-stone-800" />
            <h3 className="text-base font-bold text-stone-900">Експорт звіту рішення</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-stone-500">
          Скопіюйте цей підсумок рішення в Notion, Obsidian, Google Документи або надішліть колегам.
        </p>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto bg-stone-50 border border-stone-200 rounded-xl p-4 font-mono text-xs text-stone-800 whitespace-pre-wrap select-all">
          {markdownContent}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Друк</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-5 py-2 text-xs font-bold text-white bg-stone-950 hover:bg-stone-800 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Скопійовано в буфер!' : 'Копіювати Markdown'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
