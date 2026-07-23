import nspell from 'nspell';
import esAffUrl from '../../node_modules/dictionary-es/index.aff?url';
import esDicUrl from '../../node_modules/dictionary-es/index.dic?url';

export interface SpellingIssue {
  word: string;
  count: number;
  suggestions: string[];
}

const DOMAIN_WORDS = [
  'antropometría', 'antropométrico', 'antropométrica', 'bioimpedancia',
  'cacahuate', 'cacahuates',
  'cardiometabólico', 'colación', 'dietético', 'dietética', 'glucemia',
  'hipercalórico', 'hipocalórico', 'kilocaloría', 'kilocalorías', 'macronutriente',
  'macronutrientes', 'microbiota', 'nutrióloga', 'nutriólogo', 'nutricional',
  'somatometría', 'suplementación', 'triglicéridos', 'vegetariano', 'vegetariana',
];

let checkerPromise: Promise<ReturnType<typeof nspell>> | null = null;

const loadText = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar el diccionario (${response.status})`);
  return response.text();
};

const getChecker = () => {
  if (!checkerPromise) {
    checkerPromise = Promise.all([loadText(esAffUrl), loadText(esDicUrl)]).then(([aff, dic]) => {
      const checker = nspell(aff, dic);
      DOMAIN_WORDS.forEach(word => checker.add(word));
      return checker;
    });
  }
  return checkerPromise;
};

const WORD_PATTERN = /[\p{L}]+(?:[’'-][\p{L}]+)*/gu;

const shouldIgnore = (word: string) => {
  if (word.length < 3) return true;
  // Acrónimos clínicos y abreviaturas controladas (IMC, SMAE, HDL, etc.).
  if (word.length <= 6 && word === word.toLocaleUpperCase('es-MX')) return true;
  return false;
};

export const checkSpanishSpelling = async (text: string): Promise<SpellingIssue[]> => {
  const checker = await getChecker();
  const words = text.match(WORD_PATTERN) ?? [];
  const issues = new Map<string, { word: string; count: number }>();

  words.forEach(word => {
    if (shouldIgnore(word)) return;
    const normalized = word.toLocaleLowerCase('es-MX');
    if (checker.correct(word) || checker.correct(normalized)) return;
    const current = issues.get(normalized);
    issues.set(normalized, { word: current?.word ?? word, count: (current?.count ?? 0) + 1 });
  });

  return [...issues.entries()].map(([normalized, issue]) => ({
    ...issue,
    suggestions: checker.suggest(normalized).slice(0, 5),
  }));
};
