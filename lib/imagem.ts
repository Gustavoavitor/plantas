/**
 * Utilidades de imagem que rodam no navegador.
 * Foto de iPhone tem uns 4 MB; reduzir antes de enviar deixa a
 * identificação muito mais rápida no 4G e economiza espaço no Storage.
 */

const LADO_MAXIMO = 1400;
const QUALIDADE = 0.85;

export async function reduzirImagem(arquivo: File): Promise<File> {
  if (!arquivo.type.startsWith("image/")) return arquivo;

  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));

    if (escala === 1 && arquivo.size < 1_500_000) {
      bitmap.close();
      return arquivo;
    }

    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;

    const ctx = canvas.getContext("2d");
    if (!ctx) return arquivo;

    ctx.drawImage(bitmap, 0, 0, largura, altura);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALIDADE),
    );
    if (!blob) return arquivo;

    return new File([blob], trocarExtensao(arquivo.name), { type: "image/jpeg" });
  } catch {
    // Se algo falhar (formato exótico, HEIC sem suporte), manda o original.
    return arquivo;
  }
}

function trocarExtensao(nome: string) {
  const base = nome.replace(/\.[^.]+$/, "") || "foto";
  return `${base}.jpg`;
}

/** Nome de arquivo único dentro da pasta do usuário no Storage. */
export function caminhoStorage(usuarioId: string, nomeArquivo: string) {
  const carimbo = Date.now().toString(36);
  const aleatorio = Math.random().toString(36).slice(2, 8);
  const limpo = nomeArquivo.replace(/[^a-zA-Z0-9.-]/g, "_").slice(-40);
  return `${usuarioId}/${carimbo}-${aleatorio}-${limpo}`;
}
