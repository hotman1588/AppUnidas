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

// Escala de acuerdo sin punto neutro, con opción de no responder.
const LIKERT_SIN_NEUTRO = ['Totalmente de acuerdo', 'De acuerdo', 'En desacuerdo', 'Totalmente en desacuerdo', 'Prefiere no responder'];

export const MODULES: ModuleDef[] = [
  {
    id: 1, title: 'Características Sociodemográficas y Arraigo Territorial', icon: 'User',
    questions: [
      { id: 'barrio', label: '¿En qué barrio reside usted?', subtitle: 'Se asigna automáticamente la UPL correspondiente.', type: 'select', options: ALL_BARRIOS, route: 'ambos', full: true },
      { id: 'zona', label: 'Zona (UPL)', subtitle: 'Detectada automáticamente a partir del barrio.', type: 'select', options: ALL_UPLS, route: 'ambos', required: false },
      { id: 'genero', label: 'Sexo con el que se identifica', subtitle: 'Seleccione una opción.', type: 'pills', options: ['Femenino', 'Masculino', 'No binario / Otro', 'Prefiere no responder'], route: 'ambos', showOther: true, otherOn: ['No binario / Otro'] },
      { id: 'fecha_nacimiento', label: 'Indique su fecha de nacimiento', subtitle: 'Formato dd/mm/aaaa.', type: 'date-split', route: 'ambos', full: true },
      // P4 — condicionada por edad: nivel alcanzado (adulto) / año en curso (menor).
      { id: 'nivel_educativo', label: '¿Cuál es el nivel educativo más alto que ha alcanzado?', subtitle: 'Seleccione una opción.', type: 'pills', options: ['Primaria completa', 'Primaria incompleta', 'Bachillerato completo', 'Bachillerato incompleto', 'Técnico o Tecnológico', 'Universitario o Posgrado', 'Ninguno'], route: 'adulto' },
      { id: 'anio_escolar', label: '¿Qué año escolar estás cursando actualmente?', subtitle: 'Selecciona una opción.', type: 'pills', options: ['No estoy estudiando', 'Primaria', 'Secundaria', 'Bachillerato', 'Ya me gradué del colegio'], route: 'menor' },
      { id: 'composicion_hogar', label: '¿Cómo está compuesto su hogar principalmente?', subtitle: 'Seleccione una opción.', type: 'pills', options: ['Vivo solo o sola.', 'Vivo únicamente con mi pareja.', 'Vivo con mis padres y hermanos.', 'Vivo con mis padres.', 'Soy mamá o papá soltero/a y vivo solo con mis hijos.', 'Vivo con mi pareja y con nuestros hijos.', 'Vivimos en familia grande (con abuelos, tíos, primos u otros familiares bajo el mismo techo).', 'Vivo con amigos, conocidos o compañeros de arriendo/vivienda.', 'Prefiere no responder'], route: 'ambos', full: true },
      // P6 — condicionada por edad: habitaciones del hogar (adulto) / con cuántas
      // personas comparte el cuarto donde duerme (menor).
      { id: 'habitaciones_dormir', label: 'Sin contar la sala, la cocina o el baño, ¿en cuántas habitaciones o cuartos de la vivienda duermen las personas que componen su hogar?', subtitle: 'Seleccione una opción.', type: 'pills', options: ['En 1 habitación.', 'En 2 habitaciones.', 'En 3 habitaciones o más.', 'Prefiere no responder.'], route: 'adulto', full: true },
      { id: 'comparte_habitacion', label: '¿Con cuántas personas compartes la habitación o el cuarto donde duermes por las noches?', subtitle: 'Selecciona una opción.', type: 'pills', options: ['No la comparto, duermo solo/a.', 'La comparto con 1 o 2 personas.', 'La comparto con 3 o más personas.', 'Prefiero no responder.'], route: 'menor', full: true },
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
      // Celos y control en la pareja — condicionada por edad.
      { id: 'acuerdo_celos', label: '¿Qué tan de acuerdo está con la siguiente afirmación: "En una pareja, los celos y revisar el celular son una muestra de amor y protección"?', subtitle: 'Seleccione una opción.', type: 'pills', options: LIKERT_SIN_NEUTRO, route: 'adulto', full: true },
      { id: 'acuerdo_celos_menor', label: '¿Qué tan de acuerdo estás con esta frase: "Si mi novio o novia me cela, me revisa el celular o me dice cómo vestirme, es porque me ama y me cuida"?', subtitle: 'Selecciona una opción.', type: 'pills', options: LIKERT_SIN_NEUTRO, route: 'menor', full: true },
      // Privacidad de los conflictos familiares — condicionada por edad.
      { id: 'puerta_cerrada', label: 'Frente a las discusiones de pareja en el barrio, ¿cree usted que los problemas familiares deben resolverse estrictamente "a puerta cerrada" sin intervención de vecinos ni autoridades?', subtitle: 'Seleccione una opción.', type: 'pills', options: ['Sí, lo que pasa en casa es privado.', 'Solo si hay golpes se debe buscar ayuda de afuera.', 'No, cualquier muestra de agresión debe ser apoyada o denunciada externamente.', 'Prefiere no responder'], route: 'adulto', full: true },
      { id: 'puerta_cerrada_menor', label: 'Si ves o escuchas que unos vecinos están peleando muy fuerte en su casa, ¿crees que eso es algo privado de ellos o que se debería buscar ayuda de afuera?', subtitle: 'Selecciona una opción.', type: 'pills', options: ['Es algo privado de ellos y nadie se debe meter.', 'Solo si se están pegando se debería buscar ayuda.', 'Siempre se debería buscar ayuda o llamar a las autoridades.', 'Prefiere no responder'], route: 'menor', full: true },
      // Consumo de alcohol o SPA como causa de la violencia — condicionada por edad.
      { id: 'consumo_causa_violencia', label: '¿Considera usted que el consumo de alcohol o sustancias psicoactivas es la causa principal de la violencia en el hogar, o es un factor que la empeora?', subtitle: 'Seleccione una opción.', type: 'pills', options: ['Es la causa principal (Si no hay consumo, no habría agresión).', 'Es un factor que empeora una situación de control que ya existía antes.', 'No tiene ninguna relación.', 'Prefiere no responder'], route: 'adulto', full: true },
      { id: 'consumo_causa_violencia_menor', label: '¿Crees que cuando los adultos toman alcohol o consumen drogas es la única razón por la que se vuelven groseros o agresivos en casa, o crees que las peleas ya venían desde antes?', subtitle: 'Selecciona una opción.', type: 'pills', options: ['Es la única razón (si no tomaran, todo sería paz).', 'Es algo que empeora las discusiones que ya existían desde antes.', 'No tiene nada que ver.', 'Prefiere no responder'], route: 'menor', full: true },
      { id: 'metodo_llamar_atencion', label: 'Cuando los adultos de tu casa se disgustan contigo, ¿qué hacen con más frecuencia?', subtitle: 'Selecciona el método que más usan para llamarte la atención.', type: 'pills', options: ['Hablan conmigo con calma', 'Me gritan o me regañan', 'Me castigan sin golpes (quitan permisos)', 'Me pegan', 'Otro'], route: 'menor', showOther: true, full: true },
    ],
  },
  {
    id: 4, title: 'Identificación de Alertas de Riesgo', icon: 'Shield',
    questions: [
      // Discusiones con insultos, humillaciones o amenazas — condicionada por edad.
      { id: 'frecuencia_discusiones', label: 'En los últimos 12 meses, ¿con qué frecuencia se han presentado discusiones en su entorno familiar que han terminado en insultos, humillaciones o amenazas?', subtitle: 'Seleccione una opción.', type: 'pills', options: ['Nunca', 'Rara vez', 'Con frecuencia', 'Constantemente', 'Prefiere no responder'], route: 'adulto', full: true },
      { id: 'frecuencia_miedo', label: 'En el último año, ¿con qué frecuencia has sentido miedo en tu casa por culpa de gritos, peleas muy fuertes o insultos entre los adultos de tu familia?', subtitle: 'Selecciona una opción.', type: 'pills', options: ['Nunca me ha pasado.', 'Ha pasado un par de veces.', 'Pasa muy seguido y me hace sentir triste o asustado/a.', 'Prefiere no responder'], route: 'menor', full: true },
      // Violencia económica y patrimonial — condicionada por edad.
      { id: 'control_economico', label: 'En la cotidianidad de su hogar o de las parejas que conoce en su barrio, ¿ha identificado situaciones donde se controle el dinero, se oculten documentos o se impida trabajar a alguno de los miembros como forma de castigo o dominio?', subtitle: 'Seleccione una opción.', type: 'pills', options: ['Sí, es una situación frecuente.', 'Se ha presentado en pocas ocasiones.', 'Nunca se ha presentado.', 'No conozco situaciones de estas.', 'Prefiere no responder'], route: 'adulto', conditional: { on: 'Sí, es una situación frecuente.', targetId: 'control_economico_detalle', placeholder: 'Si desea, describa brevemente la situación.' }, full: true },
      { id: 'esconder_cosas_menor', label: 'En tu casa o con las familias que conoces en el barrio, ¿has visto que a alguien le escondan sus cosas, no lo dejen trabajar o no le den dinero para la comida o el colegio como una forma de castigo o control?', subtitle: 'Selecciona una opción.', type: 'pills', options: ['Sí, lo he visto o escuchado seguido.', 'Ha pasado muy pocas veces.', 'Nunca he visto algo así.', 'No sé / No conozco casos de esos.', 'Prefiero no responder.'], route: 'menor', full: true },
      // Violencia sexual en el entorno familiar — condicionada por edad.
      { id: 'conducta_sexual_forzada', label: '¿Ha percibido o experimentado situaciones en el entorno familiar donde se obligue a alguien a tener relaciones o conductas sexuales no deseadas mediante la fuerza, el miedo o el aprovechamiento de su autoridad?', subtitle: 'Seleccione una opción.', type: 'pills', options: ['Sí', 'No', 'Prefiero no responder'], route: 'adulto', full: true },
      { id: 'incomodidad_tocamientos', label: '¿Alguna vez te has sentido incómodo/a, asustado/a o presionado/a por caricias, tocamientos o comportamientos de un familiar o adulto dentro de tu casa?', subtitle: 'Selecciona una opción.', type: 'pills', options: ['Sí', 'No', 'Prefiero no responder.'], route: 'menor', full: true },
    ],
  },
  {
    id: 5, title: 'Acceso Institucional y Rutas de Protección', icon: 'FileText',
    questions: [
      // Primera acción ante una emergencia — condicionada por edad.
      { id: 'primera_accion', label: 'Si ocurriera una emergencia por violencia familiar o sexual en su hogar o con un vecino, ¿cuál sería la primera acción que tomaría?', subtitle: 'Seleccione una opción.', type: 'pills', options: ['Llamar a la Línea 123 o al cuadrante de Policía.', 'Acudir directamente a una Comisaría de Familia o CAI.', 'Buscar el apoyo de un familiar, amigo o líder comunitario.', 'No sabría a dónde acudir ni qué hacer.', 'Otro', 'Prefiero no responder'], route: 'adulto', showOther: true, full: true },
      { id: 'contaria_alguien', label: 'Si te sintieras en peligro, estuvieras muy triste o alguien te estuviera haciendo daño en tu casa, ¿le contarías a alguien para buscar ayuda?', subtitle: 'Selecciona una opción.', type: 'pills', options: ['Sí, le contaría a un profesor u orientador del colegio.', 'Sí, le contaría a otro familiar de confianza o a un amigo.', 'Llamaría a la policía o a una línea de ayuda (como la 123 o la 141).', 'No sabría a quién contarle, me daría mucho miedo hablar.', 'Prefiero no responder'], route: 'menor', full: true },
      // Barreras para denunciar — condicionada por edad.
      { id: 'barrera_denuncia', label: 'Desde su percepción, ¿cuál es la mayor barrera u obstáculo que frena a los residentes de su sector al momento de denunciar un caso de violencia?', subtitle: 'Seleccione la principal.', type: 'pills', options: ['El miedo a las represalias o a que la agresión empeore.', 'La lentitud en los trámites y las largas horas de espera en las entidades.', 'La falta de información sobre a dónde ir o qué líneas llamar.', 'El temor a ser juzgado, señalado por el barrio o no ser creído (Estigma social).', 'Dependencia económica', 'Otro', 'Prefiero no responder'], route: 'adulto', showOther: true, full: true },
      { id: 'barrera_denuncia_menor', label: '¿Qué crees que es lo que más frena o da miedo a las personas de tu barrio al momento de pedir ayuda o denunciar que alguien está sufriendo violencia en su casa?', subtitle: 'Selecciona la principal.', type: 'pills', options: ['El miedo a que les hagan algo malo o a que la situación se ponga peor.', 'Que los trámites con las autoridades son eternos y toca esperar demasiadas horas.', 'No saber bien a dónde ir, con quién hablar o a qué números llamar.', 'El temor a que la gente del barrio los critique, hable mal de ellos o no les crean.', 'El miedo a quedarse sin el dinero o el apoyo económico que da la persona que agrede.', 'Otra razón.', 'Prefiero no responder.'], route: 'menor', showOther: true, otherOn: ['Otra razón.'], full: true },
      // Conocimiento institucional y disposición a participar — para ambos perfiles.
      { id: 'conoce_equipo_comisaria', label: '¿Sabe usted si las Comisarías de Familia cuentan actualmente con un equipo interdisciplinario (abogado, psicólogo y trabajador social) para atender y proteger a las familias de forma integral en un mismo lugar?', subtitle: 'Seleccione una opción.', type: 'pills', options: ['Sí lo sabía y conozco que atienden juntos', 'He escuchado algo, pero no conozco cómo funciona esa atención conjunta', 'No lo sabía, pensaba que allí solo atendían abogados o comisarios', 'Prefiero no responder'], route: 'ambos', full: true },
      { id: 'disposicion_participar', label: 'Si las instituciones del Distrito ofrecieran en su barrio espacios comunitarios de orientación jurídica, apoyo psicológico y talleres de pautas de crianza sin castigo, ¿qué tanta disposición tendría su hogar para participar?', subtitle: 'Seleccione una opción.', type: 'pills', options: ['Alta disposición (Asistiría con agrado)', 'Media disposición (Asistiría dependiendo de los horarios y el trabajo)', 'Baja disposición (No es un tema que genere interés en mi hogar)', 'Prefiero no responder'], route: 'ambos', full: true },
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
