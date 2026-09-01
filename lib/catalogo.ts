/**
 * Catálogo de cuidados, indexado por gênero botânico.
 *
 * Por que não a Perenual: no plano gratuito ela devolve só taxonomia
 * (nome, família, gênero). Rega, luz e nível de cuidado exigem plano pago.
 * Como a Pl@ntNet já entrega o nome científico e a família, dá para resolver
 * tudo aqui — de graça, na hora, sem cota e funcionando offline.
 *
 * A busca vai do mais específico para o mais genérico:
 *   espécie exata → gênero → família → padrão.
 *
 * `regaDias` é a base para condições médias: vaso médio, luz indireta,
 * dentro de casa, outono. `lib/cuidados.ts` ajusta a partir daí.
 */

export type Rega = "frequent" | "average" | "minimum" | "none";
export type Nivel = "facil" | "media" | "dificil";
export type Precisao = "especie" | "genero" | "familia" | "padrao";

export type EntradaCatalogo = {
  nomes: string[];
  rega: Rega;
  regaDias: number;
  luz: string[];
  toleraSeca: boolean;
  interno: boolean;
  nivel: Nivel;
  /** null = sem informação confiável. */
  toxicaAnimais: boolean | null;
  ciclo: string;
  dicas: string[];
};

type Parcial = Partial<EntradaCatalogo>;

// ------------------------------------------------------------------
// Gêneros
// ------------------------------------------------------------------

export const GENEROS: Record<string, EntradaCatalogo> = {
  // ---------- Aráceas (a maioria das plantas de casa) ----------
  monstera: {
    nomes: ["costela-de-adão", "banana-de-macaco"],
    rega: "average",
    regaDias: 7,
    luz: ["Luz indireta forte", "Meia-sombra"],
    toleraSeca: false,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: [
      "Os furos nas folhas só aparecem com luz forte e a planta já adulta. Folha inteira em planta madura é sinal de pouca luz.",
      "Dê um suporte de musgo: as raízes aéreas se agarram nele e as folhas crescem bem maiores.",
    ],
  },
  philodendron: {
    nomes: ["filodendro"],
    rega: "average",
    regaDias: 7,
    luz: ["Luz indireta forte", "Meia-sombra"],
    toleraSeca: false,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: [
      "Aguenta bem a sombra, mas cresce esticado. Se os espaços entre as folhas aumentarem, aproxime da janela.",
      "Poda de ponta engrossa a planta: corte logo acima de um nó e enraíze o pedaço na água.",
    ],
  },
  epipremnum: {
    nomes: ["jiboia"],
    rega: "average",
    regaDias: 8,
    luz: ["Luz indireta forte", "Meia-sombra", "Sombra"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: [
      "É a planta mais tolerante que existe para interior. Morre bem mais de rega demais que de esquecimento.",
      "As folhas variegadas perdem o branco na sombra. Quanto mais claro o desenho, mais luz ela precisa.",
    ],
  },
  scindapsus: {
    nomes: ["jiboia-prateada"],
    rega: "average",
    regaDias: 9,
    luz: ["Luz indireta forte", "Meia-sombra"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["As manchas prateadas ficam mais marcadas com luz indireta forte."],
  },
  syngonium: {
    nomes: ["singônio"],
    rega: "average",
    regaDias: 6,
    luz: ["Luz indireta forte", "Meia-sombra"],
    toleraSeca: false,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["Começa compacta e depois vira trepadeira. Pode podar para manter em formato de moita."],
  },
  anthurium: {
    nomes: ["antúrio"],
    rega: "average",
    regaDias: 6,
    luz: ["Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "media",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: [
      "Quer umidade alta e substrato aerado, à base de casca. Terra comum de vaso compacta e apodrece a raiz.",
      "Parou de florir? Quase sempre é falta de luz — precisa de claridade forte, mas sem sol direto.",
    ],
  },
  spathiphyllum: {
    nomes: ["lírio-da-paz"],
    rega: "frequent",
    regaDias: 5,
    luz: ["Meia-sombra", "Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: [
      "Ela murcha de forma dramática quando tem sede e se recupera em horas depois da rega. Mas não use isso como cronograma: repetir o murchamento enfraquece a planta.",
      "Ponta marrom costuma ser flúor e cloro da água de torneira. Deixe a água descansar de um dia para o outro.",
    ],
  },
  aglaonema: {
    nomes: ["aglaonema", "pé-de-galinha"],
    rega: "average",
    regaDias: 9,
    luz: ["Meia-sombra", "Luz indireta forte"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["As variedades vermelhas e rosadas precisam de mais luz que as verdes para manter a cor."],
  },
  dieffenbachia: {
    nomes: ["comigo-ninguém-pode"],
    rega: "average",
    regaDias: 7,
    luz: ["Luz indireta forte", "Meia-sombra"],
    toleraSeca: false,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: [
      "A seiva queima boca e garganta. Se há criança ou animal em casa, deixe fora de alcance e use luva ao podar.",
    ],
  },
  alocasia: {
    nomes: ["orelha-de-elefante"],
    rega: "average",
    regaDias: 6,
    luz: ["Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "dificil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: [
      "No frio ela pode perder todas as folhas e parecer morta. O rizoma costuma estar vivo: reduza a rega e espere a primavera.",
      "É ímã de ácaro em ar seco. Confira a face de baixo das folhas toda semana.",
    ],
  },
  caladium: {
    nomes: ["caládio", "tinhorão"],
    rega: "frequent",
    regaDias: 4,
    luz: ["Meia-sombra", "Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "media",
    toxicaAnimais: true,
    ciclo: "Perene com dormência",
    dicas: ["Entra em dormência no inverno: as folhas somem, o tubérculo descansa. Pare de regar e retome na primavera."],
  },
  zamioculcas: {
    nomes: ["zamioculca", "planta-da-fortuna"],
    rega: "minimum",
    regaDias: 21,
    luz: ["Meia-sombra", "Sombra", "Luz indireta forte"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: [
      "Guarda água nos rizomas. Na dúvida, não regue: é quase impossível matá-la de sede e muito fácil de afogar.",
      "Folha amarelando na base quase sempre é excesso de água, não falta.",
    ],
  },

  // ---------- Suculentas e cactos ----------
  sansevieria: {
    nomes: ["espada-de-são-jorge", "língua-de-sogra"],
    rega: "minimum",
    regaDias: 21,
    luz: ["Sol pleno", "Luz indireta forte", "Meia-sombra"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: [
      "No inverno, regue a cada 30 ou 40 dias. Rega de inverno é a causa número um de morte dela.",
      "Regue na terra, nunca no meio da roseta: água parada ali apodrece o centro.",
    ],
  },
  dracaena: {
    nomes: ["dracena", "pau-d'água"],
    rega: "average",
    regaDias: 12,
    luz: ["Luz indireta forte", "Meia-sombra"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["Sensível ao flúor da água tratada — ponta marrom é o sintoma clássico. Use água filtrada ou de chuva."],
  },
  echeveria: {
    nomes: ["echeveria", "rosa-de-pedra"],
    rega: "minimum",
    regaDias: 14,
    luz: ["Sol pleno"],
    toleraSeca: true,
    interno: false,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: [
      "Precisa de sol direto. Dentro de casa ela estica, perde a forma de roseta e nunca mais volta ao normal.",
      "Regue na terra e nunca sobre as folhas: a água no centro apodrece a roseta.",
    ],
  },
  crassula: {
    nomes: ["planta-jade", "bálsamo"],
    rega: "minimum",
    regaDias: 16,
    luz: ["Sol pleno", "Luz indireta forte"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["Folha murcha e enrugada é sede; folha mole e translúcida é excesso de água. São coisas opostas."],
  },
  haworthia: {
    nomes: ["haworthia", "planta-zebra"],
    rega: "minimum",
    regaDias: 14,
    luz: ["Luz indireta forte", "Meia-sombra"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Das poucas suculentas que vão bem em interior: prefere luz forte filtrada a sol direto."],
  },
  aloe: {
    nomes: ["babosa", "aloe vera"],
    rega: "minimum",
    regaDias: 16,
    luz: ["Sol pleno", "Luz indireta forte"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["Substrato tem que drenar rápido. Misture areia grossa ou perlita na terra comum."],
  },
  kalanchoe: {
    nomes: ["calanchoe", "flor-da-fortuna"],
    rega: "minimum",
    regaDias: 12,
    luz: ["Sol pleno", "Luz indireta forte"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["Para florir de novo precisa de noites longas e escuras: umas 6 semanas com 14 h de escuro por noite."],
  },
  sedum: {
    nomes: ["sedum", "rabo-de-burro"],
    rega: "minimum",
    regaDias: 14,
    luz: ["Sol pleno"],
    toleraSeca: true,
    interno: false,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["As folhas caem ao menor toque, e cada uma vira uma muda nova se pousada sobre terra levemente úmida."],
  },
  senecio: {
    nomes: ["colar-de-pérolas", "dedo-de-moça"],
    rega: "minimum",
    regaDias: 14,
    luz: ["Sol pleno", "Luz indireta forte"],
    toleraSeca: true,
    interno: true,
    nivel: "media",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["As pérolas murchando indicam sede; molengas e estouradas, água demais."],
  },
  schlumbergera: {
    nomes: ["flor-de-maio", "cacto-de-natal"],
    rega: "average",
    regaDias: 8,
    luz: ["Luz indireta forte", "Meia-sombra"],
    toleraSeca: false,
    interno: true,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: [
      "Não é cacto de deserto: é epífita de mata e quer umidade. Substrato aerado e rega regular.",
      "Floresce quando os dias encurtam e as noites esfriam. Não mude o vaso de lugar quando os botões aparecerem — ela os derruba.",
    ],
  },
  rhipsalis: {
    nomes: ["rabo-de-rato", "macarrão"],
    rega: "average",
    regaDias: 10,
    luz: ["Luz indireta forte", "Meia-sombra"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Cacto de mata: quer sombra e umidade, não sol de deserto."],
  },
  opuntia: {
    nomes: ["palma", "orelha-de-coelho"],
    rega: "minimum",
    regaDias: 24,
    luz: ["Sol pleno"],
    toleraSeca: true,
    interno: false,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Os espinhos finos e soltos grudam na pele com muita facilidade. Manuseie com jornal dobrado."],
  },
  euphorbia: {
    nomes: ["coroa-de-cristo", "cacto-candelabro"],
    rega: "minimum",
    regaDias: 16,
    luz: ["Sol pleno"],
    toleraSeca: true,
    interno: false,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["O látex branco irrita pele e olhos. Use luva ao podar e lave as mãos depois."],
  },

  // ---------- Samambaias ----------
  nephrolepis: {
    nomes: ["samambaia", "samambaia-americana"],
    rega: "frequent",
    regaDias: 3,
    luz: ["Meia-sombra", "Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "media",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: [
      "Nunca deixe o substrato secar por completo. Se secou a ponto de repelir água, mergulhe o vaso numa bacia por 20 minutos.",
      "Folha crocante e caindo é ar seco, não sede. Afaste de ventilador e ar-condicionado.",
    ],
  },
  adiantum: {
    nomes: ["avenca"],
    rega: "frequent",
    regaDias: 3,
    luz: ["Meia-sombra", "Sombra"],
    toleraSeca: false,
    interno: true,
    nivel: "dificil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: [
      "É implacável: um único dia de terra seca queima as folhas todas.",
      "Se secou inteira, corte tudo rente e mantenha úmido. Ela costuma rebrotar do rizoma.",
    ],
  },
  asplenium: {
    nomes: ["ninho-de-passarinho"],
    rega: "average",
    regaDias: 5,
    luz: ["Meia-sombra", "Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Regue a terra em volta, não o centro da roseta, para não apodrecer o ponto de crescimento."],
  },
  platycerium: {
    nomes: ["chifre-de-veado"],
    rega: "average",
    regaDias: 7,
    luz: ["Luz indireta forte", "Meia-sombra"],
    toleraSeca: false,
    interno: true,
    nivel: "media",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: [
      "Epífita: vive presa em placa ou tronco. Regue por imersão, mergulhando a base por 10 minutos.",
      "As folhas marrons redondas na base são parte da planta, não folha morta. Nunca arranque.",
    ],
  },

  // ---------- Marantáceas ----------
  calathea: {
    nomes: ["calateia", "maranta"],
    rega: "frequent",
    regaDias: 4,
    luz: ["Meia-sombra", "Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "dificil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: [
      "Só aceita água filtrada, de chuva ou destilada. Cloro e flúor da torneira queimam as bordas — é o problema mais comum dela.",
      "Quer umidade alta. Agrupe com outras plantas ou use um pratinho com pedrinhas e água.",
    ],
  },
  goeppertia: {
    nomes: ["calateia"],
    rega: "frequent",
    regaDias: 4,
    luz: ["Meia-sombra", "Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "dificil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Nome novo de boa parte das calateias. Mesmos cuidados: água filtrada e ar úmido."],
  },
  maranta: {
    nomes: ["maranta", "planta-da-oração"],
    rega: "frequent",
    regaDias: 4,
    luz: ["Meia-sombra", "Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "media",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["As folhas se levantam à noite e abaixam de dia. Se pararem de se mexer, quase sempre é falta de luz."],
  },
  ctenanthe: {
    nomes: ["ctenante"],
    rega: "frequent",
    regaDias: 4,
    luz: ["Meia-sombra", "Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "media",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Como as calateias: água filtrada e ar úmido."],
  },
  stromanthe: {
    nomes: ["estromante"],
    rega: "frequent",
    regaDias: 4,
    luz: ["Meia-sombra", "Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "dificil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["As folhas rosadas queimam no sol direto e desbotam na sombra profunda. Luz filtrada forte é o meio-termo."],
  },

  // ---------- Ficus e afins ----------
  ficus: {
    nomes: ["figueira"],
    rega: "average",
    regaDias: 9,
    luz: ["Luz indireta forte", "Sol pleno"],
    toleraSeca: false,
    interno: true,
    nivel: "media",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: [
      "Detesta mudança. Escolha um lugar com boa luz e não mexa mais — trocar de canto derruba folha.",
      "Gire um quarto de volta a cada rega para o crescimento ficar parelho.",
    ],
  },
  schefflera: {
    nomes: ["cheflera"],
    rega: "average",
    regaDias: 8,
    luz: ["Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["Fica esguia com pouca luz. Poda de ponta força brotação lateral e devolve o volume."],
  },
  pachira: {
    nomes: ["pachira", "árvore-da-fortuna"],
    rega: "average",
    regaDias: 11,
    luz: ["Luz indireta forte"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Guarda água no tronco engrossado. Deixe secar bem entre as regas."],
  },
  codiaeum: {
    nomes: ["cróton"],
    rega: "average",
    regaDias: 6,
    luz: ["Sol pleno", "Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "media",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["As cores só aparecem com muita luz. Na sombra ele fica todo verde."],
  },

  // ---------- Palmeiras ----------
  chamaedorea: {
    nomes: ["palmeira-areca-bambu", "chamedórea"],
    rega: "average",
    regaDias: 6,
    luz: ["Meia-sombra", "Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Das melhores palmeiras para interior — aceita pouca luz e é segura para gatos."],
  },
  dypsis: {
    nomes: ["areca-bambu"],
    rega: "average",
    regaDias: 5,
    luz: ["Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "media",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Ponta marrom nas folhas costuma ser ar seco ou flúor da água. Use água filtrada."],
  },
  rhapis: {
    nomes: ["ráfia", "palmeira-ráfis"],
    rega: "average",
    regaDias: 8,
    luz: ["Meia-sombra", "Luz indireta forte"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Cresce devagar e vive décadas. Aguenta cantos escuros melhor que quase toda palmeira."],
  },

  // ---------- Peperômias, pileias e rasteiras ----------
  peperomia: {
    nomes: ["peperômia"],
    rega: "minimum",
    regaDias: 11,
    luz: ["Luz indireta forte", "Meia-sombra"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Folha grossa guarda água: trate quase como suculenta. Segura para gatos e cachorros."],
  },
  pilea: {
    nomes: ["planta-do-dinheiro", "pileia"],
    rega: "average",
    regaDias: 7,
    luz: ["Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: [
      "Gire o vaso toda semana: ela se inclina forte para a luz e entorta o caule.",
      "Solta mudinhas na base — dá para separar e plantar quando tiverem uns 5 cm.",
    ],
  },
  tradescantia: {
    nomes: ["trapoeraba", "judeu-errante"],
    rega: "average",
    regaDias: 5,
    luz: ["Luz indireta forte", "Sol pleno"],
    toleraSeca: false,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["Fica careca na base com o tempo. Corte as pontas e replante os pedaços no mesmo vaso para adensar."],
  },
  fittonia: {
    nomes: ["fitônia", "planta-mosaico"],
    rega: "frequent",
    regaDias: 3,
    luz: ["Meia-sombra", "Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "media",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Desmaia por completo quando tem sede e volta em uma hora depois da rega. Ainda assim, evite chegar a esse ponto."],
  },
  chlorophytum: {
    nomes: ["clorofito", "gravatinha"],
    rega: "average",
    regaDias: 7,
    luz: ["Luz indireta forte", "Meia-sombra"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: [
      "Ponta marrom é flúor e cloro da água. Use água filtrada ou deixe descansar de um dia para o outro.",
      "As mudinhas pendentes enraízam em água ou direto na terra.",
    ],
  },
  hoya: {
    nomes: ["flor-de-cera"],
    rega: "minimum",
    regaDias: 12,
    luz: ["Luz indireta forte"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: [
      "Nunca corte o cabinho onde a flor nasceu: ela floresce ali de novo todo ano.",
      "Floresce melhor com a raiz apertada. Não replante cedo demais.",
    ],
  },
  begonia: {
    nomes: ["begônia"],
    rega: "average",
    regaDias: 5,
    luz: ["Luz indireta forte", "Meia-sombra"],
    toleraSeca: false,
    interno: true,
    nivel: "media",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["Regue a terra, nunca as folhas: folha molhada de begônia vira oídio com facilidade."],
  },
  saintpaulia: {
    nomes: ["violeta-africana"],
    rega: "average",
    regaDias: 5,
    luz: ["Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "media",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: [
      "Regue por baixo, pelo pratinho: água nas folhas peludas deixa manchas permanentes.",
      "Use água em temperatura ambiente — água fria também mancha.",
    ],
  },

  // ---------- Orquídeas e bromélias ----------
  phalaenopsis: {
    nomes: ["orquídea-borboleta"],
    rega: "average",
    regaDias: 7,
    luz: ["Luz indireta forte"],
    toleraSeca: true,
    interno: true,
    nivel: "media",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: [
      "As raízes dizem tudo: verdes estão hidratadas, prateadas pedem água. É mais confiável que qualquer calendário.",
      "Nunca deixe água no cachepô. Raiz de orquídea encharcada apodrece em dias.",
      "Depois da última flor, corte a haste dois nós abaixo — costuma brotar uma haste nova.",
    ],
  },
  dendrobium: {
    nomes: ["dendróbio"],
    rega: "average",
    regaDias: 6,
    luz: ["Luz indireta forte", "Sol pleno"],
    toleraSeca: true,
    interno: true,
    nivel: "dificil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Precisa de descanso seco e mais frio no inverno para florir."],
  },
  cattleya: {
    nomes: ["catleia"],
    rega: "minimum",
    regaDias: 8,
    luz: ["Sol pleno", "Luz indireta forte"],
    toleraSeca: true,
    interno: false,
    nivel: "dificil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Quer bastante luz, quase sol direto filtrado. Deixe o substrato secar bem entre as regas."],
  },
  guzmania: {
    nomes: ["bromélia"],
    rega: "average",
    regaDias: 7,
    luz: ["Luz indireta forte", "Meia-sombra"],
    toleraSeca: false,
    interno: true,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene, morre após florir",
    dicas: [
      "Regue no copo central da roseta e troque essa água toda semana para não criar mosquito.",
      "A planta-mãe morre depois de florir, mas deixa mudas na base. Separe quando tiverem um terço do tamanho dela.",
    ],
  },
  neoregelia: {
    nomes: ["bromélia"],
    rega: "average",
    regaDias: 7,
    luz: ["Luz indireta forte", "Sol pleno"],
    toleraSeca: false,
    interno: true,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene, morre após florir",
    dicas: ["Mantenha o copo central com água limpa. Mais luz deixa o centro mais vermelho."],
  },
  tillandsia: {
    nomes: ["cravo-do-ar", "filha-do-ar"],
    rega: "frequent",
    regaDias: 4,
    luz: ["Luz indireta forte"],
    toleraSeca: true,
    interno: true,
    nivel: "media",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: [
      "Não vive de ar: mergulhe em água por 20 minutos a cada 4 ou 5 dias.",
      "Sacuda bem e deixe secar de cabeça para baixo. Água presa no centro apodrece a planta.",
    ],
  },

  // ---------- Temperos ----------
  ocimum: {
    nomes: ["manjericão"],
    rega: "frequent",
    regaDias: 2,
    luz: ["Sol pleno"],
    toleraSeca: false,
    interno: false,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Anual",
    dicas: [
      "Corte as flores assim que aparecerem: se ele florir, as folhas amargam e a planta morre.",
      "Colha pelo topo, sempre acima de um par de folhas. Isso faz a planta engrossar.",
    ],
  },
  mentha: {
    nomes: ["hortelã", "menta"],
    rega: "frequent",
    regaDias: 2,
    luz: ["Sol pleno", "Meia-sombra"],
    toleraSeca: false,
    interno: false,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Planta sempre em vaso separado: no canteiro ela toma conta de tudo pelas raízes."],
  },
  rosmarinus: {
    nomes: ["alecrim"],
    rega: "minimum",
    regaDias: 8,
    luz: ["Sol pleno"],
    toleraSeca: true,
    interno: false,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Vem do Mediterrâneo: quer sol forte e terra seca. Morre muito mais de rega demais que de seca."],
  },
  salvia: {
    nomes: ["sálvia", "alecrim"],
    rega: "minimum",
    regaDias: 8,
    luz: ["Sol pleno"],
    toleraSeca: true,
    interno: false,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Terra bem drenada e sol pleno. Não gosta de pé molhado."],
  },
  thymus: {
    nomes: ["tomilho"],
    rega: "minimum",
    regaDias: 8,
    luz: ["Sol pleno"],
    toleraSeca: true,
    interno: false,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Quanto mais seco e ensolarado, mais concentrado fica o aroma."],
  },
  origanum: {
    nomes: ["orégano", "manjerona"],
    rega: "minimum",
    regaDias: 7,
    luz: ["Sol pleno"],
    toleraSeca: true,
    interno: false,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Colha antes da floração, quando o sabor está no auge."],
  },
  petroselinum: {
    nomes: ["salsa", "salsinha"],
    rega: "frequent",
    regaDias: 3,
    luz: ["Sol pleno", "Meia-sombra"],
    toleraSeca: false,
    interno: false,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Bienal",
    dicas: ["Colhe pelos talos de fora, sempre rente à base, deixando o centro crescer."],
  },
  coriandrum: {
    nomes: ["coentro"],
    rega: "frequent",
    regaDias: 3,
    luz: ["Sol pleno", "Meia-sombra"],
    toleraSeca: false,
    interno: false,
    nivel: "media",
    toxicaAnimais: false,
    ciclo: "Anual",
    dicas: ["Espiga rápido no calor. Semeie de novo a cada 3 semanas para ter sempre folha."],
  },
  cymbopogon: {
    nomes: ["capim-limão", "capim-cidreira"],
    rega: "frequent",
    regaDias: 3,
    luz: ["Sol pleno"],
    toleraSeca: false,
    interno: false,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Cresce em touceira e se espalha. Vaso grande ou canteiro."],
  },

  // ---------- Floríferas e externas ----------
  rosa: {
    nomes: ["roseira"],
    rega: "frequent",
    regaDias: 3,
    luz: ["Sol pleno"],
    toleraSeca: false,
    interno: false,
    nivel: "media",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: [
      "Regue a terra pela manhã, nunca as folhas: folha molhada à noite vira mancha-preta.",
      "Quer no mínimo 6 horas de sol direto para florir bem.",
    ],
  },
  hibiscus: {
    nomes: ["hibisco"],
    rega: "frequent",
    regaDias: 3,
    luz: ["Sol pleno"],
    toleraSeca: false,
    interno: false,
    nivel: "media",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Botão caindo antes de abrir é quase sempre falta de água ou mudança brusca de lugar."],
  },
  bougainvillea: {
    nomes: ["primavera", "buganvília"],
    rega: "minimum",
    regaDias: 7,
    luz: ["Sol pleno"],
    toleraSeca: true,
    interno: false,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Floresce mais quando passa um pouco de sede. Regar demais dá muita folha e nenhuma flor."],
  },
  gardenia: {
    nomes: ["gardênia", "jasmim-do-cabo"],
    rega: "frequent",
    regaDias: 4,
    luz: ["Luz indireta forte", "Sol pleno"],
    toleraSeca: false,
    interno: false,
    nivel: "dificil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Quer terra ácida. Folha amarela com nervura verde é falta de ferro — use adubo para plantas acidófilas."],
  },
  pelargonium: {
    nomes: ["gerânio"],
    rega: "average",
    regaDias: 5,
    luz: ["Sol pleno"],
    toleraSeca: true,
    interno: false,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["Tire as flores secas para estimular novas. Deixe a terra secar entre as regas."],
  },
  impatiens: {
    nomes: ["maria-sem-vergonha", "beijinho"],
    rega: "frequent",
    regaDias: 2,
    luz: ["Meia-sombra"],
    toleraSeca: false,
    interno: false,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene tratada como anual",
    dicas: ["Murcha rápido no calor mas se recupera bem. Prefere sombra fresca a sol forte."],
  },
  strelitzia: {
    nomes: ["estrelítzia", "ave-do-paraíso"],
    rega: "average",
    regaDias: 7,
    luz: ["Sol pleno", "Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "media",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: [
      "As folhas rasgam naturalmente com o vento — é normal, não é doença.",
      "Só floresce adulta, com muita luz, e costuma levar de 4 a 6 anos.",
    ],
  },
  cyclamen: {
    nomes: ["cíclame"],
    rega: "average",
    regaDias: 4,
    luz: ["Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "dificil",
    toxicaAnimais: true,
    ciclo: "Perene com dormência",
    dicas: [
      "Regue pelo pratinho: água no tubérculo apodrece a planta.",
      "Amarelar depois da floração é dormência normal, não morte. Pare de regar e retome no outono.",
    ],
  },
  aspidistra: {
    nomes: ["aspidistra", "planta-de-ferro"],
    rega: "minimum",
    regaDias: 14,
    luz: ["Sombra", "Meia-sombra"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Sobrevive em cantos onde nada mais vive. Cresce devagar; tenha paciência."],
  },
  yucca: {
    nomes: ["iúca"],
    rega: "minimum",
    regaDias: 14,
    luz: ["Sol pleno", "Luz indireta forte"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["Tronco mole na base é podridão por excesso de água — o único jeito de matá-la."],
  },
  beaucarnea: {
    nomes: ["pata-de-elefante"],
    rega: "minimum",
    regaDias: 21,
    luz: ["Sol pleno", "Luz indireta forte"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["A base inchada é um reservatório de água. Regue pouco e espaçado."],
  },
};

// ------------------------------------------------------------------
// Ajustes por espécie, onde o gênero varia demais
// ------------------------------------------------------------------

export const ESPECIES: Record<string, Parcial> = {
  "ficus lyrata": {
    nomes: ["figueira-lira"],
    regaDias: 8,
    nivel: "dificil",
    dicas: [
      "A mais dramática do gênero: mancha marrom no meio da folha é excesso de água; borda seca e enrolada é sede.",
      "Quer muita luz. Menos de 6 horas de claridade forte e ela vai definhando devagar.",
    ],
  },
  "ficus elastica": {
    nomes: ["falsa-seringueira"],
    regaDias: 11,
    nivel: "facil",
    dicas: ["Bem mais tolerante que a lira. Limpe as folhas com pano úmido para ela respirar e brilhar."],
  },
  "ficus benjamina": {
    nomes: ["figueira-benjamina"],
    regaDias: 8,
    dicas: ["Derruba um monte de folha quando muda de lugar. É estresse de adaptação: mantenha a rega e espere."],
  },
  "sansevieria trifasciata": { nomes: ["espada-de-são-jorge"] },
  "dracaena trifasciata": {
    nomes: ["espada-de-são-jorge", "língua-de-sogra"],
    rega: "minimum",
    regaDias: 21,
    toleraSeca: true,
    dicas: [
      "É a antiga Sansevieria, reclassificada como Dracaena. No inverno, regue a cada 30 ou 40 dias.",
      "Regue na terra, nunca no meio da roseta.",
    ],
  },
  "dracaena fragrans": { nomes: ["pau-d'água", "tronco-da-felicidade"], regaDias: 12 },
  "dracaena marginata": { nomes: ["dracena-de-madagascar"], regaDias: 14, toleraSeca: true },
  "monstera adansonii": { nomes: ["costela-de-adão-miúda", "buraco-de-queijo"], regaDias: 6 },
  "monstera deliciosa": { nomes: ["costela-de-adão"] },
  "epipremnum aureum": { nomes: ["jiboia-dourada"] },
  "philodendron hederaceum": { nomes: ["filodendro-coração"], regaDias: 8 },
  "spathiphyllum wallisii": { nomes: ["lírio-da-paz"] },
  "zamioculcas zamiifolia": { nomes: ["zamioculca"] },
  "chlorophytum comosum": { nomes: ["clorofito", "gravatinha"] },
  "pilea peperomioides": { nomes: ["planta-do-dinheiro-chinesa"] },
  "aloe vera": { nomes: ["babosa"] },
  "crassula ovata": { nomes: ["planta-jade"] },
  "senecio rowleyanus": { nomes: ["colar-de-pérolas"], regaDias: 15 },
  "nephrolepis exaltata": { nomes: ["samambaia-americana"] },
  "phalaenopsis amabilis": { nomes: ["orquídea-borboleta"] },
  "hoya carnosa": { nomes: ["flor-de-cera"] },
  "ocimum basilicum": { nomes: ["manjericão"] },
  "mentha spicata": { nomes: ["hortelã"] },
  "salvia rosmarinus": {
    nomes: ["alecrim"],
    rega: "minimum",
    regaDias: 8,
    toleraSeca: true,
    dicas: ["Nome atual do alecrim, antes Rosmarinus officinalis. Sol forte e terra seca."],
  },
};

// ------------------------------------------------------------------
// Fallback por família
// ------------------------------------------------------------------

export const FAMILIAS: Record<string, EntradaCatalogo> = {
  cactaceae: {
    nomes: ["cacto"],
    rega: "minimum",
    regaDias: 21,
    luz: ["Sol pleno"],
    toleraSeca: true,
    interno: false,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["No inverno, quase não regue. Cacto morre de água, raramente de seca."],
  },
  crassulaceae: {
    nomes: ["suculenta"],
    rega: "minimum",
    regaDias: 14,
    luz: ["Sol pleno"],
    toleraSeca: true,
    interno: false,
    nivel: "facil",
    toxicaAnimais: null,
    ciclo: "Perene",
    dicas: ["Regue só quando a terra estiver seca até o fundo, e sempre na terra, não sobre as folhas."],
  },
  araceae: {
    nomes: ["arácea"],
    rega: "average",
    regaDias: 7,
    luz: ["Luz indireta forte", "Meia-sombra"],
    toleraSeca: false,
    interno: true,
    nivel: "facil",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["Quase toda arácea é tóxica para gatos e cães, e quase toda gosta de luz indireta e substrato aerado."],
  },
  marantaceae: {
    nomes: ["marantácea"],
    rega: "frequent",
    regaDias: 4,
    luz: ["Meia-sombra", "Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "dificil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Água filtrada e ar úmido resolvem 90% dos problemas desta família."],
  },
  orchidaceae: {
    nomes: ["orquídea"],
    rega: "average",
    regaDias: 7,
    luz: ["Luz indireta forte"],
    toleraSeca: true,
    interno: true,
    nivel: "media",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Substrato de casca, nunca terra. E nunca deixe água parada no cachepô."],
  },
  bromeliaceae: {
    nomes: ["bromélia"],
    rega: "average",
    regaDias: 7,
    luz: ["Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Regue no copo central e troque a água semanalmente."],
  },
  arecaceae: {
    nomes: ["palmeira"],
    rega: "average",
    regaDias: 6,
    luz: ["Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "media",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Ponta marrom nas folhas costuma ser ar seco ou água tratada."],
  },
  lamiaceae: {
    nomes: ["tempero"],
    rega: "average",
    regaDias: 4,
    luz: ["Sol pleno"],
    toleraSeca: false,
    interno: false,
    nivel: "facil",
    toxicaAnimais: false,
    ciclo: "Variável",
    dicas: ["Colha sempre pelo topo: isso faz a planta engrossar em vez de esticar."],
  },
  asphodelaceae: {
    nomes: ["babosa e afins"],
    rega: "minimum",
    regaDias: 15,
    luz: ["Sol pleno", "Luz indireta forte"],
    toleraSeca: true,
    interno: true,
    nivel: "facil",
    toxicaAnimais: null,
    ciclo: "Perene",
    dicas: ["Substrato que drene rápido é mais importante que a frequência da rega."],
  },
  polypodiaceae: {
    nomes: ["samambaia"],
    rega: "frequent",
    regaDias: 4,
    luz: ["Meia-sombra"],
    toleraSeca: false,
    interno: true,
    nivel: "media",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Samambaia quer umidade constante no substrato e no ar."],
  },
  pteridaceae: {
    nomes: ["samambaia"],
    rega: "frequent",
    regaDias: 3,
    luz: ["Meia-sombra", "Sombra"],
    toleraSeca: false,
    interno: true,
    nivel: "dificil",
    toxicaAnimais: false,
    ciclo: "Perene",
    dicas: ["Nunca deixe secar por completo."],
  },
  moraceae: {
    nomes: ["figueira"],
    rega: "average",
    regaDias: 9,
    luz: ["Luz indireta forte"],
    toleraSeca: false,
    interno: true,
    nivel: "media",
    toxicaAnimais: true,
    ciclo: "Perene",
    dicas: ["Escolha um lugar com boa luz e não fique mudando a planta de canto."],
  },
};

/** Usado quando não reconhecemos nem o gênero nem a família. */
export const PADRAO: EntradaCatalogo = {
  nomes: [],
  rega: "average",
  regaDias: 7,
  luz: ["Luz indireta forte"],
  toleraSeca: false,
  interno: true,
  nivel: "media",
  toxicaAnimais: null,
  ciclo: "Desconhecido",
  dicas: [
    "Não tenho dados desta espécie no catálogo, então parti de um cronograma médio.",
    "O melhor sensor continua sendo o dedo: enfie até a segunda falange antes de regar e ajuste o intervalo aqui conforme aprender.",
  ],
};

// ------------------------------------------------------------------
// Busca
// ------------------------------------------------------------------

export type Cuidados = {
  entrada: EntradaCatalogo;
  precisao: Precisao;
  /** Chave que casou, para mostrar de onde veio a informação. */
  origem: string | null;
};

function normalizar(texto: string) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Encontra os cuidados a partir do nome científico da Pl@ntNet.
 * Vai afunilando: espécie exata → gênero → família → padrão.
 */
export function buscarCuidados(
  nomeCientifico: string | null | undefined,
  familia?: string | null,
): Cuidados {
  if (nomeCientifico) {
    const limpo = normalizar(nomeCientifico);
    const partes = limpo.split(/\s+/);
    const genero = partes[0];
    const especie = partes.slice(0, 2).join(" ");

    const porEspecie = ESPECIES[especie];
    const porGenero = GENEROS[genero];

    if (porEspecie) {
      // O ajuste de espécie herda tudo o que o gênero já define.
      const base = porGenero ?? FAMILIAS[normalizar(familia ?? "")] ?? PADRAO;
      return {
        entrada: { ...base, ...porEspecie },
        precisao: "especie",
        origem: especie,
      };
    }

    if (porGenero) {
      return { entrada: porGenero, precisao: "genero", origem: genero };
    }
  }

  if (familia) {
    const porFamilia = FAMILIAS[normalizar(familia)];
    if (porFamilia) {
      return { entrada: porFamilia, precisao: "familia", origem: normalizar(familia) };
    }
  }

  return { entrada: PADRAO, precisao: "padrao", origem: null };
}

/** Busca por nome popular ou científico, para o cadastro manual. */
export function procurarPorNome(termo: string): Array<{
  chave: string;
  nomeCientifico: string;
  nomes: string[];
}> {
  const alvo = normalizar(termo);
  if (alvo.length < 2) return [];

  const achados: Array<{ chave: string; nomeCientifico: string; nomes: string[] }> = [];

  for (const [chave, entrada] of Object.entries(ESPECIES)) {
    const nomes = entrada.nomes ?? GENEROS[chave.split(" ")[0]]?.nomes ?? [];
    if (chave.includes(alvo) || nomes.some((n) => normalizar(n).includes(alvo))) {
      achados.push({
        chave,
        nomeCientifico: chave.replace(/^\w/, (c) => c.toUpperCase()),
        nomes,
      });
    }
  }

  for (const [chave, entrada] of Object.entries(GENEROS)) {
    if (achados.some((a) => a.chave.startsWith(chave))) continue;
    if (chave.includes(alvo) || entrada.nomes.some((n) => normalizar(n).includes(alvo))) {
      achados.push({
        chave,
        nomeCientifico: chave.replace(/^\w/, (c) => c.toUpperCase()),
        nomes: entrada.nomes,
      });
    }
  }

  return achados.slice(0, 12);
}

/** Quantas plantas o catálogo cobre — usado só para exibição. */
export const TAMANHO_CATALOGO = Object.keys(GENEROS).length + Object.keys(ESPECIES).length;
