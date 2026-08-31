export const APPOINTMENT_REQUEST_TIMEOUT_MS = 120_000;

type BookingError = {
  code?: string;
  message?: string;
  response?: {
    data?: {
      details?: unknown;
      error?: string;
    };
  };
};

export const getBookingFailureCopy = (error: BookingError) => {
  const isTimeout = error?.code === 'ECONNABORTED'
    || error?.code === 'ETIMEDOUT'
    || /timeout/i.test(error?.message || '');

  if (isTimeout) {
    return {
      title: 'Valoración guardada; cita por confirmar',
      description: 'Cal.com está tardando en responder. Revisa el calendario antes de volver a intentarlo para evitar una cita duplicada.'
    };
  }

  const details = error?.response?.data?.details;
  const apiError = error?.response?.data?.error;
  const description = details
    ? typeof details === 'string' ? details : JSON.stringify(details)
    : apiError || 'Intenta agendar manualmente o revisa la configuración de Cal.com.';

  return {
    title: 'Valoración guardada, pero la cita no se confirmó',
    description
  };
};
