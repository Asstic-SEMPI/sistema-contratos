import { TipoInstrumento, TipoAlteracao, StatusInstrumento, TipoContrato, TipoLicitacao } from './database.types';

export interface VwDashboardExecucaoContratoRow {
  contrato_id: string;
  numero_contrato: string | null;
  tipo_formalizacao: TipoInstrumento;
  processo_sei: string;
  chave_siga_contrato: string;
  contratada_cnpj: string;
  contratada_razao_social: string;
  objeto: string;
  status: StatusInstrumento;
  data_vigencia_inicio_original: string;
  data_vigencia_fim_original: string;
  data_vigencia_fim_atual: string;
  dias_restantes_vigencia: number;
  faixa_vencimento: string;
  qtd_aditivos: number;
  qtd_apostilamentos: number;
  percentual_acrescimo_acumulado: number;
  valor_inicial: number;
  valor_global_atual: number;
  valor_empenhado_liquido: number;
  valor_liquidado: number;
  saldo_a_empenhar: number;
  saldo_empenhado_a_liquidar: number;
  perc_empenhado_sobre_global: number;
  perc_liquidado_sobre_global: number;
  perc_liquidado_sobre_empenhado: number;
  comissao_fiscalizacao_completa: boolean;
}

export type SafraBucket = 'CRITICO_30' | 'ATENCAO_60' | 'PLANEJAMENTO_120' | 'REGULAR_MAIOR_120';
export type EstagioAditivo = 'CONTRATO_INICIAL' | 'PRIMEIRO_ADITIVO' | 'SEGUNDO_ADITIVO' | 'TERCEIRO_MAIS_ADITIVO';
export type QuadranteRisco = 'EXECUCAO_REGULAR' | 'RISCO_DESABASTECIMENTO' | 'BAIXA_EXECUCAO' | 'CRITICO_VENCENDO';

export interface HierarchicalLevel4Liquidacao {
  id: string;
  empenho_id: string;
  numero_nota_fiscal: string;
  data_emissao_nota_fiscal: string;
  competencia_mes_ano: string;
  numero_nota_liquidacao: string;
  data_emissao_nl: string;
  valor_liquidado: number;
  data_pagamento_ob: string | null;
  processo_sei: string;
}

export interface HierarchicalLevel3EmpenhoEvento {
  id: string;
  tipo_evento: 'REFORCO' | 'ANULACAO_PARCIAL' | 'ANULACAO_TOTAL' | 'CANCELAMENTO_RP';
  numero_ne_evento: string;
  valor_evento: number;
  data_evento: string;
  motivo: string;
}

export interface HierarchicalLevel3Empenho {
  id: string;
  contrato_id: string;
  alteracao_id: string | null;
  numero_nota_empenho: string;
  processo_sei: string;
  chave_siga: string | null;
  tipo_empenho: string;
  data_emissao: string;
  data_referencia_vigencia: string;
  valor_empenhado_inicial: number;
  valor_reforcado: number;
  valor_anulado: number;
  saldo_empenho_liquido: number;
  vinculo_automatico_detectado: string | null;
  eventos: HierarchicalLevel3EmpenhoEvento[];
  liquidacoes: HierarchicalLevel4Liquidacao[];
}

export interface HierarchicalLevel2Periodo {
  id: string;
  contrato_id: string;
  is_inicial: boolean;
  titulo: string;
  tipo: TipoAlteracao | 'CONTRATO_INICIAL';
  processo_sei: string;
  chave_siga_termo: string | null;
  vigencia_inicio: string;
  vigencia_fim: string;
  valor_diferenca: number;
  valor_consolidado_periodo: number;
  empenhos: HierarchicalLevel3Empenho[];
}

export interface FiscalTecnicoGestorInfo {
  gestor?: {
    nome: string;
    id_funcional?: string;
    portaria?: string;
  };
  fiscalTecnico?: {
    nome: string;
    id_funcional?: string;
    portaria?: string;
  };
  fiscaisAdicionais: Array<{
    funcao: string;
    nome: string;
    portaria?: string;
  }>;
}

export interface HierarchicalLevel1Contrato extends VwDashboardExecucaoContratoRow {
  tipo_contrato: TipoContrato;
  tipo_licitacao: TipoLicitacao;
  emergencial: boolean;
  safra_bucket: SafraBucket;
  estagio_aditivo: EstagioAditivo;
  quadrante_risco: QuadranteRisco;
  percentual_tempo_decorrido: number;
  data_ultima_liquidacao: string | null;
  fiscais_info: FiscalTecnicoGestorInfo;
  periodos: HierarchicalLevel2Periodo[];
  total_empenhos_count: number;
  total_liquidacoes_count: number;
}

export interface WaterfallItem {
  id: string;
  rotulo: string;
  tipo: 'ORIGINAL' | 'ADITIVO' | 'APOSTILAMENTO' | 'SUPRESSAO' | 'GLOBAL';
  valor_mudanca: number;
  valor_acumulado: number;
  contratos_afetados_count: number;
}

export interface DashboardBIDataSet {
  contratos: HierarchicalLevel1Contrato[];
  totais: {
    valor_inicial_total: number;
    aditivos_acrescimo_total: number;
    apostilamentos_total: number;
    supressoes_total: number;
    valor_global_total: number;
    valor_empenhado_liquido_total: number;
    valor_reforcado_total: number;
    valor_anulado_total: number;
    valor_liquidado_total: number;
    saldo_a_empenhar_total: number;
    saldo_a_liquidar_total: number;
    total_contratos_ativos: number;
    total_contratos_vencendo_60d: number;
    total_contratos_acefalos: number;
  };
  waterfall: WaterfallItem[];
}

export interface CrossFilterState {
  search: string;
  status: StatusInstrumento[];
  tipoInstrumento: TipoInstrumento[];
  tipoContrato: TipoContrato[];
  safraBucket: SafraBucket[];
  estagioAditivo: EstagioAditivo[];
  quadranteRisco: QuadranteRisco[];
  waterfallEtapa: string[];
  fiscalId: string[];
  apenasAcefalos: boolean;
  apenasVencendo60d: boolean;
}

