/**
 * Tipos de documento válidos para el registro
 */
export enum DocumentType {
  CC = 'CC',
  TI = 'TI',
  RC = 'RC',
  CE = 'CE',
  PPT = 'PPT',
  PEP = 'PEP',
}

/**
 * Descripción de los tipos de documento
 */
export const DocumentTypeLabel: Record<DocumentType, string> = {
  [DocumentType.CC]: 'Cédula de Ciudadanía',
  [DocumentType.TI]: 'Tarjeta de Identidad',
  [DocumentType.RC]: 'Registro Civil',
  [DocumentType.CE]: 'Cédula de Extranjería',
  [DocumentType.PPT]: 'Permiso por Protección Temporal',
  [DocumentType.PEP]: 'Permiso Especial de Permanencia',
};

/**
 * Array de tipos de documento disponibles
 */
export const DOCUMENT_TYPES = Object.values(DocumentType);
