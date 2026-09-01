/**
 * Título do jardim na tela inicial.
 *
 * O gatilho do banco preenche `perfis.nome` com o prefixo do e-mail quando a
 * pessoa entra pela primeira vez. Isso vira coisa como "douglascast3713", que
 * não serve para "Jardim de ___". Então só usamos o nome quando ele parece
 * mesmo um nome; caso contrário caímos num título neutro.
 */

/**
 * Só descarta o que é claramente prefixo de e-mail: dígitos, ponto,
 * sublinhado. Um prefixo grudado como "anamaria" passa por nome, e tudo
 * bem — não há regra confiável que separe os dois, e quem quiser ajustar
 * troca o nome em Ajustes.
 */
function pareceNomeDePessoa(valor: string): boolean {
  const limpo = valor.trim();
  if (limpo.length < 2 || limpo.length > 40) return false;
  return !/[\d._@+-]/.test(limpo);
}

/** Deixa "gustavo" como "Gustavo", sem estragar "Ana Maria". */
export function comInicialMaiuscula(valor: string): string {
  return valor
    .trim()
    .split(/\s+/)
    .map((parte) => parte.charAt(0).toLocaleUpperCase("pt-BR") + parte.slice(1))
    .join(" ");
}

export function tituloDoJardim(
  perfil: { nome?: string | null; titulo_jardim?: string | null } | null,
): string {
  const escolhido = perfil?.titulo_jardim?.trim();
  if (escolhido) return escolhido;

  const nome = perfil?.nome?.trim();
  if (nome && pareceNomeDePessoa(nome)) {
    return `Jardim de ${comInicialMaiuscula(nome)}`;
  }

  return "Meu jardim";
}
