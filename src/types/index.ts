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
  apellido: string | null;
  telefono: string;
  email?: string;
  fechaNacimiento?: string;
  sexo?: 'M' | 'F';
  estatura?: string | number;
  complexion?: string | null;
  fechaRegistro?: string;
  nivelMembresia?: string;
  suscripcionIdExterno?: string | null;
  suscripcionInicio?: string | null;
  suscripcionFin?: string | null;
  ejercicio?: Ejercicio; 
  datosEjercicio?: Ejercicio; 
  antecedentes?: Antecedentes; 
  habitos?: ConsumoCalorico; 
  consumoCalorico?: ConsumoCalorico; 
  ultimaValoracion?: Valoracion;
  valoraciones?: Valoracion[];
  talla?: number; 
  edad?: number;
}

export interface Ejercicio {
  id?: string;
  pacienteId?: string;
  objetivo?: string;
  gymOrigen?: string;
  disciplina?: string;
  horaEntrenamiento?: string | null;
  frecuencia?: string;
  tiempo?: string;
  detallesAdicionales?: string | null;
  nivelActividad?: string;
  porcentajeSedentario?: number;
  porcentajeLeve?: number;
  porcentajeModerado?: number;
  porcentajeIntenso?: number;
}

export interface Antecedentes {
  id?: string;
  pacienteId?: string;
  alimentosNoGustan?: string;
  alimentosGustan?: string;
  alergias?: string;
  patologia?: string;
  cirugias?: string;
  estrenimiento?: string | null;
  consumoAlcohol?: string;
  tabaco?: string;
  agua?: string;
  cicloMenstrual?: string | null;
  signosYSintomas?: string | null;
  historialProductos?: string;
  recomendacionSuplementos?: string;
}

export interface ConsumoCalorico {
  id?: string;
  pacienteId?: string;
  recordatorio24hActivo?: boolean;
  horaDesayuno?: string;
  horaColacion1?: string;
  horaAlmuerzo?: string;
  horaColacion2?: string;
  horaCena?: string;
  ayerDesayuno?: string;
  ayerColacion1?: string;
  ayerAlmuerzo?: string;
  ayerColacion2?: string;
  ayerCena?: string;
  usalmenteDesayuno?: string | null;
  usalmenteColacion1?: string | null;
  usalmenteAlmuerzo?: string | null;
  usalmenteColacion2?: string | null;
  usalmenteCena?: string | null;
}

export interface Valoracion {
  id: string;
  pacienteId: string;
  fecha: string;
  hora?: string;
  numeracion?: number;
  peso: number;
  pesoActual?: number | string;
  talla: number;
  estatura?: number | string;
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
  medicionNumero?: number;
  deficitMusculo?: number;
  superficieCorp?: number;
  pctGrasaCorp?: number;
  indicePonderal?: number;
}

export interface Plan {
  id: string;
  nombre?: string; // Nombre de la plantilla o plan
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

export interface Menu {
  nombre: string;
  tiempos: TiempoComida[];
}

export interface TiempoComida {
  nombre: string;
  ingredientes: Ingrediente[];
  nota?: string;
}

export interface Ingrediente {
  descripcion: string;
  cantidad: number;
  unidad: string;
  eqCantidad?: number;
  eqGrupo?: string;
  nota?: string;
}

export interface DashboardMetricas {
  resumen: {
    pacientesTotales: number;
    pacientesNuevos: number;
    planesNutricionales: number;
    consultasTotales: number;
  };
  kpisClave: {
    tasaRetencion: number;
    conversionMembresia: number;
    riesgoAbandono: number;
    riesgoClinico: number;
    promedioGrasaGral: number;
  };
  tendenciaMaestre: {
    mes: string;
    pacientes: number;
    consultas: number;
    planes: number;
  }[];
  googleCalendarUrl?: string;
  objetivos: {
    nombre: string;
    cantidad: number;
  }[];
}

export interface Alerta {
  pacienteId: string;
  nombre: string;
  telefono: string;
  diasSinVisita: number;
  prioridad: 'Alta' | 'Baja';
  tipoRiesgo?: string;
}
