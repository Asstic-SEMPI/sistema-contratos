import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { HairlineCard } from '@/components/ui-ledger/HairlineCard';
import { CodeBadge } from '@/components/ui-ledger/CodeBadge';
import { StatusBadge } from '@/components/ui-ledger/StatusBadge';
import { MoneyCell } from '@/components/ui-ledger/MoneyCell';
import { ReguaTemporalVigencia } from '@/components/contratos/ReguaTemporalVigencia';
import { ReguaEvolucaoValor } from '@/components/contratos/ReguaEvolucaoValor';
import { NovoAditivoDrawer } from '@/components/contratos/NovoAditivoDrawer';
import { EditarContratoDrawer } from '@/components/contratos/EditarContratoDrawer';
import { EditarAditivoDrawer } from '@/components/contratos/EditarAditivoDrawer';
import { NovoFiscalDrawer } from '@/components/contratos/NovoFiscalDrawer';
import { EditarFiscalDrawer } from '@/components/contratos/EditarFiscalDrawer';
import { TabelaEmpenhosTree } from '@/components/contratos/TabelaEmpenhosTree';
import { formatDate, formatCNPJ, formatPercent, getDiasAteVencimento } from '@/lib/utils';
import {
  FileText,
  Building2,
  Calendar,
  Layers,
  Users,
  DollarSign,
  ArrowLeft,
  AlertTriangle,
  Info,
  Clock,
  Plus,
} from 'lucide-react';
import type { Database } from '@/lib/types/database.types';
import { getUserProfile } from '@/lib/auth/get-user-profile';

interface DossiêContratoPageProps {
  params: Promise<{
    id: string;
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

type ContratoCompleto = Database['public']['Tables']['contratos']['Row'] & {
  atas_registro_preco: Database['public']['Tables']['atas_registro_preco']['Row'] | null;
  alteracoes_contratuais: Database['public']['Tables']['alteracoes_contratuais']['Row'][];
  financeiro_empenhos: (Database['public']['Tables']['financeiro_empenhos']['Row'] & {
    financeiro_empenhos_eventos: Database['public']['Tables']['financeiro_empenhos_eventos']['Row'][];
    financeiro_liquidacoes: Database['public']['Tables']['financeiro_liquidacoes']['Row'][];
  })[];
  contrato_fiscais: Database['public']['Tables']['contrato_fiscais']['Row'][];
};

export default async function DossiêContratoPage({ params }: DossiêContratoPageProps) {
  const { id } = await params;
  const { profile } = await getUserProfile();
  const canEdit = profile ? profile.role !== 'CONSULTA_TCE' : false;
  const supabase = await createClient();

  // Busca os dados completos do contrato e seus relacionamentos
  const { data: rawContrato, error } = await supabase
    .from('contratos')
    .select(`
      *,
      atas_registro_preco (
        id,
        numero_ata,
        processo_sei,
        objeto,
        data_vigencia_fim,
        orgao_gerenciador
      ),
      alteracoes_contratuais (
        *
      ),
      financeiro_empenhos (
        *,
        financeiro_empenhos_eventos (*),
        financeiro_liquidacoes (*)
      ),
      contrato_fiscais (
        *
      )
    `)
    .eq('id', id)
    .single();

  if (error || !rawContrato) {
    notFound();
  }

  const contrato = rawContrato as unknown as ContratoCompleto;

  const alteracoes = (contrato.alteracoes_contratuais || []).sort(
    (a, b) => new Date(a.data_assinatura).getTime() - new Date(b.data_assinatura).getTime()
  );

  const empenhos = contrato.financeiro_empenhos || [];
  const fiscais = (contrato.contrato_fiscais || []).sort(
    (a, b) => (a.ativo === b.ativo ? 0 : a.ativo ? -1 : 1)
  );

  // Cálculos financeiros e Teto Legal do Art. 125 da Lei 14.133/2021
  const isContinuo = contrato.tipo_contrato === 'CONTINUO';
  const diferencaTotalBruta = contrato.valor_atualizado - contrato.valor_inicial;

  // Em contratos contínuos, renovação de vigência (Art. 106/107) NÃO consome o teto de 25%.
  // Apenas acréscimos quantitativos ou qualitativos consomem a margem legal sobre o Valor Base.
  const acrescimoQueConsomeTetoTotal = alteracoes.reduce((acc, alt) => {
    const valorDif = Number(alt.valor_diferenca) || 0;
    if (isContinuo) {
      if (alt.tipo === 'ADITIVO_PRAZO') {
        return acc;
      }
      if (alt.tipo === 'ADITIVO_MISTO') {
        const acrescimoQualitativo = Math.max(0, valorDif - contrato.valor_inicial);
        return acc + acrescimoQualitativo;
      }
      if (alt.tipo === 'ADITIVO_VALOR') {
        return acc + valorDif;
      }
      return acc;
    } else {
      if (alt.tipo === 'ADITIVO_VALOR' || alt.tipo === 'ADITIVO_MISTO') {
        return acc + valorDif;
      }
      return acc;
    }
  }, 0);

  const percentualConsumoTetoLegal =
    contrato.valor_inicial > 0
      ? (acrescimoQueConsomeTetoTotal / contrato.valor_inicial) * 100
      : 0;

  const totalEmpenhadoLiquido = empenhos.reduce(
    (acc, e) => acc + (Number(e.saldo_empenho_liquido) || 0),
    0
  );

  const totalLiquidado = empenhos.reduce((acc, e) => {
    const liqs = e.financeiro_liquidacoes || [];
    return acc + liqs.reduce((sub, l) => sub + Number(l.valor_liquidado), 0);
  }, 0);

  const saldoContratualNaoEmpenhado = contrato.valor_atualizado - totalEmpenhadoLiquido;

  // Verificação de Contrato Acéfalo
  const gestorAtivo = fiscais.some((f) => f.ativo && f.funcao === 'GESTOR');
  const fiscalTecnicoAtivo = fiscais.some((f) => f.ativo && f.funcao === 'FISCAL_TECNICO');
  const isAcefalo = contrato.status === 'VIGENTE' && (!gestorAtivo || !fiscalTecnicoAtivo);

  const diasRestantes = getDiasAteVencimento(contrato.data_vigencia_fim_atual);

  return (
    <div className="space-y-6">
      {/* Botão Voltar, Breadcrumb e Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/contratos"
            className="p-2 border border-slate-200 rounded-lg hover:bg-white text-slate-500 hover:text-slate-900 shadow-xs transition-colors"
            title="Voltar para a listagem"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="text-xs font-mono text-slate-500 flex items-center gap-1.5 flex-wrap">
            <span>Contratos</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold">
              {contrato.numero_contrato || 'Art. 95 (Empenho)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && <EditarContratoDrawer contrato={contrato} />}
          <StatusBadge tipoFormalizacao={contrato.tipo_formalizacao} />
          <StatusBadge status={contrato.status} diasRestantes={diasRestantes} />
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
            contrato.tipo_contrato === 'CONTINUO'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-purple-50 text-purple-700 border-purple-200'
          }`}>
            {formatTipoContrato(contrato.tipo_contrato)}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {formatTipoLicitacao(contrato.tipo_licitacao)}
          </span>
          {contrato.emergencial && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              <span>EMERGENCIAL</span>
            </span>
          )}
        </div>
      </div>

      {/* Alerta de Contratação Emergencial */}
      {contrato.emergencial && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-3 shadow-xs">
          <div className="p-2 bg-rose-600 text-white rounded-lg shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold uppercase tracking-tight block text-rose-900 text-[11px] mb-0.5">
              Contratação de Caráter Emergencial — Art. 75, VIII da Lei Federal nº 14.133/2021
            </span>
            <span className="text-rose-700 leading-relaxed block">
              Instrumento formalizado por dispensa emergencial/calamidade pública. A vigência é limitada ao prazo máximo improrrogável de até 1 (um) ano a contar da data de sua formalização.
            </span>
          </div>
        </div>
      )}

      {/* Alerta de Contrato Acéfalo */}
      {isAcefalo && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-600 text-white rounded-lg shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold uppercase tracking-tight block text-xs text-red-900">
                Alerta de Irregularidade Administrativa: Contrato Acéfalo
              </span>
              <span className="text-xs text-red-700">
                Este contrato vigente não possui {!gestorAtivo && 'Gestor'} {!gestorAtivo && !fiscalTecnicoAtivo && 'nem'} {!fiscalTecnicoAtivo && 'Fiscal Técnico'} formalmente designado e ativo.
              </span>
            </div>
          </div>
          <a
            href="#fiscais"
            className="px-4 py-1.5 bg-red-600 text-white font-bold rounded-lg uppercase text-xs hover:bg-red-700 transition-colors shrink-0 shadow-xs"
          >
            Designar Fiscal
          </a>
        </div>
      )}

      {/* Cabeçalho Executivo do Dossiê Contemporâneo */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Instrumento Contratual
              </span>
              <span className="text-base sm:text-lg font-serif font-bold text-sempi-plum">
                {contrato.numero_contrato || 'Nota de Empenho Substitutiva (Art. 95)'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {contrato.contratada_razao_social}
            </h1>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <CodeBadge value={contrato.processo_sei} label="SEI-RJ" />
              <CodeBadge value={contrato.chave_siga_contrato} label="Chave SIGA" />
              <CodeBadge value={formatCNPJ(contrato.contratada_cnpj)} label="CNPJ" />
              {contrato.atas_registro_preco && (
                <CodeBadge
                  value={`ARP ${contrato.atas_registro_preco.numero_ata}`}
                  label="Origem"
                />
              )}
            </div>
          </div>

          {/* Cards de Resumo Financeiro no Cabeçalho */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl min-w-[220px]">
              <div className="text-[11px] font-mono uppercase text-slate-500 font-semibold mb-1">
                Valor Atualizado (Total)
              </div>
              <MoneyCell value={contrato.valor_atualizado} size="lg" />
              <div className="text-[11px] font-mono text-slate-400 mt-1">
                Início: {formatDate(contrato.data_vigencia_inicio_original)}
              </div>
            </div>

            {/* Alerta de Percentual Acumulado de Aditivos (Art. 125 Lei 14.133) */}
            {alteracoes.length > 0 && (
              <div
                className={`p-3 border rounded-xl text-xs font-mono space-y-1 ${
                  percentualConsumoTetoLegal > 25
                    ? 'border-red-200 bg-red-50 text-red-800 font-bold'
                    : 'border-teal-200 bg-teal-50 text-teal-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[11px] uppercase tracking-tight">
                    {isContinuo ? 'Acréscimo Art. 125:' : 'Variação por Aditivos:'}
                  </span>
                  <span className="font-bold tabular-nums">
                    {percentualConsumoTetoLegal > 0 ? '+' : ''}
                    {formatPercent(percentualConsumoTetoLegal)}
                  </span>
                </div>

                {percentualConsumoTetoLegal > 25 ? (
                  <div className="text-[10px] text-red-700 font-bold uppercase pt-0.5">
                    ⚠️ Limite legal de 25% excedido (Art. 125)
                  </div>
                ) : (
                  <div className="text-[10px] text-teal-700 font-medium leading-tight">
                    {isContinuo && diferencaTotalBruta > acrescimoQueConsomeTetoTotal ? (
                      <span>
                        Prorrogação de ciclo contínuo não consome teto de 25%
                      </span>
                    ) : (
                      <span>Regular (Dentro do teto legal de 25%)</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Objeto */}
        <div className="border-t border-slate-100 pt-4">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">
            Objeto do Instrumento:
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
            {contrato.objeto}
          </p>
        </div>

        {/* Grade de Vigência e Execução */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 text-xs font-mono border-t border-slate-100">
          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">1) Tipo Contrato:</span>
            <span className="font-bold text-slate-800 text-xs sm:text-sm">{formatTipoContrato(contrato.tipo_contrato)}</span>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">2) Licitação:</span>
            <span className="font-semibold text-slate-800 text-xs sm:text-sm truncate block" title={formatTipoLicitacao(contrato.tipo_licitacao)}>
              {formatTipoLicitacao(contrato.tipo_licitacao)}
            </span>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">3) Emergencial:</span>
            <span className={`font-bold text-xs sm:text-sm ${contrato.emergencial ? 'text-rose-700' : 'text-slate-600'}`}>
              {contrato.emergencial ? 'Sim (Art. 75, VIII)' : 'Não'}
            </span>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Vigência Início:</span>
            <span className="font-semibold text-slate-800 text-xs sm:text-sm">{formatDate(contrato.data_vigencia_inicio_original)}</span>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Vigência Fim Atual:</span>
            <span className="font-semibold text-sempi-plum text-xs sm:text-sm">{formatDate(contrato.data_vigencia_fim_atual)}</span>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Empenhado:</span>
            <MoneyCell value={totalEmpenhadoLiquido} size="sm" />
          </div>
        </div>
      </div>

      {/* Régua Temporal (Vigência x Chave SIGA / SIAFE-Rio) */}
      <ReguaTemporalVigencia
        vigenciaInicioOriginal={contrato.data_vigencia_inicio_original}
        vigenciaFimOriginal={contrato.data_vigencia_fim_original}
        vigenciaFimAtual={contrato.data_vigencia_fim_atual}
        aditivosPrazo={alteracoes}
        empenhos={empenhos}
      />

      {/* Régua de Evolução Financeira do Valor ao Longo dos Termos */}
      <ReguaEvolucaoValor
        valorInicial={contrato.valor_inicial}
        valorAtualizado={contrato.valor_atualizado}
        tipoContrato={contrato.tipo_contrato}
        alteracoes={alteracoes}
      />

      {/* Seção 1: Alterações Contratuais (Aditivos e Apostilamentos) */}
      <HairlineCard
        title={`Alterações Contratuais (${alteracoes.length})`}
        subtitle="Termos aditivos de prazo, valor, mistos e apostilamentos"
        action={
          canEdit ? (
            <NovoAditivoDrawer
              contratoId={contrato.id}
              tipoFormalizacao={contrato.tipo_formalizacao}
              tipoContrato={contrato.tipo_contrato}
              valorInicial={contrato.valor_inicial}
              valorAtualizado={contrato.valor_atualizado}
              vigenciaFimAtual={contrato.data_vigencia_fim_atual}
            />
          ) : undefined
        }
        noPadding
      >
        <div className="table-responsive-container">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                <th className="p-3.5 pl-5">Procedimento</th>
                <th className="p-3.5">Tipo</th>
                <th className="p-3.5">Processo SEI</th>
                <th className="p-3.5">Data Assinatura</th>
                <th className="p-3.5">Nova Vigência</th>
                <th className="p-3.5 text-right">Variação de Valor</th>
                <th className="p-3.5">Publicação DOERJ</th>
                <th className="p-3.5 pr-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alteracoes.length > 0 ? (
                alteracoes.map((alt) => (
                  <tr key={alt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 pl-5 font-bold font-mono text-slate-900">{alt.procedimento}</td>
                    <td className="p-3.5">
                      <span className="inline-block px-2 py-0.5 border border-slate-200 rounded-md text-[10px] font-mono bg-slate-50 font-semibold text-slate-700">
                        {alt.tipo}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <CodeBadge value={alt.processo_sei} />
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">{formatDate(alt.data_assinatura)}</td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {alt.vigencia_termo_fim
                        ? `${formatDate(alt.vigencia_termo_inicio)} a ${formatDate(alt.vigencia_termo_fim)}`
                        : '—'}
                    </td>
                    <td className="p-3.5 text-right font-mono tabular-nums font-semibold">
                      <MoneyCell
                        value={alt.valor_diferenca}
                        prefix={alt.valor_diferenca > 0 ? '+' : ''}
                      />
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">
                      {alt.publicacao_doerj_data
                        ? `${formatDate(alt.publicacao_doerj_data)} ${alt.publicacao_doerj_pagina ? `(p. ${alt.publicacao_doerj_pagina})` : ''}`
                        : 'Pendente'}
                    </td>
                    <td className="p-3.5 pr-5 text-center">
                      {canEdit ? (
                        <EditarAditivoDrawer
                          contratoId={contrato.id}
                          alteracao={alt}
                          tipoContrato={contrato.tipo_contrato}
                          valorInicialContrato={contrato.valor_inicial}
                          valorAtualizadoContrato={contrato.valor_atualizado}
                          dataVigenciaFimAtual={contrato.data_vigencia_fim_atual}
                        />
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-xs text-slate-400 font-mono">
                    Nenhuma alteração contratual registrada para este instrumento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </HairlineCard>

      {/* Seção 2: Execução Orçamentária e Financeira (SIAFE-Rio) */}
      <HairlineCard
        title={`Notas de Empenho SIAFE-Rio & Execução Financeira (${empenhos.length})`}
        subtitle="Empenhos originais, eventos de reforço/anulação e notas fiscais liquidadas"
        noPadding
      >
        <div className="p-3 sm:p-5">
          <TabelaEmpenhosTree
            contratoId={contrato.id}
            empenhos={empenhos}
            aditivos={alteracoes}
            dataVigenciaFimAtual={contrato.data_vigencia_fim_atual}
          />
        </div>
      </HairlineCard>

      {/* Seção 3: Comissão de Fiscalização & Portarias DOERJ */}
      <div id="fiscais">
        <HairlineCard
          title={`Comissão de Fiscalização e Gestão (${fiscais.length})`}
          subtitle="Servidores designados por Portaria publicada no Diário Oficial (DOERJ)"
          action={
            canEdit ? (
              <NovoFiscalDrawer
                contratoId={contrato.id}
                fiscaisAtivos={fiscais.filter((f) => f.ativo)}
              />
            ) : undefined
          }
          noPadding
        >
          <div className="table-responsive-container">
            <table className="w-full text-left border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                  <th className="p-3.5 pl-5">Servidor</th>
                  <th className="p-3.5">ID Funcional</th>
                  <th className="p-3.5">Função</th>
                  <th className="p-3.5">Portaria DOERJ</th>
                  <th className="p-3.5">Publicação DOERJ</th>
                  <th className="p-3.5">Período de Atuação</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 pr-5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fiscais.length > 0 ? (
                  fiscais.map((fiscal) => (
                    <tr
                      key={fiscal.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !fiscal.ativo ? 'bg-slate-50/50' : ''
                      }`}
                    >
                      <td className="p-3.5 pl-5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{fiscal.nome}</span>
                          {!fiscal.ativo && (
                            <span className="text-[10px] font-mono text-slate-400 font-normal">
                              (Histórico)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <CodeBadge value={fiscal.id_funcional} />
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-xs font-bold text-sempi-plum">
                          {fiscal.funcao}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">{fiscal.portaria_designacao}</td>
                      <td className="p-3.5 font-mono text-slate-500">{formatDate(fiscal.data_publicacao_doerj)}</td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {formatDate(fiscal.data_inicio)} até {fiscal.data_fim ? formatDate(fiscal.data_fim) : 'Atual'}
                      </td>
                      <td className="p-3.5 text-center">
                        {fiscal.ativo ? (
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] uppercase rounded-full shadow-xs">
                            Ativo
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 text-[10px] uppercase rounded-full">
                            Substituído
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 pr-5 text-center">
                        {canEdit ? (
                          <EditarFiscalDrawer contratoId={contrato.id} fiscal={fiscal} />
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-red-600 font-mono">
                      Nenhum fiscal designado para este contrato. Contrato acéfalo!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </HairlineCard>
      </div>
    </div>
  );
}
