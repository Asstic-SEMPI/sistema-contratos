'use server';

import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database.types';
import type {
  DashboardBIDataSet,
  HierarchicalLevel1Contrato,
  HierarchicalLevel2Periodo,
  HierarchicalLevel3Empenho,
  HierarchicalLevel3EmpenhoEvento,
  HierarchicalLevel4Liquidacao,
  FiscalTecnicoGestorInfo,
  SafraBucket,
  EstagioAditivo,
  QuadranteRisco,
  WaterfallItem,
  VwDashboardExecucaoContratoRow,
} from '@/lib/types/bi-analytics.types';
import type { TipoContrato, TipoLicitacao, StatusInstrumento } from '@/lib/types/database.types';

type AlteracaoRow = Database['public']['Tables']['alteracoes_contratuais']['Row'];
type EmpenhoRow = Database['public']['Tables']['financeiro_empenhos']['Row'];
type EventoRow = Database['public']['Tables']['financeiro_empenhos_eventos']['Row'];
type LiquidacaoRow = Database['public']['Tables']['financeiro_liquidacoes']['Row'];
type FiscalRow = Database['public']['Tables']['contrato_fiscais']['Row'];

export async function getDashboardBIData(): Promise<DashboardBIDataSet> {
  const supabase = await createClient();

  // 1. Busca os dados consolidados da View e das tabelas relacionais em paralelo
  const [
    { data: rawVwRows, error: vwErr },
    { data: rawContratosExtras },
    { data: rawAlteracoesRows },
    { data: rawEmpenhosRows },
    { data: rawEventosRows },
    { data: rawLiquidacoesRows },
    { data: rawFiscaisRows },
  ] = await Promise.all([
    supabase.from('vw_dashboard_execucao_contratos' as unknown as 'contratos').select('*'),
    supabase.from('contratos').select('id, tipo_contrato, tipo_licitacao, emergencial'),
    supabase.from('alteracoes_contratuais').select('*').order('created_at', { ascending: true }),
    supabase.from('financeiro_empenhos').select('*').order('data_emissao', { ascending: true }),
    supabase.from('financeiro_empenhos_eventos').select('*').order('data_evento', { ascending: true }),
    supabase.from('financeiro_liquidacoes').select('*').order('data_emissao_nl', { ascending: true }),
    supabase.from('contrato_fiscais').select('*').order('created_at', { ascending: true }),
  ]);

  const vwRows = (rawVwRows as unknown as VwDashboardExecucaoContratoRow[] | null) || [];
  const contratosExtras = rawContratosExtras;
  const alteracoesRows = (rawAlteracoesRows as unknown as AlteracaoRow[] | null) || [];
  const empenhosRows = (rawEmpenhosRows as unknown as EmpenhoRow[] | null) || [];
  const eventosRows = (rawEventosRows as unknown as EventoRow[] | null) || [];
  const liquidacoesRows = (rawLiquidacoesRows as unknown as LiquidacaoRow[] | null) || [];
  const fiscaisRows = (rawFiscaisRows as unknown as FiscalRow[] | null) || [];

  if (vwErr) {
    console.error('Erro ao consultar vw_dashboard_execucao_contratos:', vwErr);
  }

  // Mapa de colunas extras de contratos com fallback seguro
  const extrasMap = new Map<
    string,
    { tipo_contrato: TipoContrato; tipo_licitacao: TipoLicitacao; emergencial: boolean }
  >();
  if (contratosExtras) {
    for (const c of contratosExtras as unknown as Array<{
      id: string;
      tipo_contrato?: TipoContrato;
      tipo_licitacao?: TipoLicitacao;
      emergencial?: boolean;
    }>) {
      extrasMap.set(c.id, {
        tipo_contrato: c.tipo_contrato || 'CONTINUO',
        tipo_licitacao: c.tipo_licitacao || 'PREGAO_ELETRONICO',
        emergencial: Boolean(c.emergencial),
      });
    }
  }

  // Agrupamentos em memória para montagem atômica de 0ms
  const alteracoesPorContrato = new Map<string, AlteracaoRow[]>();
  if (alteracoesRows) {
    for (const a of alteracoesRows) {
      const arr = alteracoesPorContrato.get(a.contrato_id) || [];
      arr.push(a);
      alteracoesPorContrato.set(a.contrato_id, arr);
    }
  }

  const eventosPorEmpenho = new Map<string, HierarchicalLevel3EmpenhoEvento[]>();
  if (eventosRows) {
    for (const ev of eventosRows) {
      const arr = eventosPorEmpenho.get(ev.empenho_original_id) || [];
      arr.push({
        id: ev.id,
        tipo_evento: ev.tipo_evento,
        numero_ne_evento: ev.numero_ne_evento,
        valor_evento: Number(ev.valor_evento) || 0,
        data_evento: ev.data_evento,
        motivo: ev.motivo || '',
      });
      eventosPorEmpenho.set(ev.empenho_original_id, arr);
    }
  }

  const liquidacoesPorEmpenho = new Map<string, HierarchicalLevel4Liquidacao[]>();
  if (liquidacoesRows) {
    for (const lq of liquidacoesRows) {
      const arr = liquidacoesPorEmpenho.get(lq.empenho_id) || [];
      arr.push({
        id: lq.id,
        empenho_id: lq.empenho_id,
        numero_nota_fiscal: lq.numero_nota_fiscal,
        data_emissao_nota_fiscal: lq.data_emissao_nota_fiscal,
        competencia_mes_ano: lq.competencia_mes_ano,
        numero_nota_liquidacao: lq.numero_nota_liquidacao,
        data_emissao_nl: lq.data_emissao_nl,
        valor_liquidado: Number(lq.valor_liquidado) || 0,
        data_pagamento_ob: lq.data_pagamento_ob,
        processo_sei: lq.processo_sei,
      });
      liquidacoesPorEmpenho.set(lq.empenho_id, arr);
    }
  }

  const empenhosPorContrato = new Map<string, EmpenhoRow[]>();
  if (empenhosRows) {
    for (const e of empenhosRows) {
      const arr = empenhosPorContrato.get(e.contrato_id) || [];
      arr.push(e);
      empenhosPorContrato.set(e.contrato_id, arr);
    }
  }

  const fiscaisPorContrato = new Map<string, FiscalRow[]>();
  if (fiscaisRows) {
    for (const f of fiscaisRows) {
      const arr = fiscaisPorContrato.get(f.contrato_id) || [];
      arr.push(f);
      fiscaisPorContrato.set(f.contrato_id, arr);
    }
  }

  const now = new Date();
  const contratos: HierarchicalLevel1Contrato[] = [];

  const rawList = vwRows || [];

  for (const row of rawList) {
    const extra = extrasMap.get(row.contrato_id) || {
      tipo_contrato: 'CONTINUO',
      tipo_licitacao: 'PREGAO_ELETRONICO',
      emergencial: false,
    };

    const diasRestantes = Number(row.dias_restantes_vigencia) || 0;

    // Classificação da Safra de Vencimento
    let safraBucket: SafraBucket = 'REGULAR_MAIOR_120';
    if (diasRestantes <= 30) safraBucket = 'CRITICO_30';
    else if (diasRestantes <= 60) safraBucket = 'ATENCAO_60';
    else if (diasRestantes <= 120) safraBucket = 'PLANEJAMENTO_120';

    // Classificação do Estágio de Aditivos
    const qtdAditivos = Number(row.qtd_aditivos) || 0;
    let estagioAditivo: EstagioAditivo = 'CONTRATO_INICIAL';
    if (qtdAditivos === 1) estagioAditivo = 'PRIMEIRO_ADITIVO';
    else if (qtdAditivos === 2) estagioAditivo = 'SEGUNDO_ADITIVO';
    else if (qtdAditivos >= 3) estagioAditivo = 'TERCEIRO_MAIS_ADITIVO';

    // Cálculo do Percentual de Tempo Decorrido
    const dtInicio = new Date(row.data_vigencia_inicio_original);
    const dtFim = new Date(row.data_vigencia_fim_atual);
    const tempoTotalMs = Math.max(1, dtFim.getTime() - dtInicio.getTime());
    const tempoPassadoMs = Math.max(0, now.getTime() - dtInicio.getTime());
    const percentualTempo = Math.min(100, Math.max(0, Math.round((tempoPassadoMs / tempoTotalMs) * 100)));

    // Quadrante de Risco Operacional
    const percLiquidadoEmpenhado = Number(row.perc_liquidado_sobre_empenhado) || 0;
    let quadranteRisco: QuadranteRisco = 'EXECUCAO_REGULAR';
    if (diasRestantes <= 30 && row.status === 'VIGENTE') {
      quadranteRisco = 'CRITICO_VENCENDO';
    } else if (percLiquidadoEmpenhado >= 80 && percentualTempo < 50) {
      quadranteRisco = 'RISCO_DESABASTECIMENTO';
    } else if (percentualTempo > 75 && percLiquidadoEmpenhado < 30) {
      quadranteRisco = 'BAIXA_EXECUCAO';
    }

    // Fiscais
    const fiscList = fiscaisPorContrato.get(row.contrato_id) || [];
    const gestorRow = fiscList.find((f) => f.ativo && f.funcao === 'GESTOR');
    const fiscalTecnicoRow = fiscList.find((f) => f.ativo && f.funcao === 'FISCAL_TECNICO');
    const fiscaisInfo: FiscalTecnicoGestorInfo = {
      gestor: gestorRow
        ? {
            nome: gestorRow.nome || 'Gestor Designado',
            id_funcional: gestorRow.id_funcional || '',
            portaria: gestorRow.portaria_designacao || '',
          }
        : undefined,
      fiscalTecnico: fiscalTecnicoRow
        ? {
            nome: fiscalTecnicoRow.nome || 'Fiscal Técnico',
            id_funcional: fiscalTecnicoRow.id_funcional || '',
            portaria: fiscalTecnicoRow.portaria_designacao || '',
          }
        : undefined,
      fiscaisAdicionais: fiscList
        .filter((f) => f.ativo && f.funcao !== 'GESTOR' && f.funcao !== 'FISCAL_TECNICO')
        .map((f) => ({
          funcao: f.funcao,
          nome: f.nome || 'Servidor',
          portaria: f.portaria_designacao || undefined,
        })),
    };

    // Montagem da Hierarquia em 4 Níveis (Contrato ➔ Períodos ➔ Empenhos ➔ Liquidações)
    const contratoEmpenhos = empenhosPorContrato.get(row.contrato_id) || [];
    const contratoAlteracoes = alteracoesPorContrato.get(row.contrato_id) || [];

    // Mapeador de Empenhos
    const mapEmpenho = (e: (typeof contratoEmpenhos)[0]): HierarchicalLevel3Empenho => ({
      id: e.id,
      contrato_id: e.contrato_id,
      alteracao_id: e.alteracao_id,
      numero_nota_empenho: e.numero_nota_empenho,
      processo_sei: e.processo_sei,
      chave_siga: e.chave_siga,
      tipo_empenho: e.tipo_empenho,
      data_emissao: e.data_emissao,
      data_referencia_vigencia: e.data_referencia_vigencia,
      valor_empenhado_inicial: Number(e.valor_empenhado_inicial) || 0,
      valor_reforcado: Number(e.valor_reforcado) || 0,
      valor_anulado: Number(e.valor_anulado) || 0,
      saldo_empenho_liquido: Number(e.saldo_empenho_liquido) || 0,
      vinculo_automatico_detectado: e.vinculo_automatico_detectado,
      eventos: eventosPorEmpenho.get(e.id) || [],
      liquidacoes: liquidacoesPorEmpenho.get(e.id) || [],
    });

    const periodos: HierarchicalLevel2Periodo[] = [];

    // Período 1: Contrato Inicial
    const empenhosIniciais = contratoEmpenhos.filter((e) => !e.alteracao_id).map(mapEmpenho);
    periodos.push({
      id: `${row.contrato_id}-inicial`,
      contrato_id: row.contrato_id,
      is_inicial: true,
      titulo: 'Contrato Inicial',
      tipo: 'CONTRATO_INICIAL',
      processo_sei: row.processo_sei,
      chave_siga_termo: row.chave_siga_contrato,
      vigencia_inicio: row.data_vigencia_inicio_original,
      vigencia_fim: row.data_vigencia_fim_original,
      valor_diferenca: 0,
      valor_consolidado_periodo: Number(row.valor_inicial) || 0,
      empenhos: empenhosIniciais,
    });

    // Períodos seguintes: Termos Aditivos e Apostilamentos
    for (const alt of contratoAlteracoes) {
      const empenhosDesteTermo = contratoEmpenhos.filter((e) => e.alteracao_id === alt.id).map(mapEmpenho);
      periodos.push({
        id: alt.id,
        contrato_id: row.contrato_id,
        is_inicial: false,
        titulo: alt.procedimento || `Termo (${alt.tipo})`,
        tipo: alt.tipo,
        processo_sei: alt.processo_sei || row.processo_sei,
        chave_siga_termo: alt.chave_siga_termo,
        vigencia_inicio: alt.vigencia_termo_inicio || row.data_vigencia_inicio_original,
        vigencia_fim: alt.vigencia_termo_fim || row.data_vigencia_fim_atual,
        valor_diferenca: Number(alt.valor_diferenca) || 0,
        valor_consolidado_periodo: Number(alt.valor_diferenca) || 0,
        empenhos: empenhosDesteTermo,
      });
    }

    // Busca data da última liquidação de todas as NFs do contrato
    let dataUltimaLiq: string | null = null;
    let totalLiqsCount = 0;
    for (const p of periodos) {
      for (const emp of p.empenhos) {
        totalLiqsCount += emp.liquidacoes.length;
        for (const lq of emp.liquidacoes) {
          const dt = lq.data_pagamento_ob || lq.data_emissao_nl;
          if (!dataUltimaLiq || (dt && dt > dataUltimaLiq)) {
            dataUltimaLiq = dt;
          }
        }
      }
    }

    // Cálculo do Percentual Acumulado de Acréscimos que consome o Teto Legal do Art. 125
    // Em contratos contínuos, renovações de prazo (Art. 106/107) NÃO consomem o teto de 25%.
    const isContinuo = extra.tipo_contrato === 'CONTINUO';
    const valorInicialNum = Number(row.valor_inicial) || 0;

    const acrescimoQueConsomeTetoTotal = contratoAlteracoes.reduce((acc, alt) => {
      const valorDif = Number(alt.valor_diferenca) || 0;
      if (isContinuo) {
        if (alt.tipo === 'ADITIVO_PRAZO') {
          return acc;
        }
        if (alt.tipo === 'ADITIVO_MISTO') {
          const acrescimoQualitativo = Math.max(0, valorDif - valorInicialNum);
          return acc + acrescimoQualitativo;
        }
        if (alt.tipo === 'ADITIVO_VALOR') {
          return acc + valorDif;
        }
        return acc;
      } else {
        if (alt.tipo === 'ADITIVO_VALOR' || alt.tipo === 'ADITIVO_MISTO') {
          return acc + valorDif;
        }
        return acc;
      }
    }, 0);

    const percentualAcrescimoReal =
      valorInicialNum > 0
        ? (acrescimoQueConsomeTetoTotal / valorInicialNum) * 100
        : 0;

    contratos.push({
      ...row,
      percentual_acrescimo_acumulado: percentualAcrescimoReal,
      tipo_contrato: extra.tipo_contrato,
      tipo_licitacao: extra.tipo_licitacao,
      emergencial: extra.emergencial,
      safra_bucket: safraBucket,
      estagio_aditivo: estagioAditivo,
      quadrante_risco: quadranteRisco,
      percentual_tempo_decorrido: percentualTempo,
      data_ultima_liquidacao: dataUltimaLiq,
      fiscais_info: fiscaisInfo,
      periodos,
      total_empenhos_count: contratoEmpenhos.length,
      total_liquidacoes_count: totalLiqsCount,
    });
  }

  // 2. Cálculo dos Totais Macroeconômicos e Indicadores
  let valorInicialTotal = 0;
  let valorGlobalTotal = 0;
  let valorEmpenhadoLiquidoTotal = 0;
  let valorLiquidadoTotal = 0;
  let saldoAEmpenharTotal = 0;
  let saldoALiquidarTotal = 0;
  let totalAtivos = 0;
  let totalVencendo60d = 0;
  let totalAcefalos = 0;

  for (const c of contratos) {
    if (c.status === 'VIGENTE') {
      totalAtivos++;
      if (c.dias_restantes_vigencia <= 60) totalVencendo60d++;
      if (!c.comissao_fiscalizacao_completa) totalAcefalos++;
    }
    valorInicialTotal += Number(c.valor_inicial) || 0;
    valorGlobalTotal += Number(c.valor_global_atual) || 0;
    valorEmpenhadoLiquidoTotal += Number(c.valor_empenhado_liquido) || 0;
    valorLiquidadoTotal += Number(c.valor_liquidado) || 0;
    saldoAEmpenharTotal += Number(c.saldo_a_empenhar) || 0;
    saldoALiquidarTotal += Number(c.saldo_empenhado_a_liquidar) || 0;
  }

  // 3. Montagem da Cascata (Waterfall) Orçamentária
  let aditivosAcrescimoTotal = 0;
  let apostilamentosTotal = 0;
  let supressoesTotal = 0;
  let aditivosCount = 0;
  let apostilamentosCount = 0;
  let supressoesCount = 0;

  if (alteracoesRows) {
    for (const alt of alteracoesRows) {
      const val = Number(alt.valor_diferenca) || 0;
      if (alt.tipo === 'APOSTILAMENTO') {
        apostilamentosTotal += val;
        apostilamentosCount++;
      } else if (val >= 0) {
        aditivosAcrescimoTotal += val;
        aditivosCount++;
      } else {
        supressoesTotal += Math.abs(val);
        supressoesCount++;
      }
    }
  }

  const waterfall: WaterfallItem[] = [
    {
      id: 'ORIGINAL',
      rotulo: 'Valor Original',
      tipo: 'ORIGINAL',
      valor_mudanca: valorInicialTotal,
      valor_acumulado: valorInicialTotal,
      contratos_afetados_count: contratos.length,
    },
    {
      id: 'ADITIVOS',
      rotulo: '(+) Termos Aditivos',
      tipo: 'ADITIVO',
      valor_mudanca: aditivosAcrescimoTotal,
      valor_acumulado: valorInicialTotal + aditivosAcrescimoTotal,
      contratos_afetados_count: aditivosCount,
    },
    {
      id: 'APOSTILAMENTOS',
      rotulo: '(+) Apostilamentos / Reajustes',
      tipo: 'APOSTILAMENTO',
      valor_mudanca: apostilamentosTotal,
      valor_acumulado: valorInicialTotal + aditivosAcrescimoTotal + apostilamentosTotal,
      contratos_afetados_count: apostilamentosCount,
    },
    {
      id: 'SUPRESSOES',
      rotulo: '(-) Supressões',
      tipo: 'SUPRESSAO',
      valor_mudanca: -supressoesTotal,
      valor_acumulado: valorInicialTotal + aditivosAcrescimoTotal + apostilamentosTotal - supressoesTotal,
      contratos_afetados_count: supressoesCount,
    },
    {
      id: 'GLOBAL',
      rotulo: '(=) Valor Global Atualizado',
      tipo: 'GLOBAL',
      valor_mudanca: valorGlobalTotal,
      valor_acumulado: valorGlobalTotal,
      contratos_afetados_count: contratos.length,
    },
  ];

  return {
    contratos,
    totais: {
      valor_inicial_total: valorInicialTotal,
      aditivos_acrescimo_total: aditivosAcrescimoTotal,
      apostilamentos_total: apostilamentosTotal,
      supressoes_total: supressoesTotal,
      valor_global_total: valorGlobalTotal,
      valor_empenhado_liquido_total: valorEmpenhadoLiquidoTotal,
      valor_reforcado_total: 0,
      valor_anulado_total: 0,
      valor_liquidado_total: valorLiquidadoTotal,
      saldo_a_empenhar_total: saldoAEmpenharTotal,
      saldo_a_liquidar_total: saldoALiquidarTotal,
      total_contratos_ativos: totalAtivos,
      total_contratos_vencendo_60d: totalVencendo60d,
      total_contratos_acefalos: totalAcefalos,
    },
    waterfall,
  };
}
