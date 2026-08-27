import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client (lazy or guarded)
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper for calling Gemini with retry and fallback across candidate models
async function generateContentWithRetry(
  ai: GoogleGenAI,
  requestParams: {
    contents: any;
    config?: any;
  },
  models: string[] = [
    "gemini-2.5-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
  ]
) {
  let lastError: any = null;

  for (const model of models) {
    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: requestParams.contents,
          config: requestParams.config,
        });

        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand") ||
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("overloaded");

        console.warn(
          `[Gemini Attempt ${attempt}/${maxAttempts} on model ${model}]:`,
          errMsg
        );

        if (isTransient && attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          continue;
        }

        // Move to the next model immediately if transient failure persists
        break;
      }
    }
  }

  throw lastError || new Error("Failed to generate content from AI models.");
}

// Helper to sanitize JSON response string from LLM
function sanitizeJsonString(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```json")) {
    text = text.slice(7);
  } else if (text.startsWith("```")) {
    text = text.slice(3);
  }
  if (text.endsWith("```")) {
    text = text.slice(0, -3);
  }
  return text.trim();
}
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Main AI Decision Analysis Endpoint
app.post("/api/analyze-decision", async (req, res) => {
  try {
    const { title, context, options, priorities } = req.body;

    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        error: "Будь ласка, вкажіть суть рішення та щонайменше 2 варіанти для порівняння.",
      });
    }

    const ai = getGenAI();

    const prompt = `Ти — "The Tiebreaker", провідний стратег з прийняття рішень, поведінковий економіст та раціональний радник.
Твоє завдання — всебічно оцінити дилему користувача, розсіяти когнітивні упередження, усунути параліч рішень та надати чіткий, структурований аналіз:

1. Глибокі плюси (Pros) та мінуси (Cons) для кожного варіанту з оцінкою вагомості впливу (від 1 до 5) та категоріями.
2. Стратегічний SWOT-аналіз (Сильні сторони, Слабкі сторони, Можливості, Загрози) для кожного варіанту.
3. Багатокритеріальну матрицю порівняння (Comparison Matrix), яка оцінює всі варіанти від 1 до 10 за ключовими критеріями (наприклад: Фінансовий ефект, Психологічний спокій/Стрес, Витрати часу й зусиль, Довгостроковий потенціал, Зворотність рішення).
4. Чіткий, переконливий та обґрунтований вердикт (The Tiebreaker Verdict) з рівнем впевненості (0-100%), аналізом за правилом 10/10/10 (10 хвилин, 10 місяців, 10 років), аргументами адвоката диявола (Devil's Advocate), прихованими сліпими зонами (Blind Spots) та конкретними першими кроками на найближчі 48 годин.

СУВОРА ВИМОГА ДО МОВИ (UKRAINIAN LANGUAGE ONLY):
Усі згенеровані текстові значення, заголовки, пояснення, підсумки, назви критеріїв, описи, вердикти, SWOT-пункти, аргументи, запитання, ризики та кроки до дії ПОВИННІ БУТИ НАПИСАНІ ВИКЛЮЧНО ГРАМОТНОЮ, ЖИВОЮ, ПРОФЕСІЙНОЮ УКРАЇНСЬКОЮ МОВОЮ.
Навіть якщо назва рішення, варіанти чи контекст користувача введено англійською мовою, збережи зміст, але генеруй увесь аналіз, описи критеріїв, плюси, мінуси, SWOT та рекомендації повністю українською мовою. Тільки загальновідомі власні назви брендів, продуктів (наприклад: Google, Apple, AWS) та неперекладні технічні терміни можуть залишатися в оригіналі.

Вхідні дані для аналізу:
- Суть дилеми / Назва: "${title}"
- Особистий контекст / Обставини: "${context || "Стандартний контекст прийняття важливого особистого, професійного або бізнес-рішення."}"
- Варіанти для порівняння: ${JSON.stringify(options)}
- Пріоритети та цінності користувача: ${JSON.stringify(priorities || ["Довгостроковий розвиток", "Фінансовий вплив", "Психологічний спокій та свобода", "Зворотність вибору"])}

Сформуй вичерпну відповідь у форматі JSON відповідно до вказаної схеми.`;

    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction:
          "Ти — The Tiebreaker, експертний помічник для прийняття складних рішень. Твоя мета — надати структурований, глибокий та психологічно точний аналіз. ТИ ЗОБОВ'ЯЗАНИЙ писати весь згенерований текст, аналітику, описи критеріїв, SWOT, зауваження та рекомендації ВИКЛЮЧНО УКРАЇНСЬКОЮ МОВОЮ (Ukrainian language). Назви ключів у JSON залишай незмінними відповідно до схеми.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Чітка назва дилеми українською мовою",
            },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  optionName: {
                    type: Type.STRING,
                    description: "Назва варіанту",
                  },
                  tagline: {
                    type: Type.STRING,
                    description: "Влучний короткий слоган варіанту українською мовою (наприклад: 'Високий темп та максимальний потенціал зростання')",
                  },
                  score: {
                    type: Type.INTEGER,
                    description: "Попередня загальна оцінка варіанту від 0 до 100",
                  },
                  overallSummary: {
                    type: Type.STRING,
                    description: "Розгорнутий стратегічний підсумок цього варіанту українською мовою",
                  },
                  pros: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        text: {
                          type: Type.STRING,
                          description: "Коротке формулювання переваги українською мовою",
                        },
                        detail: {
                          type: Type.STRING,
                          description: "Детальне пояснення чому це суттєвий плюс, українською мовою",
                        },
                        impact: {
                          type: Type.INTEGER,
                          description: "Важливість переваги від 1 (невелика) до 5 (вирішальна)",
                        },
                        category: {
                          type: Type.STRING,
                          description:
                            "Одна з категорій: financial, emotional, strategic, time, risk, growth, other",
                        },
                      },
                      required: ["text", "impact", "category"],
                    },
                  },
                  cons: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        text: {
                          type: Type.STRING,
                          description: "Коротке формулювання мінуса або ризику українською мовою",
                        },
                        detail: {
                          type: Type.STRING,
                          description: "Детальне пояснення загрози, витрат чи навантаження, українською мовою",
                        },
                        impact: {
                          type: Type.INTEGER,
                          description: "Тяжкість мінуса від 1 (незначний) до 5 (критичний)",
                        },
                        category: {
                          type: Type.STRING,
                          description:
                            "Одна з категорій: financial, emotional, strategic, time, risk, growth, other",
                        },
                      },
                      required: ["text", "impact", "category"],
                    },
                  },
                  swot: {
                    type: Type.OBJECT,
                    properties: {
                      strengths: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Сильні сторони (внутрішні переваги) українською мовою",
                      },
                      weaknesses: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Слабкі сторони (внутрішні обмеження та недоліки) українською мовою",
                      },
                      opportunities: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Можливості (зовнішній потенціал зростання) українською мовою",
                      },
                      threats: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Загрози (зовнішні ризики та фактори невдачі) українською мовою",
                      },
                    },
                    required: [
                      "strengths",
                      "weaknesses",
                      "opportunities",
                      "threats",
                    ],
                  },
                },
                required: [
                  "optionName",
                  "tagline",
                  "score",
                  "overallSummary",
                  "pros",
                  "cons",
                  "swot",
                ],
              },
            },
            comparisonMatrix: {
              type: Type.ARRAY,
              description: "Матриця порівняння за ключовими критеріями українською мовою",
              items: {
                type: Type.OBJECT,
                properties: {
                  dimension: {
                    type: Type.STRING,
                    description: "Назва критерію порівняння українською мовою (наприклад: 'Фінансовий ефект та дохід', 'Рівень стресу та вигорання', 'Довгостроковий кар\\'єрний розвиток', 'Зворотність та гнучкість')",
                  },
                  description: {
                    type: Type.STRING,
                    description: "Короткий опис суті критерію українською мовою",
                  },
                  importanceWeight: {
                    type: Type.INTEGER,
                    description: "Важливість критерію за замовчуванням від 1 до 5",
                  },
                  winnerOption: {
                    type: Type.STRING,
                    description: "Варіант, який перемагає в цьому критерії",
                  },
                  ratings: {
                    type: Type.ARRAY,
                    description: "Оцінки для кожного з варіантів за цим критерієм",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        optionName: { type: Type.STRING },
                        score: {
                          type: Type.INTEGER,
                          description: "Бал від 1 до 10 за цим критерієм",
                        },
                        verdict: {
                          type: Type.STRING,
                          description: "Короткий вердикт українською мовою (наприклад: 'Суттєва перевага', 'Високий ризик', 'Помірно', 'Відмінно')",
                        },
                      },
                      required: ["optionName", "score", "verdict"],
                    },
                  },
                },
                required: [
                  "dimension",
                  "description",
                  "importanceWeight",
                  "winnerOption",
                  "ratings",
                ],
              },
            },
            verdict: {
              type: Type.OBJECT,
              properties: {
                recommendedOption: {
                  type: Type.STRING,
                  description: "Головний рекомендований вибір",
                },
                confidenceScore: {
                  type: Type.INTEGER,
                  description: "Рівень впевненості у відсотках від 0 до 100",
                },
                coreRationale: {
                  type: Type.STRING,
                  description: "Вичерпне, глибоке та переконливе обґрунтування вердикту виключно українською мовою",
                },
                conditionalAdvice: {
                  type: Type.ARRAY,
                  description: "Умовні правила прийняття рішення залежно від пріоритетів",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      condition: {
                        type: Type.STRING,
                        description: "Умова українською мовою (наприклад: 'для вас на першому місці мінімізація стресу та спокій')",
                      },
                      chooseOption: {
                        type: Type.STRING,
                        description: "Який варіант обрати за цієї умови",
                      },
                      explanation: {
                        type: Type.STRING,
                        description: "Пояснення вибору за цієї умови українською мовою",
                      },
                    },
                    required: ["condition", "chooseOption", "explanation"],
                  },
                },
                tenTenTenRule: {
                  type: Type.OBJECT,
                  description: "Аналіз перспективи за правилом 10/10/10 українською мовою",
                  properties: {
                    tenMinutes: {
                      type: Type.STRING,
                      description: "Відчуття та наслідки через 10 хвилин після рішення українською мовою",
                    },
                    tenMonths: {
                      type: Type.STRING,
                      description: "Наслідки та ситуація через 10 місяців українською мовою",
                    },
                    tenYears: {
                      type: Type.STRING,
                      description: "Довгостроковий вплив на життя через 10 років українською мовою",
                    },
                  },
                  required: ["tenMinutes", "tenMonths", "tenYears"],
                },
                devilsAdvocate: {
                  type: Type.ARRAY,
                  description: "Стрес-тест і контр-аргументи адвоката диявола українською мовою",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      targetOption: {
                        type: Type.STRING,
                        description: "Варіант, проти якого висувається контр-аргумент",
                      },
                      challenge: {
                        type: Type.STRING,
                        description: "Гострий контр-аргумент/виклик українською мовою",
                      },
                      gutCheckQuestion: {
                        type: Type.STRING,
                        description: "Пряме провокативне запитання для перевірки інтуїції українською мовою",
                      },
                    },
                    required: ["targetOption", "challenge", "gutCheckQuestion"],
                  },
                },
                blindSpots: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Список схованих припущень та сліпих зон українською мовою",
                },
                actionSteps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Конкретні перші кроки на найближчі 48 годин українською мовою",
                },
              },
              required: [
                "recommendedOption",
                "confidenceScore",
                "coreRationale",
                "conditionalAdvice",
                "tenTenTenRule",
                "devilsAdvocate",
                "blindSpots",
                "actionSteps",
              ],
            },
          },
          required: ["title", "options", "comparisonMatrix", "verdict"],
        },
      },
    });

    const rawText = sanitizeJsonString(response.text || "{}");
    const parsed = JSON.parse(rawText);

    // Transform comparisonMatrix ratings array into object format for faster client lookup
    const transformedMatrix = (parsed.comparisonMatrix || []).map(
      (dim: any, idx: number) => {
        const ratingsMap: Record<string, { score: number; verdict: string }> =
          {};
        if (Array.isArray(dim.ratings)) {
          dim.ratings.forEach((r: any) => {
            ratingsMap[r.optionName] = {
              score: r.score || 5,
              verdict: r.verdict || "Посередньо",
            };
          });
        }
        return {
          id: `dim-${idx}-${Date.now()}`,
          dimension: dim.dimension,
          description: dim.description || "",
          importanceWeight: dim.importanceWeight || 3,
          ratings: ratingsMap,
          winnerOption: dim.winnerOption || "",
        };
      },
    );

    // Add unique IDs to options and pros/cons
    const transformedOptions = (parsed.options || []).map(
      (opt: any, oIdx: number) => ({
        id: `opt-${oIdx}-${Date.now()}`,
        optionName: opt.optionName,
        tagline: opt.tagline || "",
        score: opt.score || 70,
        overallSummary: opt.overallSummary || "",
        pros: (opt.pros || []).map((p: any, pIdx: number) => ({
          id: `pro-${oIdx}-${pIdx}-${Date.now()}`,
          text: p.text,
          detail: p.detail || "",
          impact: p.impact || 3,
          category: p.category || "strategic",
        })),
        cons: (opt.cons || []).map((c: any, cIdx: number) => ({
          id: `con-${oIdx}-${cIdx}-${Date.now()}`,
          text: c.text,
          detail: c.detail || "",
          impact: c.impact || 3,
          category: c.category || "strategic",
        })),
        swot: opt.swot || {
          strengths: [],
          weaknesses: [],
          opportunities: [],
          threats: [],
        },
      }),
    );

    const fullResult = {
      id: `decision-${Date.now()}`,
      timestamp: Date.now(),
      title: parsed.title || title,
      context: context || "",
      options: transformedOptions,
      comparisonMatrix: transformedMatrix,
      verdict: parsed.verdict,
    };

    res.json(fullResult);
  } catch (error: any) {
    console.error("Decision analysis error:", error);
    res.status(500).json({
      error: error?.message || "Не вдалося проаналізувати рішення. Будь ласка, спробуйте ще раз.",
    });
  }
});

// Endpoint to brainstorm more pros/cons or suggest alternatives
app.post("/api/suggest-points", async (req, res) => {
  try {
    const { title, optionName, type, existingPoints } = req.body;
    const ai = getGenAI();

    const isPro = type === "pro";
    const prompt = `Дилема / Рішення: "${title}"
Варіант для аналізу: "${optionName}"
Завдання: Згенеруй 3 гострі, важливі, неочевидні ${isPro ? "переваги (плюси, сильні сторони, позитивні наслідки)" : "ризики (мінуси, приховані витрати, небезпеки)"} для цього варіанту, яких ще немає у списку.
Вже наявні пункти: ${JSON.stringify(existingPoints || [])}

ВИМОГА ДО МОВИ:
Усі згенеровані пункти (text, detail) ПОВИННІ БУТИ НАПИСАНІ ВИКЛЮЧНО УКРАЇНСЬКОЮ МОВОЮ (Ukrainian language).

Поверни масив із 3 об'єктів формату JSON з полями:
- text: коротка та влучна назва пункту українською мовою (до 8-10 слів)
- detail: 1-2 речення конкретного пояснення українською мовою
- impact: оцінка вагомості від 1 до 5
- category: категорія (одне зі значень: financial, emotional, strategic, time, risk, growth, other)`;

    const response = await generateContentWithRetry(ai, {
      contents: prompt,
      config: {
        systemInstruction:
          "Ти — аналітик рішень The Tiebreaker. Генеруй аргументи виключно українською мовою з високим рівнем конкретики та практичної користі.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: "Коротка назва пункту українською мовою",
              },
              detail: {
                type: Type.STRING,
                description: "Пояснення суті пункту українською мовою",
              },
              impact: {
                type: Type.INTEGER,
                description: "Вагомість від 1 до 5",
              },
              category: {
                type: Type.STRING,
                description: "Одна з категорій: financial, emotional, strategic, time, risk, growth, other",
              },
            },
            required: ["text", "impact", "category"],
          },
        },
      },
    });

    const parsed = JSON.parse(sanitizeJsonString(response.text || "[]"));
    res.json({ points: parsed });
  } catch (error: any) {
    console.error("Suggest points error:", error);
    res.status(500).json({ error: error?.message || "Не вдалося згенерувати додаткові пункти." });
  }
});

// Start server with Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Tiebreaker server running on http://localhost:${PORT}`);
  });
}

startServer();
