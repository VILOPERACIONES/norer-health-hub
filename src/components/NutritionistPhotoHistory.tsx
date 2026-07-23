import { useEffect, useMemo, useState } from 'react';
import { Camera, Download, Star } from 'lucide-react';
import api from '@/lib/api';

type Photo = {
  id: string;
  valoracionId: string;
  nombreOriginal?: string;
  esPrincipal: boolean;
  valoracion: { fecha: string; numeroValoracion?: number };
  previewUrl?: string;
};

export function NutritionistPhotoHistory({ pacienteId }: { pacienteId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    const load = async () => {
      try {
        const response = await api.get(`/api/pacientes/${pacienteId}/fotos`);
        const metadata: Photo[] = response.data?.data || response.data || [];
        const hydrated = await Promise.all(metadata.map(async photo => {
          const file = await api.get(`/api/pacientes/${pacienteId}/valoraciones/${photo.valoracionId}/fotos/${photo.id}/archivo`, { responseType: 'blob' });
          const previewUrl = URL.createObjectURL(file.data);
          urls.push(previewUrl);
          return { ...photo, previewUrl };
        }));
        if (!cancelled) setPhotos(hydrated);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; urls.forEach(URL.revokeObjectURL); };
  }, [pacienteId]);

  const groups = useMemo(() => {
    const map = new Map<string, Photo[]>();
    photos.forEach(photo => {
      const date = photo.valoracion.fecha.split('T')[0];
      map.set(date, [...(map.get(date) || []), photo]);
    });
    return Array.from(map.entries());
  }, [photos]);

  if (!loading && photos.length === 0) return null;

  return (
    <section className="space-y-4 pt-4">
      <div className="flex items-center gap-3">
        <Camera className="h-4 w-4 text-brand-primary" />
        <div><h2 className="text-[18px] font-semibold text-text-primary m-0">Seguimiento fotoscópico</h2><p className="text-[12px] text-text-muted">Historial privado por consulta</p></div>
      </div>
      {loading ? <div className="h-36 rounded-[12px] bg-bg-surface animate-pulse" /> : (
        <div className="space-y-3">
          {groups.map(([date, items]) => (
            <div key={date} className="bg-bg-surface border border-border-default rounded-[12px] p-4">
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-3">{new Date(`${date}T12:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {items.map(photo => (
                  <div key={photo.id} className={`relative rounded-[9px] overflow-hidden bg-black border ${photo.esPrincipal ? 'border-brand-primary' : 'border-border-subtle'}`}>
                    <div className="aspect-square flex items-center justify-center"><img src={photo.previewUrl} alt={photo.nombreOriginal || 'Seguimiento'} className="w-full h-full object-contain" /></div>
                    {photo.esPrincipal && <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-brand-primary text-black text-[9px] font-bold uppercase"><Star className="h-3 w-3" fill="currentColor" /> PDF</span>}
                    <a href={photo.previewUrl} download={photo.nombreOriginal || `seguimiento-${date}.jpg`} className="absolute bottom-2 right-2 p-2 rounded-full bg-black/75 text-white hover:bg-brand-primary hover:text-black" title="Descargar fotografía"><Download className="h-3.5 w-3.5" /></a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
