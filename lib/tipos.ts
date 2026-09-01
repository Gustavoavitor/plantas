export type Ambiente = "interno" | "varanda" | "externo";
export type Luz = "sol_direto" | "luz_indireta" | "meia_sombra" | "sombra";
export type TamanhoVaso = "pequeno" | "medio" | "grande" | "canteiro";
export type TipoEvento = "rega" | "adubacao" | "poda" | "replantio" | "nota";

export type Especie = {
  id: number;
  nome_cientifico: string;
  nome_comum: string | null;
  ciclo: string | null;
  rega: string | null;
  rega_dias: number | null;
  luz: string[] | null;
  interno: boolean | null;
  tolera_seca: boolean | null;
  nivel_cuidado: string | null;
  toxica_animais: boolean | null;
  descricao: string | null;
  imagem_url: string | null;
};

export type Planta = {
  id: string;
  usuario_id: string;
  apelido: string;
  especie_id: number | null;
  nome_cientifico: string | null;
  nome_comum: string | null;
  foto_url: string | null;
  ambiente: Ambiente;
  luz: Luz;
  tamanho_vaso: TamanhoVaso;
  intervalo_rega_dias: number;
  intervalo_aduba_dias: number;
  ultima_rega: string | null;
  ultima_aduba: string | null;
  notas: string | null;
  arquivada: boolean;
  criado_em: string;
};

export type EventoCuidado = {
  id: string;
  planta_id: string;
  tipo: TipoEvento;
  data: string;
  observacao: string | null;
  criado_em: string;
};

export type Diagnostico = {
  id: string;
  planta_id: string;
  sintomas: string[];
  foto_url: string | null;
  resultado: ResultadoDiagnostico;
  criado_em: string;
};

export type CausaProvavel = {
  causa: string;
  confianca: number; // 0 a 1
  explicacao: string;
  acoes: string[];
  urgencia: "baixa" | "media" | "alta";
};

export type ResultadoDiagnostico = {
  causas: CausaProvavel[];
  observacao: string | null;
};

/** Um palpite de espécie devolvido pela Pl@ntNet. */
export type PalpiteEspecie = {
  nomeCientifico: string;
  nomesComuns: string[];
  familia: string | null;
  confianca: number; // 0 a 1
  imagemReferencia: string | null;
};

export const ROTULOS = {
  ambiente: {
    interno: "Dentro de casa",
    varanda: "Varanda",
    externo: "Área externa",
  } satisfies Record<Ambiente, string>,

  luz: {
    sol_direto: "Sol direto",
    luz_indireta: "Luz indireta forte",
    meia_sombra: "Meia-sombra",
    sombra: "Sombra",
  } satisfies Record<Luz, string>,

  vaso: {
    pequeno: "Vaso pequeno (até 15 cm)",
    medio: "Vaso médio (15–25 cm)",
    grande: "Vaso grande (acima de 25 cm)",
    canteiro: "Canteiro / chão",
  } satisfies Record<TamanhoVaso, string>,

  evento: {
    rega: "Rega",
    adubacao: "Adubação",
    poda: "Poda",
    replantio: "Replantio",
    nota: "Anotação",
  } satisfies Record<TipoEvento, string>,
} as const;
