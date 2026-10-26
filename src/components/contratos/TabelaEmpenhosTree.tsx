'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, TrendingUp, TrendingDown, FileCheck2, Calendar, FileText } from 'lucide-react';
import { CodeBadge } from '@/components/ui-ledger/CodeBadge';
import { MoneyCell } from '@/components/ui-ledger/MoneyCell';
import { NovoEmpenhoDrawer } from '@/components/contratos/NovoEmpenhoDrawer';
import { EditarEmpenhoDrawer } from '@/components/contratos/EditarEmpenhoDrawer';
import { NovoEventoEmpenhoDrawer } from '@/components/contratos/NovoEventoEmpenhoDrawer';
import { EditarEventoEmpenhoDrawer } from '@/components/contratos/EditarEventoEmpenhoDrawer';
import { NovaLiquidacaoDrawer } from '@/components/contratos/NovaLiquidacaoDrawer';
import { EditarLiquidacaoDrawer } from '@/components/contratos/EditarLiquidacaoDrawer';
import { formatDate } from '@/lib/utils';
import type { Database } from '@/lib/types/database.types';

type AlteracaoRow = Database['public']['Tables']['alteracoes_contratuais']['Row'];
type EmpenhoRow = Database['public']['Tables']['financeiro_empenhos']['Row'] & {
  financeiro_empenhos_eventos: Database['public']['Tables']['financeiro_empenhos_eventos']['Row'][];
  financeiro_liquidacoes: Database['public']['Tables']['financeiro_liquidacoes']['Row'][];
};

interface TabelaEmpenhosTreeProps {
  contratoId: string;
  empenhos: EmpenhoRow[];
  aditivos: AlteracaoRow[];
  dataVigenciaFimAtual: string;
}

export function TabelaEmpenhosTree({
  contratoId,
  empenhos,
  aditivos,
  dataVigenciaFimAtual,
}: TabelaEmpenhosTreeProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    empenhos.forEach((e) => {
      all[e.id] = true;
    });
    setExpandedRows(all);
  };

  const collapseAll = () => {
    setExpandedRows({});
  };

  // Totais do rodapé
  const totalInicial = empenhos.reduce((acc, e) => acc + Number(e.valor_empenhado_inicial || 0), 0);
  const totalReforcos = empenhos.reduce((acc, e) => acc + Number(e.valor_reforcado || 0), 0);
  const totalAnulacoes = empenhos.reduce((acc, e) => acc + Number(e.valor_anulado || 0), 0);
  const totalSaldoLiquido = empenhos.reduce((acc, e) => acc + Number(e.saldo_empenho_liquido || 0), 0);

  const totalLiquidadoGeral = empenhos.reduce((acc, e) => {
    const liqs = e.financeiro_liquidacoes || [];
    return acc + liqs.reduce((sub, l) => sub + Number(l.valor_liquidado || 0), 0);
  }, 0);

  const saldoALiquidarGeral = totalSaldoLiquido - totalLiquidadoGeral;

  return (
    <div className="space-y-3">
      {/* Barra de Ações Superior */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-ledger-subtle border border-ledger-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold uppercase text-ledger-text">
            Total de Empenhos: <span className="text-sempi-plum font-bold">{empenhos.length}</span>
          </span>
          {empenhos.length > 0 && (
            <div className="flex items-center gap-1.5 ml-3">
              <button
                type="button"
                onClick={expandAll}
                className="text-[11px] font-mono text-ledger-muted hover:text-ledger-text hover:underline"
              >
                [Expandir Todos]
              </button>
              <span className="text-ledger-border">|</span>
              <button
                type="button"
                onClick={collapseAll}
                className="text-[11px] font-mono text-ledger-muted hover:text-ledger-text hover:underline"
              >
                [Recolher Todos]
              </button>
            </div>
          )}
        </div>

        <div>
          <NovoEmpenhoDrawer
            contratoId={contratoId}
            aditivos={aditivos}
            dataVigenciaFimAtual={dataVigenciaFimAtual}
          />
        </div>
      </div>

      {/* Tabela Master-Detail com Proteção Touch */}
      <div className="table-responsive-container border border-slate-200/80 bg-white rounded-xl shadow-xs">
        <table className="w-full text-left border-collapse text-xs min-w-[980px]">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-mono uppercase text-slate-500 tracking-wider">
              <th className="p-3 w-8 text-center">#</th>
              <th className="p-3">Nota de Empenho</th>
              <th className="p-3">Chave SIGA</th>
              <th className="p-3">Data Emissão</th>
              <th className="p-3">Janela Detectada</th>
              <th className="p-3 text-right">Inicial</th>
              <th className="p-3 text-right">Reforços</th>
              <th className="p-3 text-right">Anulações</th>
              <th className="p-3 text-right">Saldo Líquido</th>
              <th className="p-3 text-right">Liquidado</th>
              <th className="p-3 text-right">Saldo a Liquidar</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ledger-border">
            {empenhos.length > 0 ? (
              empenhos.map((emp) => {
                const isExpanded = !!expandedRows[emp.id];
                const eventos = emp.financeiro_empenhos_eventos || [];
                const liquidacoes = emp.financeiro_liquidacoes || [];

                const liquidadoEmp = liquidacoes.reduce(
                  (s, l) => s + Number(l.valor_liquidado || 0),
                  0
                );
                const saldoALiquidarEmp = Number(emp.saldo_empenho_liquido || 0) - liquidadoEmp;
                const totalSubRegistros = eventos.length + liquidacoes.length;

                return (
                  <React.Fragment key={emp.id}>
                    {/* Linha Master */}
                    <tr
                      className={`hover:bg-ledger-subtle/50 transition-colors font-mono cursor-pointer ${
                        isExpanded ? 'bg-ledger-subtle/30' : ''
                      }`}
                      onClick={() => toggleExpand(emp.id)}
                    >
                      <td className="p-3 text-center text-ledger-muted">
                        <button
                          type="button"
                          className="p-1 hover:bg-ledger-border text-ledger-muted transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(emp.id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-sempi-plum" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 font-bold text-ledger-text">
                        <div className="flex items-center gap-1.5">
                          <CodeBadge value={emp.numero_nota_empenho} />
                          {totalSubRegistros > 0 && (
                            <span className="text-[10px] bg-ledger-subtle text-ledger-muted px-1 border border-ledger-border">
                              +{totalSubRegistros}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <CodeBadge value={emp.chave_siga} />
                      </td>
                      <td className="p-3">{formatDate(emp.data_emissao)}</td>
                      <td className="p-3">
                        {emp.vinculo_automatico_detectado === 'ALERTA_FORA_DE_VIGENCIA' ? (
                          <span className="px-1.5 py-0.5 bg-status-anomalia-bg text-status-anomalia font-bold text-[10px] border border-status-anomalia">
                            FORA DE VIGÊNCIA
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-ledger-subtle text-ledger-text text-[10px] border border-ledger-border">
                            {emp.vinculo_automatico_detectado || 'CONTRATO_INICIAL'}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        <MoneyCell value={emp.valor_empenhado_inicial} size="sm" />
                      </td>
                      <td className="p-3 text-right tabular-nums text-status-vigente">
                        <MoneyCell value={emp.valor_reforcado} size="sm" />
                      </td>
                      <td className="p-3 text-right tabular-nums text-status-anomalia">
                        <MoneyCell value={emp.valor_anulado} size="sm" />
                      </td>
                      <td className="p-3 text-right tabular-nums font-bold">
                        <MoneyCell value={emp.saldo_empenho_liquido} size="md" />
                      </td>
                      <td className="p-3 text-right tabular-nums text-sempi-teal font-semibold">
                        <MoneyCell value={liquidadoEmp} size="sm" />
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        <MoneyCell
                          value={saldoALiquidarEmp}
                          size="sm"
                          isNegative={saldoALiquidarEmp < 0}
                        />
                      </td>
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <EditarEmpenhoDrawer
                            contratoId={contratoId}
                            empenho={emp}
                            aditivos={aditivos}
                          />
                          <NovoEventoEmpenhoDrawer
                            contratoId={contratoId}
                            empenho={emp}
                          />
                          <NovaLiquidacaoDrawer
                            contratoId={contratoId}
                            empenho={emp}
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Linha Detalhe Expansível (Árvore Genealógica) */}
                    {isExpanded && (
                      <tr className="bg-ledger-subtle/20 border-b-2 border-ledger-border">
                        <td colSpan={12} className="p-4 pl-12 space-y-4">
                          {/* 1. Sub-tabela de Eventos SIAFE */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono uppercase font-bold text-ledger-muted flex items-center gap-1.5">
                                ↳ 1. Eventos Contábeis no SIAFE-Rio (Reforços & Anulações) — [{eventos.length}]
                              </span>
                              <NovoEventoEmpenhoDrawer
                                contratoId={contratoId}
                                empenho={emp}
                                triggerButton={
                                  <button
                                    type="button"
                                    className="text-[10px] font-mono text-sempi-plum hover:underline font-semibold"
                                  >
                                    + Adicionar Evento SIAFE
                                  </button>
                                }
                              />
                            </div>

                            {eventos.length > 0 ? (
                              <div className="border border-ledger-border bg-white overflow-x-auto">
                                <table className="w-full text-left border-collapse text-[11px] font-mono">
                                  <thead>
                                    <tr className="bg-ledger-subtle border-b border-ledger-border text-[10px] text-ledger-muted uppercase">
                                      <th className="p-2">Tipo de Evento</th>
                                      <th className="p-2">NE do Evento</th>
                                      <th className="p-2">Processo SEI</th>
                                      <th className="p-2">Chave SIGA</th>
                                      <th className="p-2">Data do Evento</th>
                                      <th className="p-2 text-right">Valor do Evento</th>
                                      <th className="p-2">Motivo Contábil</th>
                                      <th className="p-2 text-center">Ações</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-ledger-border">
                                    {eventos.map((ev) => (
                                      <tr key={ev.id} className="hover:bg-ledger-subtle/30">
                                        <td className="p-2">
                                          <span
                                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold border ${
                                              ev.tipo_evento === 'REFORCO'
                                                ? 'bg-status-vigente-bg text-status-vigente border-status-vigente'
                                                : 'bg-status-anomalia-bg text-status-anomalia border-status-anomalia'
                                            }`}
                                          >
                                            {ev.tipo_evento === 'REFORCO' ? (
                                              <TrendingUp className="w-3 h-3" />
                                            ) : (
                                              <TrendingDown className="w-3 h-3" />
                                            )}
                                            {ev.tipo_evento}
                                          </span>
                                        </td>
                                        <td className="p-2 font-bold">
                                          <CodeBadge value={ev.numero_ne_evento} />
                                        </td>
                                        <td className="p-2">
                                          <CodeBadge value={ev.processo_sei} />
                                        </td>
                                        <td className="p-2">
                                          {ev.chave_siga ? <CodeBadge value={ev.chave_siga} /> : '—'}
                                        </td>
                                        <td className="p-2">{formatDate(ev.data_evento)}</td>
                                        <td className="p-2 text-right tabular-nums font-bold">
                                          <span
                                            className={
                                              ev.tipo_evento === 'REFORCO'
                                                ? 'text-status-vigente'
                                                : 'text-status-anomalia'
                                            }
                                          >
                                            {ev.tipo_evento === 'REFORCO' ? '+' : '-'}
                                            <MoneyCell value={ev.valor_evento} size="sm" />
                                          </span>
                                        </td>
                                        <td className="p-2 text-ledger-muted font-sans text-xs">
                                          {ev.motivo}
                                        </td>
                                        <td className="p-2 text-center">
                                          <EditarEventoEmpenhoDrawer
                                            contratoId={contratoId}
                                            evento={ev}
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="p-3 bg-white border border-ledger-border text-[11px] font-mono text-ledger-muted italic">
                                Nenhum reforço ou anulação registrado para este empenho.
                              </div>
                            )}
                          </div>

                          {/* 2. Sub-tabela de Liquidações */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono uppercase font-bold text-ledger-muted flex items-center gap-1.5">
                                ↳ 2. Atestes de Nota Fiscal & Liquidações (NL) — [{liquidacoes.length}]
                              </span>
                              <NovaLiquidacaoDrawer
                                contratoId={contratoId}
                                empenho={emp}
                                triggerButton={
                                  <button
                                    type="button"
                                    className="text-[10px] font-mono text-sempi-teal hover:underline font-semibold"
                                  >
                                    + Adicionar Liquidação (NL)
                                  </button>
                                }
                              />
                            </div>

                            {liquidacoes.length > 0 ? (
                              <div className="border border-ledger-border bg-white overflow-x-auto">
                                <table className="w-full text-left border-collapse text-[11px] font-mono">
                                  <thead>
                                    <tr className="bg-ledger-subtle border-b border-ledger-border text-[10px] text-ledger-muted uppercase">
                                      <th className="p-2">Nota Fiscal (NF)</th>
                                      <th className="p-2">Data Emissão NF</th>
                                      <th className="p-2">Competência</th>
                                      <th className="p-2">Processo SEI</th>
                                      <th className="p-2">Nota Liquidação (NL)</th>
                                      <th className="p-2">Data Emissão NL</th>
                                      <th className="p-2 text-right">Valor Liquidado</th>
                                      <th className="p-2">Pagamento OB</th>
                                      <th className="p-2 text-center">Ações</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-ledger-border">
                                    {liquidacoes.map((liq) => (
                                      <tr key={liq.id} className="hover:bg-ledger-subtle/30">
                                        <td className="p-2 font-bold text-ledger-text">
                                          <CodeBadge value={liq.numero_nota_fiscal} />
                                        </td>
                                        <td className="p-2">{formatDate(liq.data_emissao_nota_fiscal)}</td>
                                        <td className="p-2 font-bold text-sempi-plum">
                                          {liq.competencia_mes_ano}
                                        </td>
                                        <td className="p-2">
                                          <CodeBadge value={liq.processo_sei} />
                                        </td>
                                        <td className="p-2 font-bold text-sempi-teal">
                                          <CodeBadge value={liq.numero_nota_liquidacao} />
                                        </td>
                                        <td className="p-2">{formatDate(liq.data_emissao_nl)}</td>
                                        <td className="p-2 text-right tabular-nums font-bold text-sempi-teal">
                                          <MoneyCell value={liq.valor_liquidado} size="sm" />
                                        </td>
                                        <td className="p-2">
                                          {liq.data_pagamento_ob ? (
                                            <span className="text-status-vigente font-bold">
                                              {formatDate(liq.data_pagamento_ob)}
                                            </span>
                                          ) : (
                                            <span className="text-ledger-muted italic">Pendente</span>
                                          )}
                                        </td>
                                        <td className="p-2 text-center">
                                          <EditarLiquidacaoDrawer
                                            contratoId={contratoId}
                                            liquidacao={liq}
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="p-3 bg-white border border-ledger-border text-[11px] font-mono text-ledger-muted italic">
                                Nenhuma Nota Fiscal ou liquidação atestada até o momento.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={12} className="p-6 text-center text-xs text-ledger-muted font-mono">
                  Nenhuma Nota de Empenho cadastrada para este contrato.
                </td>
              </tr>
            )}
          </tbody>

          {/* Rodapé com Totais Finais Consolidados */}
          {empenhos.length > 0 && (
            <tfoot>
              <tr className="bg-ledger-subtle border-t-2 border-ledger-border font-mono text-xs font-bold text-ledger-text">
                <td colSpan={5} className="p-3 text-right uppercase tracking-wider text-[11px]">
                  Totais Consolidados da Execução:
                </td>
                <td className="p-3 text-right tabular-nums">
                  <MoneyCell value={totalInicial} size="sm" />
                </td>
                <td className="p-3 text-right tabular-nums text-status-vigente">
                  <MoneyCell value={totalReforcos} size="sm" />
                </td>
                <td className="p-3 text-right tabular-nums text-status-anomalia">
                  <MoneyCell value={totalAnulacoes} size="sm" />
                </td>
                <td className="p-3 text-right tabular-nums text-sempi-plum">
                  <MoneyCell value={totalSaldoLiquido} size="md" />
                </td>
                <td className="p-3 text-right tabular-nums text-sempi-teal">
                  <MoneyCell value={totalLiquidadoGeral} size="md" />
                </td>
                <td className="p-3 text-right tabular-nums">
                  <MoneyCell value={saldoALiquidarGeral} size="md" />
                </td>
                <td className="p-3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
