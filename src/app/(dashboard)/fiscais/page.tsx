import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { HairlineCard } from '@/components/ui-ledger/HairlineCard';
import { CodeBadge } from '@/components/ui-ledger/CodeBadge';
import { StatusBadge } from '@/components/ui-ledger/StatusBadge';
import { EditarFiscalDrawer } from '@/components/contratos/EditarFiscalDrawer';
import { formatDate } from '@/lib/utils';
import { Users, UserCheck, ShieldCheck, ArrowUpRight, Search, FileText } from 'lucide-react';
import { getUserProfile } from '@/lib/auth/get-user-profile';
import { FiscaisTableClient } from '@/components/fiscais/FiscaisTableClient';
import type { Database } from '@/lib/types/database.types';

interface FiscaisPageProps {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}

type FiscalComContrato = Database['public']['Tables']['contrato_fiscais']['Row'] & {
  contratos: Pick<
    Database['public']['Tables']['contratos']['Row'],
    'id' | 'numero_contrato' | 'tipo_formalizacao' | 'processo_sei' | 'contratada_razao_social' | 'status'
  > | null;
};

export default async function FiscaisPage() {
  const { profile } = await getUserProfile();
  const supabase = await createClient();

  // Busca todos os fiscais com os dados dos respectivos contratos
  const { data: rawFiscais } = await supabase
    .from('contrato_fiscais')
    .select(`
      *,
      contratos (
        id,
        numero_contrato,
        tipo_formalizacao,
        processo_sei,
        contratada_razao_social,
        status
      )
    `)
    .order('data_inicio', { ascending: false });

  const fiscais = (rawFiscais || []) as unknown as FiscalComContrato[];

  // Métricas do Quadro
  const totalFiscaisAtivos = fiscais.filter((f) => f.ativo).length;
  const totalGestores = fiscais.filter((f) => f.ativo && f.funcao === 'GESTOR').length;
  const totalFiscaisTecnicos = fiscais.filter((f) => f.ativo && f.funcao === 'FISCAL_TECNICO').length;
  const totalFiscaisAdmin = fiscais.filter((f) => f.ativo && f.funcao === 'FISCAL_ADMINISTRATIVO').length;

  // Carga por servidor (Agrupamento por ID Funcional)
  const cargaPorServidorMap = new Map<string, { nome: string; count: number; funcoes: Set<string> }>();
  fiscais.forEach((f) => {
    if (!f.ativo) return;
    const existing = cargaPorServidorMap.get(f.id_funcional) || {
      nome: f.nome,
      count: 0,
      funcoes: new Set<string>(),
    };
    existing.count += 1;
    existing.funcoes.add(f.funcao);
    cargaPorServidorMap.set(f.id_funcional, existing);
  });

  const topFiscaisCarga = Array.from(cargaPorServidorMap.entries())
    .map(([idFuncional, dados]) => ({
      idFuncional,
      nome: dados.nome,
      count: dados.count,
      funcoes: Array.from(dados.funcoes).join(', '),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="border-b border-ledger-border pb-4">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ledger-muted mb-1">
          <span>Governança & Comissões</span>
          <span>/</span>
          <span className="text-sempi-plum font-semibold">Diário Oficial (DOERJ)</span>
        </div>
        <h1 className="text-2xl font-serif font-bold text-ledger-text tracking-tight">
          Quadro Geral de Comissões de Fiscalização e Gestão
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          Acompanhamento das Portarias publicadas, carga de trabalho por servidor e histórico de substituições.
        </p>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HairlineCard className="p-4 bg-white">
          <div className="flex items-center justify-between text-xs text-ledger-muted font-mono uppercase mb-2">
            <span>Fiscais Ativos</span>
            <div className="w-7 h-7 rounded-lg bg-sempi-plum/10 flex items-center justify-center text-sempi-plum">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-ledger-text">
            {totalFiscaisAtivos}
          </div>
          <div className="text-[11px] text-ledger-muted mt-1">
            Total de designações em vigor
          </div>
        </HairlineCard>

        <HairlineCard className="p-4 bg-white">
          <div className="flex items-center justify-between text-xs text-ledger-muted font-mono uppercase mb-2">
            <span>Gestores de Contrato</span>
            <div className="w-7 h-7 rounded-lg bg-sempi-teal/10 flex items-center justify-center text-sempi-teal">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-sempi-teal">
            {totalGestores}
          </div>
          <div className="text-[11px] text-ledger-muted mt-1">
            Coordenação administrativa ativa
          </div>
        </HairlineCard>

        <HairlineCard className="p-4 bg-white">
          <div className="flex items-center justify-between text-xs text-ledger-muted font-mono uppercase mb-2">
            <span>Fiscais Técnicos</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-status-vigente">
            {totalFiscaisTecnicos}
          </div>
          <div className="text-[11px] text-ledger-muted mt-1">
            Atesto técnico de execução
          </div>
        </HairlineCard>

        <HairlineCard className="p-4 bg-white">
          <div className="flex items-center justify-between text-xs text-ledger-muted font-mono uppercase mb-2">
            <span>Fiscais Administrativos</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-ledger-text">
            {totalFiscaisAdmin}
          </div>
          <div className="text-[11px] text-ledger-muted mt-1">
            Atesto de encargos e certidões
          </div>
        </HairlineCard>
      </div>

      {/* Painel de Carga por Servidor (Top Fiscais) */}
      {topFiscaisCarga.length > 0 && (
        <HairlineCard
          title="Carga de Contratos por Servidor (Top 5 Ativos)"
          subtitle="Identificação de servidores com maior concentração de fiscalizações na SEMPI-RJ"
          noPadding
        >
          <div className="divide-y divide-ledger-border">
            {topFiscaisCarga.map((item, idx) => (
              <div
                key={item.idFuncional}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/70 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-ledger-muted text-sm w-5">
                    {idx + 1}.
                  </span>
                  <div>
                    <span className="font-semibold text-ledger-text">{item.nome}</span>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <CodeBadge value={item.idFuncional} label="ID Funcional" />
                      <span className="text-[11px] text-ledger-muted font-mono">
                        Atuação: {item.funcoes}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono ml-8 sm:ml-0">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-sempi-plum/10 text-sempi-plum font-bold text-xs border border-sempi-plum/20">
                    {item.count} {item.count === 1 ? 'Contrato' : 'Contratos'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </HairlineCard>
      )}

      {/* DataGrid Denso e Paginado do Quadro Geral de Fiscais com Exportação CSV */}
      <FiscaisTableClient
        fiscais={fiscais}
        canEdit={profile ? profile.role !== 'CONSULTA_TCE' : false}
      />
    </div>
  );
}
