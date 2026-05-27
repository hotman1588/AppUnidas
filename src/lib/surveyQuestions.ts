/**
 * Estructura de todas las preguntas de la encuesta UNIDAS
 */

export interface SurveyQuestion {
  id: string;
  module: string;
  moduleNumber: number;
  question: string;
  subtitle?: string;
  type: 'text' | 'select' | 'checkbox' | 'textarea' | 'date' | 'number' | 'document' | 'pills';
  options?: string[];
  required: boolean;
  fieldName: string;
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  // Módulo 1: Perfil Sociodemográfico
  {
    id: '1.1',
    module: 'Perfil Sociodemográfico',
    moduleNumber: 1,
    question: 'FECHA DE NACIMIENTO',
    subtitle: 'Ingresa el día, mes y año de tu nacimiento.',
    type: 'date',
    required: true,
    fieldName: 'socio.fecha_nacimiento'
  },
  {
    id: '1.1b',
    module: 'Perfil Sociodemográfico',
    moduleNumber: 1,
    question: 'EDAD',
    subtitle: 'Edad calculada automáticamente.',
    type: 'number',
    required: false,
    fieldName: 'socio.edad'
  },
  {
    id: '1.2',
    module: 'Perfil Sociodemográfico',
    moduleNumber: 1,
    question: 'GÉNERO',
    subtitle: 'Identidad de género con la que te identificas.',
    type: 'select',
    options: ['Femenino', 'Masculino', 'No binario', 'Transgénero', 'Otro'],
    required: true,
    fieldName: 'socio.genero'
  },
  {
    id: '1.3',
    module: 'Perfil Sociodemográfico',
    moduleNumber: 1,
    question: 'BARRIO',
    subtitle: 'Selecciona tu barrio de residencia.',
    type: 'select',
    options: ['La Castellana', 'Rionegro', 'La Patria', 'El Andes', 'Los Andes', 'Doce de Octubre', 'San Fernando', 'San Jorge', 'Jorge Eliécer Gaitán', 'Benjamín Herrera', 'Las Ferias', 'Bonanza', 'Palo Blanco', 'El Laurel', 'Bellavista Occidental', 'Simón Bolívar', 'Alcázares', 'Baquero', 'Concepción Norte', 'Santa Sofía'],
    required: true,
    fieldName: 'socio.barrio'
  },
  {
    id: '1.4',
    module: 'Perfil Sociodemográfico',
    moduleNumber: 1,
    question: 'ZONA (UPL)',
    subtitle: 'Zona geográfica detectada automáticamente.',
    type: 'select',
    required: true,
    fieldName: 'socio.upz'
  },
  {
    id: '1.5',
    module: 'Perfil Sociodemográfico',
    moduleNumber: 1,
    question: 'NIVEL EDUCATIVO',
    subtitle: 'Máximo grado de escolaridad alcanzado.',
    type: 'select',
    options: ['Primaria Incompleta', 'Primaria Completa', 'Secundaria Incompleta', 'Secundaria Completa', 'Técnico', 'Tecnólogo', 'Universitario', 'Postgrado'],
    required: true,
    fieldName: 'socio.nivel_educativo'
  },
  {
    id: '1.5b',
    module: 'Perfil Sociodemográfico',
    moduleNumber: 1,
    question: 'NIVEL EDUCATIVO (ESPECIFICAR)',
    subtitle: 'Detalle cuando selecciona "Otro".',
    type: 'text',
    required: false,
    fieldName: 'socio.nivel_educativo_otro'
  },
  {
    id: '1.6',
    module: 'Perfil Sociodemográfico',
    moduleNumber: 1,
    question: 'PERTENENCIA POBLACIONAL',
    subtitle: 'Selección múltiple. ¿Con qué grupos te identificas?',
    type: 'checkbox',
    options: ['Indígena', 'Afrocolombiana', 'Raizal', 'Palenquera', 'LGBTIQ+', 'Víctima del conflicto', 'Migrante', 'Ninguno de los anteriores'],
    required: false,
    fieldName: 'socio.pertenencia'
  },
  {
    id: '1.6b',
    module: 'Perfil Sociodemográfico',
    moduleNumber: 1,
    question: 'PERTENENCIA POBLACIONAL (OTRO)',
    subtitle: 'Detalle cuando selecciona "Otro".',
    type: 'text',
    required: false,
    fieldName: 'socio.pertenencia_otro'
  },

  // Módulo 2: Economía y Autonomía
  {
    id: '2.1',
    module: 'Economía y Autonomía',
    moduleNumber: 2,
    question: 'INGRESOS MENSUALES',
    subtitle: 'Ingresa tu ingreso mensual aproximado en pesos.',
    type: 'number',
    required: true,
    fieldName: 'economia.ingresos'
  },
  {
    id: '2.2',
    module: 'Economía y Autonomía',
    moduleNumber: 2,
    question: 'FUENTE PRINCIPAL DE INGRESOS',
    subtitle: 'Selecciona tu principal fuente de ingresos.',
    type: 'select',
    options: ['Trabajo dependiente', 'Trabajo independiente', 'Negocio propio', 'Pensión', 'Renta o alquiler', 'Ayuda familiar', 'Subsidio gubernamental', 'No tengo ingresos'],
    required: true,
    fieldName: 'economia.fuente_ingresos'
  },
  {
    id: '2.2b',
    module: 'Economía y Autonomía',
    moduleNumber: 2,
    question: 'FUENTE DE INGRESOS (OTRO)',
    subtitle: 'Detalle cuando selecciona "Otro".',
    type: 'text',
    required: false,
    fieldName: 'economia.fuente_ingresos_otro'
  },
  {
    id: '2.3',
    module: 'Economía y Autonomía',
    moduleNumber: 2,
    question: 'SITUACIÓN LABORAL',
    subtitle: 'Describe tu situación actual de empleo.',
    type: 'select',
    options: ['Empleada tiempo completo', 'Empleada tiempo parcial', 'Desempleada', 'Trabajadora por cuenta propia', 'Estudiante', 'Hogar'],
    required: true,
    fieldName: 'economia.situacion_laboral'
  },
  {
    id: '2.3b',
    module: 'Economía y Autonomía',
    moduleNumber: 2,
    question: 'SITUACIÓN LABORAL (OTRO)',
    subtitle: 'Detalle cuando selecciona "Otro".',
    type: 'text',
    required: false,
    fieldName: 'economia.situacion_laboral_otro'
  },
  {
    id: '2.4',
    module: 'Economía y Autonomía',
    moduleNumber: 2,
    question: 'TIPO DE VIVIENDA',
    subtitle: 'Selecciona el tipo de vivienda donde resides.',
    type: 'select',
    options: ['Casa propia', 'Apartamento propio', 'Casa arrendada', 'Apartamento arrendado', 'Vivienda compartida', 'Otra'],
    required: false,
    fieldName: 'economia.tipo_vivienda'
  },
  {
    id: '2.4b',
    module: 'Economía y Autonomía',
    moduleNumber: 2,
    question: 'TIPO DE VIVIENDA (OTRO)',
    subtitle: 'Detalle cuando selecciona "Otra".',
    type: 'text',
    required: false,
    fieldName: 'economia.tipo_vivienda_otro'
  },

  // Módulo 3: Carga de Cuidado
  {
    id: '3.1',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: '¿ES CUIDADORA?',
    subtitle: '¿Trabajas como cuidadora o cuidador?',
    type: 'select',
    options: ['Sí', 'No'],
    required: true,
    fieldName: 'cuidado.es_cuidadora'
  },
  {
    id: '3.2',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: 'POBLACIÓN BAJO CUIDADO',
    subtitle: 'A quién brinda cuidado.',
    type: 'pills',
    options: ['Hijos, hijas o menores de edad', 'Personas mayores', 'Persona con discapacidad', 'Familiar con enfermedad', 'Varias personas del hogar', 'Cuidado del hogar o la casa', 'Mascotas', 'Plantas o huertas', 'Otro'],
    required: false,
    fieldName: 'cuidado.poblacion'
  },
  {
    id: '3.2b',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: 'POBLACIÓN BAJO CUIDADO (OTRO)',
    subtitle: 'Detalle cuando selecciona "Otro".',
    type: 'text',
    required: false,
    fieldName: 'cuidado.poblacion_otro'
  },
  {
    id: '3.3',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: 'HORAS DIARIAS DE CUIDADO',
    subtitle: 'Tiempo dedicado al día.',
    type: 'number',
    required: false,
    fieldName: 'cuidado.horas'
  },
  {
    id: '3.4',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: 'CARGA EMOCIONAL',
    subtitle: 'Nivel de agotamiento emocional (1: Bajo, 5: Alto).',
    type: 'number',
    required: false,
    fieldName: 'cuidado.carga_emocional'
  },
  {
    id: '3.5',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: 'CONOCIMIENTO DE PROGRAMAS',
    subtitle: '¿Conoce programas o servicios para cuidadoras?',
    type: 'pills',
    options: ['Sí', 'No'],
    required: false,
    fieldName: 'cuidado.conoce_programas'
  },
  {
    id: '3.5b',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: 'PROGRAMAS QUE CONOCE (CUÁLES)',
    subtitle: 'Detalle cuando responde "Sí".',
    type: 'text',
    required: false,
    fieldName: 'cuidado.cuales_programas'
  },
  {
    id: '3.6',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: 'RECONOCIMIENTO PERCIBIDO',
    subtitle: '¿Qué tanto reconocimiento percibe por las labores que realiza?',
    type: 'pills',
    options: ['Nada reconocida', 'Poco reconocida', 'Medianamente reconocida', 'Muy reconocida'],
    required: false,
    fieldName: 'cuidado.reconocimiento'
  },
  {
    id: '3.7',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: 'SENTIMIENTO FRECUENTE',
    subtitle: '¿Qué sentimiento experimenta con más frecuencia?',
    type: 'pills',
    options: ['Ira', 'Incertidumbre', 'Temor', 'Tranquilidad', 'Felicidad', 'Angustia', 'Tristeza', 'Otro'],
    required: false,
    fieldName: 'cuidado.sentimiento'
  },
  {
    id: '3.7b',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: 'SENTIMIENTO FRECUENTE (OTRO)',
    subtitle: 'Detalle cuando selecciona "Otro".',
    type: 'text',
    required: false,
    fieldName: 'cuidado.sentimiento_otro'
  },
  {
    id: '3.8',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: 'CANSANCIO FÍSICO',
    subtitle: '¿Siente cansancio físico por las labores de cuidado?',
    type: 'pills',
    options: ['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre'],
    required: false,
    fieldName: 'cuidado.cansancio_fisico'
  },
  {
    id: '3.9',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: 'RESPONSABILIDADES EXCESIVAS',
    subtitle: '¿Siente que las responsabilidades del hogar y cuidado son excesivas?',
    type: 'pills',
    options: ['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre'],
    required: false,
    fieldName: 'cuidado.responsabilidades_excesivas'
  },
  {
    id: '3.10',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: 'POCO TIEMPO DE AUTOCUIDADO',
    subtitle: '¿Considera que tiene poco tiempo para cuidar de sí misma?',
    type: 'pills',
    options: ['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre'],
    required: false,
    fieldName: 'cuidado.poco_tiempo_autocuidado'
  },
  {
    id: '3.11',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: 'ESTRÉS CONSTANTE',
    subtitle: '¿Siente estrés o preocupación constante relacionado con el cuidado?',
    type: 'pills',
    options: ['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre'],
    required: false,
    fieldName: 'cuidado.estres_constante'
  },
  {
    id: '3.12',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: 'AGOTAMIENTO EMOCIONAL',
    subtitle: '¿Se siente emocionalmente agotada por las responsabilidades de cuidado?',
    type: 'pills',
    options: ['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre'],
    required: false,
    fieldName: 'cuidado.agotamiento_emocional'
  },

  // Módulo 4: Bienestar y Seguridad
  {
    id: '4.1',
    module: 'Bienestar y Seguridad',
    moduleNumber: 4,
    question: 'SEGURIDAD EN HOGAR',
    subtitle: 'Percepción de tranquilidad y protección en su vivienda.',
    type: 'select',
    options: ['Siempre', 'Casi siempre', 'A veces', 'Nunca'],
    required: true,
    fieldName: 'bienestar.seguridad_hogar'
  },
  {
    id: '4.2',
    module: 'Bienestar y Seguridad',
    moduleNumber: 4,
    question: 'TIPOS DE VIOLENCIA PERCIBIDA',
    subtitle: 'Identifique situaciones de vulneración experimentadas.',
    type: 'checkbox',
    options: ['Física', 'Psicológica', 'Vicaria', 'Económica', 'Sexual', 'Patrimonial', 'Digital', 'Intrafamiliar', 'Institucional', 'Otro'],
    required: false,
    fieldName: 'bienestar.violencia'
  },
  {
    id: '4.3',
    module: 'Bienestar y Seguridad',
    moduleNumber: 4,
    question: 'FACTORES DE RIESGO',
    subtitle: 'Situaciones del entorno que afectan su calidad de vida.',
    type: 'checkbox',
    options: ['Desempleo', 'Consumo de sustancias SPA', 'Hacinamiento', 'Falta de apoyo familiar', 'Discriminación', 'Otro'],
    required: false,
    fieldName: 'bienestar.factores_riesgo'
  },
  {
    id: '4.4',
    module: 'Bienestar y Seguridad',
    moduleNumber: 4,
    question: 'PARTICIPACIÓN EN ACTIVIDADES',
    subtitle: '¿Le gustaría participar en espacios para cuidadoras?',
    type: 'select',
    options: ['Sí', 'No', 'Tal vez'],
    required: false,
    fieldName: 'bienestar.participar'
  },
  {
    id: '4.5',
    module: 'Bienestar y Seguridad',
    moduleNumber: 4,
    question: 'PRINCIPAL DIFICULTAD',
    subtitle: '¿Cuál sería el mayor obstáculo para su asistencia?',
    type: 'select',
    options: ['Tiempo', 'Movilidad', 'Motivación', 'Seguridad del sector', 'Prevención social', 'Falta de empatía'],
    required: false,
    fieldName: 'bienestar.dificultad'
  },
  {
    id: '4.6',
    module: 'Bienestar y Seguridad',
    moduleNumber: 4,
    question: 'BARRIO DE INSEGURIDAD',
    subtitle: 'Seleccione el barrio que considera inseguro.',
    type: 'select',
    required: false,
    fieldName: 'bienestar.barrio_inseguro'
  },
  {
    id: '4.7',
    module: 'Bienestar y Seguridad',
    moduleNumber: 4,
    question: 'ZONA UPL (INSEGURIDAD)',
    subtitle: 'UPL correspondiente al barrio de inseguridad.',
    type: 'select',
    required: false,
    fieldName: 'bienestar.upl_inseguro'
  },
  {
    id: '4.8',
    module: 'Bienestar y Seguridad',
    moduleNumber: 4,
    question: 'TIEMPO DEDICADO AL CUIDADO',
    subtitle: '¿Considera que dedica la mayor parte de su tiempo al cuidado de otra persona?',
    type: 'select',
    options: ['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre'],
    required: false,
    fieldName: 'bienestar.tiempo_cuidado_mayor_parte'
  },
  {
    id: '4.9',
    module: 'Bienestar y Seguridad',
    moduleNumber: 4,
    question: 'APOYO PERCIBIDO',
    subtitle: '¿Considera que recibe poco apoyo de familiares o personas cercanas?',
    type: 'select',
    options: ['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre'],
    required: false,
    fieldName: 'bienestar.poco_apoyo_familiar'
  },
  {
    id: '4.10',
    module: 'Bienestar y Seguridad',
    moduleNumber: 4,
    question: 'AFECTACIÓN DEL DESCANSO',
    subtitle: '¿Las responsabilidades de cuidado afectan su descanso o calidad del sueño?',
    type: 'select',
    options: ['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre'],
    required: false,
    fieldName: 'bienestar.afectacion_sueño'
  },
  {
    id: '4.11',
    module: 'Bienestar y Seguridad',
    moduleNumber: 4,
    question: 'ENFERMEDAD POR LABORES DE CUIDADO',
    subtitle: '¿Le han dicho o diagnosticado alguna enfermedad a causa de sus labores de cuidado?',
    type: 'select',
    options: ['Sí', 'No', 'Tal vez'],
    required: false,
    fieldName: 'bienestar.enfermedad_diagnosticada'
  },
  {
    id: '4.11b',
    module: 'Bienestar y Seguridad',
    moduleNumber: 4,
    question: 'ENFERMEDADES (CUÁLES)',
    subtitle: 'Detalle cuando responde "Sí".',
    type: 'text',
    required: false,
    fieldName: 'bienestar.enfermedades_cuales'
  },
  {
    id: '4.12',
    module: 'Bienestar y Seguridad',
    moduleNumber: 4,
    question: 'AFECTACIÓN SOCIAL O FAMILIAR',
    subtitle: '¿Considera que las labores de cuidado afectan su vida social o familiar?',
    type: 'select',
    options: ['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre'],
    required: false,
    fieldName: 'bienestar.afectacion_vida_social'
  },

  // Módulo 5: Sueños y Proyecciones
  {
    id: '5.1',
    module: 'Sueños y Proyecciones',
    moduleNumber: 5,
    question: 'PRIORIDAD URGENTE',
    subtitle: 'Identifique su necesidad más inmediata para mejorar su bienestar.',
    type: 'pills',
    options: ['Salud', 'Empleo', 'Educación', 'Vivienda', 'Apoyo Psicosocial', 'Seguridad', 'Otro'],
    required: true,
    fieldName: 'proyecciones.prioridad'
  },
  {
    id: '5.1b',
    module: 'Sueños y Proyecciones',
    moduleNumber: 5,
    question: 'PRIORIDAD URGENTE (OTRO)',
    subtitle: 'Detalle cuando selecciona "Otro".',
    type: 'text',
    required: false,
    fieldName: 'proyecciones.prioridad_otro'
  },
  {
    id: '5.2',
    module: 'Sueños y Proyecciones',
    moduleNumber: 5,
    question: 'INTERÉS DE FORMACIÓN',
    subtitle: '¿En qué áreas le gustaría adquirir nuevos conocimientos?',
    type: 'checkbox',
    options: ['Tecnología', 'Artes/Oficios', 'Emprendimiento', 'Gestión Financiera', 'Liderazgo', 'Otro'],
    required: true,
    fieldName: 'proyecciones.interes_formacion'
  },
  {
    id: '5.2b',
    module: 'Sueños y Proyecciones',
    moduleNumber: 5,
    question: 'INTERÉS DE FORMACIÓN (OTRO)',
    subtitle: 'Detalle cuando selecciona "Otro".',
    type: 'text',
    required: false,
    fieldName: 'proyecciones.interes_formacion_otro'
  },
  {
    id: '5.3',
    module: 'Sueños y Proyecciones',
    moduleNumber: 5,
    question: 'BIENESTAR DESEADO',
    subtitle: 'Actividades que le gustaría realizar para su cuidado personal.',
    type: 'checkbox',
    options: ['Yoga/Meditación', 'Deporte', 'Lectura', 'Espacios de escucha', 'Manualidades', 'Otro'],
    required: true,
    fieldName: 'proyecciones.bienestar_deseado'
  },
  {
    id: '5.3b',
    module: 'Sueños y Proyecciones',
    moduleNumber: 5,
    question: 'BIENESTAR DESEADO (OTRO)',
    subtitle: 'Detalle cuando selecciona "Otro".',
    type: 'text',
    required: false,
    fieldName: 'proyecciones.bienestar_deseado_otro'
  },
  {
    id: '5.4',
    module: 'Sueños y Proyecciones',
    moduleNumber: 5,
    question: 'PROYECTOS IDEALES',
    subtitle: '¿Qué tipo de actividades espera encontrar en nuestros proyectos?',
    type: 'checkbox',
    options: ['Bienestar emocional', 'Autocuidado', 'Orientación psicológica/jurídica', 'Recreativas', 'Redes de apoyo', 'Derechos', 'Emprendimiento/Finanzas', 'Otro'],
    required: false,
    fieldName: 'proyecciones.proyectos_ideales'
  },
  {
    id: '5.4b',
    module: 'Sueños y Proyecciones',
    moduleNumber: 5,
    question: 'PROYECTOS IDEALES (OTRO)',
    subtitle: 'Detalle cuando selecciona "Otro".',
    type: 'text',
    required: false,
    fieldName: 'proyecciones.proyectos_ideales_otro'
  },
  {
    id: '5.5',
    module: 'Sueños y Proyecciones',
    moduleNumber: 5,
    question: 'DIFICULTAD EN ACTIVIDADES',
    subtitle: '¿Ha tenido dificultades para trabajar, estudiar o realizar actividades cotidianas debido a las labores de cuidado?',
    type: 'pills',
    options: ['Nunca', 'Casi nunca', 'Algunas veces', 'Casi siempre', 'Siempre'],
    required: true,
    fieldName: 'proyecciones.dificultades_actividades_cotidianas'
  },
  {
    id: '5.6',
    module: 'Sueños y Proyecciones',
    moduleNumber: 5,
    question: 'APOYO O ACOMPAÑAMIENTO DESEADO',
    subtitle: '¿Le gustaría recibir más apoyo, orientación o acompañamiento para las labores de cuidado?',
    type: 'pills',
    options: ['Sí', 'No', 'Tal vez'],
    required: true,
    fieldName: 'proyecciones.desea_mas_apoyo'
  },
  {
    id: '5.6b',
    module: 'Sueños y Proyecciones',
    moduleNumber: 5,
    question: 'APOYO DESEADO (CUÁLES)',
    subtitle: 'Detalle cuando responde "Sí".',
    type: 'text',
    required: false,
    fieldName: 'proyecciones.apoyo_cuales'
  },

  // Módulo 6: Dinámica Familiar
  {
    id: '6.1',
    module: 'Dinámica Familiar',
    moduleNumber: 6,
    question: 'ESTRUCTURA FAMILIAR',
    subtitle: '¿Cuál de las siguientes opciones describe mejor su familia?',
    type: 'pills',
    options: ['Vive sola', 'Madre con hijos(as) y sin pareja en el hogar', 'Pareja con hijos(as)', 'Pareja sin hijos(as)', 'Familia extensa (incluye abuelos, tíos, sobrinos u otros familiares)', 'Familia reconstituida (pareja con hijos de relaciones anteriores)', 'Otra'],
    required: true,
    fieldName: 'dinamica_familiar.estructura'
  },
  {
    id: '6.1b',
    module: 'Dinámica Familiar',
    moduleNumber: 6,
    question: 'ESTRUCTURA FAMILIAR (OTRA)',
    subtitle: 'Detalle cuando selecciona "Otra".',
    type: 'text',
    required: false,
    fieldName: 'dinamica_familiar.estructura_otra'
  },
  {
    id: '6.2',
    module: 'Dinámica Familiar',
    moduleNumber: 6,
    question: 'PERSONAS EN EL HOGAR',
    subtitle: '¿Cuántas personas viven actualmente en su hogar, incluyéndose usted?',
    type: 'number',
    required: true,
    fieldName: 'dinamica_familiar.personas_hogar'
  },
  {
    id: '6.3',
    module: 'Dinámica Familiar',
    moduleNumber: 6,
    question: 'RELACIONES EN EL HOGAR',
    subtitle: 'En general, ¿cómo son las relaciones entre las personas que viven en su hogar?',
    type: 'pills',
    options: ['Muy buenas', 'Buenas', 'Regulares', 'Difíciles', 'Muy difíciles'],
    required: true,
    fieldName: 'dinamica_familiar.relaciones'
  },
  {
    id: '6.4',
    module: 'Dinámica Familiar',
    moduleNumber: 6,
    question: 'HABILIDADES PARA COMPARTIR',
    subtitle: '¿Considera que tiene habilidades o conocimientos que podría compartir con otras mujeres cuidadoras?',
    type: 'pills',
    options: ['Sí', 'No'],
    required: true,
    fieldName: 'dinamica_familiar.compartir_habilidades'
  },
  {
    id: '6.4b',
    module: 'Dinámica Familiar',
    moduleNumber: 6,
    question: 'HABILIDADES A COMPARTIR (CUÁLES)',
    subtitle: 'Detalle cuando responde "Sí".',
    type: 'text',
    required: false,
    fieldName: 'dinamica_familiar.compartir_habilidades_cuales'
  },
  {
    id: '6.5',
    module: 'Dinámica Familiar',
    moduleNumber: 6,
    question: 'APOYO EN EMERGENCIAS',
    subtitle: 'Cuando tiene una emergencia o necesita apoyo, ¿quién suele ayudarle?',
    type: 'pills',
    options: ['Pareja', 'Hijos o hijas', 'Padres o familiares', 'Amigos', 'Vecinos', 'Líderes comunitarios', 'Nadie', 'Otro'],
    required: true,
    fieldName: 'dinamica_familiar.apoyo_emergencia'
  },
  {
    id: '6.6',
    module: 'Dinámica Familiar',
    moduleNumber: 6,
    question: 'PARTICIPACIÓN SOCIAL',
    subtitle: '¿Participa en grupos, organizaciones, iglesias, actividades comunitarias o redes de apoyo?',
    type: 'pills',
    options: ['Sí, frecuentemente', 'Algunas veces', 'Muy pocas veces', 'No participa'],
    required: true,
    fieldName: 'dinamica_familiar.participacion_social'
  },

  // Módulo 7: Documentos y Consentimiento
  {
    id: '7.1',
    module: 'Documentos y Consentimiento',
    moduleNumber: 7,
    question: 'CÉDULA FRONTAL',
    subtitle: 'Sube una fotografía clara de tu cédula (lado frontal).',
    type: 'document',
    required: false,
    fieldName: 'documentos.cedula_frontal'
  },
  {
    id: '7.2',
    module: 'Documentos y Consentimiento',
    moduleNumber: 7,
    question: 'CÉDULA REVERSO',
    subtitle: 'Sube una fotografía clara de tu cédula (lado reverso).',
    type: 'document',
    required: false,
    fieldName: 'documentos.cedula_reverso'
  },
  {
    id: '7.3',
    module: 'Documentos y Consentimiento',
    moduleNumber: 7,
    question: 'RECIBO DE SERVICIO PÚBLICO',
    subtitle: 'Sube un recibo de servicio público a tu nombre (agua, luz, etc).',
    type: 'document',
    required: false,
    fieldName: 'documentos.recibo_publico'
  },
  {
    id: '7.4',
    module: 'Documentos y Consentimiento',
    moduleNumber: 7,
    question: 'HABEAS DATA',
    subtitle: 'Acepta la política de tratamiento de datos personales.',
    type: 'checkbox',
    options: ['Acepto la política de habeas data'],
    required: true,
    fieldName: 'documentos.habeas_data'
  }
];

export const exportSurveyToExcel = () => {
  const XLSX = require('xlsx');
  
  // Preparar datos para el Excel
  const data = SURVEY_QUESTIONS.map((q, index) => ({
    '#': index + 1,
    'Módulo': q.module,
    'Pregunta': q.question,
    'Descripción': q.subtitle || '-',
    'Tipo': q.type,
    'Opciones': q.options?.join('; ') || '-',
    'Requerido': q.required ? 'Sí' : 'No',
    'Campo': q.fieldName
  }));

  // Crear workbook
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  
  // Ajustar ancho de columnas
  ws['!cols'] = [
    { wch: 5 },   // #
    { wch: 25 },  // Módulo
    { wch: 30 },  // Pregunta
    { wch: 40 },  // Descripción
    { wch: 12 },  // Tipo
    { wch: 50 },  // Opciones
    { wch: 12 },  // Requerido
    { wch: 30 }   // Campo
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Preguntas');
  
  // Descargar
  const now = new Date();
  const filename = `Encuesta_UNIDAS_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;
  XLSX.writeFile(wb, filename);
};
