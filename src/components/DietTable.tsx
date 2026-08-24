import React, { useCallback, useId } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { Recall24Row } from '@/lib/recall24';

/* ── Styles (shared between NewPatient and NewAssessment) ─────────────────── */

interface DietTableProps {
  habitos: Recall24Row[];
  setHabitos: React.Dispatch<React.SetStateAction<Recall24Row[]>>;
  /** Dark variant used in NewAssessment (bg-[#181818], etc.) */
  variant?: 'default' | 'dark';
}

/* ── Sortable Row ─────────────────────────────────────────────────────────── */

interface SortableRowProps {
  id: string;
  index: number;
  row: Recall24Row;
  onFieldChange: (index: number, field: keyof Recall24Row, value: string) => void;
  onRemove: (index: number) => void;
  variant: 'default' | 'dark';
}

const SortableRow = ({ id, index, row, onFieldChange, onRemove, variant }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative',
  };

  const dark = variant === 'dark';

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50 shadow-lg' : ''} ${dark ? 'bg-[#111111]' : 'bg-bg-surface'}`}
    >
      {/* Drag handle */}
      <td className="py-2 w-8">
        <button
          type="button"
          className={`p-1 rounded cursor-grab active:cursor-grabbing transition-colors ${
            dark
              ? 'text-[#555] hover:text-[#888]'
              : 'text-text-muted hover:text-text-secondary'
          }`}
          {...attributes}
          {...listeners}
          title="Arrastrar para reordenar"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </td>

      {/* Fields */}
      {(['label', 'hora', 'notas'] as const).map((field) => (
        <td key={field} className="py-2 pr-3">
          <input
            type="text"
            value={row[field]}
            onChange={(e) => onFieldChange(index, field, e.target.value)}
            placeholder={
              field === 'label'
                ? 'Tiempo de comida'
                : field === 'hora'
                ? '7:00 am'
                : 'Notas (opcional)'
            }
            className={`w-full rounded-[6px] px-3 py-2 text-[13px] font-medium outline-none border transition-colors ${
              dark
                ? 'bg-[#181818] text-white border-[#333] focus:border-[#555]'
                : 'bg-bg-elevated text-text-primary border-border-subtle focus:border-[#555]'
            }`}
          />
        </td>
      ))}

      {/* Delete */}
      <td className="py-2">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className={`p-2 rounded-[6px] transition-colors ${
            dark
              ? 'text-[#8a8a8a] hover:text-[#ff6b6b] hover:bg-[#181818]'
              : 'text-text-muted hover:text-accent-red hover:bg-bg-elevated'
          }`}
          title="Eliminar tiempo"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

/* ── Main Component ───────────────────────────────────────────────────────── */

const DietTable = ({ habitos, setHabitos, variant = 'default' }: DietTableProps) => {
  const dndId = useId();
  const dark = variant === 'dark';

  // Ensure every row has a persistent id in state
  React.useEffect(() => {
    if (habitos.some((h) => !h.id)) {
      setHabitos((prev) =>
        prev.map((h, i) => (h.id ? h : { ...h, id: `diet-${i + 1}-${Math.random().toString(36).slice(2, 8)}` }))
      );
    }
  }, [habitos, setHabitos]);

  // Stable IDs directly from item.id
  const rowIds = React.useMemo(
    () => habitos.map((h, i) => h.id || `diet-tmp-${i}`),
    [habitos]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setHabitos((prev) => {
        const oldIndex = prev.findIndex((h, i) => (h.id || `diet-tmp-${i}`) === active.id);
        const newIndex = prev.findIndex((h, i) => (h.id || `diet-tmp-${i}`) === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(prev, oldIndex, newIndex);
        }
        return prev;
      });
    },
    [setHabitos]
  );

  const handleFieldChange = useCallback(
    (index: number, field: keyof Recall24Row, value: string) => {
      setHabitos((rows) =>
        rows.map((item, i) => (i === index ? { ...item, [field]: value } : item))
      );
    },
    [setHabitos]
  );

  const handleRemove = useCallback(
    (index: number) => {
      setHabitos((rows) => rows.filter((_, i) => i !== index));
    },
    [setHabitos]
  );

  return (
    <div className="overflow-x-auto">
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="w-full min-w-[560px] text-[12px]">
          <thead>
            <tr className={`border-b ${dark ? 'border-[#333]' : 'border-border-subtle'}`}>
              <th className="w-8" />
              {['Tiempo', 'Hora', 'Notas'].map((label) => (
                <th
                  key={label}
                  className={`text-left text-[10px] font-bold uppercase tracking-widest pb-2 pr-3 ${
                    dark ? 'text-[#8a8a8a]' : 'text-text-muted font-medium'
                  }`}
                >
                  {label}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            <tbody className={`divide-y ${dark ? 'divide-[#2a2a2a]' : 'divide-border-subtle/50'}`}>
              {habitos.map((row, index) => (
                <SortableRow
                  key={rowIds[index]}
                  id={rowIds[index]}
                  index={index}
                  row={row}
                  onFieldChange={handleFieldChange}
                  onRemove={handleRemove}
                  variant={variant}
                />
              ))}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>
    </div>
  );
};

export default DietTable;
