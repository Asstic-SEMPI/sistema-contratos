'use client';

import React, { useMemo } from 'react';
import { useCrossFilter } from './CrossFilterContext';
import { MoneyCell } from '@/components/ui-ledger/MoneyCell';
import {
  ShieldCheck,
  AlertOctagon,
  ClockAlert,
  Flame,
  LayoutGrid,
} from 'lucide-react';
import type { QuadranteRisco } from '@/lib/types/bi-analytics.types';

interface QuadranteConfig {
  key: QuadranteRisco;
  titulo: string;
  subtitulo: string;
  diagnostico: string;
  icone: React.ComponentType<{ className?: string }>;
  estiloCard: string;
  estiloBadge: string;
  corBarra: string;
}

const QUADRANTES: QuadranteConfig[] = [
  {
    key: 'EXECUCAO_REGULAR',
    titulo: '1. Execução Regular',
    subtitulo: 'Ritmo Equilibrado',
    diagnostico: '% Tempo compatível com consumo financeiro das NFs',
    icone: ShieldCheck,
    estiloCard: 'border-emerald-200/80 bg-emerald-50/20 hover:bg-emerald-50/50',
    estiloBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    corBarra: 'bg-emerald-600',
  },
  {
    key: 'RISCO_DESABASTECIMENTO',
    titulo: '2. Risco Desabastecimento',
    subtitulo: 'Consumo Acelerado',
    diagnostico: 'Execução > 80% com menos de 50% da vigência transcorrida',
    icone: Flame,
    estiloCard: 'border-amber-200/80 bg-amber-50/20 hover:bg-amber-50/50',
    estiloBadge: 'bg-amber-100 text-amber-800 border-amber-300',
    corBarra: 'bg-amber-500',
  },
  {
    key: 'BAIXA_EXECUCAO',
    titulo: '3. Baixa Execução / Empate',
    subtitulo: 'Subutilização de Recursos',
    diagnostico: 'Vigência > 75% decorrida com menos de 30% liquidado',
    icone: ClockAlert,
    estiloCard: 'border-sky-200/80 bg-sky-50/20 hover:bg-sky-50/50',
    estiloBadge: 'bg-sky-100 text-sky-800 border-sky-300',
    corBarra: 'bg-sky-600',
  },
  {
    key: 'CRITICO_VENCENDO',
    titulo: '4. Crítico Vencendo',
    subtitulo: 'Prazo Limite ≤ 30 Dias',
    diagnostico: 'Exigência imediata de celebração de aditivo ou transição',
    icone: AlertOctagon,
    estiloCard: 'border-red-200/80 bg-red-50/20 hover:bg-red-50/50',
    estiloBadge: 'bg-red-100 text-red-800 border-red-300',
    corBarra: 'bg-red-600',
  },
];

export function MatrizRiscoQuadrantes() {
  const { dataset, filteredContratos, filters, toggleFilter } = useCrossFilter();

  const agregadosTotais = useMemo(() => {
    const map = new Map<QuadranteRisco, { count: number; valor: number }>();
    for (const q of QUADRANTES) {
      map.set(q.key, { count: 0, valor: 0 });
    }
    for (const c of dataset.contratos) {
      const e = map.get(c.quadrante_risco);
      if (e) {
        e.count++;
        e.valor += Number(c.valor_global_atual) || 0;
      }
    }
    return map;
  }, [dataset.contratos]);

  const agregadosFiltrados = useMemo(() => {
    const map = new Map<QuadranteRisco, { count: number; valor: number }>();
    for (const q of QUADRANTES) {
      map.set(q.key, { count: 0, valor: 0 });
    }
    for (const c of filteredContratos) {
      const e = map.get(c.quadrante_risco);
      if (e) {
        e.count++;
        e.valor += Number(c.valor_global_atual) || 0;
      }
    }
    return map;
  }, [filteredContratos]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
      {/* Cabeçalho do Visual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-sempi-plum" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight font-sans">
              Matriz de Risco Operacional (Vigência vs. Execução)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cruzamento do tempo decorrido com a taxa de liquidação das despesas (Clique no quadrante para filtrar)
          </p>
        </div>
      </div>

      {/* Grid de 4 Quadrantes Operacionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {QUADRANTES.map((q) => {
          const Icone = q.icone;
          const tot = agregadosTotais.get(q.key)!;
          const filt = agregadosFiltrados.get(q.key)!;
          const isSelected = filters.quadranteRisco.includes(q.key);

          const percentualDoUniverso =
            dataset.contratos.length > 0 ? (tot.count / dataset.contratos.length) * 100 : 0;

          return (
            <div
              key={q.key}
              onClick={() => toggleFilter('quadranteRisco', q.key)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                q.estiloCard
              } ${
                isSelected
                  ? 'ring-2 ring-sempi-plum border-sempi-plum shadow-xs'
                  : 'hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider border ${q.estiloBadge}`}
                  >
                    {q.titulo}
                  </span>
                  <div className="p-1.5 rounded-md bg-white/80 shadow-2xs">
                    <Icone className="w-4 h-4 text-slate-700" />
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-800">
                  {q.subtitulo}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {q.diagnostico}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60">
                <div className="flex items-baseline justify-between text-xs mb-1">
                  <div className="font-mono tabular-nums font-bold text-slate-900 text-base">
                    {filt.count}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      / {tot.count}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-semibold text-slate-700">
                    <MoneyCell value={filt.valor} size="xs" />
                  </div>
                </div>

                {/* Barra de Proporção no Universo */}
                <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full ${q.corBarra} rounded-full transition-all duration-500`}
                    style={{ width: `${percentualDoUniverso}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
