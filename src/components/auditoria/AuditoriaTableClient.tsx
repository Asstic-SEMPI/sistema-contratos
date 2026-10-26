'use client';

import React, { useState, useMemo } from 'react';
import { CodeBadge } from '@/components/ui-ledger/CodeBadge';
import { Pagination } from '@/components/ui-ledger/Pagination';
import { ExportButton } from '@/components/ui-ledger/ExportButton';
import { HairlineCard } from '@/components/ui-ledger/HairlineCard';
import { AuditDiffModal } from '@/components/auditoria/AuditDiffModal';
import { Search, Filter } from 'lucide-react';
import type { Database } from '@/lib/types/database.types';

type AuditLogComPerfil = Database['public']['Tables']['audit_logs']['Row'] & {
  perfis_usuarios: Database['public']['Tables']['perfis_usuarios']['Row'] | null;
};

interface AuditoriaTableClientProps {
  logs: AuditLogComPerfil[];
}

export function AuditoriaTableClient({ logs }: AuditoriaTableClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tabelaFilter, setTabelaFilter] = useState('TODAS');
  const [acaoFilter, setAcaoFilter] = useState('TODAS');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtragem
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (tabelaFilter !== 'TODAS' && log.tabela_afetada !== tabelaFilter) return false;
      if (acaoFilter !== 'TODAS' && log.acao !== acaoFilter) return false;

      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        log.tabela_afetada.toLowerCase().includes(q) ||
        log.registro_id.toLowerCase().includes(q) ||
        (log.perfis_usuarios?.nome_completo || '').toLowerCase().includes(q) ||
        (log.campos_alterados || []).some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [logs, tabelaFilter, acaoFilter, searchTerm]);

  // Paginação
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedLogs = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, validCurrentPage, pageSize]);

  // Configuração de exportação CSV
  const exportColumns = [
    { header: 'ID Log', accessor: (log: AuditLogComPerfil) => log.id },
    {
      header: 'Data e Hora',
      accessor: (log: AuditLogComPerfil) => new Date(log.created_at).toLocaleString('pt-BR'),
    },
    { header: 'Tabela', accessor: (log: AuditLogComPerfil) => log.tabela_afetada },
    { header: 'Operação', accessor: (log: AuditLogComPerfil) => log.acao },
    { header: 'Registro ID', accessor: (log: AuditLogComPerfil) => log.registro_id },
    {
      header: 'Servidor',
      accessor: (log: AuditLogComPerfil) =>
        log.perfis_usuarios ? log.perfis_usuarios.nome_completo : 'Sistema',
    },
    {
      header: 'Perfil',
      accessor: (log: AuditLogComPerfil) =>
        log.perfis_usuarios ? log.perfis_usuarios.role : 'SYSTEM',
    },
    {
      header: 'Campos Alterados',
      accessor: (log: AuditLogComPerfil) => (log.campos_alterados ? log.campos_alterados.join(', ') : 'N/A'),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Barra de Filtros, Busca e Exportação */}
      <HairlineCard className="p-3 bg-white" noPadding>
        <div className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-ledger-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por Registro ID, Servidor, Campo Alterado ou Tabela..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-ledger-border rounded-lg focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 focus:outline-none text-xs font-mono transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-ledger-border rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-ledger-muted" />
              <select
                value={tabelaFilter}
                onChange={(e) => {
                  setTabelaFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent focus:outline-none text-xs font-mono uppercase text-ledger-text cursor-pointer"
              >
                <option value="TODAS">Todas as Tabelas</option>
                <option value="contratos">contratos</option>
                <option value="alteracoes_contratuais">alteracoes_contratuais</option>
                <option value="contrato_fiscais">contrato_fiscais</option>
                <option value="financeiro_empenhos">financeiro_empenhos</option>
                <option value="financeiro_empenhos_eventos">financeiro_empenhos_eventos</option>
                <option value="financeiro_liquidacoes">financeiro_liquidacoes</option>
                <option value="atas_registro_preco">atas_registro_preco</option>
                <option value="atas_itens">atas_itens</option>
                <option value="atas_consumo_empenhos">atas_consumo_empenhos</option>
                <option value="perfis_usuarios">perfis_usuarios</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-ledger-border rounded-lg px-2.5 py-1.5">
              <select
                value={acaoFilter}
                onChange={(e) => {
                  setAcaoFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent focus:outline-none text-xs font-mono uppercase text-ledger-text cursor-pointer"
              >
                <option value="TODAS">Todas as Ações</option>
                <option value="INSERT">INSERT (Criação)</option>
                <option value="UPDATE">UPDATE (Alteração)</option>
                <option value="DELETE">DELETE (Exclusão)</option>
              </select>
            </div>

            <ExportButton
              data={filteredLogs}
              columns={exportColumns}
              filename="auditoria_forense_sempi"
              label="Exportar"
            />

            {(searchTerm || tabelaFilter !== 'TODAS' || acaoFilter !== 'TODAS') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setTabelaFilter('TODAS');
                  setAcaoFilter('TODAS');
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-xs font-mono text-ledger-muted hover:text-ledger-text hover:underline cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </HairlineCard>

      {/* Tabela de Logs */}
      <HairlineCard
        title={`Registros de Auditoria (${filteredLogs.length})`}
        subtitle="Eventos forenses capturados pelas triggers de banco de dados"
        noPadding
      >
        <div className="table-responsive-container">
          <table className="w-full text-left border-collapse text-xs font-mono min-w-[880px]">
            <thead>
              <tr className="border-b border-ledger-border bg-slate-50 text-[11px] uppercase text-ledger-muted tracking-wider">
                <th className="p-3.5 w-16 text-center font-semibold">Log #</th>
                <th className="p-3.5 font-semibold">Data & Hora</th>
                <th className="p-3.5 font-semibold">Tabela Afetada</th>
                <th className="p-3.5 text-center font-semibold">Operação</th>
                <th className="p-3.5 font-semibold">ID do Registro</th>
                <th className="p-3.5 font-semibold">Servidor / Perfil</th>
                <th className="p-3.5 font-semibold">Campos Alterados</th>
                <th className="p-3.5 text-right font-semibold">Inspeção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ledger-border">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => {
                  const dataFormatada = new Date(log.created_at).toLocaleString('pt-BR');
                  const campos = log.campos_alterados || [];

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 text-center font-bold text-slate-400">
                        #{log.id}
                      </td>
                      <td className="p-3.5 tabular-nums text-ledger-text">
                        {dataFormatada}
                      </td>
                      <td className="p-3.5 font-bold text-sempi-plum">
                        <CodeBadge value={log.tabela_afetada} />
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            log.acao === 'INSERT'
                              ? 'bg-emerald-50 text-status-vigente border-emerald-200'
                              : log.acao === 'UPDATE'
                              ? 'bg-amber-50 text-status-alerta border-amber-200'
                              : 'bg-rose-50 text-status-anomalia border-rose-200'
                          }`}
                        >
                          {log.acao}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <CodeBadge value={log.registro_id.slice(0, 13) + '...'} />
                      </td>
                      <td className="p-3.5 font-sans text-xs">
                        <div className="font-semibold text-ledger-text truncate max-w-[160px]">
                          {log.perfis_usuarios?.nome_completo || 'Sistema (Trigger)'}
                        </div>
                        <div className="font-mono text-[10px] text-ledger-muted">
                          {log.perfis_usuarios?.role || 'SYSTEM'}
                        </div>
                      </td>
                      <td className="p-3.5">
                        {campos.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {campos.slice(0, 3).map((c) => (
                              <span
                                key={c}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] border border-slate-200 text-slate-700"
                              >
                                {c}
                              </span>
                            ))}
                            {campos.length > 3 && (
                              <span className="text-[10px] text-ledger-muted font-medium">
                                +{campos.length - 3}
                              </span>
                            )}
                          </div>
                        ) : log.acao === 'UPDATE' ? (
                          <span className="text-ledger-muted text-[10px] italic">Sem campos</span>
                        ) : (
                          <span className="text-ledger-muted text-[10px] italic">
                            {log.acao === 'INSERT' ? 'Registro Novo' : 'Registro Removido'}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <AuditDiffModal log={log} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-xs text-ledger-muted font-mono">
                    Nenhum log de auditoria encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <Pagination
          currentPage={validCurrentPage}
          totalRecords={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
        />
      </HairlineCard>
    </div>
  );
}
