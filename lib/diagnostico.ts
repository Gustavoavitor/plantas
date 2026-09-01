import type { CausaProvavel, ResultadoDiagnostico } from "./tipos";

/**
 * Triagem de problemas por sintoma.
 *
 * Nem a Pl@ntNet nem a Perenual fazem diagnóstico de doença por foto no plano
 * gratuito — a Pl@ntNet só identifica espécie. O que funciona de verdade é o
 * raciocínio que um jardineiro experiente faz: cruzar sintomas visíveis com o
 * histórico de rega. É isso que este arquivo faz.
 */

export type GrupoSintoma = "folhas" | "caule" | "terra" | "bichos" | "geral";

export type Sintoma = {
  id: string;
  rotulo: string;
  grupo: GrupoSintoma;
};

export const SINTOMAS: Sintoma[] = [
  // Folhas
  { id: "folhas_amarelas_base", rotulo: "Folhas de baixo amarelando", grupo: "folhas" },
  { id: "folhas_amarelas_geral", rotulo: "Amarelão generalizado", grupo: "folhas" },
  { id: "pontas_marrons_secas", rotulo: "Pontas e bordas marrons e secas", grupo: "folhas" },
  { id: "manchas_marrons_moles", rotulo: "Manchas marrons moles ou encharcadas", grupo: "folhas" },
  { id: "manchas_escuras_secas", rotulo: "Manchas escuras secas, com halo amarelo", grupo: "folhas" },
  { id: "folhas_murchas", rotulo: "Folhas murchas ou caídas", grupo: "folhas" },
  { id: "folhas_caindo", rotulo: "Folhas caindo sem amarelar", grupo: "folhas" },
  { id: "folhas_palidas", rotulo: "Folhas novas pálidas ou menores", grupo: "folhas" },
  { id: "folhas_esbranquicadas", rotulo: "Áreas esbranquiçadas ou 'lavadas'", grupo: "folhas" },
  { id: "folhas_enroladas", rotulo: "Folhas enrolando para dentro", grupo: "folhas" },
  { id: "poeira_branca_folha", rotulo: "Pó branco na superfície da folha", grupo: "folhas" },

  // Caule e formato
  { id: "caule_mole_escuro", rotulo: "Caule mole, escuro ou com cheiro ruim", grupo: "caule" },
  { id: "estiolado", rotulo: "Crescimento esticado, com espaços longos entre folhas", grupo: "caule" },
  { id: "inclinando_janela", rotulo: "Planta inclinando forte para a janela", grupo: "caule" },
  { id: "sem_crescimento", rotulo: "Parada, sem folha nova há semanas", grupo: "geral" },
  { id: "sem_flores", rotulo: "Não floresce", grupo: "geral" },

  // Terra e raiz
  { id: "terra_encharcada", rotulo: "Terra sempre úmida ou encharcada", grupo: "terra" },
  { id: "terra_muito_seca", rotulo: "Terra ressecada, afastando das bordas do vaso", grupo: "terra" },
  { id: "mofo_na_terra", rotulo: "Mofo branco na superfície da terra", grupo: "terra" },
  { id: "crosta_branca", rotulo: "Crosta branca no vaso ou na terra", grupo: "terra" },
  { id: "raizes_para_fora", rotulo: "Raízes saindo pelo furo do vaso", grupo: "terra" },
  { id: "agua_escorre_direto", rotulo: "A água escorre direto sem molhar a terra", grupo: "terra" },

  // Bichos
  { id: "teias_finas", rotulo: "Teias finas entre as folhas", grupo: "bichos" },
  { id: "pontos_algodao", rotulo: "Pontinhos brancos parecendo algodão", grupo: "bichos" },
  { id: "carocinhos_marrons", rotulo: "Carocinhos marrons grudados no caule", grupo: "bichos" },
  { id: "mosquitinhos", rotulo: "Mosquitinhos pretos saindo da terra", grupo: "bichos" },
  { id: "bichinhos_verdes", rotulo: "Bichinhos verdes ou pretos nos brotos", grupo: "bichos" },
  { id: "folha_pegajosa", rotulo: "Folhas pegajosas ou brilhosas demais", grupo: "bichos" },
  { id: "furos_nas_folhas", rotulo: "Furos ou pedaços comidos", grupo: "bichos" },
];

type Causa = {
  id: string;
  nome: string;
  urgencia: CausaProvavel["urgencia"];
  explicacao: string;
  acoes: string[];
};

const CAUSAS: Record<string, Causa> = {
  excesso_agua: {
    id: "excesso_agua",
    nome: "Excesso de água",
    urgencia: "media",
    explicacao:
      "Raiz encharcada não consegue absorver oxigênio, e a planta apresenta sintomas idênticos aos de sede: folha murcha e amarelada. É o erro mais comum em planta de casa.",
    acoes: [
      "Pare de regar e deixe os 3 cm de cima da terra secarem completamente antes da próxima rega.",
      "Enfie o dedo até a segunda falange antes de cada rega — se sair úmido, espere.",
      "Confirme que o vaso tem furo de drenagem e que o pratinho não fica com água parada.",
      "Se a terra demora dias para secar, troque por substrato mais aerado (adicione perlita ou casca de pinus).",
    ],
  },
  falta_agua: {
    id: "falta_agua",
    nome: "Falta de água",
    urgencia: "media",
    explicacao:
      "O substrato secou além do ponto de recuperação e as folhas perdem turgidez. Terra muito seca também repele água, e a rega escorre pelas laterais sem hidratar nada.",
    acoes: [
      "Regue devagar até a água sair pelo furo de baixo.",
      "Se a terra estiver repelindo a água, mergulhe o vaso em uma bacia por 20 minutos.",
      "Encurte o intervalo de rega na tela da planta.",
    ],
  },
  podridao_raiz: {
    id: "podridao_raiz",
    nome: "Podridão de raiz",
    urgencia: "alta",
    explicacao:
      "Encharcamento prolongado apodreceu a raiz e a infecção subiu pelo caule. Sem intervenção rápida a planta não se recupera.",
    acoes: [
      "Desenvase e examine as raízes: saudável é firme e clara, podre é marrom, mole e solta cheiro.",
      "Corte toda a raiz apodrecida com tesoura limpa.",
      "Replante em substrato novo e seco, em vaso com boa drenagem.",
      "Não regue por 3 a 5 dias depois do replantio, e não adube até ver folha nova.",
    ],
  },
  luz_insuficiente: {
    id: "luz_insuficiente",
    nome: "Luz insuficiente",
    urgencia: "baixa",
    explicacao:
      "Sem luz suficiente a planta estica em busca da janela, produz folhas menores e pálidas e para de florescer. O caule fica com espaços longos entre as folhas.",
    acoes: [
      "Aproxime a planta de uma janela — a maioria das plantas de interior quer luz indireta forte.",
      "Gire o vaso um quarto de volta a cada rega, para o crescimento ficar parelho.",
      "Corte os ramos mais esticados para estimular brotação compacta.",
    ],
  },
  luz_excessiva: {
    id: "luz_excessiva",
    nome: "Sol direto demais",
    urgencia: "media",
    explicacao:
      "Folha adaptada à sombra queima sob sol direto. A marca aparece na face voltada ao sol, seca e esbranquiçada, com contorno bem definido.",
    acoes: [
      "Afaste do sol direto do meio-dia; manhã até 10h costuma ser seguro.",
      "Use cortina de voil para filtrar a luz sem escurecer o cômodo.",
      "Folha queimada não se recupera — corte só se estiver incomodando.",
    ],
  },
  baixa_umidade: {
    id: "baixa_umidade",
    nome: "Ar seco",
    urgencia: "baixa",
    explicacao:
      "Pontas marrons e crocantes em folha de planta tropical geralmente são ar seco, não sede. Ar-condicionado e ventilador apontados para a planta pioram muito.",
    acoes: [
      "Afaste de ar-condicionado, ventilador e corrente de ar.",
      "Agrupe plantas: elas criam um microclima mais úmido entre si.",
      "Um pratinho com pedrinhas e água embaixo do vaso ajuda (sem encostar a base na água).",
    ],
  },
  excesso_sal: {
    id: "excesso_sal",
    nome: "Acúmulo de sal ou excesso de adubo",
    urgencia: "media",
    explicacao:
      "Adubo demais, ou água muito dura, deixa sal acumulado no substrato. O sal queima a raiz e a ponta da folha, e forma crosta branca no vaso.",
    acoes: [
      "Lave o substrato: regue com bastante água limpa e deixe escorrer, três vezes seguidas.",
      "Suspenda o adubo por pelo menos dois meses.",
      "Quando voltar a adubar, use metade da dose indicada no rótulo.",
    ],
  },
  falta_nutrientes: {
    id: "falta_nutrientes",
    nome: "Falta de nutrientes",
    urgencia: "baixa",
    explicacao:
      "Substrato antigo esgota. O nitrogênio é móvel na planta, então ela puxa das folhas velhas para alimentar as novas — por isso o amarelão começa por baixo.",
    acoes: [
      "Adube com fertilizante equilibrado na estação de crescimento (primavera e verão).",
      "Se a terra tem mais de dois anos, troque a camada de cima ou replante.",
      "Não adube planta com raiz doente ou substrato seco.",
    ],
  },
  vaso_pequeno: {
    id: "vaso_pequeno",
    nome: "Vaso apertado",
    urgencia: "baixa",
    explicacao:
      "A raiz tomou todo o espaço. Sobra pouco substrato para segurar água e nutriente, então a planta seca rápido e para de crescer.",
    acoes: [
      "Replante em vaso 3 a 5 cm mais largo que o atual — pular para um vaso muito grande favorece encharcamento.",
      "Solte delicadamente o novelo de raízes ao replantar.",
      "Replante de preferência na primavera.",
    ],
  },
  acaros: {
    id: "acaros",
    nome: "Ácaro-rajado",
    urgencia: "alta",
    explicacao:
      "Ácaros são quase invisíveis a olho nu; o sinal é a teia fina e o pontilhado claro na folha. Proliferam em ar seco e se espalham rápido para as plantas vizinhas.",
    acoes: [
      "Isole a planta das outras hoje mesmo.",
      "Lave bem as folhas, principalmente a face de baixo, com jato de água no chuveiro.",
      "Aplique óleo de nim a cada 5 dias, por 3 semanas, para pegar os ovos que vão eclodindo.",
      "Aumente a umidade do ar: ácaro odeia ambiente úmido.",
    ],
  },
  cochonilha: {
    id: "cochonilha",
    nome: "Cochonilha",
    urgencia: "alta",
    explicacao:
      "Suga a seiva e excreta uma substância açucarada que deixa a folha pegajosa e atrai fungo preto (fumagina). A carapaça protege o bicho de inseticida comum.",
    acoes: [
      "Isole a planta.",
      "Remova o que der com cotonete embebido em álcool 70%, uma a uma.",
      "Depois aplique óleo de nim ou calda de sabão neutro, repetindo semanalmente por um mês.",
      "Cheque as axilas das folhas e a face de baixo — é onde se escondem.",
    ],
  },
  pulgoes: {
    id: "pulgoes",
    nome: "Pulgões",
    urgencia: "media",
    explicacao:
      "Atacam brotos e folhas novas, deformando o crescimento. Multiplicam-se muito rápido, mas são fáceis de eliminar se pegos cedo.",
    acoes: [
      "Derrube com jato de água forte nos brotos.",
      "Aplique calda de sabão neutro (1 colher de sopa por litro) ou óleo de nim.",
      "Repita a cada 4 dias até sumirem.",
    ],
  },
  sciarideos: {
    id: "sciarideos",
    nome: "Mosquitinhos do substrato (sciarídeos)",
    urgencia: "baixa",
    explicacao:
      "As larvas vivem na terra permanentemente úmida. O adulto incomoda mas quase não faz dano — o problema real que ele denuncia é o excesso de rega.",
    acoes: [
      "Deixe os 3 cm de cima da terra secarem entre as regas: isso quebra o ciclo das larvas.",
      "Cubra a terra com 1 cm de areia grossa ou pedrisco.",
      "Use armadilha adesiva amarela para os adultos.",
    ],
  },
  fungo_foliar: {
    id: "fungo_foliar",
    nome: "Fungo nas folhas",
    urgencia: "media",
    explicacao:
      "Manchas escuras com halo amarelo, que crescem e se juntam, indicam fungo. Espalha-se com folha molhada, ar parado e plantas muito juntas.",
    acoes: [
      "Corte e descarte as folhas afetadas (no lixo, não na composteira).",
      "Regue a terra, nunca as folhas, e prefira regar de manhã.",
      "Melhore a circulação de ar: afaste as plantas umas das outras.",
      "Se persistir, aplique fungicida à base de cobre.",
    ],
  },
  oidio: {
    id: "oidio",
    nome: "Oídio",
    urgencia: "media",
    explicacao:
      "O pó branco farinhento na superfície da folha é um fungo de ar parado e úmido. Sai com o dedo, o que ajuda a diferenciar de poeira ou resíduo de água dura.",
    acoes: [
      "Remova as folhas mais tomadas.",
      "Borrife solução de 1 colher de chá de bicarbonato por litro de água, com uma gota de detergente neutro.",
      "Aumente a ventilação e evite molhar as folhas.",
    ],
  },
  lagartas: {
    id: "lagartas",
    nome: "Lagartas ou besouros",
    urgencia: "media",
    explicacao:
      "Pedaços comidos com borda irregular indicam mastigador. Costuma ser um bicho só, escondido na face de baixo ou saindo à noite.",
    acoes: [
      "Procure na face de baixo das folhas e remova à mão.",
      "Confira a planta à noite com lanterna, quando muitos saem para comer.",
      "Em infestação maior, use Bacillus thuringiensis, que é seletivo e seguro.",
    ],
  },
  adaptacao: {
    id: "adaptacao",
    nome: "Estresse de mudança",
    urgencia: "baixa",
    explicacao:
      "Planta recém-comprada ou recém-mudada de lugar derruba folhas ao se adaptar à nova luz e umidade. Costuma passar em duas a quatro semanas.",
    acoes: [
      "Escolha um lugar e não fique mudando a planta de posição.",
      "Mantenha a rega regular e não adube durante a adaptação.",
      "Dê tempo: folha nova saudável é o sinal de que passou.",
    ],
  },
};

/** Peso de cada sintoma para cada causa. Quanto maior, mais característico. */
const PESOS: Record<string, Partial<Record<string, number>>> = {
  folhas_amarelas_base: { excesso_agua: 2, falta_nutrientes: 2.5, adaptacao: 1 },
  folhas_amarelas_geral: { excesso_agua: 3, podridao_raiz: 1.5, falta_nutrientes: 1.5, luz_insuficiente: 1 },
  pontas_marrons_secas: { baixa_umidade: 3, excesso_sal: 2.5, falta_agua: 1.5 },
  manchas_marrons_moles: { excesso_agua: 3, podridao_raiz: 2, fungo_foliar: 2 },
  manchas_escuras_secas: { fungo_foliar: 3.5, luz_excessiva: 1 },
  folhas_murchas: { falta_agua: 3, excesso_agua: 2.5, podridao_raiz: 2 },
  folhas_caindo: { adaptacao: 2.5, excesso_agua: 1.5, falta_agua: 1.5, luz_insuficiente: 1 },
  folhas_palidas: { luz_insuficiente: 3, falta_nutrientes: 2 },
  folhas_esbranquicadas: { luz_excessiva: 3.5, acaros: 1.5 },
  folhas_enroladas: { falta_agua: 2, acaros: 1.5, luz_excessiva: 1.5 },
  poeira_branca_folha: { oidio: 4 },

  caule_mole_escuro: { podridao_raiz: 4.5, excesso_agua: 2 },
  estiolado: { luz_insuficiente: 4 },
  inclinando_janela: { luz_insuficiente: 3 },
  sem_crescimento: { luz_insuficiente: 1.5, falta_nutrientes: 1.5, vaso_pequeno: 1.5, podridao_raiz: 1 },
  sem_flores: { luz_insuficiente: 2.5, falta_nutrientes: 2 },

  terra_encharcada: { excesso_agua: 4, podridao_raiz: 2, sciarideos: 1.5 },
  terra_muito_seca: { falta_agua: 4 },
  mofo_na_terra: { excesso_agua: 3, sciarideos: 1.5 },
  crosta_branca: { excesso_sal: 4 },
  raizes_para_fora: { vaso_pequeno: 4 },
  agua_escorre_direto: { falta_agua: 2.5, vaso_pequeno: 2 },

  teias_finas: { acaros: 5 },
  pontos_algodao: { cochonilha: 5 },
  carocinhos_marrons: { cochonilha: 4.5 },
  mosquitinhos: { sciarideos: 4.5, excesso_agua: 2 },
  bichinhos_verdes: { pulgoes: 5 },
  folha_pegajosa: { cochonilha: 3, pulgoes: 2.5 },
  furos_nas_folhas: { lagartas: 4.5 },
};

export type ContextoDiagnostico = {
  /** Dias desde a última rega registrada, se houver. */
  diasDesdeRega?: number | null;
  /** Intervalo de rega configurado para a planta. */
  intervaloRega?: number | null;
};

/**
 * Cruza os sintomas marcados com o histórico de rega e devolve as causas
 * mais prováveis, em ordem de confiança.
 */
export function diagnosticar(
  sintomas: string[],
  contexto: ContextoDiagnostico = {},
): ResultadoDiagnostico {
  if (sintomas.length === 0) {
    return { causas: [], observacao: "Marque ao menos um sintoma para eu conseguir ajudar." };
  }

  const pontos = new Map<string, number>();
  for (const sintoma of sintomas) {
    for (const [causa, peso] of Object.entries(PESOS[sintoma] ?? {})) {
      pontos.set(causa, (pontos.get(causa) ?? 0) + (peso ?? 0));
    }
  }

  // O histórico de rega desempata excesso x falta de água, que dão
  // exatamente os mesmos sintomas na folha.
  let observacao: string | null = null;
  const { diasDesdeRega, intervaloRega } = contexto;

  if (typeof diasDesdeRega === "number" && typeof intervaloRega === "number" && intervaloRega > 0) {
    const proporcao = diasDesdeRega / intervaloRega;

    if (proporcao < 0.4 && pontos.has("excesso_agua")) {
      pontos.set("excesso_agua", (pontos.get("excesso_agua") ?? 0) * 1.6);
      pontos.set("falta_agua", (pontos.get("falta_agua") ?? 0) * 0.4);
      observacao = `Você regou há ${diasDesdeRega} dia(s), bem antes do intervalo de ${intervaloRega} dias. Isso pesa muito a favor de excesso de água.`;
    } else if (proporcao > 1.5 && pontos.has("falta_agua")) {
      pontos.set("falta_agua", (pontos.get("falta_agua") ?? 0) * 1.6);
      pontos.set("excesso_agua", (pontos.get("excesso_agua") ?? 0) * 0.4);
      observacao = `A última rega foi há ${diasDesdeRega} dias, e o intervalo previsto é ${intervaloRega}. A planta passou sede.`;
    }
  } else if (pontos.has("excesso_agua") && pontos.has("falta_agua")) {
    observacao =
      "Sede e afogamento produzem os mesmos sintomas na folha. Registre as regas no app: com o histórico eu consigo separar os dois.";
  }

  const total = [...pontos.values()].reduce((a, b) => a + b, 0);
  if (total === 0) {
    return {
      causas: [],
      observacao: "Não consegui relacionar esses sintomas a uma causa conhecida.",
    };
  }

  const causas: CausaProvavel[] = [...pontos.entries()]
    .filter(([id]) => CAUSAS[id])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, pontuacao]) => {
      const c = CAUSAS[id];
      return {
        causa: c.nome,
        confianca: Math.round((pontuacao / total) * 100) / 100,
        explicacao: c.explicacao,
        acoes: c.acoes,
        urgencia: c.urgencia,
      };
    })
    .filter((c) => c.confianca >= 0.1);

  return { causas, observacao };
}
