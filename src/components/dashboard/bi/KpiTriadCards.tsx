'use client';

import React from 'react';
import { useCrossFilter } from './CrossFilterContext';
import { MoneyCell } from '@/components/ui-ledger/MoneyCell';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  ShieldAlert,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  Info,
} from 'lucide-react';

export function KpiTriadCards() {
  const { totaisFiltrados, totaisGerais, isAnyFilterActive, filters, toggleFilter } = useCrossFilter();

  const valorAditivosApostilamentos =
    totaisFiltrados.valor_global_total - totaisFiltrados.valor_inicial_total;

  const percentualGlobalDoTotal =
    totaisGerais.valor_global_total > 0
      ? (totaisFiltrados.valor_global_total / totaisGerais.valor_global_total) * 100
      : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Valor Global Atualizado (com Decomposição Inicial vs Aditivos) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
              Valor Global Atualizado
            </span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-slate-900 tracking-tight">
            <MoneyCell value={totaisFiltrados.valor_global_total} size="xl" />
          </div>

          {isAnyFilterActive && (
            <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Universo Total:</span>
              <MoneyCell value={totaisGerais.valor_global_total} size="xs" />
              <span className="text-sempi-plum font-semibold">
                ({percentualGlobalDoTotal.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>

        {/* Sub-métricas: Decomposição Orçamentária */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px]">Valor Inicial Original:</span>
            <span className="font-mono tabular-nums font-medium text-slate-800">
              <MoneyCell value={totaisFiltrados.valor_inicial_total} size="xs" />
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px]">Aditivos / Apostilamentos:</span>
            <span
              className={`font-mono tabular-nums font-semibold ${
                valorAditivosApostilamentos >= 0 ? 'text-teal-700' : 'text-sempi-carmine'
              }`}
            >
              {valorAditivosApostilamentos >= 0 ? '+' : ''}
              <MoneyCell value={valorAditivosApostilamentos} size="xs" />
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Valor Empenhado Líquido (com % Global e Saldo a Empenhar) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-teal-800">
              Empenhado Líquido
            </span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-slate-900 tracking-tight">
            <MoneyCell value={totaisFiltrados.valor_empenhado_liquido_total} size="xl" />
          </div>

          {/* Barra de Progresso % sobre Global */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
              <span className="text-slate-500">% do Valor Global:</span>
              <span className="font-bold text-teal-800 tabular-nums">
                {totaisFiltrados.perc_empenhado_global.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-700 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, totaisFiltrados.perc_empenhado_global))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Sub-métrica: Saldo Contratual a Empenhar */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px]">Saldo a Empenhar:</span>
            <span className="font-mono tabular-nums font-semibold text-slate-800">
              <MoneyCell value={totaisFiltrados.saldo_a_empenhar_total} size="xs" />
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Margem restante para emissão de novas NEs
          </div>
        </div>
      </div>

      {/* Card 3: Valor Liquidado Real (com % Empenhado e Saldo a Liquidar / Passivo RP) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-sempi-plum">
              Liquidado Real (NFs)
            </span>
            <div className="p-2 bg-sempi-plum/10 text-sempi-plum rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>

          <div className="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-slate-900 tracking-tight">
            <MoneyCell value={totaisFiltrados.valor_liquidado_total} size="xl" />
          </div>

          {/* Barra de Progresso % sobre Empenhado */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
              <span className="text-slate-500">% do Empenhado:</span>
              <span className="font-bold text-sempi-plum tabular-nums">
                {totaisFiltrados.perc_liquidado_empenhado.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sempi-plum rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, totaisFiltrados.perc_liquidado_empenhado))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Sub-métrica: Saldo a Liquidar / Passivo de Restos a Pagar */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px]">Saldo a Liquidar (Passivo):</span>
            <span className="font-mono tabular-nums font-semibold text-slate-800">
              <MoneyCell value={totaisFiltrados.saldo_a_liquidar_total} size="xs" />
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Compromissos empenhados pendentes de atesto fiscal
          </div>
        </div>
      </div>

      {/* Card 4: Radar de Vigência & Conformidade (Contratos Ativos + Alertas Interativos) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500">
              Vigência & Conformidade
            </span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <div className="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-slate-900 tracking-tight">
              {totaisFiltrados.total_contratos_ativos}
            </div>
            <span className="text-xs text-slate-500">contratos ativos</span>
          </div>

          <div className="text-[11px] text-slate-400 mt-1">
            Total selecionado: {totaisFiltrados.contratos_count} instrumentos
          </div>
        </div>

        {/* Badges Interativos de Risco (Clique para Filtrar) */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
          {/* Alerta 1: Vencendo em <= 60 dias */}
          <button
            onClick={() => toggleFilter('apenasVencendo60d', true)}
            className={`p-2 rounded-lg border text-left transition-all ${
              filters.apenasVencendo60d
                ? 'bg-amber-100 border-amber-400 text-amber-900 ring-1 ring-amber-400'
                : 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-100/70 text-amber-800'
            }`}
            title="Clique para filtrar contratos vencendo em ≤ 60 dias"
          >
            <div className="flex items-center justify-between mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-mono font-bold tabular-nums">
                {totaisFiltrados.total_contratos_vencendo_60d}
              </span>
            </div>
            <div className="text-[10px] font-semibold leading-tight">
              ≤ 60 dias
            </div>
          </button>

          {/* Alerta 2: Contratos Acéfalos */}
          <button
            onClick={() => toggleFilter('apenasAcefalos', true)}
            className={`p-2 rounded-lg border text-left transition-all ${
              filters.apenasAcefalos
                ? 'bg-red-100 border-red-400 text-red-900 ring-1 ring-red-400'
                : 'bg-red-50/60 border-red-200/80 hover:bg-red-100/70 text-red-800'
            }`}
            title="Clique para filtrar contratos acéfalos (sem comissão completa)"
          >
            <div className="flex items-center justify-between mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span className="text-xs font-mono font-bold tabular-nums">
                {totaisFiltrados.total_contratos_acefalos}
              </span>
            </div>
            <div className="text-[10px] font-semibold leading-tight">
              Acéfalos
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
