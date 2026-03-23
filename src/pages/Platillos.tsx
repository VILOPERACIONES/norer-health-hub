import { useState, useEffect } from 'react';
import { Plus, Search, Utensils, Trash2, Save, X, Edit2, ChevronLeft } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import SmaeIngredientePicker from '@/components/SmaeIngredientePicker';
import type { Platillo, Ingrediente } from '@/types';

const CATEGORIAS = ['DESAYUNO', 'COLACIÓN', 'COMIDA', 'CENA', 'PRE-ENTRENO', 'POST-ENTRENO', 'OTROS'];

const Platillos = () => {
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlatillo, setCurrentPlatillo] = useState<Partial<Platillo> | null>(null);

  useEffect(() => {
    fetchPlatillos();
  }, []);

  const fetchPlatillos = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/platillos');
      setPlatillos(data?.data || []);
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudieron cargar los platillos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setCurrentPlatillo({
      nombre: '',
      categoria: 'DESAYUNO',
      ingredientes: []
    });
    setIsEditing(true);
  };

  const handleEdit = (p: Platillo) => {
    setCurrentPlatillo({ ...p });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este platillo?')) return;
    try {
      await api.delete(`/api/platillos/${id}`);
      setPlatillos(platillos.filter(p => p.id !== id));
      toast({ title: 'Eliminado', description: 'Platillo eliminado correctamente' });
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo eliminar el platillo', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!currentPlatillo?.nombre || !currentPlatillo?.categoria) {
      toast({ title: 'Error', description: 'Nombre y categoría son requeridos', variant: 'destructive' });
      return;
    }

    try {
      if (currentPlatillo.id) {
        await api.put(`/api/platillos/${currentPlatillo.id}`, currentPlatillo);
        toast({ title: 'Actualizado', description: 'Platillo actualizado correctamente' });
      } else {
        await api.post('/api/platillos', currentPlatillo);
        toast({ title: 'Creado', description: 'Platillo creado correctamente' });
      }
      setIsEditing(false);
      setCurrentPlatillo(null);
      fetchPlatillos();
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo guardar el platillo', variant: 'destructive' });
    }
  };

  const addIngrediente = () => {
    if (!currentPlatillo) return;
    const newIng: Ingrediente = {
      descripcion: '',
      cantidad: 0,
      unidad: 'GR',
      orden: (currentPlatillo.ingredientes?.length || 0) + 1
    };
    setCurrentPlatillo({
      ...currentPlatillo,
      ingredientes: [...(currentPlatillo.ingredientes || []), newIng]
    });
  };

  const updateIngrediente = (idx: number, updates: Partial<Ingrediente>) => {
    if (!currentPlatillo?.ingredientes) return;
    const newIngs = [...currentPlatillo.ingredientes];
    newIngs[idx] = { ...newIngs[idx], ...updates };
    setCurrentPlatillo({ ...currentPlatillo, ingredientes: newIngs });
  };

  const removeIngrediente = (idx: number) => {
    if (!currentPlatillo?.ingredientes) return;
    const newIngs = currentPlatillo.ingredientes.filter((_, i) => i !== idx);
    setCurrentPlatillo({ ...currentPlatillo, ingredientes: newIngs });
  };

  const filtered = platillos.filter(p => 
    p.nombre.toLowerCase().includes(search.toLowerCase()) || 
    p.categoria.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Biblioteca de Platillos</h1>
          <p className="text-text-muted text-sm">Gestiona tus preparaciones y recetas para reutilizarlas en los planes.</p>
        </div>
        {!isEditing && (
          <Button onClick={handleCreate} className="bg-brand-primary text-black hover:bg-brand-primary/90 font-bold px-6">
            <Plus className="w-4 h-4 mr-2" /> NUEVO PLATILLO
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <Input 
              placeholder="Buscar por nombre o categoría..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-bg-surface border-border-subtle"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <Card key={p.id} className="p-5 bg-bg-surface border-border-subtle hover:border-[#444] transition-all group relative overflow-hidden">
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex-1 min-w-0 mr-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#90c2ff] bg-[#90c2ff]/10 px-2.5 py-1 rounded-full border border-[#90c2ff]/20">
                      {p.categoria}
                    </span>
                    <h3 className="text-lg font-bold text-text-primary mt-3 truncate">{p.nombre}</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <Utensils className="w-3.5 h-3.5 text-text-muted" />
                       <p className="text-xs font-medium text-text-muted">{p.ingredientes?.length || 0} ingredientes</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="h-8 w-8 bg-bg-base/50">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="h-8 w-8 text-accent-red hover:bg-accent-red/10 bg-bg-base/50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {/* Visual accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
              </Card>
            ))}
          </div>
          
          {filtered.length === 0 && !loading && (
            <div className="text-center py-24 border-2 border-dashed border-border-subtle rounded-2xl bg-bg-surface/30">
              <div className="w-20 h-20 bg-bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-border-subtle">
                <Utensils className="w-10 h-10 text-border-default" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">No hay platillos</h3>
              <p className="text-text-muted max-w-xs mx-auto text-sm">Empieza por crear preparaciones comunes como "Omelet de claras" o "Batido de proteína".</p>
              <Button onClick={handleCreate} variant="outline" className="mt-8 border-border-subtle hover:bg-bg-surface">
                 Crear primer platillo
              </Button>
            </div>
          )}

          {loading && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="h-32 bg-bg-surface animate-pulse rounded-xl border border-border-subtle" />
                ))}
             </div>
          )}
        </div>
      ) : (
        <Card className="p-0 bg-bg-surface border-border-subtle max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 shadow-2xl overflow-hidden">
          <div className="p-6 md:p-8 flex items-center justify-between bg-bg-base/30 border-b border-border-subtle">
            <div className="flex items-center gap-4">
               <button 
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-bg-base rounded-full text-text-muted transition-colors"
               >
                 <ChevronLeft className="w-5 h-5" />
               </button>
               <div>
                 <h2 className="text-xl font-bold text-text-primary">
                   {currentPlatillo?.id ? 'Editar Platillo' : 'Nuevo Platillo'}
                 </h2>
                 <p className="text-xs text-text-muted uppercase font-bold tracking-wider mt-1">Biblioteca de alimentos</p>
               </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setIsEditing(false)} className="px-6">Cancelar</Button>
              <Button onClick={handleSave} className="bg-brand-primary text-black hover:bg-brand-primary/90 font-black px-8">
                <Save className="w-4 h-4 mr-2" /> GUARDAR
              </Button>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] block">Nombre del Platillo</label>
                <Input 
                  value={currentPlatillo?.nombre} 
                  onChange={(e) => setCurrentPlatillo({ ...currentPlatillo, nombre: e.target.value })}
                  placeholder="Ej. Omelet con Espinacas y Queso"
                  className="text-lg font-bold bg-bg-base border-border-subtle focus:border-brand-primary h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] block">Categoría Sugerida</label>
                <select
                  value={currentPlatillo?.categoria}
                  onChange={(e) => setCurrentPlatillo({ ...currentPlatillo, categoria: e.target.value })}
                  className="w-full h-12 bg-bg-base border border-border-subtle rounded-md px-4 text-sm font-bold outline-none focus:border-brand-primary appearance-none transition-all cursor-pointer hover:border-[#444]"
                >
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-text-primary flex items-center gap-2 text-lg">
                    <Utensils className="w-5 h-5 text-brand-primary" /> Ingredientes del Platillo
                  </h3>
                  <p className="text-xs text-text-muted mt-1">Define la composición base de esta preparación usando el buscador SMAE.</p>
                </div>
                <Button variant="outline" size="sm" onClick={addIngrediente} className="h-9 border-dashed border-border-subtle bg-bg-base hover:bg-brand-primary/5 hover:border-brand-primary/30 text-brand-primary px-4">
                  <Plus className="w-4 h-4 mr-2" /> AGREGAR INGREDIENTE
                </Button>
              </div>

              <div className="bg-bg-base p-6 rounded-2xl border border-border-subtle space-y-6 shadow-inner">
                {currentPlatillo?.ingredientes?.map((ing, idx) => (
                  <SmaeIngredientePicker 
                    key={idx}
                    index={idx}
                    ingrediente={ing}
                    onUpdate={(upd) => updateIngrediente(idx, upd)}
                    onRemove={() => removeIngrediente(idx)}
                  />
                ))}
                
                {(currentPlatillo?.ingredientes?.length || 0) === 0 && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-border-subtle">
                       <Plus className="w-6 h-6 text-text-muted" />
                    </div>
                    <p className="text-text-muted text-sm font-medium">Sin ingredientes aún.</p>
                    <p className="text-[11px] text-text-muted/60 mt-1">Busca y añade alimentos de la lista SMAE.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Platillos;
