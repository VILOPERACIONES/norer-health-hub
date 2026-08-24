import { Plus, Trash2 } from 'lucide-react';

export interface SupplementHistoryItem {
  id: string;
  nombre: string;
  indicaciones: string;
  activo: boolean;
}

interface SupplementHistoryEditorProps {
  value: SupplementHistoryItem[];
  onChange: (value: SupplementHistoryItem[]) => void;
}

const newSupplement = (): SupplementHistoryItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  nombre: '',
  indicaciones: '',
  activo: true,
});

export function SupplementHistoryEditor({ value, onChange }: SupplementHistoryEditorProps) {
  const update = (index: number, changes: Partial<SupplementHistoryItem>) => {
    onChange(value.map((item, currentIndex) => (
      currentIndex === index ? { ...item, ...changes } : item
    )));
  };

  return (
    <div className="col-span-full space-y-3">
      <label className="text-[12px] font-medium text-text-secondary uppercase tracking-widest ml-1 leading-none block">
        Suplementos Actuales del Paciente
      </label>
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-[12px] p-4 space-y-2">
        {value.length > 0 && (
          <div className="grid grid-cols-[1.5fr_2fr_48px_40px] gap-3 items-center px-2 py-1 text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest border-b border-[#2a2a2a] mb-2">
            <div>Suplemento</div>
            <div>Indicaciones / Dosis</div>
            <div className="text-center">Activo</div>
            <div />
          </div>
        )}
        <div className="flex justify-start pb-1">
          <button
            type="button"
            onClick={() => onChange([newSupplement(), ...value])}
            className="flex items-center gap-2 text-[12px] font-bold text-[#0a0a0a] bg-[#f0f0f0] hover:bg-white px-4 py-2 rounded-[8px] transition-colors uppercase tracking-wider"
          >
            <Plus className="w-4 h-4" /> Agregar Suplemento
          </button>
        </div>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {value.map((item, index) => (
            <div key={item.id} className="grid grid-cols-[1.5fr_2fr_48px_40px] gap-3 items-center bg-[#181818] p-3 rounded-[8px] border border-[#2a2a2a] animate-fade-in">
              <input
                type="text"
                value={item.nombre}
                onChange={(event) => update(index, { nombre: event.target.value })}
                placeholder="Ej. Creatina"
                className="w-full bg-transparent text-[13px] font-semibold text-white outline-none placeholder-[#555] p-1 border-b border-transparent focus:border-[#444] transition-colors"
              />
              <input
                type="text"
                value={item.indicaciones}
                onChange={(event) => update(index, { indicaciones: event.target.value })}
                placeholder="Ej. 5g pre-entreno"
                className="w-full bg-transparent text-[13px] text-[#c0c0c0] outline-none placeholder-[#555] p-1 border-b border-transparent focus:border-[#444] transition-colors"
              />
              <div className="flex justify-center">
                <button
                  type="button"
                  aria-label={`${item.activo ? 'Desactivar' : 'Activar'} ${item.nombre || 'suplemento'}`}
                  onClick={() => update(index, { activo: !item.activo })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${item.activo ? 'bg-accent-green' : 'bg-[#333]'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${item.activo ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>
              <button
                type="button"
                aria-label={`Eliminar ${item.nombre || 'suplemento'}`}
                onClick={() => onChange(value.filter((_, currentIndex) => currentIndex !== index))}
                className="p-2 text-[#555] hover:text-[#ff6b6b] hover:bg-[#ff6b6b]/10 rounded-[6px] transition-colors flex justify-center items-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {value.length === 0 && (
            <p className="text-[12px] text-[#8a8a8a] text-center py-4">Sin suplementos registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
}
