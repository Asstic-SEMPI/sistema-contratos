'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CodeBadge } from '@/components/ui-ledger/CodeBadge';
import { StatusBadge } from '@/components/ui-ledger/StatusBadge';
import { Pagination } from '@/components/ui-ledger/Pagination';
import { ExportButton } from '@/components/ui-ledger/ExportButton';
import { HairlineCard } from '@/components/ui-ledger/HairlineCard';
import { EditarFiscalDrawer } from '@/components/contratos/EditarFiscalDrawer';
import { formatDate } from '@/lib/utils';
import { Search, ArrowUpRight } from 'lucide-react';
import type { Database } from '@/lib/types/database.types';

type FiscalComContrato = Database['public']['Tables']['contrato_fiscais']['Row'] & {
  contratos: Pick<
    Database['public']['Tables']['contratos']['Row'],
    'id' | 'numero_contrato' | 'tipo_formalizacao' | 'processo_sei' | 'contratada_razao_social' | 'status'
  > | null;
};

interface FiscaisTableClientProps {
  fiscais: FiscalComContrato[];
  canEdit?: boolean;
}

export function FiscaisTableClient({ fiscais, canEdit = true }: FiscaisTableClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [funcaoFilter, setFuncaoFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtragem
  const filteredFiscais = useMemo(() => {
    return fiscais.filter((f) => {
      // Filtro de função
      if (funcaoFilter !== 'ALL' && f.funcao !== funcaoFilter) return false;

      // Filtro de status
      if (statusFilter === 'ATIVO' && !f.ativo) return false;
      if (statusFilter === 'SUBSTITUIDO' && f.ativo) return false;

      // Busca por texto
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        f.nome.toLowerCase().includes(q) ||
        f.id_funcional.toLowerCase().includes(q) ||
        f.portaria_designacao.toLowerCase().includes(q) ||
        (f.contratos?.numero_contrato && f.contratos.numero_contrato.toLowerCase().includes(q)) ||
        (f.contratos?.processo_sei && f.contratos.processo_sei.toLowerCase().includes(q)) ||
        (f.contratos?.contratada_razao_social &&
          f.contratos.contratada_razao_social.toLowerCase().includes(q))
      );
    });
  }, [fiscais, funcaoFilter, statusFilter, searchTerm]);

  // Paginação
  const totalItems = filteredFiscais.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedFiscais = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredFiscais.slice(start, start + pageSize);
  }, [filteredFiscais, validCurrentPage, pageSize]);

  // Configuração de exportação CSV
  const exportColumns = [
    { header: 'Nome do Servidor', accessor: (f: FiscalComContrato) => f.nome },
    { header: 'ID Funcional', accessor: (f: FiscalComContrato) => f.id_funcional },
    { header: 'Função', accessor: (f: FiscalComContrato) => f.funcao },
    {
      header: 'Contrato',
      accessor: (f: FiscalComContrato) =>
        f.contratos ? f.contratos.numero_contrato || 'Art. 95 (NE)' : 'N/A',
    },
    {
      header: 'Contratada',
      accessor: (f: FiscalComContrato) =>
        f.contratos ? f.contratos.contratada_razao_social || 'N/A' : 'N/A',
    },
    { header: 'Portaria DOERJ', accessor: (f: FiscalComContrato) => f.portaria_designacao },
    {
      header: 'Data Publicação',
      accessor: (f: FiscalComContrato) => formatDate(f.data_publicacao_doerj),
    },
    {
      header: 'Data Início',
      accessor: (f: FiscalComContrato) => formatDate(f.data_inicio),
    },
    {
      header: 'Data Fim',
      accessor: (f: FiscalComContrato) => (f.data_fim ? formatDate(f.data_fim) : 'Atual'),
    },
    {
      header: 'Status',
      accessor: (f: FiscalComContrato) => (f.ativo ? 'Ativo' : 'Substituído'),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Barra de Filtros, Busca e Exportação */}
      <HairlineCard className="p-3 bg-white" noPadding>
        <div className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 text-ledger-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por Nome, ID Funcional, Portaria DOERJ ou Contrato..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-ledger-border rounded-lg font-mono text-xs focus:outline-none focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-ledger-border rounded-lg px-2.5 py-1.5">
              <span className="text-[11px] font-mono text-ledger-muted uppercase">Função:</span>
              <select
                value={funcaoFilter}
                onChange={(e) => {
                  setFuncaoFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-mono text-xs focus:outline-none text-ledger-text cursor-pointer"
              >
                <option value="ALL">Todas as Funções</option>
                <option value="GESTOR">Gestor</option>
                <option value="FISCAL_TECNICO">Fiscal Técnico</option>
                <option value="FISCAL_ADMINISTRATIVO">Fiscal Administrativo</option>
                <option value="SUPLENTE">Suplente</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-ledger-border rounded-lg px-2.5 py-1.5">
              <span className="text-[11px] font-mono text-ledger-muted uppercase">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-mono text-xs focus:outline-none text-ledger-text cursor-pointer"
              >
                <option value="ALL">Todos os Status</option>
                <option value="ATIVO">Ativo</option>
                <option value="SUBSTITUIDO">Substituído / Inativo</option>
              </select>
            </div>

            <ExportButton
              data={filteredFiscais}
              columns={exportColumns}
              filename="quadro_fiscais_sempi"
              label="Exportar"
            />

            {(searchTerm || funcaoFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFuncaoFilter('ALL');
                  setStatusFilter('ALL');
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

      {/* Tabela do Quadro Geral de Fiscais */}
      <HairlineCard
        title={`Quadro de Fiscais Registrados (${filteredFiscais.length})`}
        subtitle="Relação completa de servidores designados com portaria no Diário Oficial"
        noPadding
      >
        <div className="table-responsive-container">
          <table className="w-full text-left border-collapse text-xs min-w-[950px]">
            <thead>
              <tr className="border-b border-ledger-border bg-slate-50 text-[11px] font-mono uppercase text-ledger-muted tracking-wider">
                <th className="p-3.5 font-semibold">Servidor</th>
                <th className="p-3.5 font-semibold">ID Funcional</th>
                <th className="p-3.5 font-semibold">Função</th>
                <th className="p-3.5 font-semibold">Contrato Vinculado</th>
                <th className="p-3.5 font-semibold">Portaria DOERJ</th>
                <th className="p-3.5 font-semibold">Data Publicação</th>
                <th className="p-3.5 font-semibold">Período de Atuação</th>
                <th className="p-3.5 font-semibold text-center">Status</th>
                <th className="p-3.5 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ledger-border">
              {paginatedFiscais.length > 0 ? (
                paginatedFiscais.map((f) => (
                  <tr
                    key={f.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      !f.ativo ? 'bg-slate-50/50' : ''
                    }`}
                  >
                    <td className="p-3.5 font-semibold text-ledger-text">
                      <div className="flex items-center gap-1.5">
                        <span>{f.nome}</span>
                        {!f.ativo && (
                          <span className="text-[10px] font-mono text-slate-400 font-normal">
                            (Histórico)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <CodeBadge value={f.id_funcional} />
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono text-[11px] font-semibold text-sempi-plum">
                        {f.funcao}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-[200px]">
                      {f.contratos ? (
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-ledger-text">
                              {f.contratos.numero_contrato || 'Art. 95 (NE)'}
                            </span>
                            <StatusBadge status={f.contratos.status} />
                          </div>
                          <div className="text-[10px] text-ledger-muted truncate mt-0.5">
                            {f.contratos.contratada_razao_social}
                          </div>
                        </div>
                      ) : (
                        <span className="text-ledger-muted font-mono">Contrato Excluído</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-ledger-text">
                      {f.portaria_designacao}
                    </td>
                    <td className="p-3.5 font-mono text-ledger-muted">
                      {formatDate(f.data_publicacao_doerj)}
                    </td>
                    <td className="p-3.5 font-mono text-ledger-muted">
                      {formatDate(f.data_inicio)} até {f.data_fim ? formatDate(f.data_fim) : 'Atual'}
                    </td>
                    <td className="p-3.5 text-center">
                      {f.ativo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-status-vigente font-bold text-[10px] uppercase border border-emerald-200">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] uppercase border border-slate-200">
                          Substituído
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && f.contratos && (
                          <EditarFiscalDrawer contratoId={f.contratos.id} fiscal={f} />
                        )}
                        {f.contratos && (
                          <Link
                            href={`/contratos/${f.contratos.id}#fiscais`}
                            className="inline-flex items-center gap-0.5 text-xs text-sempi-plum hover:text-sempi-plum-hover font-semibold px-2 py-1 rounded hover:bg-sempi-plum/5 transition-colors"
                          >
                            <span>Dossiê</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-xs text-ledger-muted font-mono">
                    Nenhum servidor encontrado com os filtros aplicados.
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
