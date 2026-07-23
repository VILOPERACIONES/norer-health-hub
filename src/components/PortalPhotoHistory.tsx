import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Camera, Star } from 'lucide-react';
import portalApi from '@/lib/portalApi';

type PortalPhoto = {
  id: string;
  esPrincipal: boolean;
  createdAt: string;
  valoracion: { fecha: string; numeroValoracion?: number };
  previewUrl?: string;
};

export function PortalPhotoHistory() {
  const { data = [], isLoading } = useQuery<PortalPhoto[]>({
    queryKey: ['portal', 'fotos'],
    queryFn: () => portalApi.get('/api/portal/fotos').then(response => response.data?.data || response.data || []),
    staleTime: 60_000,
  });
  const [photos, setPhotos] = useState<PortalPhoto[]>([]);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    const load = async () => {
      const hydrated = await Promise.all(data.map(async photo => {
        const response = await portalApi.get(`/api/portal/fotos/${photo.id}/archivo`, { responseType: 'blob' });
        const previewUrl = URL.createObjectURL(response.data);
        urls.push(previewUrl);
        return { ...photo, previewUrl };
      }));
      if (!cancelled) setPhotos(hydrated);
    };
    if (data.length) void load();
    else setPhotos([]);
    return () => { cancelled = true; urls.forEach(URL.revokeObjectURL); };
  }, [data]);

  const groups = useMemo(() => {
    const map = new Map<string, PortalPhoto[]>();
    photos.forEach(photo => {
      const key = photo.valoracion.fecha.split('T')[0];
      map.set(key, [...(map.get(key) || []), photo]);
    });
    return Array.from(map.entries());
  }, [photos]);

  if (!isLoading && groups.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Camera size={11} className="text-[#22c55e]" />
        <p className="text-[10px] text-[#3a3a3a] uppercase tracking-[0.15em] font-bold">Seguimiento fotográfico</p>
      </div>
      {isLoading ? <div className="h-28 bg-[#161616] animate-pulse rounded-[14px]" /> : (
        <div className="space-y-4">
          {groups.map(([date, items]) => (
            <div key={date} className="bg-[#111] border border-[#1c1c1c] rounded-[14px] p-3">
              <p className="text-[10px] text-[#555] font-semibold mb-2">{new Date(`${date}T12:00:00`).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              <div className="grid grid-cols-4 gap-2">
                {items.map(photo => (
                  <div key={photo.id} className={`relative aspect-square rounded-[9px] overflow-hidden bg-black border ${photo.esPrincipal ? 'border-[#22c55e]' : 'border-[#242424]'}`}>
                    {photo.previewUrl && <img src={photo.previewUrl} alt="Seguimiento corporal" className="w-full h-full object-contain" draggable={false} />}
                    {photo.esPrincipal && <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#22c55e] text-black flex items-center justify-center"><Star size={10} fill="currentColor" /></span>}
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
