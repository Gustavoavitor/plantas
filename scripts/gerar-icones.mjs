/**
 * Gera os ícones PNG do app sem depender de editor de imagem.
 * Desenha um quadrado arredondado verde com uma folha clara no meio.
 *
 *   node scripts/gerar-icones.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = join(RAIZ, "public", "icones");

const VERDE = [47, 107, 79];
const CLARO = [232, 241, 234];

// ------------------------------------------------------------------
// Encoder PNG mínimo (RGBA, sem filtro)
// ------------------------------------------------------------------

const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TABELA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function bloco(tipo, dados) {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}

function montarPng(largura, altura, pixels) {
  const assinatura = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filtro padrão
  ihdr[12] = 0; // sem entrelaçamento

  // Cada linha começa com o byte de filtro (0 = nenhum).
  const linhas = Buffer.alloc(altura * (largura * 4 + 1));
  for (let y = 0; y < altura; y++) {
    const inicioLinha = y * (largura * 4 + 1);
    linhas[inicioLinha] = 0;
    pixels.copy(linhas, inicioLinha + 1, y * largura * 4, (y + 1) * largura * 4);
  }

  return Buffer.concat([
    assinatura,
    bloco("IHDR", ihdr),
    bloco("IDAT", deflateSync(linhas, { level: 9 })),
    bloco("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------
// Desenho
// ------------------------------------------------------------------

/** Suaviza a borda entre dentro (<0) e fora (>0) de uma forma. */
function cobertura(distancia, suavizacao) {
  return Math.min(1, Math.max(0, 0.5 - distancia / suavizacao));
}

function misturar(alvo, i, cor, alfa) {
  if (alfa <= 0) return;
  for (let c = 0; c < 3; c++) {
    alvo[i + c] = Math.round(alvo[i + c] * (1 - alfa) + cor[c] * alfa);
  }
  alvo[i + 3] = Math.round(alvo[i + 3] * (1 - alfa) + 255 * alfa);
}

function desenharIcone(tamanho, { escalaFolha = 1 } = {}) {
  const pixels = Buffer.alloc(tamanho * tamanho * 4, 0);
  const suave = 1.5;

  const raioCanto = tamanho * 0.22;
  const meio = tamanho / 2;

  // Folha: interseção de dois círculos, girada 45°.
  const anguloFolha = -Math.PI / 4;
  const cos = Math.cos(anguloFolha);
  const sen = Math.sin(anguloFolha);
  const raioFolha = tamanho * 0.36 * escalaFolha;
  const deslocamento = tamanho * 0.205 * escalaFolha;

  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      const i = (y * tamanho + x) * 4;
      const px = x + 0.5;
      const py = y + 0.5;

      // --- quadrado arredondado ---
      const dx = Math.abs(px - meio) - (meio - raioCanto);
      const dy = Math.abs(py - meio) - (meio - raioCanto);
      const distanciaFundo =
        Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) +
        Math.min(Math.max(dx, dy), 0) -
        raioCanto;

      misturar(pixels, i, VERDE, cobertura(distanciaFundo, suave));

      // --- folha ---
      const rx = (px - meio) * cos - (py - meio) * sen;
      const ry = (px - meio) * sen + (py - meio) * cos;

      const distA = Math.hypot(rx - deslocamento, ry) - raioFolha;
      const distB = Math.hypot(rx + deslocamento, ry) - raioFolha;
      const distanciaFolha = Math.max(distA, distB);

      let alfaFolha = cobertura(distanciaFolha, suave);

      // Nervura central: risca fina que sugere o eixo da folha.
      const meiaLargura = tamanho * 0.007;
      const naNervura = cobertura(Math.abs(ry) - meiaLargura, suave);
      if (naNervura > 0 && alfaFolha > 0) {
        alfaFolha *= 1 - naNervura;
      }

      misturar(pixels, i, CLARO, alfaFolha);
    }
  }

  return montarPng(tamanho, tamanho, pixels);
}

// ------------------------------------------------------------------

mkdirSync(DESTINO, { recursive: true });

const TAMANHOS = [
  { arquivo: "icone-180.png", tamanho: 180 }, // atalho do iPhone
  { arquivo: "icone-192.png", tamanho: 192 },
  { arquivo: "icone-512.png", tamanho: 512 },
  // O Android recorta o ícone "maskable" em círculo, então a folha
  // precisa caber na zona segura central.
  { arquivo: "icone-maskable-512.png", tamanho: 512, escalaFolha: 0.72 },
];

for (const { arquivo, tamanho, escalaFolha = 1 } of TAMANHOS) {
  writeFileSync(join(DESTINO, arquivo), desenharIcone(tamanho, { escalaFolha }));
  console.log(`✓ ${arquivo} (${tamanho}×${tamanho})`);
}

// Favicon pequeno para a aba do navegador.
writeFileSync(join(RAIZ, "public", "favicon.png"), desenharIcone(48));
console.log("✓ favicon.png (48×48)");
