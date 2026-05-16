/**
 * Estructura de todas las preguntas de la encuesta UNIDAS
 */

export interface SurveyQuestion {
  id: string;
  module: string;
  moduleNumber: number;
  question: string;
  subtitle?: string;
  type: 'text' | 'select' | 'checkbox' | 'textarea' | 'date' | 'number' | 'document';
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
    id: '1.2',
    module: 'Perfil Sociodemográfico',
    moduleNumber: 1,
    question: 'GÉNERO',
    subtitle: 'Identidad de género con la que te identificas.',
    type: 'select',
    options: ['Mujer Cisgénero', 'Mujer Transgénero', 'No binaria', 'Otro'],
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
    id: '1.6',
    module: 'Perfil Sociodemográfico',
    moduleNumber: 1,
    question: 'PERTENENCIA POBLACIONAL',
    subtitle: 'Selección múltiple. ¿Con qué grupos te identificas?',
    type: 'checkbox',
    options: ['Indígena', 'Afrocolombiana', 'Raizal', 'Palenquera', 'LGBTIQ+', 'Víctima del conflicto', 'Migrante', 'Ninguno de los anteriores'],
    required: false,
    fieldName: 'socio.pertenencia_poblacional'
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

  // Módulo 3: Carga de Cuidado
  {
    id: '3.1',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: 'POBLACIÓN BAJO CUIDADO',
    subtitle: 'Selecciona quiénes cuidas y en qué cantidad.',
    type: 'checkbox',
    options: ['Menores de 5 años', 'Niños/as 5-17 años', 'Personas mayores', 'Personas con discapacidad', 'Personas con enfermedad crónica'],
    required: true,
    fieldName: 'cuidado.poblacion'
  },
  {
    id: '3.2',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: 'HORAS DIARIAS DE CUIDADO',
    subtitle: 'Ingresa el número de horas diarias dedicadas al cuidado.',
    type: 'number',
    required: true,
    fieldName: 'cuidado.horas'
  },
  {
    id: '3.3',
    module: 'Carga de Cuidado',
    moduleNumber: 3,
    question: '¿EL CUIDADO ES REMUNERADO?',
    subtitle: 'Indica si recibas pago por tu trabajo de cuidado.',
    type: 'select',
    options: ['Sí', 'No'],
    required: false,
    fieldName: 'cuidado.remunerado'
  },

  // Módulo 4: Bienestar y Seguridad
  {
    id: '4.1',
    module: 'Bienestar y Seguridad',
    moduleNumber: 4,
    question: 'SEGURIDAD EN EL HOGAR',
    subtitle: 'Indica tu nivel de seguridad en el hogar.',
    type: 'select',
    options: ['Muy segura', 'Segura', 'Neutral', 'Insegura', 'Muy insegura'],
    required: true,
    fieldName: 'bienestar.seguridad_hogar'
  },
  {
    id: '4.2',
    module: 'Bienestar y Seguridad',
    moduleNumber: 4,
    question: 'TIPOS DE VIOLENCIA EXPERIMENTADA',
    subtitle: 'Selecciona los tipos de violencia que hayas experimentado.',
    type: 'checkbox',
    options: ['Violencia física', 'Violencia psicológica', 'Violencia verbal', 'Violencia económica', 'Violencia sexual', 'Discriminación', 'Ninguna'],
    required: false,
    fieldName: 'bienestar.tipos_violencia'
  },

  // Módulo 5: Sueños y Proyecciones
  {
    id: '5.1',
    module: 'Sueños y Proyecciones',
    moduleNumber: 5,
    question: 'INTERÉS DE FORMACIÓN',
    subtitle: 'Selecciona áreas de formación que te interesan.',
    type: 'checkbox',
    options: ['Educación formal', 'Capacitación técnica', 'Emprendimiento', 'Desarrollo personal', 'Tecnología', 'Salud y bienestar', 'Otra'],
    required: false,
    fieldName: 'suenos.interes_formacion'
  },
  {
    id: '5.2',
    module: 'Sueños y Proyecciones',
    moduleNumber: 5,
    question: 'PRIORIDAD URGENTE',
    subtitle: 'Describe tu prioridad más urgente en este momento.',
    type: 'textarea',
    required: false,
    fieldName: 'suenos.prioridad_urgente'
  },

  // Módulo 6: Documentos y Consentimiento
  {
    id: '6.1',
    module: 'Documentos y Consentimiento',
    moduleNumber: 6,
    question: 'CÉDULA FRONTAL',
    subtitle: 'Sube una fotografía clara de tu cédula (lado frontal).',
    type: 'document',
    required: false,
    fieldName: 'documentos.cedula_frontal'
  },
  {
    id: '6.2',
    module: 'Documentos y Consentimiento',
    moduleNumber: 6,
    question: 'CÉDULA REVERSO',
    subtitle: 'Sube una fotografía clara de tu cédula (lado reverso).',
    type: 'document',
    required: false,
    fieldName: 'documentos.cedula_reverso'
  },
  {
    id: '6.3',
    module: 'Documentos y Consentimiento',
    moduleNumber: 6,
    question: 'RECIBO DE SERVICIO PÚBLICO',
    subtitle: 'Sube un recibo de servicio público a tu nombre (agua, luz, etc).',
    type: 'document',
    required: false,
    fieldName: 'documentos.recibo_publico'
  },
  {
    id: '6.4',
    module: 'Documentos y Consentimiento',
    moduleNumber: 6,
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
