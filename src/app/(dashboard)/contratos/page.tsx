import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { HairlineCard } from '@/components/ui-ledger/HairlineCard';
import { CodeBadge } from '@/components/ui-ledger/CodeBadge';
import { StatusBadge } from '@/components/ui-ledger/StatusBadge';
import { MoneyCell } from '@/components/ui-ledger/MoneyCell';
import { NovoContratoDrawer } from '@/components/contratos/NovoContratoDrawer';
import { formatDate, formatCNPJ, getDiasAteVencimento } from '@/lib/utils';
import { Search, ArrowUpRight, Filter, AlertTriangle, ShieldAlert } from 'lucide-react';
import { getUserProfile } from '@/lib/auth/get-user-profile';
import { ContratosTableClient } from '@/components/contratos/ContratosTableClient';
import type { Database } from '@/lib/types/database.types';

interface ContratosPageProps {
  searchParams: Promise<{
    q?: string;
    tipo?: string;
    status?: string;
    tipo_contrato?: string;
    tipo_licitacao?: string;
    emergencial?: string;
  }>;
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

export default async function ContratosPage({ searchParams }: ContratosPageProps) {
  const params = await searchParams;
  const q = params.q?.trim().toLowerCase();
  const tipoFilter = params.tipo;
  const statusFilter = params.status;
  const tipoContratoFilter = params.tipo_contrato;
  const tipoLicitacaoFilter = params.tipo_licitacao;
  const emergencialFilter = params.emergencial;

  const supabase = await createClient();
  const [{ profile }, { data: atas }] = await Promise.all([
    getUserProfile(),
    supabase
      .from('atas_registro_preco')
      .select('id, numero_ata, objeto')
      .eq('status', 'VIGENTE')
      .order('numero_ata'),
  ]);

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

  // Busca todos os contratos com as 3 novas colunas
  let query = supabase.from('contratos').select(`
    id,
    numero_contrato,
    tipo_formalizacao,
    tipo_contrato,
    tipo_licitacao,
    emergencial,
    processo_sei,
    chave_siga_contrato,
    contratada_cnpj,
    contratada_razao_social,
    objeto,
    valor_inicial,
    valor_atualizado,
    data_vigencia_inicio_original,
    data_vigencia_fim_atual,
    status
  `);

  if (tipoFilter && tipoFilter !== 'ALL') {
    query = query.eq('tipo_formalizacao', tipoFilter);
  }

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.eq('status', statusFilter);
  }

  if (tipoContratoFilter && tipoContratoFilter !== 'ALL') {
    query = query.eq('tipo_contrato', tipoContratoFilter);
  }

  if (tipoLicitacaoFilter && tipoLicitacaoFilter !== 'ALL') {
    query = query.eq('tipo_licitacao', tipoLicitacaoFilter);
  }

  if (emergencialFilter && emergencialFilter !== 'ALL') {
    query = query.eq('emergencial', emergencialFilter === 'SIM');
  }

  let rawContratos: ContratoListItem[] = [];
  const { data: fetchedContratos, error: queryError } = await query.order('data_vigencia_fim_atual', { ascending: true });

  if (fetchedContratos) {
    rawContratos = fetchedContratos as unknown as ContratoListItem[];
  }

  // Fallback suave enquanto a migration 0003 é executada no Supabase SQL Editor
  if (
    queryError &&
    (queryError.message.includes('tipo_contrato') ||
      queryError.message.includes('emergencial') ||
      queryError.message.includes('tipo_licitacao'))
  ) {
    let fallbackQuery = supabase.from('contratos').select(`
      id,
      numero_contrato,
      tipo_formalizacao,
      processo_sei,
      chave_siga_contrato,
      contratada_cnpj,
      contratada_razao_social,
      objeto,
      valor_inicial,
      valor_atualizado,
      data_vigencia_inicio_original,
      data_vigencia_fim_atual,
      status
    `);
    if (tipoFilter && tipoFilter !== 'ALL') {
      fallbackQuery = fallbackQuery.eq('tipo_formalizacao', tipoFilter);
    }
    if (statusFilter && statusFilter !== 'ALL') {
      fallbackQuery = fallbackQuery.eq('status', statusFilter);
    }
    const res = await fallbackQuery.order('data_vigencia_fim_atual', { ascending: true });
    rawContratos = ((res.data || []) as unknown as any[]).map((c) => ({
      ...c,
      tipo_contrato: 'CONTINUO',
      tipo_licitacao: 'PREGAO_ELETRONICO',
      emergencial: false,
    })) as ContratoListItem[];
  }

  const contratos = rawContratos;

  // Filtro client-side de texto (SEI, SIGA, CNPJ, Razão Social, Número)
  const filteredContratos = contratos.filter((c) => {
    if (!q) return true;
    return (
      (c.numero_contrato && c.numero_contrato.toLowerCase().includes(q)) ||
      c.processo_sei.toLowerCase().includes(q) ||
      c.chave_siga_contrato.toLowerCase().includes(q) ||
      c.contratada_razao_social.toLowerCase().includes(q) ||
      c.contratada_cnpj.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 mb-1">
            <span>Dossiês Contratuais</span>
            <span>/</span>
            <span className="text-sempi-plum font-semibold">Lei nº 14.133/2021</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Contratos Administrativos & Instrumentos Art. 95
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestão de vigências, classificação de execução, modalidades licitatórias e dotações orçamentárias.
          </p>
        </div>

        <div className="shrink-0">
          {profile?.role !== 'CONSULTA_TCE' ? (
            <NovoContratoDrawer atasDisponiveis={atas || []} />
          ) : (
            <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-mono">
              Modo Somente Leitura (TCE/Auditoria)
            </div>
          )}
        </div>
      </div>

      {/* Barra de Filtros e Busca Rápida */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-3 sm:p-4 shadow-xs">
        <form method="GET" className="space-y-3 text-xs">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="q"
                defaultValue={params.q}
                placeholder="Buscar por Processo SEI, Chave SIGA, CNPJ, Razão Social ou Nº..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 transition-all"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="flex-1 sm:flex-none flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <span className="text-[11px] font-sans font-semibold text-slate-500 uppercase">Instrumento:</span>
                <select
                  name="tipo"
                  defaultValue={tipoFilter || 'ALL'}
                  className="bg-transparent text-xs text-slate-800 focus:outline-none py-1 cursor-pointer font-mono"
                >
                  <option value="ALL">Todos os Tipos</option>
                  <option value="CONTRATO_FORMAL">Contrato Formal</option>
                  <option value="NOTA_EMPENHO_FORCA_CONTRATO">Art. 95 (Empenho)</option>
                </select>
              </div>

              <div className="flex-1 sm:flex-none flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <span className="text-[11px] font-sans font-semibold text-slate-500 uppercase">Status:</span>
                <select
                  name="status"
                  defaultValue={statusFilter || 'ALL'}
                  className="bg-transparent text-xs text-slate-800 focus:outline-none py-1 cursor-pointer font-mono"
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="VIGENTE">Vigente</option>
                  <option value="EM_FORMALIZACAO">Em Elaboração</option>
                  <option value="SUSPENSO">Suspenso</option>
                  <option value="ENCERRADO">Encerrado</option>
                  <option value="RESCINDIDO">Cancelado / Rescindido</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
              >
                Filtrar
              </button>
            </div>
          </div>

          {/* Segunda Linha de Filtros: Novas Colunas */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Classificações:
            </span>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <span className="text-[11px] font-sans font-semibold text-slate-500 uppercase">Tipo Contrato:</span>
              <select
                name="tipo_contrato"
                defaultValue={tipoContratoFilter || 'ALL'}
                className="bg-transparent text-xs text-slate-800 focus:outline-none py-1 cursor-pointer font-mono"
              >
                <option value="ALL">Todos (Contínuo/Escopo)</option>
                <option value="CONTINUO">Contínuo</option>
                <option value="ESCOPO">Escopo</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <span className="text-[11px] font-sans font-semibold text-slate-500 uppercase">Licitação:</span>
              <select
                name="tipo_licitacao"
                defaultValue={tipoLicitacaoFilter || 'ALL'}
                className="bg-transparent text-xs text-slate-800 focus:outline-none py-1 cursor-pointer font-mono"
              >
                <option value="ALL">Todas as Modalidades</option>
                <option value="PREGAO_ELETRONICO">Pregão Eletrônico</option>
                <option value="DISPENSA_LICITACAO">Dispensa de Licitação</option>
                <option value="INEXIGIBILIDADE">Inexigibilidade</option>
                <option value="CONCORRENCIA">Concorrência</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <span className="text-[11px] font-sans font-semibold text-slate-500 uppercase">Emergencial:</span>
              <select
                name="emergencial"
                defaultValue={emergencialFilter || 'ALL'}
                className="bg-transparent text-xs text-slate-800 focus:outline-none py-1 cursor-pointer font-mono"
              >
                <option value="ALL">Todos</option>
                <option value="SIM">Sim (Art. 75, VIII)</option>
                <option value="NAO">Não</option>
              </select>
            </div>

            {(tipoContratoFilter || tipoLicitacaoFilter || emergencialFilter || tipoFilter || statusFilter || q) && (
              <Link
                href="/contratos"
                className="text-[11px] text-sempi-plum hover:underline ml-auto font-mono"
              >
                Limpar Filtros
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Grid de Contratos com Paginação e Exportação CSV */}
      <HairlineCard
        title={`Instrumentos Cadastrados (${filteredContratos.length})`}
        subtitle="Listagem consolidada com regime de execução, modalidade licitatória, paginação e exportação"
      >
        <ContratosTableClient
          contratos={filteredContratos}
          currentUserRole={profile?.role}
        />
      </HairlineCard>
    </div>
  );
}
