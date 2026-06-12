// ============================================================================
// ENCUESTA DOS — Esquema declarativo de módulos y preguntas.
// Basado en "Requerimiento 2.docx". Reutiliza catálogos completos de la
// Encuesta Uno cuando una pregunta coincide (opciones más completas).
//
// audience:
//   'all'   -> se muestra a todos los tipos de documento
//   'minor' -> SOLO cuando Tipo de documento = 'TI' (menor de edad)
//   'major' -> SOLO para CC, CE, PEP, PPT, Pasaporte (mayores). Oculto si TI.
// ============================================================================

export const DOCUMENT_TYPES = ['TI', 'CC', 'CE', 'PEP', 'PPT', 'Pasaporte'] as const;

// Mapeo barrio -> UPL reutilizado de la Encuesta Uno (zona autodetectada).
export const BARRIO_TO_UPL: Record<string, string> = {
  '7 de Agosto': 'Doce de Octubre',
  'Alcázares Norte': 'Los Alcázares',
  'Andes': 'Los Andes',
  'Andes Norte': 'Los Andes',
  'Baquero': 'Los Alcázares',
  'Benjamín Herrera': 'Doce de Octubre',
  'Colombia': 'Los Alcázares',
  'Doce de Octubre': 'Doce de Octubre',
  'El Labrador': 'Doce de Octubre',
  'El Rosario': 'Doce de Octubre',
  'Entre Ríos': 'Los Alcázares',
  'Escuela Militar': 'Los Alcázares',
  'Jorge Eliécer Gaitán': 'Doce de Octubre',
  'José Joaquín Vargas': 'Doce de Octubre',
  'Julio Flórez': 'Los Andes',
  'La Castellana': 'Los Andes',
  'La Esperanza': 'Doce de Octubre',
  'La Libertad': 'Doce de Octubre',
  'Los Alcázares': 'Los Alcázares',
  'Los Andes': 'Los Andes',
  'Metrópolis': 'Los Alcázares',
  'Modelo Norte': 'Los Alcázares',
  'Parque Salitre': 'Parque Salitre',
  'Polo Club': 'Los Alcázares',
  'Popular Modelo': 'Los Alcázares',
  'Quinta Mutis': 'Parque Salitre',
  'Rafael Uribe Uribe': 'Parque Salitre',
  'Rincón del Salitre': 'Parque Salitre',
  'Rionegro': 'Los Andes',
  'San Felipe': 'Los Alcázares',
  'San Fernando': 'Doce de Octubre',
  'San Fernando Occidental': 'Doce de Octubre',
  'San Miguel': 'Los Andes',
  'Simón Bolívar': 'Parque Salitre',
};

export const ALL_BARRIOS = Object.keys(BARRIO_TO_UPL).sort();
export const ALL_UPLS = Array.from(new Set(Object.values(BARRIO_TO_UPL))).sort();

export type Audience = 'all' | 'minor' | 'major';
export type QType =
  | 'pills' | 'checkbox-group' | 'date-split' | 'select'
  | 'textarea' | 'text' | 'range' | 'doc-type';

export interface Question {
  id: string;
  label: string;
  subtitle?: string;
  type: QType;
  options?: string[];
  audience: Audience;
  required?: boolean;       // por defecto true
  multi?: boolean;          // checkbox múltiple
  maxSelect?: number;       // límite de selecciones (ej. máximo 3)
  showOther?: boolean;      // habilita caja "Otro/Otra"
  full?: boolean;           // ocupa fila completa (md:col-span-2)
  // Caja de texto condicional ilimitada que se abre cuando el valor del padre === conditionalOn
  conditional?: { on: string; targetId: string; placeholder: string };
  // Sub-pregunta habilitada solo si otra pregunta tiene cierto valor
  enabledIf?: { id: string; equals: string };
  min?: number; max?: number; step?: number; suffix?: string;
}

export interface ModuleDef {
  id: number;
  title: string;
  icon: string; // nombre de icono lucide
  questions: Question[];
}

export const MODULES: ModuleDef[] = [
  {
    id: 1, title: 'Perfil Sociodemográfico', icon: 'User',
    questions: [
      { id: 'tipo_documento', label: 'Tipo de documento', subtitle: 'TI activa el modo menor de edad.', type: 'doc-type', options: [...DOCUMENT_TYPES], audience: 'all', full: true },
      { id: 'fecha_nacimiento', label: 'Fecha de Nacimiento', subtitle: 'Día, mes y año.', type: 'date-split', audience: 'all' },
      { id: 'genero', label: 'Género / ¿Cómo se identifica?', type: 'pills', options: ['Femenino', 'Masculino', 'No binario', 'Transgénero', 'Otro'], audience: 'all', showOther: true },
      { id: 'barrio', label: 'Barrio de residencia', subtitle: 'La zona (UPL) se detecta automáticamente.', type: 'select', options: ALL_BARRIOS, audience: 'all' },
      { id: 'zona', label: 'Zona (UPL)', subtitle: 'Autodetectada según el barrio.', type: 'select', options: ALL_UPLS, audience: 'all', required: false },
      { id: 'nivel_educativo', label: 'Nivel Educativo', type: 'pills', options: ['Primaria', 'Secundaria', 'Técnico', 'Tecnólogo', 'Universitario', 'Posgrado', 'Ninguno', 'Otro'], audience: 'major', showOther: true },
      { id: 'pertenencia', label: 'Pertenencia Étnica y Poblacional', subtitle: 'Selección múltiple.', type: 'checkbox-group', options: ['Mujer Indígena', 'Afrodescendiente', 'Migrante', 'Persona con discapacidad', 'Víctima del conflicto', 'Ninguna', 'Otro'], audience: 'all', multi: true, showOther: true, full: true },
    ],
  },
  {
    id: 2, title: 'Economía y Autonomía', icon: 'Wallet',
    questions: [
      { id: 'ingresos_mensuales', label: 'Ingresos Mensuales', subtitle: 'Rango estimado en pesos (COP).', type: 'range', min: 0, max: 5000000, step: 50000, audience: 'major' },
      { id: 'fuente_ingresos', label: 'Fuente de Ingresos', type: 'pills', options: ['Trabajo formal', 'Trabajo informal', 'Apoyo familiar', 'Subsidios', 'Pensión', 'Otro'], audience: 'major', showOther: true },
      { id: 'situacion_laboral', label: 'Situación Laboral', type: 'pills', options: ['Empleado', 'Independiente', 'Buscando empleo', 'Hogar', 'Estudiante', 'Jubilado', 'Otro'], audience: 'all', showOther: true },
      { id: 'tipo_vivienda', label: 'Tipo de Vivienda', type: 'pills', options: ['Propia', 'Arriendo', 'Compartida', 'Familiar', 'Otro'], audience: 'all', showOther: true },
    ],
  },
  {
    id: 3, title: 'Dinámicas Familiares', icon: 'Users',
    questions: [
      { id: 'rol_hogar', label: '¿Cuál es su rol dentro del hogar?', type: 'pills', options: ['Niño, niña o adolescente', 'Madre', 'Padre', 'Cuidador/a', 'Abuelo/a', 'Otro'], audience: 'all', showOther: true, full: true },
      { id: 'con_quien_vive', label: '¿Con quién vive actualmente?', subtitle: 'Selección múltiple.', type: 'checkbox-group', options: ['Madre', 'Padre', 'Hermanos', 'Abuelos', 'Pareja', 'Hijos', 'Otros', 'Solo'], audience: 'all', multi: true, full: true },
      { id: 'convivencia', label: '¿Cómo considera la convivencia?', type: 'pills', options: ['Muy buena', 'Buena', 'Regular', 'Difícil', 'Muy difícil'], audience: 'all' },
      { id: 'manejo_conflictos', label: 'Cuando existen conflictos...', type: 'pills', options: ['Diálogo', 'Gritos', 'Evita el tema', 'Agresiones', 'No responde'], audience: 'all' },
      { id: 'apoyo_emocional', label: '¿Considera que existe apoyo emocional?', type: 'pills', options: ['Siempre', 'Casi siempre', 'Algunas veces', 'Casi nunca', 'Nunca'], audience: 'all', full: true },
    ],
  },
  {
    id: 4, title: 'Violencia Familiar', icon: 'Shield',
    questions: [
      { id: 'situaciones_entorno', label: 'Situaciones en el entorno', subtitle: 'Selección múltiple.', type: 'checkbox-group', options: ['Gritos', 'Amenazas', 'Golpes', 'Control', 'Violencia económica', 'Negligencia', 'Ninguna', 'No responde'], audience: 'all', multi: true, full: true },
      { id: 'violencia_normalizada', label: '¿Formas de violencia normalizadas?', type: 'pills', options: ['Sí', 'No', 'Tal vez', 'No sabe'], audience: 'all', conditional: { on: 'Sí', targetId: 'violencia_normalizada_cuales', placeholder: '¿Cuáles?' }, full: true },
      { id: 'conflictos_bienestar', label: '¿Conflictos afectan bienestar emocional?', type: 'pills', options: ['Siempre', 'Casi siempre', 'Algunas veces', 'Casi nunca', 'Nunca'], audience: 'all' },
      { id: 'tipos_violencia', label: '¿Qué tipos de violencia identifica más?', subtitle: 'Selección múltiple.', type: 'checkbox-group', options: ['Psicológica', 'Física', 'Sexual', 'Económica', 'Digital', 'Negligencia', 'Acoso'], audience: 'all', multi: true, full: true },
      { id: 'participado_prevencion', label: '¿Ha participado en prevención?', type: 'pills', options: ['Sí', 'No'], audience: 'all', conditional: { on: 'Sí', targetId: 'participado_prevencion_cuales', placeholder: '¿Cuáles?' } },
      { id: 'comportamientos_afectan', label: '¿Comportamientos "normales" que afectan?', type: 'pills', options: ['Siempre', 'Frecuentemente', 'Algunas veces', 'Nunca'], audience: 'all' },
    ],
  },
  {
    id: 5, title: 'Delito Sexual y Entornos Protectores', icon: 'Shield',
    questions: [
      { id: 'ninos_protegerse', label: '¿Niños/as conocen cómo protegerse?', type: 'pills', options: ['Sí', 'Parcialmente', 'No', 'No sabe'], audience: 'minor' },
      { id: 'adultos_confianza', label: '¿Existen adultos de confianza?', type: 'pills', options: ['Sí', 'No', 'Algunas veces'], audience: 'minor' },
      { id: 'lugares_riesgo', label: '¿Qué lugares considera de riesgo?', subtitle: 'Selección múltiple.', type: 'checkbox-group', options: ['Vivienda', 'Calle', 'Parques', 'Transporte público', 'Entornos digitales', 'Colegios', 'Otro'], audience: 'minor', multi: true, showOther: true, full: true },
      { id: 'conoce_casos_vs', label: '¿Conoce casos de violencia sexual?', type: 'pills', options: ['Sí', 'No', 'Prefiere no responder'], audience: 'minor' },
    ],
  },
  {
    id: 6, title: 'Género y Cuidado', icon: 'HeartPulse',
    questions: [
      { id: 'quien_asume_cuidado', label: '¿Quién asume labores de cuidado?', type: 'pills', options: ['Mamá', 'Papá', 'Abuelos', 'Familia', 'Vecinos', 'Otro'], audience: 'all', showOther: true },
      { id: 'distribucion_justa', label: '¿Distribución justa de responsabilidades?', type: 'pills', options: ['Sí', 'Parcialmente', 'No'], audience: 'all' },
      { id: 'mujeres_tiempo_libre', label: '¿Mujeres cuentan con tiempo libre?', type: 'pills', options: ['Siempre', 'Casi siempre', 'Algunas veces', 'Casi nunca', 'Nunca'], audience: 'all' },
      { id: 'poblaciones_vulnerables', label: '¿Poblaciones más vulnerables?', subtitle: 'Selección múltiple.', type: 'checkbox-group', options: ['Mujeres', 'Hombres', 'Niños', 'Mayores', 'Discapacidad', 'LGBTIQ+', 'Todas'], audience: 'all', multi: true, full: true },
    ],
  },
  {
    id: 7, title: 'Adultos Mayores', icon: 'Users',
    questions: [
      { id: 'persona_mayor_hogar', label: '¿Vive alguna persona mayor en el hogar?', type: 'pills', options: ['Sí', 'No'], audience: 'major' },
      { id: 'apoyo_suficiente', label: '¿Cuenta con apoyo suficiente?', type: 'pills', options: ['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre'], audience: 'major' },
      { id: 'abandono_maltrato', label: '¿Ha identificado abandono o maltrato?', type: 'pills', options: ['Sí', 'No'], audience: 'major', conditional: { on: 'Sí', targetId: 'abandono_maltrato_cual', placeholder: '¿Cuál?' } },
      { id: 'mayor_ingresos', label: '¿Cuenta con ingresos?', type: 'pills', options: ['Sí', 'No'], audience: 'major' },
      { id: 'mayor_fuente_ingresos', label: '¿De dónde proviene?', type: 'pills', options: ['Pensión', 'Subsidio', 'Apoyo familiar', 'Empleo', 'Otros'], audience: 'major', showOther: true, enabledIf: { id: 'mayor_ingresos', equals: 'Sí' } },
      { id: 'mayor_autonomia', label: '¿Cuenta con autonomía sobre su dinero?', type: 'pills', options: ['Sí', 'No'], audience: 'major', conditional: { on: 'Sí', targetId: 'mayor_autonomia_consensuado', placeholder: '¿Es consensuado?' } },
    ],
  },
  {
    id: 8, title: 'Bienestar Emocional', icon: 'HeartPulse',
    questions: [
      { id: 'situaciones_sentidas', label: 'Situaciones sentidas últimamente', subtitle: 'Selección múltiple.', type: 'checkbox-group', options: ['Estrés', 'Ansiedad', 'Soledad', 'Temor', 'Tranquilidad', 'Felicidad', 'Angustia', 'Tristeza', 'Agotamiento', 'Otro'], audience: 'all', multi: true, showOther: true, full: true },
      { id: 'recibir_apoyo_cuidado', label: '¿Le gustaría recibir apoyo en cuidado?', type: 'pills', options: ['Sí', 'No', 'Tal vez'], audience: 'all', conditional: { on: 'Sí', targetId: 'recibir_apoyo_cuidado_cuales', placeholder: '¿Cuáles?' }, full: true },
    ],
  },
  {
    id: 9, title: 'Territorio y Seguridad', icon: 'Shield',
    questions: [
      { id: 'seguridad_barrio', label: '¿Cómo percibe la seguridad del barrio?', type: 'pills', options: ['Muy segura', 'Segura', 'Regular', 'Insegura', 'Muy insegura'], audience: 'all', full: true },
      { id: 'situaciones_convivencia', label: '¿Qué situaciones afectan más la convivencia?', subtitle: 'Selección múltiple.', type: 'checkbox-group', options: ['Consumo de SPA', 'Inseguridad', 'Violencia', 'Habitabilidad en calle', 'Basuras', 'Falta institucional', 'Familias', 'Otro'], audience: 'all', multi: true, showOther: true, full: true },
      { id: 'parques_seguros', label: '¿Parques seguros para niñez y familias?', type: 'pills', options: ['Sí', 'Parcialmente', 'No'], audience: 'all', full: true },
    ],
  },
  {
    id: 10, title: 'Acceso Institucional', icon: 'FileText',
    questions: [
      { id: 'conoce_rutas', label: '¿Conoce rutas de atención?', type: 'pills', options: ['Sí', 'Parcialmente', 'No'], audience: 'all' },
      { id: 'sabe_entidad', label: '¿Sabe a qué entidad acudir en riesgo?', type: 'pills', options: ['Sí', 'No', 'No está seguro/a'], audience: 'all' },
      { id: 'dificultades_denunciar', label: '¿Qué dificultades existen para denunciar?', subtitle: 'Selección múltiple.', type: 'checkbox-group', options: ['Miedo', 'Desconfianza', 'Vergüenza', 'Desconocimiento', 'Dependencia', 'Amenazas', 'Falta de apoyo', 'Otra'], audience: 'all', multi: true, showOther: true, full: true },
      { id: 'instituciones_presencia', label: '¿Instituciones hacen presencia suficiente?', type: 'pills', options: ['Sí', 'Parcialmente', 'No'], audience: 'all' },
      { id: 'fortalecer_ninez', label: '¿Importante fortalecer derechos de niñez?', type: 'pills', options: ['Muy importante', 'Importante', 'Poco importante', 'Nada importante'], audience: 'minor' },
    ],
  },
  {
    id: 11, title: 'Necesidades y Recomendaciones', icon: 'Star',
    questions: [
      { id: 'acciones_prioritarias', label: 'Acciones prioritarias para prevenir violencias', subtitle: 'Seleccione un máximo de 3 opciones.', type: 'checkbox-group', options: ['Talleres de prevención', 'Rutas de atención claras', 'Más presencia institucional', 'Espacios seguros para la niñez', 'Formación en derechos', 'Apoyo psicosocial', 'Fortalecer redes comunitarias', 'Mejorar entornos públicos', 'Otro'], audience: 'all', multi: true, maxSelect: 3, showOther: true, full: true },
      { id: 'participar_espacios', label: '¿Le gustaría participar en espacios?', type: 'pills', options: ['Sí', 'No', 'Tal vez'], audience: 'all' },
      { id: 'interes_formacion_derechos', label: '¿Le interesaría formación en derechos?', type: 'pills', options: ['Sí', 'No', 'Tal vez'], audience: 'all' },
      { id: 'recomendacion_instituciones', label: '¿Qué recomendación le haría a las instituciones?', subtitle: 'Caja de texto libre, sin límite de caracteres.', type: 'textarea', audience: 'all', full: true },
    ],
  },
];

// Devuelve true si la pregunta debe mostrarse para el tipo de documento dado.
export function isVisibleForDoc(audience: Audience, isMinor: boolean): boolean {
  if (audience === 'all') return true;
  if (audience === 'minor') return isMinor;
  return !isMinor; // 'major'
}
