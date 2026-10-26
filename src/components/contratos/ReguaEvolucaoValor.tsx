'use client';

import React from 'react';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils';
import {
  TrendingUp,
  ArrowRight,
  Shield,
  Sparkles,
  Calendar,
  DollarSign,
  Shuffle,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import type { TipoAlteracao, TipoContrato } from '@/lib/types/database.types';

interface AlteracaoItem {
  id: string;
  procedimento: string;
  tipo: TipoAlteracao;
  valor_diferenca: number;
  data_assinatura: string;
  vigencia_termo_inicio: string | null;
  vigencia_termo_fim: string | null;
  processo_sei: string;
}

interface ReguaEvolucaoValorProps {
  valorInicial: number;
  valorAtualizado: number;
  tipoContrato?: TipoContrato;
  alteracoes: AlteracaoItem[];
}

export function ReguaEvolucaoValor({
  valorInicial,
  valorAtualizado,
  tipoContrato = 'CONTINUO',
  alteracoes,
}: ReguaEvolucaoValorProps) {
  const isContinuo = tipoContrato === 'CONTINUO';
  const tetoLegal25 = valorInicial * 0.25;

  // Ordena as alterações cronologicamente
  const sortedAlteracoes = [...alteracoes].sort(
    (a, b) => new Date(a.data_assinatura).getTime() - new Date(b.data_assinatura).getTime()
  );

  // Calcula os marcos acumulados
  let acumulador = valorInicial;
  let consumoAcrecimosTotal = 0;

  const marcos = [
    {
      id: 'base',
      titulo: 'Contrato Inicial',
      subtitulo: 'Valor Base Formalizado',
      tipo: 'BASE' as const,
      data: '',
      valorTermo: valorInicial,
      valorAcumulado: valorInicial,
      detalhe: 'Origem da contratação',
      consumoTeto: 0,
    },
    ...sortedAlteracoes.map((alt, index) => {
      const diferenca = Number(alt.valor_diferenca) || 0;
      acumulador += diferenca;

      // Se for contínuo e tiver prazo/misto, a parcela de renovação é valorInicial
      let detalhe = '';
      let acrescimoQueConsomeTeto = 0;

      if (isContinuo && alt.tipo === 'ADITIVO_PRAZO') {
        detalhe = `Renovação de Ciclo Contínuo (+ ${formatCurrency(valorInicial)})`;
      } else if (isContinuo && alt.tipo === 'ADITIVO_MISTO') {
        acrescimoQueConsomeTeto = Math.max(0, diferenca - valorInicial);
        detalhe = `Renovação (+ ${formatCurrency(valorInicial)}) + Acréscimo (+ ${formatCurrency(acrescimoQueConsomeTeto)})`;
      } else if (alt.tipo === 'ADITIVO_VALOR') {
        acrescimoQueConsomeTeto = diferenca;
        detalhe = diferenca > 0 ? 'Acréscimo de Valor' : 'Supressão de Valor';
      } else if (alt.tipo === 'APOSTILAMENTO') {
        detalhe = 'Reajuste / Apostilamento';
      }

      consumoAcrecimosTotal += acrescimoQueConsomeTeto;
      const pctConsumo = valorInicial > 0 ? (acrescimoQueConsomeTeto / valorInicial) * 100 : 0;

      return {
        id: alt.id,
        titulo: alt.procedimento,
        subtitulo: formatDate(alt.data_assinatura),
        tipo: alt.tipo,
        data: alt.data_assinatura,
        valorTermo: diferenca,
        valorAcumulado: acumulador,
        detalhe,
        consumoTeto: pctConsumo,
      };
    }),
  ];

  const variacaoTotalGlobal = valorInicial > 0
    ? ((valorAtualizado - valorInicial) / valorInicial) * 100
    : 0;

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'BASE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-800">BASE ORIGINAL</span>;
      case 'ADITIVO_PRAZO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">PRAZO</span>;
      case 'ADITIVO_VALOR':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">VALOR</span>;
      case 'ADITIVO_MISTO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sempi-plum/10 text-sempi-plum border border-sempi-plum/20">MISTO</span>;
      case 'APOSTILAMENTO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">APOSTILAMENTO</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Cabeçalho da Régua Orçamentária */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-sempi-plum/10 text-sempi-plum rounded-md">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Régua Orçamentária: Evolução do Valor ao Longo dos Termos
            </h3>
            <span className="text-[11px] text-slate-500 font-sans">
              Histórico cronológico de adições financeiras, prorrogações e teto do Art. 125 da Lei 14.133/21
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <div className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <span className="text-slate-500 text-[10px] uppercase block">Valor Base Inicial:</span>
            <strong className="text-slate-800">{formatCurrency(valorInicial)}</strong>
          </div>
          <div className="bg-sempi-plum/5 px-2.5 py-1 rounded-md border border-sempi-plum/20">
            <span className="text-sempi-plum text-[10px] uppercase block">Valor Global Vigente:</span>
            <strong className="text-sempi-plum">{formatCurrency(valorAtualizado)}</strong>
          </div>
        </div>
      </div>

      {/* Linha do Tempo Horizontal com Conectores */}
      <div className="overflow-x-auto pb-2 no-scrollbar">
        <div className="flex items-stretch gap-3 min-w-max py-1">
          {marcos.map((m, idx) => (
            <React.Fragment key={m.id}>
              {idx > 0 && (
                <div className="flex items-center justify-center text-slate-300 shrink-0 px-0.5">
                  <ArrowRight className="w-5 h-5 text-sempi-plum" />
                </div>
              )}

              <div
                className={`w-[250px] p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  m.tipo === 'BASE'
                    ? 'border-slate-200 bg-slate-50/70 shadow-xs'
                    : m.tipo === 'ADITIVO_MISTO'
                    ? 'border-sempi-plum/30 bg-sempi-plum/[0.02] shadow-xs'
                    : 'border-slate-200 bg-white shadow-xs hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    {getTipoBadge(m.tipo)}
                    {m.subtitulo && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {m.subtitulo}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {idx === 0 ? m.titulo : `${idx}. ${m.titulo}`}
                  </h4>

                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">
                    {m.detalhe}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 font-mono space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Variação no Termo:</span>
                    <span className={`font-bold ${m.tipo === 'BASE' ? 'text-slate-800' : 'text-sempi-plum'}`}>
                      {m.tipo === 'BASE' ? formatCurrency(m.valorTermo) : `+ ${formatCurrency(m.valorTermo)}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs font-bold text-slate-900 border-t border-dashed border-slate-200 pt-1">
                    <span className="text-slate-600">Total Acumulado:</span>
                    <span>{formatCurrency(m.valorAcumulado)}</span>
                  </div>

                  {m.consumoTeto > 0 && (
                    <div className="flex justify-between text-[10px] text-sempi-teal font-semibold pt-0.5">
                      <span>Teto 25% (Base):</span>
                      <span>{formatPercent(m.consumoTeto)}</span>
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}

          {/* Marco Final: Destaque de Fechamento */}
          <div className="flex items-center justify-center text-slate-300 shrink-0 px-0.5">
            <ArrowRight className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="w-[240px] p-4 rounded-xl border border-emerald-300 bg-emerald-50/40 shadow-xs flex flex-col justify-between shrink-0">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>VIGENTE</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                  {marcos.length - 1} {marcos.length - 1 === 1 ? 'alteração' : 'alterações'}
                </span>
              </div>
              <h4 className="text-xs font-bold text-emerald-950">
                Valor Global Vigente
              </h4>
              <p className="text-[11px] text-emerald-800/80 mt-0.5 leading-tight font-sans">
                Montante total atualizado reconhecido no SGC-SEMPI e SIAFE.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-200/60 font-mono space-y-1">
              <div className="text-lg font-bold text-emerald-900 tabular-nums">
                {formatCurrency(valorAtualizado)}
              </div>
              <div className="text-[10px] text-emerald-700 flex justify-between">
                <span>Evolução s/ Base:</span>
                <span className="font-bold">+{formatPercent(variacaoTotalGlobal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
