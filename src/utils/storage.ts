import { FullDecisionAnalysis } from '../types';

const STORAGE_KEY = 'the_tiebreaker_decisions_v1';
const ACTIVE_DECISION_KEY = 'the_tiebreaker_active_id';

export function getSavedDecisions(): FullDecisionAnalysis[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load decisions from localStorage:', e);
    return [];
  }
}

export function saveDecision(decision: FullDecisionAnalysis): void {
  try {
    const existing = getSavedDecisions();
    const index = existing.findIndex((d) => d.id === decision.id);
    let updated: FullDecisionAnalysis[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = decision;
    } else {
      updated = [decision, ...existing];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(ACTIVE_DECISION_KEY, decision.id);
  } catch (e) {
    console.error('Failed to save decision to localStorage:', e);
  }
}

export function deleteSavedDecision(id: string): FullDecisionAnalysis[] {
  try {
    const existing = getSavedDecisions();
    const updated = existing.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete decision from localStorage:', e);
    return [];
  }
}

export function getCategoryBadgeColor(category: string): { bg: string; text: string; border: string; label: string } {
  switch (category?.toLowerCase()) {
    case 'financial':
    case 'фінансовий':
      return { bg: 'bg-emerald-50 text-emerald-800', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Фінансовий' };
    case 'emotional':
    case 'емоційний':
      return { bg: 'bg-purple-50 text-purple-800', text: 'text-purple-700', border: 'border-purple-200', label: 'Емоційний / Стрес' };
    case 'strategic':
    case 'стратегічний':
      return { bg: 'bg-blue-50 text-blue-800', text: 'text-blue-700', border: 'border-blue-200', label: 'Стратегічний' };
    case 'time':
    case 'час':
      return { bg: 'bg-amber-50 text-amber-800', text: 'text-amber-700', border: 'border-amber-200', label: 'Час / Свобода' };
    case 'risk':
    case 'ризик':
      return { bg: 'bg-rose-50 text-rose-800', text: 'text-rose-700', border: 'border-rose-200', label: 'Ризик / Невизначеність' };
    case 'growth':
    case 'розвиток':
    case 'кар\'єра':
      return { bg: 'bg-teal-50 text-teal-800', text: 'text-teal-700', border: 'border-teal-200', label: 'Кар\'єра / Розвиток' };
    default:
      return { bg: 'bg-stone-100 text-stone-800', text: 'text-stone-700', border: 'border-stone-200', label: category || 'Інше' };
  }
}

export function formatDecisionAsMarkdown(decision: FullDecisionAnalysis): string {
  let md = `# Звіт про рішення: ${decision.title}\n\n`;
  if (decision.context) {
    md += `**Контекст:** ${decision.context}\n\n`;
  }
  md += `*Згенеровано The Tiebreaker на дату: ${new Date(decision.timestamp).toLocaleDateString('uk-UA')}*\n\n`;
  md += `---\n\n`;

  md += `## 🏆 Вердикт The Tiebreaker\n\n`;
  md += `**Рекомендований вибір:** **${decision.verdict.recommendedOption}** (Рівень впевненості: ${decision.verdict.confidenceScore}%)\n\n`;
  md += `> ${decision.verdict.coreRationale}\n\n`;

  md += `### ⏱️ Правило 10/10/10\n`;
  md += `- **Через 10 хвилин:** ${decision.verdict.tenTenTenRule.tenMinutes}\n`;
  md += `- **Через 10 місяців:** ${decision.verdict.tenTenTenRule.tenMonths}\n`;
  md += `- **Через 10 років:** ${decision.verdict.tenTenTenRule.tenYears}\n\n`;

  md += `### 🔄 Умовні рекомендації\n`;
  decision.verdict.conditionalAdvice.forEach((c) => {
    md += `- *Якщо ${c.condition}* → **${c.chooseOption}**: ${c.explanation}\n`;
  });
  md += `\n`;

  md += `## ⚖️ Аналіз варіантів і «За» / «Проти»\n\n`;
  decision.options.forEach((opt) => {
    md += `### ${opt.optionName} (Попередній бал: ${opt.score}/100)\n`;
    md += `*${opt.tagline}*\n\n`;
    md += `**Загальний підсумок:** ${opt.overallSummary}\n\n`;

    md += `**Переваги («За»):**\n`;
    opt.pros.forEach((p) => {
      const badge = getCategoryBadgeColor(p.category);
      md += `- **[+${p.impact}] ${p.text}** (${badge.label})${p.detail ? ` — ${p.detail}` : ''}\n`;
    });
    md += `\n`;

    md += `**Ризики та недоліки («Проти»):**\n`;
    opt.cons.forEach((c) => {
      const badge = getCategoryBadgeColor(c.category);
      md += `- **[-${c.impact}] ${c.text}** (${badge.label})${c.detail ? ` — ${c.detail}` : ''}\n`;
    });
    md += `\n`;

    md += `**SWOT-підсумок:**\n`;
    md += `- **Сильні сторони (Strengths):** ${opt.swot.strengths.join('; ')}\n`;
    md += `- **Слабкі сторони (Weaknesses):** ${opt.swot.weaknesses.join('; ')}\n`;
    md += `- **Можливості (Opportunities):** ${opt.swot.opportunities.join('; ')}\n`;
    md += `- **Загрози (Threats):** ${opt.swot.threats.join('; ')}\n\n`;
  });

  md += `## 📊 Матриця порівняння\n\n`;
  md += `| Критерій | Важливість | Переможець | Деталі |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  decision.comparisonMatrix.forEach((dim) => {
    const details = Object.entries(dim.ratings)
      .map(([opt, r]) => `${opt}: ${r.score}/10 (${r.verdict})`)
      .join('; ');
    md += `| ${dim.dimension} | ${dim.importanceWeight}/5 | **${dim.winnerOption}** | ${details} |\n`;
  });
  md += `\n`;

  if (decision.verdict.devilsAdvocate.length > 0) {
    md += `## 😈 Адвокат диявола (Стрес-тест)\n\n`;
    decision.verdict.devilsAdvocate.forEach((d) => {
      md += `### Проти варіанту «${d.targetOption}»:\n`;
      md += `*Заперечення:* ${d.challenge}\n\n`;
      md += `*Гостре питання:* **"${d.gutCheckQuestion}"**\n\n`;
    });
  }

  if (decision.verdict.blindSpots.length > 0) {
    md += `## 👁️ Приховані сліпі зони\n\n`;
    decision.verdict.blindSpots.forEach((b) => {
      md += `- ${b}\n`;
    });
    md += `\n`;
  }

  if (decision.verdict.actionSteps.length > 0) {
    md += `## 🚀 Наступні кроки до дії\n\n`;
    decision.verdict.actionSteps.forEach((s, idx) => {
      md += `${idx + 1}. ${s}\n`;
    });
  }

  return md;
}
