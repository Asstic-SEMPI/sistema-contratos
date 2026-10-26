'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CodeBadge } from '@/components/ui-ledger/CodeBadge';
import { StatusBadge } from '@/components/ui-ledger/StatusBadge';
import { MoneyCell } from '@/components/ui-ledger/MoneyCell';
import { Pagination } from '@/components/ui-ledger/Pagination';
import { ExportButton } from '@/components/ui-ledger/ExportButton';
import { formatDate, getDiasAteVencimento, formatCNPJ } from '@/lib/utils';
import { ArrowUpRight, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { Database, UserRole } from '@/lib/types/database.types';

type ContratoListItem = Pick<
  Database['public']['Tables']['contratos']['Row'],
  | 'id'
  | 'numero_contrato'
  | 'tipo_formalizacao'
  | 'tipo_contrato'
  | 'tipo_licitacao'
  | 'emergencial'
  | 'processo_sei'
  | 'chave_siga_contrato'
  | 'contratada_cnpj'
  | 'contratada_razao_social'
  | 'objeto'
  | 'valor_inicial'
  | 'valor_atualizado'
  | 'data_vigencia_inicio_original'
  | 'data_vigencia_fim_atual'
  | 'status'
>;

interface ContratosTableClientProps {
  contratos: ContratoListItem[];
  currentUserRole?: UserRole;
}

const formatTipoLicitacao = (tipo?: string | null) => {
  switch (tipo) {
    case 'PREGAO_ELETRONICO':
      return 'Pregão Eletrônico';
    case 'DISPENSA_LICITACAO':
      return 'Dispensa de Licitação';
    case 'INEXIGIBILIDADE':
      return 'Inexigibilidade';
    case 'CONCORRENCIA':
      return 'Concorrência';
    default:
      return tipo || '—';
  }
};

const formatTipoContrato = (tipo?: string | null) => {
  switch (tipo) {
    case 'CONTINUO':
      return 'Contínuo';
    case 'ESCOPO':
      return 'Escopo';
    default:
      return tipo || '—';
  }
};

export function ContratosTableClient({ contratos, currentUserRole }: ContratosTableClientProps) {
  // Paginação (Default 10 por página)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedContratos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return contratos.slice(start, start + pageSize);
  }, [contratos, currentPage, pageSize]);

  const exportColumns = [
    { header: 'Nº Contrato / Instrumento', accessor: (c: ContratoListItem) => c.numero_contrato || 'Art. 95 (NE)' },
    { header: 'Tipo Formalização', accessor: (c: ContratoListItem) => c.tipo_formalizacao },
    { header: 'Processo SEI', accessor: (c: ContratoListItem) => c.processo_sei },
    { header: 'Chave SIGA', accessor: (c: ContratoListItem) => c.chave_siga_contrato || '' },
    { header: 'CNPJ Contratada', accessor: (c: ContratoListItem) => formatCNPJ(c.contratada_cnpj) },
    { header: 'Razão Social Contratada', accessor: (c: ContratoListItem) => c.contratada_razao_social },
    { header: 'Tipo Contrato', accessor: (c: ContratoListItem) => formatTipoContrato(c.tipo_contrato) },
    { header: 'Modalidade Licitação', accessor: (c: ContratoListItem) => formatTipoLicitacao(c.tipo_licitacao) },
    { header: 'Emergencial (Art. 75, VIII)', accessor: (c: ContratoListItem) => (c.emergencial ? 'SIM' : 'NÃO') },
    { header: 'Valor Inicial', accessor: (c: ContratoListItem) => Number(c.valor_inicial) || 0 },
    { header: 'Valor Atualizado', accessor: (c: ContratoListItem) => Number(c.valor_atualizado) || 0 },
    { header: 'Vigência Início', accessor: (c: ContratoListItem) => formatDate(c.data_vigencia_inicio_original) },
    { header: 'Vigência Fim', accessor: (c: ContratoListItem) => formatDate(c.data_vigencia_fim_atual) },
    { header: 'Status', accessor: (c: ContratoListItem) => c.status },
  ];

  return (
    <div className="space-y-3">
      {/* Barra de Ações: Exportar e Totalizadores */}
      <div className="flex items-center justify-between pb-1 px-1">
        <span className="text-xs font-mono text-slate-500">
          Total de instrumentos: <strong className="text-slate-900">{contratos.length}</strong>
        </span>
        <ExportButton
          data={contratos}
          columns={exportColumns}
          filename="contratos_sgc_sempi"
          label="Exportar Lista (CSV)"
        />
      </div>

      <div className="table-responsive-container bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs min-w-[1100px]">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-mono uppercase text-slate-500 tracking-wider">
              <th className="p-3.5 pl-5">Instrumento</th>
              <th className="p-3.5">Processo SEI</th>
              <th className="p-3.5">Chave SIGA</th>
              <th className="p-3.5">Contratada</th>
              <th className="p-3.5 text-center">Tipo Contrato</th>
              <th className="p-3.5">Licitação</th>
              <th className="p-3.5 text-center">Emergencial</th>
              <th className="p-3.5">Vigência Fim</th>
              <th className="p-3.5 text-right">Valor Atualizado</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 pr-5 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedContratos.length > 0 ? (
              paginatedContratos.map((contrato) => {
                const diasRestantes = getDiasAteVencimento(contrato.data_vigencia_fim_atual);

                return (
                  <tr key={contrato.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Instrumento */}
                    <td className="p-3.5 pl-5 font-medium">
                      <div className="flex items-center gap-2">
                        <StatusBadge tipoFormalizacao={contrato.tipo_formalizacao} />
                        <span className="font-mono font-bold text-slate-900">
                          {contrato.numero_contrato || 'Sem Nº Formal'}
                        </span>
                      </div>
                    </td>

                    {/* Processo SEI */}
                    <td className="p-3.5">
                      <CodeBadge value={contrato.processo_sei} />
                    </td>

                    {/* Chave SIGA */}
                    <td className="p-3.5">
                      {contrato.chave_siga_contrato ? (
                        <CodeBadge value={contrato.chave_siga_contrato} />
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">—</span>
                      )}
                    </td>

                    {/* Contratada */}
                    <td className="p-3.5 max-w-[200px]">
                      <div className="font-medium text-slate-900 truncate" title={contrato.contratada_razao_social}>
                        {contrato.contratada_razao_social}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {formatCNPJ(contrato.contratada_cnpj)}
                      </div>
                    </td>

                    {/* Tipo Contrato: Contínuo / Escopo */}
                    <td className="p-3.5 text-center font-mono">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                          contrato.tipo_contrato === 'CONTINUO'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {formatTipoContrato(contrato.tipo_contrato)}
                      </span>
                    </td>

                    {/* Licitação */}
                    <td className="p-3.5">
                      <span className="font-medium text-slate-700 text-xs">
                        {formatTipoLicitacao(contrato.tipo_licitacao)}
                      </span>
                    </td>

                    {/* Emergencial */}
                    <td className="p-3.5 text-center">
                      {contrato.emergencial ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-sm text-[10px] font-bold font-mono border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span>SIM</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">NÃO</span>
                      )}
                    </td>

                    {/* Vigência Fim */}
                    <td className="p-3.5 font-mono">
                      <div className="text-slate-800">{formatDate(contrato.data_vigencia_fim_atual)}</div>
                      <div className="text-[10px] text-slate-400">
                        {diasRestantes > 0 ? `${diasRestantes} dias restantes` : 'Vencido'}
                      </div>
                    </td>

                    {/* Valor Atualizado */}
                    <td className="p-3.5 text-right font-mono tabular-nums font-semibold">
                      <MoneyCell value={contrato.valor_atualizado} />
                    </td>

                    {/* Status */}
                    <td className="p-3.5 text-center">
                      <StatusBadge status={contrato.status} />
                    </td>

                    {/* Ação */}
                    <td className="p-3.5 pr-5 text-right">
                      <Link
                        href={`/contratos/${contrato.id}`}
                        className="inline-flex items-center gap-1 text-xs text-sempi-plum hover:text-sempi-plum-hover font-semibold px-2.5 py-1 rounded-md hover:bg-sempi-plum/5 transition-colors"
                      >
                        <span>Dossiê</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="p-8 text-center text-slate-400 font-mono text-xs">
                  Nenhum contrato encontrado para os parâmetros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginação */}
        <Pagination
          currentPage={currentPage}
          totalRecords={contratos.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
