'use client';

import React, { useState } from 'react';
import { X, Eye, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { CodeBadge } from '@/components/ui-ledger/CodeBadge';
import { formatDate } from '@/lib/utils';
import type { Database } from '@/lib/types/database.types';

type AuditLogRow = Database['public']['Tables']['audit_logs']['Row'] & {
  perfis_usuarios?: Database['public']['Tables']['perfis_usuarios']['Row'] | null;
};

interface AuditDiffModalProps {
  log: AuditLogRow;
}

export function AuditDiffModal({ log }: AuditDiffModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const dadosAntigos = log.dados_antigos as Record<string, unknown> | null;
  const dadosNovos = log.dados_novos as Record<string, unknown> | null;
  const camposAlterados = log.campos_alterados || [];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-sempi-plum hover:text-sempi-plum-hover shadow-xs transition-all cursor-pointer"
      >
        <Eye className="w-3.5 h-3.5" />
        <span>Inspecionar Diff</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-drawer flex flex-col max-h-[90vh] overflow-hidden">
            {/* Cabeçalho */}
            <div className="p-4 sm:p-5 border-b border-ledger-border bg-slate-50/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
                    Trilha de Auditoria Forense — Registro #{log.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                      log.acao === 'INSERT'
                        ? 'bg-emerald-50 text-status-vigente border-emerald-200'
                        : log.acao === 'UPDATE'
                        ? 'bg-amber-50 text-status-alerta border-amber-200'
                        : 'bg-rose-50 text-status-anomalia border-rose-200'
                    }`}
                  >
                    {log.acao}
                  </span>
                </div>
                <h2 className="text-base font-serif font-bold text-ledger-text mt-1">
                  Tabela: <span className="font-mono text-sempi-plum">{log.tabela_afetada}</span>{' '}
                  <span className="text-xs font-mono text-ledger-muted font-normal">(ID: {log.registro_id})</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-ledger-muted hover:text-ledger-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadados da Ação */}
            <div className="p-4 bg-slate-50/50 border-b border-ledger-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-[10px] uppercase text-ledger-muted block">Data & Hora</span>
                <span className="font-semibold text-ledger-text">
                  {new Date(log.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-ledger-muted block">Servidor Responsável</span>
                <span className="text-ledger-text truncate block font-medium">
                  {log.perfis_usuarios?.nome_completo || 'Sistema / Trigger'}
                </span>
                {log.perfis_usuarios?.id_funcional && (
                  <span className="text-[10px] text-ledger-muted">
                    ID: {log.perfis_usuarios.id_funcional}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase text-ledger-muted block">Perfil de Acesso</span>
                <span className="font-semibold text-sempi-plum">
                  {log.perfis_usuarios?.role || 'SISTEMA'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-ledger-muted block">Campos Afetados</span>
                <span className="text-ledger-text font-medium">
                  {camposAlterados.length > 0 ? `${camposAlterados.length} campos` : 'Registro Integral'}
                </span>
              </div>
            </div>

            {/* Corpo do Diff */}
            <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
              {log.acao === 'UPDATE' && (
                <div className="space-y-3">
                  <div className="text-xs font-mono font-bold uppercase text-ledger-muted">
                    Comparativo JSONB: Estado Anterior vs. Novo Estado
                  </div>

                  {camposAlterados.length > 0 ? (
                    <div className="table-responsive-container border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs font-mono min-w-[500px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-ledger-border text-[10px] uppercase text-ledger-muted">
                            <th className="p-3 w-1/4 font-semibold">Campo Alterado</th>
                            <th className="p-3 w-3/8 text-rose-700 font-semibold">Estado Anterior (-)</th>
                            <th className="p-3 w-3/8 text-emerald-700 font-semibold">Novo Estado (+)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ledger-border">
                          {camposAlterados.map((campo) => {
                            const valAntigo = dadosAntigos ? dadosAntigos[campo] : undefined;
                            const valNovo = dadosNovos ? dadosNovos[campo] : undefined;

                            return (
                              <tr key={campo} className="hover:bg-slate-50/50">
                                <td className="p-3 font-bold text-ledger-text bg-slate-50/30">
                                  {campo}
                                </td>
                                <td className="p-3 bg-rose-50/30 text-rose-800 break-all">
                                  <pre className="font-mono text-[11px] whitespace-pre-wrap">
                                    {typeof valAntigo === 'object'
                                      ? JSON.stringify(valAntigo, null, 2)
                                      : String(valAntigo ?? 'null')}
                                  </pre>
                                </td>
                                <td className="p-3 bg-emerald-50/30 text-emerald-800 break-all">
                                  <pre className="font-mono text-[11px] whitespace-pre-wrap">
                                    {typeof valNovo === 'object'
                                      ? JSON.stringify(valNovo, null, 2)
                                      : String(valNovo ?? 'null')}
                                  </pre>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-ledger-muted italic">
                      Nenhuma alteração pontual detectada além do timestamp de atualização.
                    </div>
                  )}
                </div>
              )}

              {log.acao === 'INSERT' && (
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold uppercase text-emerald-700 flex items-center gap-1.5">
                    <span>↳ Dados Inseridos no Banco (Payload Original):</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-x-auto">
                    <pre className="font-mono text-[11px] text-slate-800 whitespace-pre-wrap">
                      {JSON.stringify(dadosNovos, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {log.acao === 'DELETE' && (
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold uppercase text-rose-700 flex items-center gap-1.5">
                    <span>↳ Registro Excluído (Estado Anterior à Remoção):</span>
                  </div>
                  <div className="bg-rose-50/30 border border-rose-200 rounded-xl p-4 overflow-x-auto">
                    <pre className="font-mono text-[11px] text-rose-800 whitespace-pre-wrap">
                      {JSON.stringify(dadosAntigos, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé */}
            <div className="p-4 border-t border-ledger-border bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-[10px] font-mono text-ledger-muted">
                Registro protegido pela política de auditoria imutável SEMPI-RJ / CGE / TCE-RJ.
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-mono uppercase font-semibold rounded-lg shadow-xs transition-all w-full sm:w-auto"
              >
                Fechar Visualizador
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
