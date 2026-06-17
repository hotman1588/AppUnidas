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
  'Muequetá': 'Los Alcázares',
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
      { id: 'tipo_documento', label: 'Tipo de documento', subtitle: '¿Qué tipo de documento de identidad tiene? (TI activa el modo menor de edad)', type: 'doc-type', options: [...DOCUMENT_TYPES], audience: 'all', full: true },
      { id: 'fecha_nacimiento', label: 'Fecha de Nacimiento', subtitle: '¿Cuál es su fecha de nacimiento?', type: 'date-split', audience: 'all' },
      { id: 'genero', label: 'Género / ¿Cómo se identifica?', subtitle: '¿Con cuál género se identifica actualmente?', type: 'pills', options: ['Femenino', 'Masculino', 'No binario', 'Transgénero', 'Otro'], audience: 'all', showOther: true },
      { id: 'barrio', label: 'Barrio de residencia', subtitle: '¿En qué barrio vive actualmente?', type: 'select', options: ALL_BARRIOS, audience: 'all' },
      { id: 'zona', label: 'Zona (UPL)', subtitle: '¿A qué zona (UPL) corresponde su barrio? (se detecta automáticamente)', type: 'select', options: ALL_UPLS, audience: 'all', required: false },
      { id: 'nivel_educativo', label: 'Nivel Educativo', subtitle: '¿Cuál es el nivel educativo más alto que ha alcanzado?', type: 'pills', options: ['Primaria', 'Secundaria', 'Técnico', 'Tecnólogo', 'Universitario', 'Posgrado', 'Ninguno', 'Otro'], audience: 'major', showOther: true },
      { id: 'pertenencia', label: 'Pertenencia Étnica y Poblacional', subtitle: '¿Con cuál grupo étnico o poblacional se identifica?', type: 'checkbox-group', options: ['Mujer Indígena', 'Afrodescendiente', 'Migrante', 'Persona con discapacidad', 'Víctima del conflicto', 'Ninguna', 'Otro'], audience: 'all', multi: true, showOther: true, full: true },
    ],
  },
  {
    id: 2, title: 'Economía y Autonomía', icon: 'Wallet',
    questions: [
      { id: 'ingresos_mensuales', label: 'Ingresos Mensuales', subtitle: '¿Cuánto suman aproximadamente sus ingresos mensuales? (COP)', type: 'range', min: 0, max: 5000000, step: 50000, audience: 'major' },
      { id: 'fuente_ingresos', label: 'Fuente de Ingresos', subtitle: '¿De dónde provienen principalmente sus ingresos?', type: 'pills', options: ['Trabajo formal', 'Trabajo informal', 'Apoyo familiar', 'Subsidios', 'Pensión', 'Otro'], audience: 'major', showOther: true },
      { id: 'situacion_laboral', label: 'Situación Laboral', subtitle: '¿Cuál es su situación laboral actual?', type: 'pills', options: ['Empleado', 'Independiente', 'Buscando empleo', 'Hogar', 'Estudiante', 'Jubilado', 'Otro'], audience: 'all', showOther: true },
      { id: 'tipo_vivienda', label: 'Tipo de Vivienda', subtitle: '¿En qué tipo de vivienda habita?', type: 'pills', options: ['Propia', 'Arriendo', 'Compartida', 'Familiar', 'Otro'], audience: 'all', showOther: true },
    ],
  },
  {
    id: 3, title: 'Dinámicas Familiares', icon: 'Users',
    questions: [
      { id: 'rol_hogar', label: '¿Cuál es su rol dentro del hogar?', subtitle: '¿Qué rol cumple usted dentro de su hogar?', type: 'pills', options: ['Niño, niña o adolescente', 'Madre', 'Padre', 'Cuidador/a', 'Abuelo/a', 'Otro'], audience: 'all', showOther: true, full: true },
      { id: 'con_quien_vive', label: '¿Con quién vive actualmente?', subtitle: '¿Con quién vive usted actualmente?', type: 'checkbox-group', options: ['Madre', 'Padre', 'Hermanos', 'Abuelos', 'Pareja', 'Hijos', 'Otros', 'Solo'], audience: 'all', multi: true, full: true },
      { id: 'convivencia', label: '¿Cómo considera la convivencia?', subtitle: '¿Cómo considera la convivencia en su hogar?', type: 'pills', options: ['Muy buena', 'Buena', 'Regular', 'Difícil', 'Muy difícil'], audience: 'all' },
      { id: 'manejo_conflictos', label: 'Cuando existen conflictos...', subtitle: 'Cuando hay conflictos en casa, ¿cómo se resuelven?', type: 'pills', options: ['Diálogo', 'Gritos', 'Evita el tema', 'Agresiones', 'No responde'], audience: 'all' },
      { id: 'apoyo_emocional', label: '¿Considera que existe apoyo emocional?', subtitle: '¿Considera que existe apoyo emocional en su hogar?', type: 'pills', options: ['Siempre', 'Casi siempre', 'Algunas veces', 'Casi nunca', 'Nunca'], audience: 'all', full: true },
    ],
  },
  {
    id: 4, title: 'Violencia Familiar', icon: 'Shield',
    questions: [
      { id: 'situaciones_entorno', label: 'Situaciones en el entorno', subtitle: '¿Qué situaciones de violencia ha visto en su entorno?', type: 'checkbox-group', options: ['Gritos', 'Amenazas', 'Golpes', 'Control', 'Violencia económica', 'Negligencia', 'Ninguna', 'No responde'], audience: 'all', multi: true, full: true },
      { id: 'violencia_normalizada', label: '¿Formas de violencia normalizadas?', subtitle: '¿Identifica formas de violencia que se ven como normales?', type: 'pills', options: ['Sí', 'No', 'Tal vez', 'No sabe'], audience: 'all', conditional: { on: 'Sí', targetId: 'violencia_normalizada_cuales', placeholder: '¿Cuáles?' }, full: true },
      { id: 'conflictos_bienestar', label: '¿Conflictos afectan bienestar emocional?', subtitle: '¿Los conflictos afectan su bienestar emocional?', type: 'pills', options: ['Siempre', 'Casi siempre', 'Algunas veces', 'Casi nunca', 'Nunca'], audience: 'all' },
      { id: 'tipos_violencia', label: '¿Qué tipos de violencia identifica más?', subtitle: '¿Qué tipos de violencia identifica con más frecuencia?', type: 'checkbox-group', options: ['Psicológica', 'Física', 'Sexual', 'Económica', 'Digital', 'Negligencia', 'Acoso'], audience: 'all', multi: true, full: true },
      { id: 'participado_prevencion', label: '¿Ha participado en prevención?', subtitle: '¿Ha participado en actividades de prevención?', type: 'pills', options: ['Sí', 'No'], audience: 'all', conditional: { on: 'Sí', targetId: 'participado_prevencion_cuales', placeholder: '¿Cuáles?' } },
      { id: 'comportamientos_afectan', label: '¿Comportamientos "normales" que afectan?', subtitle: '¿Hay comportamientos vistos como "normales" que le afectan?', type: 'pills', options: ['Siempre', 'Frecuentemente', 'Algunas veces', 'Nunca'], audience: 'all' },
    ],
  },
  {
    id: 5, title: 'Delito Sexual y Entornos Protectores', icon: 'Shield',
    questions: [
      { id: 'ninos_protegerse', label: '¿Niños/as conocen cómo protegerse?', subtitle: '¿Los niños y niñas saben cómo protegerse?', type: 'pills', options: ['Sí', 'Parcialmente', 'No', 'No sabe'], audience: 'minor' },
      { id: 'adultos_confianza', label: '¿Existen adultos de confianza?', subtitle: '¿Cuenta con adultos de confianza a quién acudir?', type: 'pills', options: ['Sí', 'No', 'Algunas veces'], audience: 'minor' },
      { id: 'lugares_riesgo', label: '¿Qué lugares considera de riesgo?', subtitle: '¿Qué lugares considera de riesgo?', type: 'checkbox-group', options: ['Vivienda', 'Calle', 'Parques', 'Transporte público', 'Entornos digitales', 'Colegios', 'Otro'], audience: 'minor', multi: true, showOther: true, full: true },
      { id: 'conoce_casos_vs', label: '¿Conoce casos de violencia sexual?', subtitle: '¿Conoce casos de violencia sexual en su entorno?', type: 'pills', options: ['Sí', 'No', 'Prefiere no responder'], audience: 'minor' },
    ],
  },
  {
    id: 6, title: 'Género y Cuidado', icon: 'HeartPulse',
    questions: [
      { id: 'quien_asume_cuidado', label: '¿Quién asume labores de cuidado?', subtitle: '¿Quién asume las labores de cuidado en su hogar?', type: 'pills', options: ['Mamá', 'Papá', 'Abuelos', 'Familia', 'Vecinos', 'Otro'], audience: 'all', showOther: true },
      { id: 'distribucion_justa', label: '¿Distribución justa de responsabilidades?', subtitle: '¿Las responsabilidades se distribuyen de forma justa?', type: 'pills', options: ['Sí', 'Parcialmente', 'No'], audience: 'all' },
      { id: 'mujeres_tiempo_libre', label: '¿Mujeres cuentan con tiempo libre?', subtitle: '¿Las mujeres del hogar cuentan con tiempo libre?', type: 'pills', options: ['Siempre', 'Casi siempre', 'Algunas veces', 'Casi nunca', 'Nunca'], audience: 'all' },
      { id: 'poblaciones_vulnerables', label: '¿Poblaciones más vulnerables?', subtitle: '¿Cuáles considera las poblaciones más vulnerables?', type: 'checkbox-group', options: ['Mujeres', 'Hombres', 'Niños', 'Mayores', 'Discapacidad', 'LGBTIQ+', 'Todas'], audience: 'all', multi: true, full: true },
    ],
  },
  {
    id: 7, title: 'Adultos Mayores', icon: 'Users',
    questions: [
      { id: 'persona_mayor_hogar', label: '¿Vive alguna persona mayor en el hogar?', subtitle: '¿Vive alguna persona mayor en su hogar?', type: 'pills', options: ['Sí', 'No'], audience: 'major' },
      { id: 'apoyo_suficiente', label: '¿Cuenta con apoyo suficiente?', subtitle: '¿Esa persona mayor cuenta con apoyo suficiente?', type: 'pills', options: ['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre'], audience: 'major' },
      { id: 'abandono_maltrato', label: '¿Ha identificado abandono o maltrato?', subtitle: '¿Ha identificado abandono o maltrato hacia ella?', type: 'pills', options: ['Sí', 'No'], audience: 'major', conditional: { on: 'Sí', targetId: 'abandono_maltrato_cual', placeholder: '¿Cuál?' } },
      { id: 'mayor_ingresos', label: '¿Cuenta con ingresos?', subtitle: '¿La persona mayor cuenta con ingresos propios?', type: 'pills', options: ['Sí', 'No'], audience: 'major' },
      { id: 'mayor_fuente_ingresos', label: '¿De dónde proviene?', subtitle: '¿De dónde provienen esos ingresos?', type: 'pills', options: ['Pensión', 'Subsidio', 'Apoyo familiar', 'Empleo', 'Otros'], audience: 'major', showOther: true, enabledIf: { id: 'mayor_ingresos', equals: 'Sí' } },
      { id: 'mayor_autonomia', label: '¿Cuenta con autonomía sobre su dinero?', subtitle: '¿Tiene autonomía sobre su propio dinero?', type: 'pills', options: ['Sí', 'No'], audience: 'major', conditional: { on: 'Sí', targetId: 'mayor_autonomia_consensuado', placeholder: '¿Es consensuado?' } },
    ],
  },
  {
    id: 8, title: 'Bienestar Emocional', icon: 'HeartPulse',
    questions: [
      { id: 'situaciones_sentidas', label: 'Situaciones sentidas últimamente', subtitle: '¿Qué situaciones ha sentido últimamente?', type: 'checkbox-group', options: ['Estrés', 'Ansiedad', 'Soledad', 'Temor', 'Tranquilidad', 'Felicidad', 'Angustia', 'Tristeza', 'Agotamiento', 'Otro'], audience: 'all', multi: true, showOther: true, full: true },
      { id: 'recibir_apoyo_cuidado', label: '¿Le gustaría recibir apoyo en cuidado?', subtitle: '¿Le gustaría recibir apoyo en temas de cuidado?', type: 'pills', options: ['Sí', 'No', 'Tal vez'], audience: 'all', conditional: { on: 'Sí', targetId: 'recibir_apoyo_cuidado_cuales', placeholder: '¿Cuáles?' }, full: true },
    ],
  },
  {
    id: 9, title: 'Territorio y Seguridad', icon: 'Shield',
    questions: [
      { id: 'seguridad_barrio', label: '¿Cómo percibe la seguridad del barrio?', subtitle: '¿Cómo percibe la seguridad de su barrio?', type: 'pills', options: ['Muy segura', 'Segura', 'Regular', 'Insegura', 'Muy insegura'], audience: 'all', full: true },
      { id: 'situaciones_convivencia', label: '¿Qué situaciones afectan más la convivencia?', subtitle: '¿Qué situaciones afectan más la convivencia en su barrio?', type: 'checkbox-group', options: ['Consumo de SPA', 'Inseguridad', 'Violencia', 'Habitabilidad en calle', 'Basuras', 'Falta institucional', 'Familias', 'Otro'], audience: 'all', multi: true, showOther: true, full: true },
      { id: 'parques_seguros', label: '¿Parques seguros para niñez y familias?', subtitle: '¿Los parques son seguros para la niñez y las familias?', type: 'pills', options: ['Sí', 'Parcialmente', 'No'], audience: 'all', full: true },
    ],
  },
  {
    id: 10, title: 'Acceso Institucional', icon: 'FileText',
    questions: [
      { id: 'conoce_rutas', label: '¿Conoce rutas de atención?', subtitle: '¿Conoce las rutas de atención disponibles?', type: 'pills', options: ['Sí', 'Parcialmente', 'No'], audience: 'all' },
      { id: 'sabe_entidad', label: '¿Sabe a qué entidad acudir en riesgo?', subtitle: '¿Sabe a qué entidad acudir ante un riesgo?', type: 'pills', options: ['Sí', 'No', 'No está seguro/a'], audience: 'all' },
      { id: 'dificultades_denunciar', label: '¿Qué dificultades existen para denunciar?', subtitle: '¿Qué dificultades existen para denunciar?', type: 'checkbox-group', options: ['Miedo', 'Desconfianza', 'Vergüenza', 'Desconocimiento', 'Dependencia', 'Amenazas', 'Falta de apoyo', 'Otra'], audience: 'all', multi: true, showOther: true, full: true },
      { id: 'instituciones_presencia', label: '¿Instituciones hacen presencia suficiente?', subtitle: '¿Las instituciones hacen presencia suficiente en su barrio?', type: 'pills', options: ['Sí', 'Parcialmente', 'No'], audience: 'all' },
      { id: 'fortalecer_ninez', label: '¿Importante fortalecer derechos de niñez?', subtitle: '¿Qué tan importante considera fortalecer los derechos de la niñez?', type: 'pills', options: ['Muy importante', 'Importante', 'Poco importante', 'Nada importante'], audience: 'minor' },
    ],
  },
  {
    id: 11, title: 'Necesidades y Recomendaciones', icon: 'Star',
    questions: [
      { id: 'acciones_prioritarias', label: 'Acciones prioritarias para prevenir violencias', subtitle: '¿Qué acciones prioritarias propondría para prevenir violencias? (máximo 3)', type: 'checkbox-group', options: ['Talleres de prevención', 'Rutas de atención claras', 'Más presencia institucional', 'Espacios seguros para la niñez', 'Formación en derechos', 'Apoyo psicosocial', 'Fortalecer redes comunitarias', 'Mejorar entornos públicos', 'Otro'], audience: 'all', multi: true, maxSelect: 3, showOther: true, full: true },
      { id: 'participar_espacios', label: '¿Le gustaría participar en espacios?', subtitle: '¿Le gustaría participar en espacios comunitarios?', type: 'pills', options: ['Sí', 'No', 'Tal vez'], audience: 'all' },
      { id: 'interes_formacion_derechos', label: '¿Le interesaría formación en derechos?', subtitle: '¿Le interesaría recibir formación en derechos?', type: 'pills', options: ['Sí', 'No', 'Tal vez'], audience: 'all' },
      { id: 'recomendacion_instituciones', label: '¿Qué recomendación le haría a las instituciones?', subtitle: '¿Qué recomendación le haría a las instituciones? (texto libre)', type: 'textarea', audience: 'all', full: true },
    ],
  },
];

// Devuelve true si la pregunta debe mostrarse para el tipo de documento dado.
export function isVisibleForDoc(audience: Audience, isMinor: boolean): boolean {
  if (audience === 'all') return true;
  if (audience === 'minor') return isMinor;
  return !isMinor; // 'major'
}
