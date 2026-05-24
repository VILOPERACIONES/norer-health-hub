// Encabezado oficial del PDF — fuente única de verdad.
// Se envía al backend (norder-crm-api) via pdfCustomMeta.headerInfo.
// Backend debe leer headerInfo y renderizar estos campos en lugar de los hardcoded actuales.

export const PDF_HEADER_INFO = {
  nombre: 'L.N. Eyder Méndez Gamboa',
  certificacion: 'Certificación ISAK Nivel 2',
  cedula: 'Cédula: 11181890',
  telefono: '999 453 7182',
  email: 'nordermx@gmail.com',
  marca: 'VIA "Vida Integral y Asesoría Profesional"',
  direccion: 'Calle 40 #278 G, Campestre C.P. 97120. Mérida, Yucatán.',
} as const;
