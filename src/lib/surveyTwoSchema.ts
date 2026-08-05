// ============================================================================
// ENCUESTA DOS — Esquema declarativo (REESTRUCTURADO).
//
// Flujo del sistema:
//   FASE 0 (Ingreso)  -> pantalla con 2 botones de REGISTRO ALEATORIO ANÓNIMO.
//                        Cada botón genera un código único de registro y fija el
//                        perfil ('adulto' | 'menor'). No captura datos personales.
//   FASE 1 (Consentimiento) -> política de datos diferenciada por perfil, con
//                        compuerta lógica: si NO acepta -> cierre de la encuesta.
//   FASE 2 (Cuerpo)   -> 5 módulos con preguntas de ruta (adulto/menor/ambos).
//
// route:
//   'ambos'  -> se muestra en las dos rutas
//   'adulto' -> SOLO perfil Adulto (18+)
//   'menor'  -> SOLO perfil Menor de Edad (<18)
// ============================================================================

export type Perfil = 'adulto' | 'menor';

// ---- FASE 0: Pantalla de ingreso / registro aleatorio ----------------------
export interface EntryButton {
  id: Perfil;
  label: string;
  description: string;
  icon: string; // icono lucide
}

export const ENTRY_BUTTONS: EntryButton[] = [
  {
    id: 'adulto',
    label: 'Mayor de Edad',
    description: 'Genera un registro único con perfil Adulto (18 años o más).',
    icon: 'UserCheck',
  },
  {
    id: 'menor',
    label: 'Menor de Edad',
    description: 'Genera un registro único con perfil Menor de Edad (menor de 18 años).',
    icon: 'Baby',
  },
];

// Genera un código de registro único (anónimo, no asociado a datos personales).
export function generateRegistroCodigo(perfil: Perfil): string {
  const prefix = perfil === 'menor' ? 'MEN' : 'ADU';
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `E2-${prefix}-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

// ---- FASE 1: Consentimiento diferenciado -----------------------------------
export interface ConsentDef {
  title: string;
  intro: string;    // párrafo(s) informativos
  question: string; // pregunta de aceptación
  acceptLabel: string;
  rejectLabel: string;
}

export const CONSENT: Record<Perfil, ConsentDef> = {
  adulto: {
    title: 'Opción A · Para Personas Adultas (18 años o más)',
    intro:
      'Le damos la bienvenida a este espacio de escucha comunitaria. Antes de empezar, le informamos que esta encuesta es completamente anónima y confidencial. Sus respuestas no serán asociadas a su nombre y se utilizarán exclusivamente con fines científicos, de análisis técnico y para el diseño de recomendaciones de política pública. Todo esto se realiza bajo el estricto marco de la Ley 1581 de 2012 (Protección de Datos Personales). Usted está en total libertad y tiene el derecho de no responder cualquier pregunta que le genere incomodidad o de detener y cancelar la encuesta en el momento en que lo desee, sin que esto le genere ningún tipo de perjuicio.',
    question: '¿Comprende esta información y acepta participar voluntariamente en este ejercicio?',
    acceptLabel: 'SÍ ACEPTA',
    rejectLabel: 'NO ACEPTA',
  },
  menor: {
    title: 'Opción B · Para Niños, Niñas y Adolescentes (Menores de 18 años)',
    intro:
      'Paso 1: Consentimiento del Adulto Responsable. Para nosotros es una prioridad absoluta proteger los derechos y el bienestar de las infancias y juventudes de Barrios Unidos. Por esta razón, para que el menor de edad pueda responder esta encuesta anónima sobre convivencia y cuidado, necesitamos su autorización como adulto responsable. Las respuestas serán totalmente confidenciales bajo la Ley 1581 de 2012, se usarán solo para mejorar los servicios comunitarios de la localidad y el menor puede detenerse si se siente incómodo.',
    question: 'Como adulto a cargo, ¿autoriza usted que el/la menor participe en este estudio?',
    acceptLabel: 'SÍ ACEPTA',
    rejectLabel: 'NO ACEPTA',
  },
};

// Paso 2 (solo Menor): asentimiento del propio menor, tras el consentimiento del
// adulto responsable. Compuerta: si NO quiere participar -> cierre respetuoso.
export const ASSENT_MENOR: ConsentDef = {
  title: 'Paso 2 · Asentimiento del Menor de Edad',
  intro:
    '¡Hola! Queremos invitarte a participar en una actividad muy corta donde nos vas a contar cómo te sientes en tu hogar y en tu barrio. No es una evaluación, no hay respuestas buenas ni malas, y nadie va a saber qué respondiste tú porque guardaremos el secreto de tus respuestas. Si alguna pregunta no te gusta, me puedes decir "no quiero responder esa" o si te cansas, podemos parar cuando tú quieras.',
  question: '¿Te gustaría ayudarnos respondiendo estas preguntas de forma libre?',
  acceptLabel: 'SÍ QUIERE participar',
  rejectLabel: 'NO QUIERE participar',
};

// Mensaje de cierre cuando NO se acepta la política de datos.
export const CLOSURE_MESSAGE = {
  title: 'Encuesta finalizada',
  body: 'Ha decidido no participar. Respetamos su decisión: la encuesta se ha cerrado y no se ha registrado ninguna respuesta. Gracias por su tiempo.',
};

// ---- Catálogo Barrio -> UPL (indexación automática, igual que Encuesta 1) ---
export const BARRIO_TO_UPL: Record<string, string> = {
  // UPL Los Andes
  'Villa Calasanz': 'Los Andes',
  'Conjunto Residencial Calle 100': 'Los Andes',
  'Entre Ríos': 'Los Andes',
  'Escuela Militar': 'Los Andes',
  'La Castellana': 'Los Andes',
  'La Patria': 'Los Andes',
  'Los Andes': 'Los Andes',
  'Río Negro': 'Los Andes',
  'Urbanización San Martín': 'Los Andes',
  'Vizcaya': 'Los Andes',
  // UPL Doce de Octubre
  'Doce de Octubre': 'Doce de Octubre',
  'Jorge Eliécer Gaitán': 'Doce de Octubre',
  'José Joaquín Vargas': 'Doce de Octubre',
  'La Libertad': 'Doce de Octubre',
  'Rincón del Salitre': 'Doce de Octubre',
  'El Labrador': 'Doce de Octubre',
  'Metrópolis': 'Doce de Octubre',
  'Popular Modelo': 'Doce de Octubre',
  'San Fernando': 'Doce de Octubre',
  'San Fernando Occidental': 'Doce de Octubre',
  'San Miguel': 'Doce de Octubre',
  'Simón Bolívar': 'Doce de Octubre',
  // UPL Los Alcázares
  'Once de Noviembre': 'Los Alcázares',
  'Alcázares Norte': 'Los Alcázares',
  'Baquero': 'Los Alcázares',
  'Benjamín Herrera': 'Los Alcázares',
  'Chapinero Noroccidental': 'Los Alcázares',
  'Colombia': 'Los Alcázares',
  'Concepción Norte': 'Los Alcázares',
  'Juan XXIII': 'Los Alcázares',
  'La Aurora': 'Los Alcázares',
  'La Esperanza': 'Los Alcázares',
  'La Merced Norte': 'Los Alcázares',
  'La Paz': 'Los Alcázares',
  'Los Alcázares': 'Los Alcázares',
  'Muequetá': 'Los Alcázares',
  'Polo Club': 'Los Alcázares',
  'Quinta Mutis': 'Los Alcázares',
  'Rafael Uribe': 'Los Alcázares',
  'San Felipe': 'Los Alcázares',
  'Santa Sofía': 'Los Alcázares',
  'Siete de Agosto': 'Los Alcázares',
  // UPL Parque Salitre
  'El Rosario': 'Parque Salitre',
};

export const ALL_BARRIOS = Object.keys(BARRIO_TO_UPL).sort();
export const ALL_UPLS = Array.from(new Set(Object.values(BARRIO_TO_UPL))).sort();

// ---- FASE 2: Tipos de pregunta y estructura --------------------------------
export type Route = 'ambos' | 'adulto' | 'menor';
export type QType =
  | 'pills' | 'checkbox-group' | 'date-split' | 'select' | 'textarea' | 'text';

export interface Question {
  id: string;
  label: string;
  subtitle?: string;
  type: QType;
  options?: string[];
  route: Route;
  required?: boolean;       // por defecto true
  multi?: boolean;          // checkbox múltiple
  maxSelect?: number;       // límite de selecciones
  showOther?: boolean;      // habilita caja "Otro/Otra"
  // Opciones que disparan la caja abierta cuando su etiqueta no es 'Otro'/'Otra'
  // (ej. 'No binario / Otro'). Si se omite, se usan 'Otro' y 'Otra'.
  otherOn?: string[];
  // Opciones excluyentes en preguntas múltiples: al marcarlas se desmarcan las
  // demás, y al marcar cualquier otra se desmarcan estas.
  exclusiveOptions?: string[];
  full?: boolean;           // ocupa fila completa
  // Caja de texto condicional que se abre cuando el valor del padre === on
  conditional?: { on: string; targetId: string; placeholder: string };
  min?: number; max?: number; step?: number; suffix?: string;
}

export interface ModuleDef {
  id: number;
  title: string;
  icon: string; // icono lucide
  questions: Question[];
}

// Escalas reutilizadas.
const LIKERT_ACUERDO = ['Totalmente de acuerdo', 'De acuerdo', 'Ni de acuerdo ni en desacuerdo', 'En desacuerdo', 'Totalmente en desacuerdo'];
const FRECUENCIA = ['Nunca', 'Rara vez', 'Algunas veces', 'Frecuentemente', 'Siempre'];

export const MODULES: ModuleDef[] = [
  {
    id: 1, title: 'Características Sociodemográficas y Arraigo Territorial', icon: 'User',
    questions: [
      { id: 'barrio', label: '¿En qué barrio reside de manera permanente?', subtitle: 'Se asigna automáticamente la UPL correspondiente.', type: 'select', options: ALL_BARRIOS, route: 'ambos', full: true },
      { id: 'zona', label: 'Zona (UPL)', subtitle: 'Detectada automáticamente a partir del barrio.', type: 'select', options: ALL_UPLS, route: 'ambos', required: false },
      { id: 'genero', label: '2. Sexo con el que se identifica', subtitle: 'Seleccione una opción.', type: 'pills', options: ['Masculino', 'Femenino', 'No binario / Otro', 'Prefiero no responder'], route: 'ambos', showOther: true, otherOn: ['No binario / Otro'] },
      { id: 'fecha_nacimiento', label: 'Fecha de nacimiento', subtitle: 'Día, mes y año.', type: 'date-split', route: 'ambos', full: true },
      // P4 — condicionada por edad: nivel alcanzado (adulto) / año en curso (menor).
      { id: 'nivel_educativo', label: '4. ¿Cuál es el nivel educativo más alto que ha alcanzado?', subtitle: 'Seleccione una opción.', type: 'pills', options: ['Primaria completa / incompleta', 'Bachillerato completo / incompleto', 'Técnico o Tecnológico', 'Universitario o Posgrado', 'Ninguno'], route: 'adulto' },
      { id: 'anio_escolar', label: '4. ¿Qué año escolar estás cursando actualmente?', subtitle: 'Selecciona una opción.', type: 'pills', options: ['No estoy estudiando', 'Primaria', 'Secundaria', 'Bachillerato', 'Ya me gradué del colegio'], route: 'menor' },
      // P5 — selección múltiple con opción excluyente.
      { id: 'composicion_hogar', label: '5. ¿Cómo está compuesto su hogar principalmente?', subtitle: 'Puede seleccionar varias opciones.', type: 'checkbox-group', multi: true, options: ['Vivo solo o sola.', 'Vivo únicamente con mi pareja.', 'Vivo con mis padres y hermanos.', 'Vivo con mis padres.', 'Soy mamá o papá soltero/a y vivo solo con mis hijos.', 'Vivo con mi pareja y con nuestros hijos.', 'Vivimos en familia grande (con abuelos, tíos, primos u otros familiares bajo el mismo techo).', 'Vivo con amigos, conocidos o compañeros de arriendo/vivienda.', 'Prefiero no responder'], exclusiveOptions: ['Prefiero no responder'], route: 'ambos', full: true },
      // P6 — condicionada por edad: habitaciones del hogar (adulto) / con cuántas
      // personas comparte el cuarto donde duerme (menor).
      { id: 'habitaciones_dormir', label: '6. Sin contar la sala, la cocina o el baño, ¿en cuántas habitaciones o cuartos de la vivienda duermen las personas que componen su hogar?', subtitle: 'Seleccione una opción.', type: 'pills', options: ['En 1 habitación.', 'En 2 habitaciones.', 'En 3 habitaciones o más.', 'Prefiere no responder.'], route: 'adulto', full: true },
      { id: 'comparte_habitacion', label: '6. ¿Con cuántas personas compartes la habitación o el cuarto donde duermes por las noches?', subtitle: 'Selecciona una opción.', type: 'pills', options: ['No la comparto, duermo solo/a.', 'La comparto con 1 o 2 personas.', 'La comparto con 3 o más personas.', 'Prefiero no responder.'], route: 'menor', full: true },
    ],
  },
  {
    id: 2, title: 'Dinámicas de Convivencia y Distribución del Cuidado', icon: 'Users',
    questions: [
      // Horas de cuidado — solo mayores de edad.
      { id: 'horas_cuidado', label: 'En promedio, ¿cuántas horas diarias dedica usted al trabajo de cuidado no remunerado? (Hacer aseo, cocinar, cuidar niños, personas mayores o enfermas en casa)', subtitle: 'Seleccione una opción.', type: 'pills', options: ['Menos de 2 horas al día', 'Entre 2 y 5 horas al día', 'Entre 6 y 10 horas al día', 'Más de 10 horas al día', 'No realizo labores de cuidado.', 'Prefiere no responder'], route: 'adulto', full: true },
      // Tensiones por dificultades económicas — condicionada por edad.
      { id: 'tensiones_economicas', label: 'En los últimos 12 meses, ¿con qué frecuencia las dificultades económicas (falta de empleo, deudas o escasez de dinero para el diario) han sido el detonante de discusiones o tensiones fuertes en su hogar?', subtitle: 'Seleccione una opción.', type: 'pills', options: ['Constantemente (Casi todas las semanas).', 'Con frecuencia (Algunas veces al mes).', 'Rara vez.', 'Nunca.', 'Prefiere no responder.'], route: 'adulto', full: true },
      { id: 'tensiones_economicas_menor', label: 'En tu casa, ¿sientes que los adultos se ponen más estresados, gritan o discuten más cuando hay preocupaciones por la falta de trabajo o por el dinero de la comida y el arriendo?', subtitle: 'Selecciona una opción.', type: 'pills', options: ['Sí, pasa casi siempre que falta dinero.', 'A veces influye en las peleas.', 'No, las discusiones no tienen que ver con el dinero.', 'Prefiero no responder.'], route: 'menor', full: true },
      // Distribución de tareas del hogar — condicionada por edad.
      { id: 'distribucion_tareas', label: '¿Cómo siente que se distribuyen las tareas del hogar y de cuidado entre los miembros de su familia?', subtitle: 'Seleccione una opción.', type: 'pills', options: ['Se distribuyen de manera equitativa entre todos.', 'Principalmente las asumen las mujeres del hogar.', 'Principalmente las asumo yo.', 'Se comparten parcialmente.', 'No hay organización y esto genera constantes discusiones.', 'Prefiere no responder'], route: 'adulto', full: true },
      { id: 'tiempo_cuida_hermanos', label: 'Después de estudiar, ¿dedicas tiempo en el día a cuidar a tus hermanos menores, abuelitos o a hacer los quehaceres de la casa?', subtitle: 'Selecciona una opción.', type: 'pills', options: ['No, casi no dedico tiempo a eso.', 'Sí, le dedico un par de horas al día.', 'Sí, paso la mayor parte del día cuidando a otros o haciendo aseo.', 'Solo realizo actividades de cuidado en el día.', 'Prefiere no responder'], route: 'menor', full: true },
      // Métodos de corrección hacia NNA — condicionada por edad.
      { id: 'metodo_correccion', label: 'En su hogar, ¿cuál es la forma más común que se utiliza para corregir o guiar a los niños, niñas y adolescentes?', subtitle: 'Seleccione una opción.', type: 'pills', options: ['El diálogo, los acuerdos y el retiro de privilegios.', 'Gritos, insultos o castigos morales.', 'Golpes, palmadas o castigos físicos.', 'No aplica (No hay menores en el hogar).', 'Prefiere no responder.'], route: 'adulto', full: true },
      { id: 'metodo_correccion_menor', label: 'Cuando los adultos de tu casa se disgustan o te van a llamar la atención a ti o a tus hermanos, ¿cuál es el método que más usan?', subtitle: 'Selecciona una opción.', type: 'pills', options: ['Nos explican, dialogan con nosotros y nos enseñan con paciencia.', 'Nos gritan, nos insultan o nos hacen sentir mal con palabras.', 'Nos pegan, nos dan palmadas, correazos o castigos físicos.', 'Otro.', 'Prefiero no responder.'], route: 'menor', showOther: true, otherOn: ['Otro.'], full: true },
    ],
  },
  {
    id: 3, title: 'Percepciones Socioculturales y Representaciones', icon: 'HeartPulse',
    questions: [
      { id: 'acuerdo_celos', label: 'Los celos y revisar el celular son una muestra de amor', subtitle: '¿Qué tan de acuerdo está con esta afirmación?', type: 'pills', options: LIKERT_ACUERDO, route: 'adulto', full: true },
      { id: 'metodo_llamar_atencion', label: 'Cuando los adultos de tu casa se disgustan contigo, ¿qué hacen con más frecuencia?', subtitle: 'Selecciona el método que más usan para llamarte la atención.', type: 'pills', options: ['Hablan conmigo con calma', 'Me gritan o me regañan', 'Me castigan sin golpes (quitan permisos)', 'Me pegan', 'Otro'], route: 'menor', showOther: true, full: true },
      { id: 'puerta_cerrada', label: 'Los problemas familiares deben resolverse "a puerta cerrada"', subtitle: '¿Qué tan de acuerdo está con esta afirmación?', type: 'pills', options: LIKERT_ACUERDO, route: 'adulto', full: true },
      { id: 'consumo_causa_violencia', label: 'El consumo de alcohol o SPA es la causa principal de la violencia', subtitle: '¿Qué tan de acuerdo está con esta afirmación?', type: 'pills', options: LIKERT_ACUERDO, route: 'adulto', full: true },
      { id: 'acuerdo_celos_menor', label: '"Si mi novio o novia me cela y me revisa el celular, es porque me quiere"', subtitle: '¿Qué tan de acuerdo estás con esta frase?', type: 'pills', options: LIKERT_ACUERDO, route: 'menor', full: true },
    ],
  },
  {
    id: 4, title: 'Identificación de Alertas de Riesgo', icon: 'Shield',
    questions: [
      { id: 'frecuencia_discusiones', label: 'Discusiones que terminan en insultos (últimos 12 meses)', subtitle: '¿Con qué frecuencia se han presentado discusiones en su entorno familiar que terminan en insultos o agresiones?', type: 'pills', options: FRECUENCIA, route: 'adulto', full: true },
      { id: 'frecuencia_miedo', label: 'Miedo en casa por gritos o peleas fuertes (último año)', subtitle: '¿Con qué frecuencia has sentido miedo en tu casa por culpa de gritos o peleas muy fuertes?', type: 'pills', options: FRECUENCIA, route: 'menor', full: true },
      { id: 'control_economico', label: '¿Ha identificado control del dinero u ocultamiento de documentos?', subtitle: 'En la cotidianidad de su hogar, ¿ha identificado situaciones donde se controle el dinero o se oculten documentos?', type: 'pills', options: ['Sí', 'No', 'Prefiere no responder'], route: 'adulto', conditional: { on: 'Sí', targetId: 'control_economico_detalle', placeholder: 'Si desea, describa brevemente la situación.' }, full: true },
      { id: 'esconder_cosas_menor', label: '¿Has visto que a alguien le escondan sus cosas o no le den dinero para comida o colegio?', subtitle: 'En tu casa o con familias que conoces.', type: 'pills', options: ['Sí', 'No', 'No sé'], route: 'menor', full: true },
      { id: 'conducta_sexual_forzada', label: '¿Ha percibido situaciones de conductas sexuales no deseadas en el entorno familiar?', subtitle: '¿Ha percibido o experimentado situaciones donde se obligue a alguien a tener relaciones o conductas sexuales no deseadas?', type: 'pills', options: ['Sí', 'No', 'Prefiere no responder'], route: 'adulto', full: true },
      { id: 'incomodidad_tocamientos', label: '¿Te has sentido incómodo/a o presionado/a por tocamientos de un familiar o adulto?', subtitle: '¿Alguna vez te has sentido incómodo/a, asustado/a o presionado/a por caricias, tocamientos o comportamientos de un familiar o adulto?', type: 'pills', options: ['Sí', 'No', 'Prefiero no responder'], route: 'menor', full: true },
    ],
  },
  {
    id: 5, title: 'Acceso Institucional y Rutas de Protección', icon: 'FileText',
    questions: [
      { id: 'primera_accion', label: 'Primera acción ante una emergencia por violencia', subtitle: 'Si ocurriera una emergencia por violencia familiar o sexual, ¿cuál sería la primera acción que tomaría?', type: 'pills', options: ['Llamar a la Línea 123', 'Acudir a la Comisaría de Familia', 'Buscar a la Policía', 'Contárselo a un familiar o vecino', 'No sabría qué hacer', 'Otro'], route: 'adulto', showOther: true, full: true },
      { id: 'contaria_alguien', label: 'Si te sintieras en peligro o alguien te hiciera daño, ¿le contarías a alguien?', subtitle: 'Selecciona la opción que mejor te representa.', type: 'pills', options: ['Sí, a un familiar', 'Sí, a un profesor/a', 'Sí, a un amigo/a', 'No, a nadie', 'No sé'], route: 'menor', full: true },
      { id: 'barrera_denuncia', label: 'Mayor barrera para denunciar', subtitle: 'Desde su percepción, ¿cuál es la mayor barrera u obstáculo que frena a los residentes al momento de denunciar?', type: 'pills', options: ['Miedo a represalias', 'Desconfianza en las instituciones', 'Vergüenza', 'Desconocimiento de las rutas', 'Dependencia económica', 'Otro'], route: 'adulto', showOther: true, full: true },
      { id: 'disposicion_participar', label: 'Disposición del hogar para participar en espacios de orientación', subtitle: 'Si las instituciones del Distrito ofrecieran espacios de orientación, ¿qué tanta disposición tendría su hogar para participar?', type: 'pills', options: ['Mucha disposición', 'Alguna disposición', 'Poca disposición', 'Ninguna disposición'], route: 'adulto', full: true },
    ],
  },
];

// Devuelve true si la pregunta debe mostrarse para el perfil dado.
// Opciones que abren la caja de texto abierta de una pregunta. Por defecto
// 'Otro'/'Otra'; 'otherOn' permite etiquetas propias (ej. 'No binario / Otro').
export function otherTriggers(q: Question): string[] {
  return q.otherOn && q.otherOn.length ? q.otherOn : ['Otro', 'Otra'];
}

// ¿El valor seleccionado (único o múltiple) abre la caja "Otro"?
export function opensOther(q: Question, value: any): boolean {
  if (!q.showOther) return false;
  const triggers = otherTriggers(q);
  return Array.isArray(value) ? value.some(v => triggers.includes(v)) : triggers.includes(value);
}

export function isVisibleForRoute(route: Route, perfil: Perfil): boolean {
  if (route === 'ambos') return true;
  return route === perfil;
}
