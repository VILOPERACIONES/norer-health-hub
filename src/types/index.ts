export interface User {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  certificacion?: string;
  profesion?: string;
  universidad?: string;
  cedula?: string;
  firma?: string;
  logotipo?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  apiUrl: string;
  setAuth: (token: string, user: User) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  setApiUrl: (url: string) => void;
}

export interface Paciente {
  id: string;
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
  ocupacion?: string;
  motivoConsulta?: string;
  createdAt?: string;
  ejercicio?: Ejercicio;
  antecedentes?: Antecedentes;
  habitos?: Consumo;
  ultimaValoracion?: Valoracion;
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
  id: string;
  pacienteId: string;
  fecha: string;
  hora?: string;
  numeracion?: number;
  peso: number;
  talla: number;
  imc?: number | string;
  pctGrasa2comp?: number | string;
  bioimpedanciaPctGrasa?: number | string;
  kgGrasa2comp?: number | string;
  kgMasaMagra2comp?: number | string;
  pctGrasaCorporal4comp?: number | string;
  superficieCorporal?: number | string;
  masaGrasaReal?: number | string;
  masaOsea?: number | string;
  masaMuscular?: number | string;
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
  eqCantidad?: number;
  eqGrupo?: string;
  nota?: string;
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
  id: string;
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
  id?: string;
  tipo?: string;
  frecuencia?: string;
  duracion?: string;
  intensidad?: string;
  notas?: string;
}

export interface Antecedentes {
  id?: string;
  personales?: string;
  familiares?: string;
  patologicos?: string;
  quirurgicos?: string;
  alergias?: string;
  medicamentos?: string;
  alimentosGusta?: string;
  alimentosNoGusta?: string;
  patologia?: string;
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
