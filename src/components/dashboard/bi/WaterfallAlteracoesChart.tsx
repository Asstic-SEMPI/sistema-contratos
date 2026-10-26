'use client';

import React, { useMemo } from 'react';
import { useCrossFilter } from './CrossFilterContext';
import { MoneyCell } from '@/components/ui-ledger/MoneyCell';
import { BarChart3, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

export function WaterfallAlteracoesChart() {
  const { dataset, filteredContratos, filters, toggleFilter } = useCrossFilter();

  // Calcula valores dinâmicos da cascata para a seleção ativa
  const waterfallData = useMemo(() => {
    let valorOriginal = 0;
    let aditivosAcrescimo = 0;
    let apostilamentos = 0;
    let supressoes = 0;
    let valorGlobal = 0;

    let aditivosCount = 0;
    let apostilamentosCount = 0;
    let supressoesCount = 0;

    for (const c of filteredContratos) {
      valorOriginal += Number(c.valor_inicial) || 0;
      valorGlobal += Number(c.valor_global_atual) || 0;

      let temAditivo = false;
      let temApost = false;
      let temSupressao = false;

      for (const p of c.periodos) {
        if (!p.is_inicial) {
          const diff = Number(p.valor_diferenca) || 0;
          if (p.tipo === 'APOSTILAMENTO') {
            apostilamentos += diff;
            temApost = true;
          } else if (diff >= 0) {
            aditivosAcrescimo += diff;
            temAditivo = true;
          } else {
            supressoes += Math.abs(diff);
            temSupressao = true;
          }
        }
      }

      if (temAditivo) aditivosCount++;
      if (temApost) apostilamentosCount++;
      if (temSupressao) supressoesCount++;
    }

    const steps = [
      {
        id: 'ORIGINAL',
        rotulo: 'Valor Original',
        tipo: 'BASE',
        valorMudanca: valorOriginal,
        inicioY: 0,
        fimY: valorOriginal,
        corBarra: 'bg-slate-700 text-white',
        corBadge: 'bg-slate-100 text-slate-700',
        contratosCount: filteredContratos.length,
        isClickable: false,
      },
      {
        id: 'ADITIVOS',
        rotulo: '(+) Termos Aditivos',
        tipo: 'ACRESCIMO',
        valorMudanca: aditivosAcrescimo,
        inicioY: valorOriginal,
        fimY: valorOriginal + aditivosAcrescimo,
        corBarra: 'bg-teal-700 text-white',
        corBadge: 'bg-teal-50 text-teal-800 border-teal-200',
        contratosCount: aditivosCount,
        isClickable: true,
      },
      {
        id: 'APOSTILAMENTOS',
        rotulo: '(+) Apostilamentos',
        tipo: 'ACRESCIMO',
        valorMudanca: apostilamentos,
        inicioY: valorOriginal + aditivosAcrescimo,
        fimY: valorOriginal + aditivosAcrescimo + apostilamentos,
        corBarra: 'bg-sky-700 text-white',
        corBadge: 'bg-sky-50 text-sky-800 border-sky-200',
        contratosCount: apostilamentosCount,
        isClickable: true,
      },
      {
        id: 'SUPRESSOES',
        rotulo: '(-) Supressões',
        tipo: 'DECRESCIMO',
        valorMudanca: -supressoes,
        inicioY: valorOriginal + aditivosAcrescimo + apostilamentos - supressoes,
        fimY: valorOriginal + aditivosAcrescimo + apostilamentos,
        corBarra: 'bg-red-700 text-white',
        corBadge: 'bg-red-50 text-red-800 border-red-200',
        contratosCount: supressoesCount,
        isClickable: true,
      },
      {
        id: 'GLOBAL',
        rotulo: '(=) Global Atual',
        tipo: 'TOTAL',
        valorMudanca: valorGlobal,
        inicioY: 0,
        fimY: valorGlobal,
        corBarra: 'bg-sempi-plum text-white',
        corBadge: 'bg-sempi-plum/10 text-sempi-plum border-sempi-plum/20',
        contratosCount: filteredContratos.length,
        isClickable: false,
      },
    ];

    // Encontra o teto máximo da escala
    let maxEscala = Math.max(valorOriginal, valorGlobal, 1);
    for (const s of steps) {
      if (s.fimY > maxEscala) maxEscala = s.fimY;
    }

    return { steps, maxEscala, valorGlobal, valorOriginal };
  }, [filteredContratos]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
      {/* Cabeçalho do Visual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sempi-plum" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight font-sans">
              Cascata Orçamentária (Waterfall de Alterações)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evolução do Valor Original até o Global via Aditivos, Reajustes e Supressões (Clique para isolar)
          </p>
        </div>

        {/* Resumo da Variação Líquida */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500">Variação Acumulada:</span>
          <span
            className={`font-bold tabular-nums px-2 py-0.5 rounded-md ${
              waterfallData.valorGlobal >= waterfallData.valorOriginal
                ? 'bg-teal-50 text-teal-800'
                : 'bg-red-50 text-red-800'
            }`}
          >
            {waterfallData.valorGlobal >= waterfallData.valorOriginal ? '+' : ''}
            <MoneyCell
              value={waterfallData.valorGlobal - waterfallData.valorOriginal}
              size="xs"
            />
          </span>
        </div>
      </div>

      {/* Grid de Colunas Flutuantes da Cascata */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
        {waterfallData.steps.map((step) => {
          const isSelected = filters.waterfallEtapa.includes(step.id);
          const alturaPercentual = Math.max(
            8,
            Math.round((Math.abs(step.fimY - step.inicioY) / waterfallData.maxEscala) * 100)
          );
          const baseOffsetPercentual = Math.round((step.inicioY / waterfallData.maxEscala) * 100);

          return (
            <div
              key={step.id}
              onClick={() => {
                if (step.isClickable) {
                  toggleFilter('waterfallEtapa', step.id);
                }
              }}
              className={`flex flex-col justify-between p-3 rounded-lg border transition-all ${
                step.isClickable ? 'cursor-pointer hover:border-slate-400' : 'cursor-default'
              } ${
                isSelected
                  ? 'ring-2 ring-sempi-plum border-sempi-plum bg-sempi-plum/5'
                  : 'border-slate-100 bg-slate-50/50'
              }`}
            >
              <div>
                <span
                  className={`inline-block px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5 border ${step.corBadge}`}
                >
                  {step.rotulo}
                </span>

                <div className="text-xs font-mono tabular-nums font-bold text-slate-900 mt-1">
                  <MoneyCell value={Math.abs(step.valorMudanca)} size="xs" />
                </div>

                <div className="text-[10px] text-slate-400 mt-0.5 font-sans">
                  {step.contratosCount} {step.contratosCount === 1 ? 'contrato' : 'contratos'}
                </div>
              </div>

              {/* Bloco Visual da Barra de Cascata com Altura Proporcional */}
              <div className="h-28 w-full bg-slate-100 rounded-md relative flex flex-col justify-end p-1 mt-3 overflow-hidden">
                <div
                  className={`w-full rounded-sm transition-all duration-500 shadow-2xs flex items-center justify-center ${step.corBarra}`}
                  style={{
                    height: `${alturaPercentual}%`,
                    marginBottom: step.tipo !== 'BASE' && step.tipo !== 'TOTAL' ? `${baseOffsetPercentual}%` : '0%',
                  }}
                >
                  {alturaPercentual > 25 && (
                    <span className="text-[9px] font-mono font-bold opacity-90 px-1 truncate">
                      {step.tipo === 'ACRESCIMO' ? '+' : step.tipo === 'DECRESCIMO' ? '-' : ''}
                      {((Math.abs(step.valorMudanca) / (waterfallData.valorOriginal || 1)) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
