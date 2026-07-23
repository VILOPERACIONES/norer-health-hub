import { CalendarDays, Mail, MapPin, Phone, UserRound, Video } from 'lucide-react';
import { formatMexicoCityAppointment } from '@/lib/dateTime';

export type AppointmentSummaryData = {
  fecha: string;
  modalidad: string;
  eventTypeId: number;
  name: string;
  email: string;
  phone: string;
};

const modalityLabel = (value: string) => {
  if (value === 'online') return 'En línea';
  if (value === 'doble_presencial') return 'Presencial · Doble seguimiento';
  return 'Presencial';
};

export const formatAppointmentDate = (value: string) => {
  return formatMexicoCityAppointment(value, {
    dateStyle: 'full',
    timeStyle: 'short',
  }) || 'Sin fecha';
};

export function AppointmentSummary({ data }: { data: AppointmentSummaryData }) {
  const ModalityIcon = data.modalidad === 'online' ? Video : MapPin;
  return (
    <div className="mt-4 space-y-2.5 text-left">
      <SummaryRow icon={UserRound} label="Paciente" value={data.name || 'Sin nombre'} />
      <SummaryRow icon={ModalityIcon} label="Modalidad" value={modalityLabel(data.modalidad)} />
      <SummaryRow icon={CalendarDays} label="Fecha y hora" value={formatAppointmentDate(data.fecha)} emphasize />
      <SummaryRow icon={Mail} label="Correo" value={data.email || 'Sin correo'} />
      <SummaryRow icon={Phone} label="Teléfono" value={data.phone || 'Sin teléfono'} />
      <p className="m-0 pt-1 text-[10px] leading-relaxed text-[#666]">
        La reserva y la invitación de Cal.com se crearán únicamente después de confirmar.
      </p>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value, emphasize = false }: {
  icon: typeof UserRound;
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[#292929] bg-[#171717] px-3 py-2.5">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${emphasize ? 'text-brand-primary' : 'text-[#777]'}`} />
      <span className="min-w-0">
        <span className="block text-[9px] font-bold uppercase tracking-wider text-[#666]">{label}</span>
        <span className={`mt-0.5 block break-words text-[12px] font-semibold capitalize ${emphasize ? 'text-brand-primary' : 'text-[#d0d0d0]'}`}>{value}</span>
      </span>
    </div>
  );
}
