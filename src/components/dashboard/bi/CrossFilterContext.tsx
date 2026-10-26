'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import type {
  DashboardBIDataSet,
  HierarchicalLevel1Contrato,
  CrossFilterState,
  SafraBucket,
  EstagioAditivo,
  QuadranteRisco,
} from '@/lib/types/bi-analytics.types';
import type { StatusInstrumento, TipoInstrumento, TipoContrato } from '@/lib/types/database.types';

const INITIAL_FILTERS: CrossFilterState = {
  search: '',
  status: [],
  tipoInstrumento: [],
  tipoContrato: [],
  safraBucket: [],
  estagioAditivo: [],
  quadranteRisco: [],
  waterfallEtapa: [],
  fiscalId: [],
  apenasAcefalos: false,
  apenasVencendo60d: false,
};

export interface ActiveFilterChip {
  key: keyof CrossFilterState;
  itemValue?: string;
  label: string;
  displayValue: string;
}

interface CrossFilterContextValue {
  filters: CrossFilterState;
  dataset: DashboardBIDataSet;
  filteredContratos: HierarchicalLevel1Contrato[];
  totaisGerais: DashboardBIDataSet['totais'];
  totaisFiltrados: {
    valor_inicial_total: number;
    valor_global_total: number;
    valor_empenhado_liquido_total: number;
    valor_liquidado_total: number;
    saldo_a_empenhar_total: number;
    saldo_a_liquidar_total: number;
    contratos_count: number;
    total_contratos_ativos: number;
    total_contratos_vencendo_60d: number;
    total_contratos_acefalos: number;
    perc_empenhado_global: number;
    perc_liquidado_empenhado: number;
    perc_liquidado_global: number;
  };
  activeFiltersCount: number;
  activeFilterChips: ActiveFilterChip[];
  isAnyFilterActive: boolean;
  setFilter: <K extends keyof CrossFilterState>(key: K, value: CrossFilterState[K]) => void;
  toggleFilter: (key: keyof CrossFilterState, value: any) => void;
  removeFilterItem: (key: keyof CrossFilterState, itemValue?: string) => void;
  clearFilterDimension: (key: keyof CrossFilterState) => void;
  clearAllFilters: () => void;
}

const CrossFilterContext = createContext<CrossFilterContextValue | null>(null);

export function CrossFilterProvider({
  children,
  dataset,
}: {
  children: React.ReactNode;
  dataset: DashboardBIDataSet;
}) {
  const [filters, setFilters] = useState<CrossFilterState>(INITIAL_FILTERS);

  const setFilter = useCallback(<K extends keyof CrossFilterState>(key: K, value: CrossFilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Alterna seleção múltipla em arrays ou toggle em booleans
  const toggleFilter = useCallback((key: keyof CrossFilterState, value: any) => {
    setFilters((prev) => {
      const current = prev[key];
      if (typeof current === 'boolean') {
        return { ...prev, [key]: !current };
      }
      if (Array.isArray(current)) {
        const strVal = String(value);
        const exists = current.some((v) => String(v) === strVal);
        const nextArray = exists
          ? current.filter((v) => String(v) !== strVal)
          : [...current, value];
        return { ...prev, [key]: nextArray };
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const removeFilterItem = useCallback((key: keyof CrossFilterState, itemValue?: string) => {
    setFilters((prev) => {
      const current = prev[key];
      if (typeof current === 'boolean') {
        return { ...prev, [key]: false };
      }
      if (key === 'search') {
        return { ...prev, search: '' };
      }
      if (Array.isArray(current) && itemValue !== undefined) {
        return { ...prev, [key]: current.filter((v) => String(v) !== itemValue) };
      }
      return { ...prev, [key]: INITIAL_FILTERS[key] };
    });
  }, []);

  const clearFilterDimension = useCallback((key: keyof CrossFilterState) => {
    setFilters((prev) => ({ ...prev, [key]: INITIAL_FILTERS[key] }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  // Tecla de atalho global "Esc" para limpar todos os filtros
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearAllFilters();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearAllFilters]);

  // Motor de filtragem bidirecional com suporte a múltipla seleção (0ms via useMemo)
  const filteredContratos = useMemo(() => {
    const list = dataset.contratos;
    const {
      search,
      status,
      tipoInstrumento,
      tipoContrato,
      safraBucket,
      estagioAditivo,
      quadranteRisco,
      waterfallEtapa,
      fiscalId,
      apenasAcefalos,
      apenasVencendo60d,
    } = filters;

    const term = search.trim().toLowerCase();

    return list.filter((c) => {
      // 1. Busca textual
      if (term) {
        const matchNum = c.numero_contrato?.toLowerCase().includes(term);
        const matchSei = c.processo_sei?.toLowerCase().includes(term);
        const matchSiga = c.chave_siga_contrato?.toLowerCase().includes(term);
        const matchRazao = c.contratada_razao_social?.toLowerCase().includes(term);
        const matchCnpj = c.contratada_cnpj?.includes(term);
        const matchObj = c.objeto?.toLowerCase().includes(term);
        if (!matchNum && !matchSei && !matchSiga && !matchRazao && !matchCnpj && !matchObj) {
          return false;
        }
      }

      // 2. Status (Múltipla Seleção)
      if (status.length > 0 && !status.includes(c.status)) {
        return false;
      }

      // 3. Tipo de Instrumento (Múltipla Seleção)
      if (tipoInstrumento.length > 0 && !tipoInstrumento.includes(c.tipo_formalizacao)) {
        return false;
      }

      // 4. Tipo de Contrato - Contínuo / Escopo (Múltipla Seleção)
      if (tipoContrato.length > 0 && !tipoContrato.includes(c.tipo_contrato)) {
        return false;
      }

      // 5. Safra de Vencimento (Múltipla Seleção)
      if (safraBucket.length > 0 && !safraBucket.includes(c.safra_bucket)) {
        return false;
      }

      // 6. Estágio de Aditivos (Múltipla Seleção)
      if (estagioAditivo.length > 0 && !estagioAditivo.includes(c.estagio_aditivo)) {
        return false;
      }

      // 7. Quadrante de Risco (Múltipla Seleção)
      if (quadranteRisco.length > 0 && !quadranteRisco.includes(c.quadrante_risco)) {
        return false;
      }

      // 8. Etapas do Waterfall (Múltipla Seleção)
      if (waterfallEtapa.length > 0) {
        const matchAnyStage = waterfallEtapa.some((etapa) => {
          if (etapa === 'ADITIVOS') return c.qtd_aditivos > 0;
          if (etapa === 'APOSTILAMENTOS') return c.qtd_apostilamentos > 0;
          if (etapa === 'SUPRESSOES') return c.periodos.some((p) => p.valor_diferenca < 0);
          return true;
        });
        if (!matchAnyStage) return false;
      }

      // 9. Fiscais / Gestores (Múltipla Seleção)
      if (fiscalId.length > 0) {
        const matchFiscal = fiscalId.some((fNome) => {
          const isGestor = c.fiscais_info.gestor?.nome === fNome;
          const isFiscal = c.fiscais_info.fiscalTecnico?.nome === fNome;
          const isAdicional = c.fiscais_info.fiscaisAdicionais.some((f) => f.nome === fNome);
          return isGestor || isFiscal || isAdicional;
        });
        if (!matchFiscal) return false;
      }

      // 10. Alertas Rápidos de Auditoria
      if (apenasAcefalos && c.comissao_fiscalizacao_completa) {
        return false;
      }
      if (apenasVencendo60d && (c.dias_restantes_vigencia > 60 || c.status !== 'VIGENTE')) {
        return false;
      }

      return true;
    });
  }, [dataset.contratos, filters]);

  // Recálculo instantâneo dos totais para a seleção ativa
  const totaisFiltrados = useMemo(() => {
    let valorInicial = 0;
    let valorGlobal = 0;
    let valorEmpenhadoLiquido = 0;
    let valorLiquidado = 0;
    let saldoAEmpenhar = 0;
    let saldoALiquidar = 0;
    let totalAtivos = 0;
    let totalVencendo60d = 0;
    let totalAcefalos = 0;

    for (const c of filteredContratos) {
      if (c.status === 'VIGENTE') {
        totalAtivos++;
        if (c.dias_restantes_vigencia <= 60) totalVencendo60d++;
        if (!c.comissao_fiscalizacao_completa) totalAcefalos++;
      }
      valorInicial += Number(c.valor_inicial) || 0;
      valorGlobal += Number(c.valor_global_atual) || 0;
      valorEmpenhadoLiquido += Number(c.valor_empenhado_liquido) || 0;
      valorLiquidado += Number(c.valor_liquidado) || 0;
      saldoAEmpenhar += Number(c.saldo_a_empenhar) || 0;
      saldoALiquidar += Number(c.saldo_empenhado_a_liquidar) || 0;
    }

    const percEmpenhadoGlobal = valorGlobal > 0 ? (valorEmpenhadoLiquido / valorGlobal) * 100 : 0;
    const percLiquidadoEmpenhado =
      valorEmpenhadoLiquido > 0 ? (valorLiquidado / valorEmpenhadoLiquido) * 100 : 0;
    const percLiquidadoGlobal = valorGlobal > 0 ? (valorLiquidado / valorGlobal) * 100 : 0;

    return {
      valor_inicial_total: valorInicial,
      valor_global_total: valorGlobal,
      valor_empenhado_liquido_total: valorEmpenhadoLiquido,
      valor_liquidado_total: valorLiquidado,
      saldo_a_empenhar_total: saldoAEmpenhar,
      saldo_a_liquidar_total: saldoALiquidar,
      contratos_count: filteredContratos.length,
      total_contratos_ativos: totalAtivos,
      total_contratos_vencendo_60d: totalVencendo60d,
      total_contratos_acefalos: totalAcefalos,
      perc_empenhado_global: percEmpenhadoGlobal,
      perc_liquidado_empenhado: percLiquidadoEmpenhado,
      perc_liquidado_global: percLiquidadoGlobal,
    };
  }, [filteredContratos]);

  // Lista de Chips de Filtros Ativos com granularidade individual
  const activeFilterChips = useMemo(() => {
    const chips: ActiveFilterChip[] = [];

    if (filters.search) {
      chips.push({ key: 'search', label: 'Busca', displayValue: `"${filters.search}"` });
    }

    for (const s of filters.status) {
      chips.push({ key: 'status', itemValue: s, label: 'Status', displayValue: s });
    }

    for (const inst of filters.tipoInstrumento) {
      chips.push({
        key: 'tipoInstrumento',
        itemValue: inst,
        label: 'Instrumento',
        displayValue: inst === 'CONTRATO_FORMAL' ? 'Contrato Formal' : 'Art. 95 (NE)',
      });
    }

    for (const tc of filters.tipoContrato) {
      chips.push({
        key: 'tipoContrato',
        itemValue: tc,
        label: 'Tipo',
        displayValue: tc === 'CONTINUO' ? 'Contínuo' : 'Escopo',
      });
    }

    const mapSafra: Record<SafraBucket, string> = {
      CRITICO_30: '< 30d (Crítico)',
      ATENCAO_60: '31–60d (Atenção)',
      PLANEJAMENTO_120: '61–120d (Planejamento)',
      REGULAR_MAIOR_120: '> 120d (Regular)',
    };
    for (const sb of filters.safraBucket) {
      chips.push({
        key: 'safraBucket',
        itemValue: sb,
        label: 'Safra',
        displayValue: mapSafra[sb] || sb,
      });
    }

    const mapEstagio: Record<EstagioAditivo, string> = {
      CONTRATO_INICIAL: 'Inicial',
      PRIMEIRO_ADITIVO: '1º Aditivo',
      SEGUNDO_ADITIVO: '2º Aditivo',
      TERCEIRO_MAIS_ADITIVO: '3º+ Aditivo',
    };
    for (const ea of filters.estagioAditivo) {
      chips.push({
        key: 'estagioAditivo',
        itemValue: ea,
        label: 'Estágio',
        displayValue: mapEstagio[ea] || ea,
      });
    }

    const mapRisco: Record<QuadranteRisco, string> = {
      EXECUCAO_REGULAR: 'Execução Regular',
      RISCO_DESABASTECIMENTO: 'Risco Desabastecimento',
      BAIXA_EXECUCAO: 'Baixa Execução',
      CRITICO_VENCENDO: 'Crítico Vencendo',
    };
    for (const qr of filters.quadranteRisco) {
      chips.push({
        key: 'quadranteRisco',
        itemValue: qr,
        label: 'Risco',
        displayValue: mapRisco[qr] || qr,
      });
    }

    for (const we of filters.waterfallEtapa) {
      chips.push({
        key: 'waterfallEtapa',
        itemValue: we,
        label: 'Cascata',
        displayValue: we,
      });
    }

    for (const fid of filters.fiscalId) {
      chips.push({
        key: 'fiscalId',
        itemValue: fid,
        label: 'Fiscal',
        displayValue: fid,
      });
    }

    if (filters.apenasAcefalos) {
      chips.push({ key: 'apenasAcefalos', label: 'Auditoria', displayValue: 'Apenas Acéfalos' });
    }
    if (filters.apenasVencendo60d) {
      chips.push({
        key: 'apenasVencendo60d',
        label: 'Auditoria',
        displayValue: 'Vencendo ≤ 60d',
      });
    }

    return chips;
  }, [filters]);

  const activeFiltersCount = activeFilterChips.length;
  const isAnyFilterActive = activeFiltersCount > 0;

  return (
    <CrossFilterContext.Provider
      value={{
        filters,
        dataset,
        filteredContratos,
        totaisGerais: dataset.totais,
        totaisFiltrados,
        activeFiltersCount,
        activeFilterChips,
        isAnyFilterActive,
        setFilter,
        toggleFilter,
        removeFilterItem,
        clearFilterDimension,
        clearAllFilters,
      }}
    >
      {children}
    </CrossFilterContext.Provider>
  );
}

export function useCrossFilter() {
  const context = useContext(CrossFilterContext);
  if (!context) {
    throw new Error('useCrossFilter deve ser utilizado dentro de um <CrossFilterProvider>');
  }
  return context;
}
