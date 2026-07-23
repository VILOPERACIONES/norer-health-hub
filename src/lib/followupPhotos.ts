export type PendingFollowupPhoto = {
  localId: string;
  nombreOriginal: string;
  dataUrl: string;
  ancho: number;
  alto: number;
  esPrincipal: boolean;
};

const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 2_500_000;
const MAX_DIMENSION = 1600;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const dataUrlBytes = (dataUrl: string) => Math.ceil((dataUrl.split(',')[1]?.length || 0) * 0.75);

export const compressFollowupPhoto = async (file: File): Promise<PendingFollowupPhoto> => {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('Usa una imagen JPEG, PNG o WebP.');
  if (file.size > MAX_INPUT_BYTES) throw new Error('La fotografía no puede superar 10 MB.');

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo leer la fotografía.'));
      img.src = objectUrl;
    });

    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const ancho = Math.max(1, Math.round(image.naturalWidth * scale));
    const alto = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('El navegador no pudo procesar la fotografía.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, ancho, alto);
    context.drawImage(image, 0, 0, ancho, alto);

    let quality = 0.84;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrlBytes(dataUrl) > MAX_OUTPUT_BYTES && quality > 0.5) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    if (dataUrlBytes(dataUrl) > MAX_OUTPUT_BYTES) throw new Error('No fue posible comprimir la fotografía por debajo de 2.5 MB.');

    return {
      localId: crypto.randomUUID(),
      nombreOriginal: file.name,
      dataUrl,
      ancho,
      alto,
      esPrincipal: false,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
