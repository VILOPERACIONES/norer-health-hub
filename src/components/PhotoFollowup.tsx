import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Check, ImagePlus, Star, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { compressFollowupPhoto, type PendingFollowupPhoto } from '@/lib/followupPhotos';

type StoredPhoto = {
  id: string;
  nombreOriginal?: string;
  esPrincipal: boolean;
  createdAt: string;
  previewUrl?: string;
};

export function PhotoFollowup({
  pacienteId,
  valoracionId,
  onPendingChange,
}: {
  pacienteId: string;
  valoracionId?: string;
  onPendingChange: (photos: PendingFollowupPhoto[]) => void;
}) {
  const { toast } = useToast();
  const [stored, setStored] = useState<StoredPhoto[]>([]);
  const [pending, setPending] = useState<PendingFollowupPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const urlsRef = useRef<string[]>([]);
  const total = stored.length + pending.length;

  const basePath = valoracionId
    ? `/api/pacientes/${pacienteId}/valoraciones/${valoracionId}/fotos`
    : '';

  useEffect(() => {
    if (!basePath) return;
    let cancelled = false;
    const load = async () => {
      try {
        const response = await api.get(basePath);
        const metadata: StoredPhoto[] = response.data?.data || response.data || [];
        const hydrated = await Promise.all(metadata.map(async (photo) => {
          const file = await api.get(`${basePath}/${photo.id}/archivo`, { responseType: 'blob' });
          const previewUrl = URL.createObjectURL(file.data);
          urlsRef.current.push(previewUrl);
          return { ...photo, previewUrl };
        }));
        if (!cancelled) setStored(hydrated);
      } catch {
        if (!cancelled) toast({ title: 'No se pudo cargar el historial fotográfico', variant: 'destructive' });
      }
    };
    void load();
    return () => {
      cancelled = true;
      urlsRef.current.forEach(URL.revokeObjectURL);
      urlsRef.current = [];
    };
  }, [basePath]);

  const updatePending = (next: PendingFollowupPhoto[]) => {
    setPending(next);
    onPendingChange(next);
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const available = 4 - total;
    if (available <= 0) return;
    setLoading(true);
    try {
      const selected = Array.from(files).slice(0, available);
      const compressed = await Promise.all(selected.map(compressFollowupPhoto));
      const hasPrincipal = stored.some(photo => photo.esPrincipal) || pending.some(photo => photo.esPrincipal);
      if (!hasPrincipal && compressed[0]) compressed[0].esPrincipal = true;
      updatePending([...pending, ...compressed]);
      if (files.length > available) {
        toast({ title: 'Límite de fotografías', description: 'Sólo se agregaron las necesarias para completar el máximo de 4.' });
      }
    } catch (err) {
      toast({ title: 'No se pudo procesar la fotografía', description: err instanceof Error ? err.message : 'Archivo inválido.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const markPendingPrincipal = (localId: string) => {
    setStored(items => items.map(item => ({ ...item, esPrincipal: false })));
    updatePending(pending.map(item => ({ ...item, esPrincipal: item.localId === localId })));
  };

  const markStoredPrincipal = async (id: string) => {
    if (!basePath) return;
    try {
      await api.patch(`${basePath}/${id}/principal`);
      setStored(items => items.map(item => ({ ...item, esPrincipal: item.id === id })));
      updatePending(pending.map(item => ({ ...item, esPrincipal: false })));
    } catch {
      toast({ title: 'No se pudo cambiar la fotografía principal', variant: 'destructive' });
    }
  };

  const removeStored = async (photo: StoredPhoto) => {
    if (!basePath || !window.confirm(`¿Eliminar definitivamente “${photo.nombreOriginal || 'esta fotografía'}”?`)) return;
    try {
      const response = await api.delete(`${basePath}/${photo.id}`);
      const reemplazoId = response.data?.data?.reemplazoId || response.data?.reemplazoId || null;
      if (photo.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      setStored(items => items
        .filter(item => item.id !== photo.id)
        .map(item => ({ ...item, esPrincipal: item.id === reemplazoId })));
      if (photo.esPrincipal && !reemplazoId && pending.length > 0) {
        updatePending(pending.map((item, index) => ({ ...item, esPrincipal: index === 0 })));
      }
    } catch {
      toast({ title: 'No se pudo eliminar la fotografía', variant: 'destructive' });
    }
  };

  const cards = useMemo(() => [
    ...stored.map(photo => ({ kind: 'stored' as const, id: photo.id, src: photo.previewUrl, name: photo.nombreOriginal, principal: photo.esPrincipal, photo })),
    ...pending.map(photo => ({ kind: 'pending' as const, id: photo.localId, src: photo.dataUrl, name: photo.nombreOriginal, principal: photo.esPrincipal, photo })),
  ], [stored, pending]);

  return (
    <div className="mt-5 pt-5 border-t border-[#2a2a2a]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[11px] font-bold text-white uppercase tracking-widest flex items-center gap-2"><Camera className="h-4 w-4 text-brand-primary" /> Seguimiento fotoscópico</p>
          <p className="text-[11px] text-[#777] mt-1">{total} de 4 fotografías. La marcada con estrella aparecerá en el reporte.</p>
        </div>
        <label className={`flex items-center gap-2 px-3 py-2 rounded-[7px] text-[11px] font-bold uppercase tracking-wider border transition-colors ${total >= 4 || loading ? 'opacity-40 cursor-not-allowed border-[#333] text-[#777]' : 'cursor-pointer border-brand-primary/50 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20'}`}>
          <ImagePlus className="h-4 w-4" /> {loading ? 'Comprimiendo…' : 'Agregar foto'}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={total >= 4 || loading} className="hidden" onChange={(event) => { void addPhotos(event.target.files); event.currentTarget.value = ''; }} />
        </label>
      </div>

      {cards.length === 0 ? (
        <div className="border border-dashed border-[#333] rounded-[10px] p-5 text-center text-[11px] text-[#666]">Sin fotografías en esta consulta. No es obligatorio cargar las cuatro.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cards.map(card => (
            <div key={`${card.kind}-${card.id}`} className={`relative overflow-hidden rounded-[10px] border bg-[#0d0d0d] ${card.principal ? 'border-brand-primary ring-1 ring-brand-primary/40' : 'border-[#333]'}`}>
              <div className="aspect-square bg-black flex items-center justify-center">
                {card.src && <img src={card.src} alt={card.name || 'Seguimiento'} className="w-full h-full object-contain" />}
              </div>
              <div className="p-2 flex items-center justify-between gap-1">
                <button type="button" onClick={() => card.kind === 'stored' ? void markStoredPrincipal(card.id) : markPendingPrincipal(card.id)} className={`flex items-center gap-1 text-[9px] font-bold uppercase ${card.principal ? 'text-brand-primary' : 'text-[#777] hover:text-white'}`}>
                  {card.principal ? <Check className="h-3 w-3" /> : <Star className="h-3 w-3" />} {card.principal ? 'Principal' : 'Usar en PDF'}
                </button>
                <button type="button" onClick={() => card.kind === 'stored' ? void removeStored(card.photo as StoredPhoto) : updatePending(pending.filter(item => item.localId !== card.id))} className="p-1 text-red-400 hover:text-white" title="Eliminar fotografía"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
