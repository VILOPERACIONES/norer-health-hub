export interface User {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  certificacion?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  apiUrl: string;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setApiUrl: (url: string) => void;
}

export interface Paciente {
  _id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email?: string;
  fechaNacimiento?: string;
  sexo?: 'M' | 'F';
  membresia?: 'ninguna' | 'basica' | 'premium';
  membresiaVencimiento?: string;
  ultimoPeso?: number;
  ultimaVisita?: string;
  createdAt?: string;
}

export interface DashboardMetricas {
  totalPacientes: number;
  nuevosEsteMes: number;
  planesEsteMes: number;
  membresiasActivas: { total: number; basica: number; premium: number };
}

export interface Alerta {
  pacienteId: string;
  nombre: string;
  telefono: string;
  diasSinVisita: number;
}

export interface Valoracion {
  _id: string;
  pacienteId: string;
  fecha: string;
  hora?: string;
  numeracion?: number;
  peso: number;
  talla: number;
  imc?: number;
  porcentajeGrasa?: number;
  pliegues?: Record<string, number>;
  perimetros?: Record<string, number>;
  diametros?: Record<string, number>;
  composicion?: Record<string, number>;
  bioimpedancia?: Record<string, number>;
  bioquimicos?: Record<string, number>;
  signosVitales?: Record<string, any>;
  competencia?: Record<string, string>;
  comentarios?: string;
  suplementacion?: string;
  temario?: { tema: string; detalle: string }[];
  plan?: Plan;
}

export interface Ingrediente {
  descripcion: string;
  cantidad: number;
  unidad: string;
  equivalentes?: string;
}

export interface TiempoComida {
  nombre: string;
  ingredientes: Ingrediente[];
  nota?: string;
}

export interface Menu {
  nombre: string;
  tiempos: TiempoComida[];
}

export interface Plan {
  _id: string;
  pacienteId: string;
  valoracionId?: string;
  tipo: string;
  calorias: number;
  macros: { proteinas: number; carbohidratos: number; grasas: number };
  menus: Menu[];
  proximaSesion?: string;
  proximaSesionHora?: string;
  notas?: string;
  activo?: boolean;
  createdAt?: string;
}

export interface Ejercicio {
  tipo?: string;
  frecuencia?: string;
  duracion?: string;
  intensidad?: string;
  notas?: string;
}

export interface Antecedentes {
  personales?: string;
  familiares?: string;
  patologicos?: string;
  quirurgicos?: string;
  alergias?: string;
  medicamentos?: string;
}

export interface Consumo {
  desayuno?: string;
  comida?: string;
  cena?: string;
  colaciones?: string;
  agua?: string;
  alcohol?: string;
  tabaco?: string;
  suplementos?: string;
}
