import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { checkSpanishSpelling, type SpellingIssue } from '@/lib/localSpellcheck';

const getFieldDescription = (target: HTMLInputElement | HTMLTextAreaElement) => {
  const nearbyLabel = target.closest('.group, div')?.querySelector('label')?.textContent;
  return [target.name, target.id, target.placeholder, target.getAttribute('aria-label'), nearbyLabel]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('es-MX');
};

const isPersonNameField = (description: string) => (
  /nombre\s*\(s\)|nombre completo|primer nombre|segundo nombre|apellidos?/.test(description)
  || /^\s*nombre\s*\*?\s*$/.test(description)
);

const isEligibleField = (target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement => {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return false;
  if (target.disabled || target.readOnly || target.dataset.spellcheck === 'false') return false;
  if (target.closest('[data-disable-local-spellcheck="true"]')) return false;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target.type !== 'text' || target.inputMode === 'numeric') return false;

  // Evita nombres propios, búsquedas y datos controlados que no son redacción clínica.
  const fieldDescription = getFieldDescription(target);
  if (isPersonNameField(fieldDescription)) return false;
  return !/(correo|email|tel[eé]fono|buscar|search|usuario|username|folio|c[oó]digo|cantidad|unidad|peso|altura|estatura|edad|calor[ií]a|kcal)/.test(fieldDescription);
};

export default function LocalSpellcheck() {
  const [issues, setIssues] = useState<SpellingIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const activeField = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const requestId = useRef(0);
  const timer = useRef<number>();

  useEffect(() => {
    const analyze = (field: HTMLInputElement | HTMLTextAreaElement) => {
      window.clearTimeout(timer.current);
      const text = field.value.trim();
      if (text.length < 3) {
        delete field.dataset.localSpelling;
        setIssues([]);
        setLoading(false);
        return;
      }

      timer.current = window.setTimeout(async () => {
        const currentRequest = ++requestId.current;
        setLoading(true);
        try {
          const nextIssues = await checkSpanishSpelling(text);
          if (currentRequest !== requestId.current || activeField.current !== field) return;
          field.dataset.localSpelling = nextIssues.length > 0 ? 'error' : 'valid';
          setIssues(nextIssues);
          setSelectedWord(current => nextIssues.some(issue => issue.word === current) ? current : null);
        } catch (error) {
          console.error('No se pudo ejecutar el corrector ortográfico local:', error);
          delete field.dataset.localSpelling;
          if (currentRequest === requestId.current) setIssues([]);
        } finally {
          if (currentRequest === requestId.current) setLoading(false);
        }
      }, 300);
    };

    const handleFocus = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) return;
      if (!isEligibleField(event.target)) {
        // El body habilita el corrector nativo globalmente. Lo apagamos de forma
        // explícita en datos personales y campos controlados para que el navegador
        // tampoco subraye nombres o apellidos válidos.
        event.target.spellcheck = false;
        delete event.target.dataset.localSpelling;
        return;
      }
      activeField.current = event.target;
      event.target.spellcheck = true;
      event.target.lang = 'es-MX';
      event.target.autocapitalize = 'sentences';
      analyze(event.target);
    };

    const handleInput = (event: Event) => {
      if (!isEligibleField(event.target)) return;
      activeField.current = event.target;
      analyze(event.target);
    };

    const handleFocusOut = (event: FocusEvent) => {
      if (event.target !== activeField.current) return;
      window.setTimeout(() => {
        if (document.activeElement !== activeField.current) {
          activeField.current = null;
          setIssues([]);
          setSelectedWord(null);
          setLoading(false);
        }
      }, 0);
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('input', handleInput);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      window.clearTimeout(timer.current);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('input', handleInput);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  if (!loading && issues.length === 0) return null;

  const selected = issues.find(issue => issue.word === selectedWord);

  return (
    <aside
      className="fixed bottom-4 right-4 z-[10000] w-[min(380px,calc(100vw-2rem))] rounded-xl border border-[#3a3a3a] bg-[#111] p-4 shadow-2xl"
      aria-live="polite"
      aria-label="Corrector ortográfico local"
      onPointerDown={event => event.preventDefault()}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#d0d0d0]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4 text-red-400" />}
            Corrector local
          </p>
          <p className="mb-0 mt-1 text-[11px] text-[#777]">
            {loading ? 'Revisando español…' : `${issues.length} ${issues.length === 1 ? 'palabra por revisar' : 'palabras por revisar'}`}
          </p>
        </div>
        <button
          type="button"
          className="rounded p-1 text-[#666] hover:bg-[#222] hover:text-white"
          onClick={() => setIssues([])}
          aria-label="Cerrar corrector"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!loading && (
        <div className="mt-3 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
          {issues.map(issue => (
            <button
              key={issue.word}
              type="button"
              className={`rounded-md border px-2 py-1 text-left text-xs decoration-red-500 decoration-wavy underline underline-offset-4 ${
                selectedWord === issue.word
                  ? 'border-red-500/70 bg-red-500/10 text-red-300'
                  : 'border-[#333] bg-[#181818] text-red-400 hover:border-[#555]'
              }`}
              onClick={() => setSelectedWord(current => current === issue.word ? null : issue.word)}
            >
              {issue.word}{issue.count > 1 ? ` ×${issue.count}` : ''}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-3 border-t border-[#292929] pt-3">
          <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-[#777]">Sugerencias</p>
          <p className="mb-0 mt-1 text-xs text-[#c5c5c5]">
            {selected.suggestions.length > 0 ? selected.suggestions.join(' · ') : 'Sin sugerencias disponibles'}
          </p>
        </div>
      )}
    </aside>
  );
}
