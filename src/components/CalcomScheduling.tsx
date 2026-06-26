import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Clock, CheckCircle2, Loader2, Video, MapPin } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Slot {
  time: string;
}

interface CalcomSchedulingProps {
  onSelection?: (data: { 
    fecha: string; 
    modalidad: string; 
    eventTypeId: number;
    name: string;
    email: string;
    phone: string;
  } | null) => void;
  pacienteData?: {
    nombre: string;
    email: string;
    telefono?: string;
  };
}

// IDs de event types del EQUIPO "NORDER Health" en Cal.com
// (son distintos a los del perfil personal — el equipo es quien gestiona las citas)
// Seguimiento presencial: 30 min → 4657665
// Seguimiento online:     30 min → 4726502
// Doble presencial:       60 min → 4844702
const EVENT_TYPES = {
  presencial: 4657665,       // PRESENCIAL - seguimiento SDC (30 min)
  online: 4726502,           // ONLINE - seguimiento SDC (30 min)
  doble_presencial: 4844702  // PRESENCIAL - DOBLE CITA seguimiento (60 min)
};

const CalcomScheduling = ({ onSelection, pacienteData }: CalcomSchedulingProps) => {
  const [modalidad, setModalidad] = useState<'presencial' | 'online' | 'doble_presencial' | null>('presencial');
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const stripLada = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/^\+52/, '').replace(/^52/, '');
  };

  // Datos de contacto locales
  const [name, setName] = useState(pacienteData?.nombre || '');
  const [email, setEmail] = useState(pacienteData?.email || '');
  const [phone, setPhone] = useState(stripLada(pacienteData?.telefono));

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());

  // Sincronizar con props iniciales
  useEffect(() => {
    if (pacienteData) {
      setName(pacienteData.nombre);
      setEmail(pacienteData.email);
      setPhone(stripLada(pacienteData.telefono));
    }
  }, [pacienteData]);

  useEffect(() => {
    if (modalidad) {
      fetchEventDetails(modalidad);
      fetchMonthAvailability(modalidad);
    }
  }, [modalidad]);

  useEffect(() => {
    if (modalidad && date) {
      fetchSlots(date, modalidad);
    }
    setSelectedSlot(null);
  }, [modalidad, date]);

  const fetchEventDetails = async (mod: 'presencial' | 'online' | 'doble_presencial') => {
    try {
      const { data } = await api.get(`/api/citas/event-type/${EVENT_TYPES[mod]}`);
      setEventDetails(data.eventType || data);
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };

  const fetchMonthAvailability = async (mod: 'presencial' | 'online' | 'doble_presencial') => {
    try {
      const eventTypeId = EVENT_TYPES[mod];
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = addMonths(new Date(), 2);
      
      const { data } = await api.get('/api/citas/slots', {
        params: {
          eventTypeId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        }
      });

      const slotsObj = data.slots || {};
      const days = new Set<string>(Object.keys(slotsObj));
      setAvailableDays(days);

      // Auto-seleccionar el primer día disponible más próximo
      if (days.size > 0) {
        const today = format(new Date(), 'yyyy-MM-dd');
        const sortedDays = Array.from(days).sort();
        const firstAvailable = days.has(today)
          ? today
          : sortedDays.find((d) => d >= today) || sortedDays[0];
        if (firstAvailable) {
          const [year, month, day] = firstAvailable.split('-').map(Number);
          setDate(new Date(year, month - 1, day));
        }
      }
    } catch (error) {
      console.error('Error fetching month availability:', error);
    }
  };

  const fetchSlots = async (selectedDate: Date, mod: 'presencial' | 'online' | 'doble_presencial') => {
    setLoadingSlots(true);
    try {
      const eventTypeId = EVENT_TYPES[mod];
      const startTime = new Date(selectedDate);
      startTime.setHours(0, 0, 0, 0);
      
      const endTime = new Date(selectedDate);
      endTime.setHours(23, 59, 59, 999);

      const { data } = await api.get('/api/citas/slots', {
        params: {
          eventTypeId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }
      });

      // Cal.com returns { slots: { "2024-01-01": [...] } }
      let availableSlots: Slot[] = [];
      if (data.slots && typeof data.slots === 'object') {
        availableSlots = Object.values(data.slots).flat() as Slot[];
      } else if (Array.isArray(data)) {
        availableSlots = data;
      }
      
      setSlots(availableSlots);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSlotSelect = (time: string) => {
    setSelectedSlot(time);
  };

  // Efecto para reportar cambios al padre
  useEffect(() => {
    if (onSelection && modalidad && selectedSlot) {
      onSelection({
        fecha: selectedSlot,
        modalidad,
        eventTypeId: EVENT_TYPES[modalidad],
        name,
        email,
        phone
      });
    } else if (onSelection) {
      onSelection(null);
    }
  }, [selectedSlot, modalidad, name, email, phone]);

  return (
    <div className="bg-[#111111] p-5 rounded-[16px] border border-[#2a2a2a] flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex flex-col">
          <h4 className="text-[12px] font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <CalendarIcon className="h-3.5 w-3.5 text-brand-primary" />
            Agendar Próxima Consulta
          </h4>
          <p className="text-[10px] text-[#8a8a8a] mt-0.5">Confirma los datos del paciente para Cal.com</p>
        </div>
        {selectedSlot && (
          <div className="flex items-center gap-1.5 bg-brand-primary/10 px-3 py-1 rounded-full border border-brand-primary/20">
            <CheckCircle2 className="h-3 w-3 text-brand-primary" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Cita Lista</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* COLUMNA 1: DATOS PACIENTE (PRE-LLENADOS) */}
        <div className="flex flex-col gap-3 p-3 bg-[#181818]/50 rounded-[12px] border border-[#222]">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest ml-1">Nombre Completo</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-[8px] px-3 py-2 text-[12px] text-white outline-none focus:border-brand-primary/50 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest ml-1">Correo Electrónico</label>
            <input 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-[8px] px-3 py-2 text-[12px] text-white outline-none focus:border-brand-primary/50 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest ml-1">Teléfono</label>
            <input 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-[8px] px-3 py-2 text-[12px] text-white outline-none focus:border-brand-primary/50 transition-colors"
              placeholder="+52..."
            />
          </div>
        </div>

        {/* COLUMNA 2: MODALIDAD Y FECHA */}
        <div className="flex flex-col gap-4">
          <div className="space-y-1.5 font-sans">
             <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Modalidad</label>
                {eventDetails && (
                  <span className="text-[10px] font-bold text-brand-primary uppercase bg-brand-primary/10 px-2 py-0.5 rounded-full">
                    {eventDetails.length || eventDetails.duration}
                  </span>
                )}
             </div>
            <Select value={modalidad || undefined} onValueChange={(val: any) => setModalidad(val)}>
              <SelectTrigger className="bg-[#181818] border-[#333] h-11 text-[13px] font-medium text-white rounded-[10px] focus:ring-brand-primary/30">
                <SelectValue placeholder="Selecciona modalidad" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-[#333] text-white">
                <SelectItem value="presencial">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-text-muted" />
                    <span>Presencial</span>
                  </div>
                </SelectItem>
                <SelectItem value="online">
                  <div className="flex items-center gap-2">
                    <Video className="h-3.5 w-3.5 text-text-muted" />
                    <span>Online</span>
                  </div>
                </SelectItem>
                <SelectItem value="doble_presencial">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-brand-primary" />
                    <span>Presencial — Doble cita de seguimiento</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 font-sans">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-1">Fecha</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-medium bg-[#181818] border-[#333] h-11 text-[13px] rounded-[10px] hover:bg-[#202020] hover:text-white transition-colors",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-brand-primary" />
                  {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar día</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#0a0a0a] border-[#333]" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={es}
                  disabled={(d) => {
                    const dStr = format(d, 'yyyy-MM-dd');
                    return d < new Date(new Date().setHours(0,0,0,0)) || 
                           d > addMonths(new Date(), 2) ||
                           (availableDays.size > 0 && !availableDays.has(dStr));
                  }}
                  className="rounded-md border-none"
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {selectedSlot && (
            <div className="mt-auto p-3 bg-[#181818] border border-[#333] rounded-[12px] animate-in zoom-in-95 font-sans">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">Resumen de Cita</p>
              <p className="text-[12px] font-bold text-white capitalize">
                {eventDetails?.title || modalidad} — {format(new Date(selectedSlot), "d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-[14px] font-black text-brand-primary mt-1">
                {format(new Date(selectedSlot), "HH:mm 'hrs'")}
              </p>
            </div>
          )}
        </div>

        {/* COLUMNA DE SLOTS */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center justify-between ml-1">
            Horarios Disponibles
            {loadingSlots && <Loader2 className="h-3 w-3 animate-spin text-brand-primary" />}
          </label>
          <div className="bg-[#181818] border border-[#333] rounded-[12px] p-3 h-[210px] overflow-y-auto custom-scrollbar">
            {loadingSlots ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#333]" />
              </div>
            ) : slots.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {slots.map((slot) => {
                  const slotTime = new Date(slot.time);
                  const isSelected = selectedSlot === slot.time;
                  return (
                    <button
                      key={slot.time}
                      onClick={() => handleSlotSelect(slot.time)}
                      className={cn(
                        "py-2.5 px-3 rounded-[8px] text-[12px] font-bold transition-all border",
                        isSelected 
                          ? "bg-brand-primary border-brand-primary text-black" 
                          : "bg-[#1f1f1f] border-[#333] text-[#8a8a8a] hover:border-[#555] hover:text-white"
                      )}
                    >
                      {format(slotTime, 'HH:mm')}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Clock className="h-8 w-8 text-[#2a2a2a] mb-2" />
                <p className="text-[11px] text-[#555] font-medium leading-relaxed">
                  No hay horarios para este día. Prueba con otra fecha.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalcomScheduling;
