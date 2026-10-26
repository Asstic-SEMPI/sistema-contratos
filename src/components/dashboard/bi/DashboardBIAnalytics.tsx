'use client';

import React from 'react';
import type { DashboardBIDataSet } from '@/lib/types/bi-analytics.types';
import { CrossFilterProvider } from './CrossFilterContext';
import { SlicerBar } from './SlicerBar';
import { KpiTriadCards } from './KpiTriadCards';
import { SafraVencimentosChart } from './SafraVencimentosChart';
import { WaterfallAlteracoesChart } from './WaterfallAlteracoesChart';
import { MatrizRiscoQuadrantes } from './MatrizRiscoQuadrantes';
import { MatrizHierarquicaContratos } from './MatrizHierarquicaContratos';
import { BarChart2, ShieldCheck, Sparkles } from 'lucide-react';

export function DashboardBIAnalytics({ dataset }: { dataset: DashboardBIDataSet }) {
  return (
    <CrossFilterProvider dataset={dataset}>
      <div className="space-y-6">
        {/* Título de Dossiê Editorial Swiss Ledger */}
        <div className="border-b border-slate-200/80 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500">
              <span>Painel Executivo de BI</span>
              <span>/</span>
              <span className="text-sempi-plum font-semibold">SEMPI-RJ</span>
              <span>/</span>
              <span className="text-teal-700 font-medium">Power BI Analytics Engine</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-md text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
              <span>Cross-Filtering Bidirecional Ativo</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Execução Contratual, Vigência & Auditoria Financeira
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Análise bidirecional integrada: Vigência e Aditivos cruzados com a Tríade Orçamentária (Global, Empenhado e Liquidado).
          </p>
        </div>

        {/* Slicer Bar (Segmentação Rápida, Omnibox e Chips de Filtros) */}
        <SlicerBar />

        {/* Visual 1: Tríade de Execução com Sub-Métricas (Cards Modernos) */}
        <KpiTriadCards />

        {/* Grid Intermediário: Safra de Vencimentos & Waterfall Orçamentário */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Visual 2: Safra de Vencimentos & Estágio de Aditivos */}
          <SafraVencimentosChart />

          {/* Visual 3: Cascata Orçamentária (Waterfall de Alterações) */}
          <WaterfallAlteracoesChart />
        </div>

        {/* Visual 4: Matriz de Risco Operacional Cruzado (Ritmo Vigência vs Execução) */}
        <MatrizRiscoQuadrantes />

        {/* Visual 5: Matriz Hierárquica em 4 Níveis com Triple Bullet Chart e Totais Dinâmicos */}
        <MatrizHierarquicaContratos />
      </div>
    </CrossFilterProvider>
  );
}
