'use client';

import React, { useMemo } from 'react';
import { useCrossFilter } from './CrossFilterContext';
import { MoneyCell } from '@/components/ui-ledger/MoneyCell';
import { Calendar, HelpCircle } from 'lucide-react';
import type { SafraBucket, EstagioAditivo } from '@/lib/types/bi-analytics.types';

interface BucketRowConfig {
  bucket: SafraBucket;
  rotulo: string;
  subtitulo: string;
  corBase: string;
  corBarra: string;
}

const BUCKET_CONFIGS: BucketRowConfig[] = [
  {
    bucket: 'CRITICO_30',
    rotulo: '< 30 dias',
    subtitulo: 'Crítico — Urgência Imediata',
    corBase: 'bg-red-50 text-red-700 border-red-200',
    corBarra: 'bg-red-600',
  },
  {
    bucket: 'ATENCAO_60',
    rotulo: '31 a 60 dias',
    subtitulo: 'Alerta CGE — Transição/Aditivo',
    corBase: 'bg-amber-50 text-amber-700 border-amber-200',
    corBarra: 'bg-amber-500',
  },
  {
    bucket: 'PLANEJAMENTO_120',
    rotulo: '61 a 120 dias',
    subtitulo: 'Planejamento / Prorrogação',
    corBase: 'bg-sky-50 text-sky-700 border-sky-200',
    corBarra: 'bg-sky-600',
  },
  {
    bucket: 'REGULAR_MAIOR_120',
    rotulo: '> 120 dias',
    subtitulo: 'Vigência Regular e Estável',
    corBase: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    corBarra: 'bg-emerald-600',
  },
];

const ESTAGIOS: Array<{ key: EstagioAditivo; rotulo: string; cor: string }> = [
  { key: 'CONTRATO_INICIAL', rotulo: 'Inicial', cor: 'bg-slate-400' },
  { key: 'PRIMEIRO_ADITIVO', rotulo: '1º Aditivo', cor: 'bg-teal-600' },
  { key: 'SEGUNDO_ADITIVO', rotulo: '2º Aditivo', cor: 'bg-sempi-plum' },
  { key: 'TERCEIRO_MAIS_ADITIVO', rotulo: '3º+ Aditivo', cor: 'bg-indigo-700' },
];

export function SafraVencimentosChart() {
  const { dataset, filteredContratos, filters, toggleFilter, isAnyFilterActive } = useCrossFilter();

  // Agrega dados do Universo Total (Fundo esmaecido Power BI)
  const statsTotais = useMemo(() => {
    const map = new Map<SafraBucket, { count: number; valor: number; porEstagio: Record<EstagioAditivo, number> }>();
    for (const cfg of BUCKET_CONFIGS) {
      map.set(cfg.bucket, {
        count: 0,
        valor: 0,
        porEstagio: {
          CONTRATO_INICIAL: 0,
          PRIMEIRO_ADITIVO: 0,
          SEGUNDO_ADITIVO: 0,
          TERCEIRO_MAIS_ADITIVO: 0,
        },
      });
    }

    for (const c of dataset.contratos) {
      const entry = map.get(c.safra_bucket);
      if (entry) {
        entry.count++;
        entry.valor += Number(c.valor_global_atual) || 0;
        entry.porEstagio[c.estagio_aditivo] = (entry.porEstagio[c.estagio_aditivo] || 0) + 1;
      }
    }
    return map;
  }, [dataset.contratos]);

  // Agrega dados da Seleção Ativa / Filtrada (Destaque sólido Power BI)
  const statsFiltrados = useMemo(() => {
    const map = new Map<SafraBucket, { count: number; valor: number; porEstagio: Record<EstagioAditivo, number> }>();
    for (const cfg of BUCKET_CONFIGS) {
      map.set(cfg.bucket, {
        count: 0,
        valor: 0,
        porEstagio: {
          CONTRATO_INICIAL: 0,
          PRIMEIRO_ADITIVO: 0,
          SEGUNDO_ADITIVO: 0,
          TERCEIRO_MAIS_ADITIVO: 0,
        },
      });
    }

    for (const c of filteredContratos) {
      const entry = map.get(c.safra_bucket);
      if (entry) {
        entry.count++;
        entry.valor += Number(c.valor_global_atual) || 0;
        entry.porEstagio[c.estagio_aditivo] = (entry.porEstagio[c.estagio_aditivo] || 0) + 1;
      }
    }
    return map;
  }, [filteredContratos]);

  const maxTotalCount = useMemo(() => {
    let max = 1;
    for (const entry of statsTotais.values()) {
      if (entry.count > max) max = entry.count;
    }
    return max;
  }, [statsTotais]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
      {/* Cabeçalho do Visual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sempi-plum" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight font-sans">
              Safra de Vencimentos & Estágio de Aditivos
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribuição temporal de encerramento por maturidade contratual (Clique para filtrar)
          </p>
        </div>

        {/* Legenda de Estágios de Aditivo */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600 flex-wrap">
          {ESTAGIOS.map((est) => {
            const isEstagioSelected = filters.estagioAditivo.includes(est.key);
            return (
              <button
                key={est.key}
                onClick={() => toggleFilter('estagioAditivo', est.key)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm transition-all ${
                  isEstagioSelected
                    ? 'ring-1 ring-slate-800 font-bold bg-slate-100'
                    : 'hover:bg-slate-50 opacity-80 hover:opacity-100'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-xs ${est.cor}`} />
                <span>{est.rotulo}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Barras Horizontais Empilhadas */}
      <div className="space-y-3.5">
        {BUCKET_CONFIGS.map((cfg) => {
          const tot = statsTotais.get(cfg.bucket)!;
          const filt = statsFiltrados.get(cfg.bucket)!;
          const isSelected = filters.safraBucket.includes(cfg.bucket);

          // Largura percentual em relação ao maior bucket do universo
          const widthTotal = `${(tot.count / maxTotalCount) * 100}%`;
          const widthFiltrado = tot.count > 0 ? `${(filt.count / tot.count) * 100}%` : '0%';

          return (
            <div
              key={cfg.bucket}
              onClick={() => toggleFilter('safraBucket', cfg.bucket)}
              className={`p-3 rounded-lg border transition-all cursor-pointer group ${
                isSelected
                  ? 'border-sempi-plum bg-sempi-plum/5 ring-1 ring-sempi-plum'
                  : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${cfg.corBase}`}
                  >
                    {cfg.rotulo}
                  </span>
                  <span className="text-slate-600 text-xs hidden sm:inline">
                    {cfg.subtitulo}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                  <span className="font-bold text-slate-800">
                    {filt.count}{' '}
                    <span className="text-slate-400 font-normal">/ {tot.count} contratos</span>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-600 font-medium">
                    <MoneyCell value={filt.valor} size="xs" />
                  </span>
                </div>
              </div>

              {/* Barra Empilhada Bi-Nível (Power BI Highlight: Fundo Esmaecido vs Barra Ativa) */}
              <div className="relative w-full h-4 bg-slate-100 rounded-md overflow-hidden">
                {/* Barra do Total (Esmaecida ao fundo) */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-slate-200 opacity-60 rounded-md transition-all duration-300"
                  style={{ width: widthTotal }}
                />

                {/* Barra Filtrada em Destaque com Subdivisão por Estágio de Aditivo */}
                <div
                  className="absolute top-0 bottom-0 left-0 flex h-full rounded-md overflow-hidden transition-all duration-300"
                  style={{
                    width: isAnyFilterActive ? `${(filt.count / maxTotalCount) * 100}%` : widthTotal,
                  }}
                >
                  {filt.count > 0 ? (
                    ESTAGIOS.map((est) => {
                      const countNesteEstagio = filt.porEstagio[est.key] || 0;
                      if (countNesteEstagio === 0) return null;
                      const segmentWidth = `${(countNesteEstagio / filt.count) * 100}%`;

                      return (
                        <div
                          key={est.key}
                          style={{ width: segmentWidth }}
                          className={`h-full ${est.cor} transition-all duration-300 relative group/seg`}
                          title={`${cfg.rotulo} - ${est.rotulo}: ${countNesteEstagio} contratos`}
                        />
                      );
                    })
                  ) : (
                    <div className="h-full w-full bg-slate-300 opacity-20" />
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
