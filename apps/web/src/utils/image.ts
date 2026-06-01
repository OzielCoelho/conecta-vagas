function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível carregar a imagem selecionada."));
    image.src = src;
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Não foi possível carregar a imagem selecionada."));
    reader.readAsDataURL(file);
  });
}

type CompressOptions = {
  maxSize?: number;
  quality?: number;
};

/**
 * Lê uma imagem do disco, redimensiona para caber em `maxSize` (lado maior)
 * e devolve um data URL JPEG comprimido. Assim qualquer foto (mesmo as grandes
 * de celular) pode ser usada como avatar/logo sem estourar o limite do servidor.
 */
export async function readImageAsCompressedDataUrl(
  file: File,
  { maxSize = 512, quality = 0.85 }: CompressOptions = {}
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = largestSide > maxSize ? maxSize / largestSide : 1;
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      // Sem suporte a canvas: cai para o data URL original.
      return readFileAsDataUrl(file);
    }

    // Fundo branco para imagens com transparência (PNG) ao converter para JPEG.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    // Qualquer falha no redimensionamento: usa o arquivo original.
    return readFileAsDataUrl(file);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
