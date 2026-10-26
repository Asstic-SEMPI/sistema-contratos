'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCrossFilter } from './CrossFilterContext';
import { MoneyCell } from '@/components/ui-ledger/MoneyCell';
import { CodeBadge } from '@/components/ui-ledger/CodeBadge';
import { StatusBadge } from '@/components/ui-ledger/StatusBadge';
import { formatDate } from '@/lib/utils';
import { ReportPageTooltipContent } from './ReportPageTooltip';
import {
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowUpRight,
  FileText,
  Calendar,
  Receipt,
  Plus,
  Minus,
  Sparkles,
  AlertTriangle,
  Info,
} from 'lucide-react';
import type {
  HierarchicalLevel1Contrato,
  HierarchicalLevel2Periodo,
  HierarchicalLevel3Empenho,
  HierarchicalLevel4Liquidacao,
} from '@/lib/types/bi-analytics.types';

export function MatrizHierarquicaContratos() {
  const { filteredContratos, totaisFiltrados, dataset } = useCrossFilter();

  // Estados de expansão do Drill-Down em 4 Níveis
  const [expandedContratos, setExpandedContratos] = useState<Set<string>>(new Set());
  const [expandedPeriodos, setExpandedPeriodos] = useState<Set<string>>(new Set());
  const [expandedEmpenhos, setExpandedEmpenhos] = useState<Set<string>>(new Set());

  // Estado do Tooltip Flutuante de Dossiê
  const [activeTooltipContrato, setActiveTooltipContrato] = useState<HierarchicalLevel1Contrato | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const toggleContrato = (id: string) => {
    setExpandedContratos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePeriodo = (id: string) => {
    setExpandedPeriodos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleEmpenho = (id: string) => {
    setExpandedEmpenhos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMouseEnter = (e: React.MouseEvent, c: HierarchicalLevel1Contrato) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.right + 12, y: rect.top });
    setActiveTooltipContrato(c);
  };

  const handleMouseLeave = () => {
    setActiveTooltipContrato(null);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden relative">
      {/* Cabeçalho da Matriz */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sempi-plum" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight font-sans">
              Matriz Hierárquica de Execução (Drill-Down em 4 Níveis)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Nível 1 (Contrato) ➔ Nível 2 (Períodos/Aditivos) ➔ Nível 3 (Notas de Empenho) ➔ Nível 4 (Liquidações/NFs)
          </p>
        </div>

        <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
          <span>Exibindo:</span>
          <span className="font-bold text-slate-800 tabular-nums">
            {filteredContratos.length} de {dataset.contratos.length}
          </span>
          <span>contratos</span>
        </div>
      </div>

      {/* Tabela com Scroll Responsivo e Linha de Totais Dinâmicos Fixada */}
      <div className="table-responsive-container max-h-[700px] overflow-y-auto">
        <table className="w-full text-left border-collapse min-w-[1050px]">
          <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-[11px] font-mono uppercase text-slate-600 tracking-wider">
            <tr>
              <th className="p-3 pl-4 w-10 text-center">+/-</th>
              <th className="p-3 min-w-[200px]">Instrumento / Contratada</th>
              <th className="p-3 w-40">Processo SEI</th>
              <th className="p-3 text-right w-36">Valor Global</th>
              <th className="p-3 min-w-[220px]">Bullet Chart (Execução)</th>
              <th className="p-3 text-right w-32">Saldo a Empenhar</th>
              <th className="p-3 text-right w-32">Saldo a Liquidar</th>
              <th className="p-3 text-center w-28">Vigência Fim</th>
              <th className="p-3 text-center w-24">Status</th>
              <th className="p-3 pr-4 text-right w-16">Dossiê</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredContratos.length > 0 ? (
              filteredContratos.map((contrato) => {
                const isExpanded = expandedContratos.has(contrato.contrato_id);
                const valorGlobal = Number(contrato.valor_global_atual) || 0;
                const valorEmpenhado = Number(contrato.valor_empenhado_liquido) || 0;
                const valorLiquidado = Number(contrato.valor_liquidado) || 0;

                const percEmpenhado = valorGlobal > 0 ? Math.min(100, (valorEmpenhado / valorGlobal) * 100) : 0;
                const percLiquidado = valorGlobal > 0 ? Math.min(100, (valorLiquidado / valorGlobal) * 100) : 0;

                const dias = Number(contrato.dias_restantes_vigencia) || 0;
                let corDias = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                if (dias <= 30) corDias = 'text-red-700 bg-red-50 border-red-200';
                else if (dias <= 60) corDias = 'text-amber-700 bg-amber-50 border-amber-200';

                return (
                  <React.Fragment key={contrato.contrato_id}>
                    {/* Linha Nível 1: Contrato Principal */}
                    <tr
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isExpanded ? 'bg-slate-50/60 font-medium' : ''
                      }`}
                    >
                      {/* Botão Expandir Nível 1 */}
                      <td className="p-3 pl-4 text-center">
                        <button
                          onClick={() => toggleContrato(contrato.contrato_id)}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded-sm hover:bg-slate-200/70 transition-colors"
                          title={isExpanded ? 'Recolher períodos' : 'Expandir períodos e aditivos'}
                        >
                          {isExpanded ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                      </td>

                      {/* Instrumento e Fornecedor (Apenas Nº do Contrato e Contratada) */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {contrato.numero_contrato || 'Art. 95 (NE)'}
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${
                              contrato.tipo_contrato === 'CONTINUO'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}
                          >
                            {contrato.tipo_contrato === 'CONTINUO' ? 'Contínuo' : 'Escopo'}
                          </span>
                          <button
                            type="button"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const x = Math.min(rect.right + 10, window.innerWidth - 350);
                              const y = Math.min(Math.max(10, rect.top - 20), window.innerHeight - 380);
                              setTooltipPos({ x, y });
                              setActiveTooltipContrato(contrato);
                            }}
                            onMouseLeave={handleMouseLeave}
                            className="text-slate-400 hover:text-sempi-plum p-0.5 rounded-full hover:bg-slate-100 transition-colors inline-flex items-center"
                            title="Ver Dossiê Técnico Resumido"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div
                          className="text-[11px] text-slate-600 truncate max-w-[240px] font-sans mt-0.5"
                          title={contrato.contratada_razao_social}
                        >
                          {contrato.contratada_razao_social}
                        </div>
                      </td>

                      {/* Processo SEI */}
                      <td className="p-3">
                        <CodeBadge value={contrato.processo_sei} />
                      </td>

                      {/* Valor Global */}
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        <MoneyCell value={valorGlobal} size="sm" className="text-slate-900 font-bold" />
                      </td>

                      {/* Triple Bullet Chart (Base Global + Empenhado + Liquidado) */}
                      <td className="p-3">
                        <div className="space-y-1">
                          {/* Barra do Bullet Chart Triplo */}
                          <div
                            className="relative w-full h-3.5 bg-slate-200 rounded-sm overflow-hidden"
                            title={`Global: 100% | Empenhado: ${percEmpenhado.toFixed(1)}% | Liquidado: ${percLiquidado.toFixed(1)}%`}
                          >
                            {/* Barra Intermediária: Empenhado Líquido (Petróleo) */}
                            <div
                              className="absolute top-0 bottom-0 left-0 bg-teal-700 transition-all duration-300"
                              style={{ width: `${percEmpenhado}%` }}
                            />
                            {/* Barra Frontal: Liquidado Real (Ameixa) */}
                            <div
                              className="absolute top-0 bottom-0 left-0 bg-sempi-plum transition-all duration-300"
                              style={{ width: `${percLiquidado}%` }}
                            />
                          </div>

                          {/* Rótulo de Percentuais */}
                          <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-500">
                            <span className="text-teal-800 font-semibold">Emp: {percEmpenhado.toFixed(0)}%</span>
                            <span className="text-sempi-plum font-semibold">Liq: {percLiquidado.toFixed(0)}%</span>
                          </div>
                        </div>
                      </td>

                      {/* Saldo a Empenhar */}
                      <td className="p-3 text-right font-mono tabular-nums text-slate-700">
                        <MoneyCell value={contrato.saldo_a_empenhar} size="xs" className="text-slate-800 font-medium" />
                      </td>

                      {/* Saldo a Liquidar */}
                      <td className="p-3 text-right font-mono tabular-nums text-slate-700">
                        <MoneyCell value={contrato.saldo_empenhado_a_liquidar} size="xs" className="text-slate-800 font-medium" />
                      </td>

                      {/* Vigência Fim e Termômetro */}
                      <td className="p-3 text-center">
                        <div className="font-mono text-slate-700 text-[11px]">
                          {formatDate(contrato.data_vigencia_fim_atual)}
                        </div>
                        <div
                          className={`inline-block px-1.5 py-0.2 rounded-xs text-[10px] font-mono font-bold border mt-0.5 ${corDias}`}
                        >
                          {dias > 0 ? `${dias}d rest.` : 'Vencido'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <StatusBadge status={contrato.status} />
                      </td>

                      {/* Ação: Abrir Dossiê */}
                      <td className="p-3 pr-4 text-right">
                        <Link
                          href={`/contratos/${contrato.contrato_id}`}
                          className="inline-flex p-1.5 text-sempi-plum hover:text-white hover:bg-sempi-plum rounded-md transition-colors"
                          title="Abrir Dossiê Completo"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>

                    {/* Drill-Down Nível 2: Períodos (Inicial e Termos Aditivos) */}
                    {isExpanded &&
                      contrato.periodos.map((periodo) => {
                        const isPeriodoExpanded = expandedPeriodos.has(periodo.id);

                        return (
                          <React.Fragment key={periodo.id}>
                            <tr className="bg-slate-50/90 border-l-4 border-l-teal-600 text-xs">
                              <td className="p-2.5 pl-7 text-center">
                                <button
                                  onClick={() => togglePeriodo(periodo.id)}
                                  className="p-1 text-teal-800 hover:text-teal-950 rounded-xs hover:bg-teal-100 transition-colors"
                                  title={isPeriodoExpanded ? 'Recolher empenhos' : 'Expandir empenhos do período'}
                                >
                                  {isPeriodoExpanded ? (
                                    <Minus className="w-3 h-3" />
                                  ) : (
                                    <Plus className="w-3 h-3" />
                                  )}
                                </button>
                              </td>

                              <td colSpan={2} className="p-2.5 pl-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                                  <span className="font-semibold text-slate-800">
                                    {periodo.titulo}
                                  </span>
                                  {!periodo.is_inicial && (
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-xs border border-slate-200 bg-white text-slate-600">
                                      {periodo.tipo}
                                    </span>
                                  )}
                                  {periodo.chave_siga_termo && (
                                    <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded-xs border border-slate-200">
                                      SIGA: {periodo.chave_siga_termo}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-mono text-slate-500 pl-5">
                                  Vigência: {formatDate(periodo.vigencia_inicio)} até{' '}
                                  {formatDate(periodo.vigencia_fim)}
                                </div>
                              </td>

                              <td className="p-2.5 text-right font-mono tabular-nums font-semibold text-teal-900">
                                <MoneyCell value={periodo.valor_consolidado_periodo} size="xs" />
                              </td>

                              <td colSpan={6} className="p-2.5 text-xs text-slate-500">
                                <span className="font-mono text-[11px]">
                                  {periodo.empenhos.length}{' '}
                                  {periodo.empenhos.length === 1 ? 'empenho vinculado' : 'empenhos vinculados'}
                                </span>
                              </td>
                            </tr>

                            {/* Drill-Down Nível 3: Notas de Empenho daquele Período */}
                            {isPeriodoExpanded &&
                              (periodo.empenhos.length > 0 ? (
                                periodo.empenhos.map((empenho) => {
                                  const isEmpenhoExpanded = expandedEmpenhos.has(empenho.id);

                                  return (
                                    <React.Fragment key={empenho.id}>
                                      <tr className="bg-teal-50/30 border-l-4 border-l-sempi-plum text-xs">
                                        <td className="p-2 pl-10 text-center">
                                          <button
                                            onClick={() => toggleEmpenho(empenho.id)}
                                            className="p-1 text-sempi-plum hover:text-sempi-plum-hover rounded-xs hover:bg-sempi-plum/10 transition-colors"
                                            title={isEmpenhoExpanded ? 'Recolher liquidações' : 'Expandir liquidações/NFs'}
                                          >
                                            {isEmpenhoExpanded ? (
                                              <Minus className="w-2.5 h-2.5" />
                                            ) : (
                                              <Plus className="w-2.5 h-2.5" />
                                            )}
                                          </button>
                                        </td>

                                        <td colSpan={2} className="p-2 pl-3">
                                          <div className="flex items-center gap-2">
                                            <FileText className="w-3.5 h-3.5 text-sempi-plum shrink-0" />
                                            <span className="font-mono font-bold text-slate-900">
                                              NE: {empenho.numero_nota_empenho}
                                            </span>
                                            {empenho.chave_siga && (
                                              <span className="text-[10px] font-mono text-slate-500">
                                                ({empenho.chave_siga})
                                              </span>
                                            )}
                                            {empenho.eventos.length > 0 && (
                                              <span className="text-[10px] font-mono font-semibold text-teal-800 bg-teal-100 px-1 rounded-xs">
                                                +{empenho.eventos.length} evento(s)
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[10px] text-slate-500 pl-5 font-mono">
                                            Emissão: {formatDate(empenho.data_emissao)} | Tipo: {empenho.tipo_empenho}
                                          </div>
                                        </td>

                                        <td className="p-2 text-right font-mono tabular-nums text-slate-800 font-medium">
                                          <MoneyCell value={empenho.saldo_empenho_liquido} size="xs" />
                                        </td>

                                        <td colSpan={6} className="p-2 text-xs text-slate-500">
                                          <span className="font-mono text-[11px]">
                                            {empenho.liquidacoes.length}{' '}
                                            {empenho.liquidacoes.length === 1 ? 'nota fiscal liquidada' : 'notas fiscais liquidadas'}
                                          </span>
                                        </td>
                                      </tr>

                                      {/* Drill-Down Nível 4: Notas Fiscais e Liquidações daquela NE */}
                                      {isEmpenhoExpanded &&
                                        (empenho.liquidacoes.length > 0 ? (
                                          empenho.liquidacoes.map((liq) => (
                                            <tr
                                              key={liq.id}
                                              className="bg-sempi-plum/5 border-l-4 border-l-slate-400 text-xs text-slate-700"
                                            >
                                              <td className="p-1.5 pl-14 text-center">
                                                <Receipt className="w-3 h-3 text-sempi-plum mx-auto" />
                                              </td>
                                              <td colSpan={2} className="p-1.5 pl-3">
                                                <span className="font-mono font-semibold text-slate-900">
                                                  {liq.numero_nota_fiscal}
                                                </span>{' '}
                                                <span className="text-slate-400">
                                                  (NL: {liq.numero_nota_liquidacao})
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono block">
                                                  Comp: {liq.competencia_mes_ano} | Atesto:{' '}
                                                  {formatDate(liq.data_emissao_nl)}
                                                </span>
                                              </td>
                                              <td className="p-1.5 text-right font-mono tabular-nums font-bold text-sempi-plum">
                                                <MoneyCell value={liq.valor_liquidado} size="xs" />
                                              </td>
                                              <td colSpan={6} className="p-1.5 text-xs text-slate-500 font-mono">
                                                {liq.data_pagamento_ob ? (
                                                  <span className="text-teal-700">
                                                    Pago via OB em {formatDate(liq.data_pagamento_ob)}
                                                  </span>
                                                ) : (
                                                  <span className="text-amber-700">
                                                    Pendente de emissão de OB
                                                  </span>
                                                )}
                                              </td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr className="bg-sempi-plum/5 text-xs text-slate-400 italic">
                                            <td colSpan={10} className="p-2 pl-14">
                                              Nenhuma liquidação ou Nota Fiscal registrada para esta NE.
                                            </td>
                                          </tr>
                                        ))}
                                    </React.Fragment>
                                  );
                                })
                              ) : (
                                <tr className="bg-teal-50/20 text-xs text-slate-400 italic">
                                  <td colSpan={10} className="p-2 pl-10">
                                    Nenhum empenho vinculado a este período.
                                  </td>
                                </tr>
                              ))}
                          </React.Fragment>
                        );
                      })}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="p-8 text-center text-xs text-slate-400 font-mono">
                  Nenhum contrato encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>

          {/* Linha de Totais Dinâmicos Fixada no Rodapé (Power BI Matrix Footer) */}
          <tfoot className="sticky bottom-0 z-10 bg-slate-900 text-white font-mono text-xs border-t-2 border-slate-700 shadow-lg">
            <tr>
              <td className="p-3.5 pl-4 text-center font-bold">∑</td>
              <td className="p-3.5 font-bold">
                Totais Selecionados ({totaisFiltrados.contratos_count} contratos)
              </td>
              <td className="p-3.5 text-slate-300 text-[11px]">Consolidado</td>
              <td className="p-3.5 text-right font-bold tabular-nums">
                <MoneyCell value={totaisFiltrados.valor_global_total} size="sm" className="text-white font-bold" />
              </td>
              <td className="p-3.5">
                <div className="flex items-center justify-between text-[11px] tabular-nums font-bold">
                  <span className="text-teal-300">
                    Emp: <MoneyCell value={totaisFiltrados.valor_empenhado_liquido_total} size="xs" className="text-teal-300 font-bold" />
                  </span>
                  <span className="text-rose-300">
                    Liq: <MoneyCell value={totaisFiltrados.valor_liquidado_total} size="xs" className="text-rose-300 font-bold" />
                  </span>
                </div>
              </td>
              <td className="p-3.5 text-right font-bold tabular-nums">
                <MoneyCell value={totaisFiltrados.saldo_a_empenhar_total} size="xs" className="text-emerald-300 font-bold" />
              </td>
              <td className="p-3.5 text-right font-bold tabular-nums">
                <MoneyCell value={totaisFiltrados.saldo_a_liquidar_total} size="xs" className="text-amber-300 font-bold" />
              </td>
              <td colSpan={3} className="p-3.5 pr-4 text-right text-slate-400 text-[11px]">
                {totaisFiltrados.total_contratos_ativos} ativos
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Floating Tooltip Card (Report Page Tooltip) */}
      {activeTooltipContrato && (
        <div
          className="fixed z-50 pointer-events-none transition-opacity duration-150"
          style={{
            left: `${Math.min(tooltipPos.x, window.innerWidth - 340)}px`,
            top: `${Math.min(tooltipPos.y, window.innerHeight - 340)}px`,
          }}
        >
          <ReportPageTooltipContent contrato={activeTooltipContrato} />
        </div>
      )}
    </div>
  );
}
