'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CodeBadge } from '@/components/ui-ledger/CodeBadge';
import { StatusBadge } from '@/components/ui-ledger/StatusBadge';
import { Pagination } from '@/components/ui-ledger/Pagination';
import { ExportButton } from '@/components/ui-ledger/ExportButton';
import { HairlineCard } from '@/components/ui-ledger/HairlineCard';
import { formatDate, getDiasAteVencimento } from '@/lib/utils';
import { Search, Filter, ArrowRight, ShieldCheck, Share2 } from 'lucide-react';
import type { Database } from '@/lib/types/database.types';

type AtaComItens = Database['public']['Tables']['atas_registro_preco']['Row'] & {
  atas_itens: Database['public']['Tables']['atas_itens']['Row'][];
};

interface AtasTableClientProps {
  atas: AtaComItens[];
  initialTab?: string;
}

export function AtasTableClient({ atas, initialTab = 'gerenciadas' }: AtasTableClientProps) {
  const [tab, setTab] = useState<'gerenciadas' | 'participantes'>(
    initialTab === 'participantes' ? 'participantes' : 'gerenciadas'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Separar gerenciadas e participantes
  const atasGerenciadas = useMemo(
    () => atas.filter((a) => a.papel_secretaria === 'GERENCIADOR'),
    [atas]
  );
  const atasParticipantes = useMemo(
    () => atas.filter((a) => a.papel_secretaria === 'PARTICIPANTE'),
    [atas]
  );

  const atasDoTab = tab === 'participantes' ? atasParticipantes : atasGerenciadas;

  // Filtragem
  const atasFiltradas = useMemo(() => {
    return atasDoTab.filter((a) => {
      const matchStatus = statusFilter === 'TODOS' || a.status === statusFilter;
      const q = searchTerm.toLowerCase();
      const matchBusca =
        !q ||
        a.numero_ata.toLowerCase().includes(q) ||
        a.processo_sei.toLowerCase().includes(q) ||
        a.objeto.toLowerCase().includes(q) ||
        a.orgao_gerenciador.toLowerCase().includes(q);

      return matchStatus && matchBusca;
    });
  }, [atasDoTab, statusFilter, searchTerm]);

  // Paginação
  const totalItems = atasFiltradas.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedAtas = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return atasFiltradas.slice(start, start + pageSize);
  }, [atasFiltradas, validCurrentPage, pageSize]);

  // Configuração de exportação CSV
  const exportColumns = [
    { header: 'Número da Ata', accessor: (a: AtaComItens) => a.numero_ata },
    { header: 'Processo SEI', accessor: (a: AtaComItens) => a.processo_sei },
    { header: 'Código SIGA', accessor: (a: AtaComItens) => a.codigo_siga_arp || '' },
    { header: 'Papel SEMPI', accessor: (a: AtaComItens) => a.papel_secretaria },
    { header: 'Órgão Gerenciador', accessor: (a: AtaComItens) => a.orgao_gerenciador },
    { header: 'Objeto', accessor: (a: AtaComItens) => a.objeto },
    {
      header: 'Vigência Fim',
      accessor: (a: AtaComItens) => formatDate(a.data_vigencia_fim),
    },
    {
      header: 'Status',
      accessor: (a: AtaComItens) => a.status,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Seletor de Abas Swiss Ledger */}
      <div className="border-b border-ledger-border overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          <button
            type="button"
            onClick={() => {
              setTab('gerenciadas');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs uppercase tracking-wider font-semibold border-b-2 transition-all cursor-pointer ${
              tab === 'gerenciadas'
                ? 'border-sempi-plum text-sempi-plum bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-ledger-muted hover:text-ledger-text'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Atas Gerenciadas pela SEMPI</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-sempi-plum/10 text-sempi-plum text-[10px] font-bold">
              {atasGerenciadas.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('participantes');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 font-mono text-xs uppercase tracking-wider font-semibold border-b-2 transition-all cursor-pointer ${
              tab === 'participantes'
                ? 'border-sempi-teal text-sempi-teal bg-white shadow-xs rounded-t-lg'
                : 'border-transparent text-ledger-muted hover:text-ledger-text'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Participantes & Caronas Externas</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-sempi-teal/10 text-sempi-teal text-[10px] font-bold">
              {atasParticipantes.length}
            </span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros, Busca e Exportação */}
      <HairlineCard className="p-3 bg-white" noPadding>
        <div className="p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-ledger-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por Número de Ata, Processo SEI, Objeto ou Órgão Gerenciador..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-ledger-border rounded-lg focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 focus:outline-none text-xs font-mono transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-ledger-border rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-ledger-muted" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent focus:outline-none text-xs font-mono uppercase text-ledger-text cursor-pointer"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="VIGENTE">Vigente</option>
                <option value="SUSPENSO">Suspenso</option>
                <option value="CANCELADO">Cancelado</option>
                <option value="ENCERRADO">Encerrado</option>
              </select>
            </div>

            <ExportButton
              data={atasFiltradas}
              columns={exportColumns}
              filename={`atas_${tab}_sempi`}
              label="Exportar"
            />

            {(searchTerm || statusFilter !== 'TODOS') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('TODOS');
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

      {/* Tabela de Dados */}
      <HairlineCard
        title={`Atas ${tab === 'participantes' ? 'Participantes (Adesões)' : 'Gerenciadas'} (${atasFiltradas.length})`}
        subtitle="Registro oficial de preços e controle de cotas"
        noPadding
      >
        <div className="table-responsive-container">
          <table className="w-full text-left border-collapse text-xs min-w-[880px]">
            <thead>
              <tr className="border-b border-ledger-border bg-slate-50 text-[11px] font-mono uppercase text-ledger-muted tracking-wider">
                <th className="p-3.5 font-semibold">Número da Ata</th>
                <th className="p-3.5 font-semibold">Processo SEI-RJ</th>
                <th className="p-3.5 font-semibold">Órgão Gerenciador</th>
                <th className="p-3.5 font-semibold">Objeto do Registro de Preços</th>
                <th className="p-3.5 font-semibold">Vigência</th>
                <th className="p-3.5 font-semibold text-center">Itens</th>
                <th className="p-3.5 font-semibold text-center">Status</th>
                <th className="p-3.5 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ledger-border">
              {paginatedAtas.length > 0 ? (
                paginatedAtas.map((ata) => {
                  const diasFim = getDiasAteVencimento(ata.data_vigencia_fim);
                  const itensCount = ata.atas_itens?.length || 0;

                  return (
                    <tr
                      key={ata.id}
                      className="hover:bg-slate-50/70 transition-colors font-mono"
                    >
                      <td className="p-3.5 font-bold text-ledger-text">
                        <Link
                          href={`/atas/${ata.id}`}
                          className="hover:text-sempi-plum hover:underline"
                        >
                          <CodeBadge value={ata.numero_ata} />
                        </Link>
                        {ata.codigo_siga_arp && (
                          <div className="text-[10px] text-ledger-muted font-normal mt-0.5">
                            SIGA: {ata.codigo_siga_arp}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <CodeBadge value={ata.processo_sei} />
                      </td>
                      <td className="p-3.5 text-ledger-text font-sans text-xs max-w-[180px] truncate font-medium">
                        {ata.orgao_gerenciador}
                      </td>
                      <td className="p-3.5 font-sans text-xs text-ledger-text max-w-[280px]">
                        <p className="line-clamp-2 text-slate-700" title={ata.objeto}>
                          {ata.objeto}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="block font-bold text-ledger-text">
                            {formatDate(ata.data_vigencia_fim)}
                          </span>
                          <span
                            className={`text-[10px] block ${
                              diasFim <= 30
                                ? 'text-status-anomalia font-bold'
                                : diasFim <= 60
                                ? 'text-status-alerta font-bold'
                                : 'text-ledger-muted'
                            }`}
                          >
                            {diasFim > 0 ? `${diasFim} dias restantes` : 'Expirada'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-bold">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[11px]">
                          {itensCount} {itensCount === 1 ? 'item' : 'itens'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <StatusBadge status={ata.status} />
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={`/atas/${ata.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sempi-plum hover:text-sempi-plum-hover font-mono px-2 py-1 rounded hover:bg-sempi-plum/5 transition-colors"
                        >
                          <span>Dossiê</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-xs text-ledger-muted font-mono">
                    Nenhuma Ata de Registro de Preços encontrada para os filtros selecionados.
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
