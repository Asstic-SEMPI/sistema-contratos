import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth/get-user-profile';
import { HairlineCard } from '@/components/ui-ledger/HairlineCard';
import { CodeBadge } from '@/components/ui-ledger/CodeBadge';
import { AuditDiffModal } from '@/components/auditoria/AuditDiffModal';
import { formatDate } from '@/lib/utils';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  History,
  Lock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { Database } from '@/lib/types/database.types';
import { AuditoriaTableClient } from '@/components/auditoria/AuditoriaTableClient';

interface AuditoriaPageProps {
  searchParams: Promise<{
    tabela?: string;
    acao?: string;
    q?: string;
  }>;
}

type AuditLogComPerfil = Database['public']['Tables']['audit_logs']['Row'] & {
  perfis_usuarios: Database['public']['Tables']['perfis_usuarios']['Row'] | null;
};

export default async function AuditoriaPage({ searchParams }: AuditoriaPageProps) {
  const { tabela = 'TODAS', acao = 'TODAS', q = '' } = await searchParams;
  const { user, profile } = await getUserProfile();
  const supabase = await createClient();

  // Verificação de permissão estrita (Apenas ADMIN e CONSULTA_TCE)
  const isAuthorized = profile && ['ADMIN', 'CONSULTA_TCE'].includes(profile.role);

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-4">
        <HairlineCard title="Acesso Restrito — Controle & Auditoria Governamental">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3 text-status-anomalia font-mono text-sm font-bold">
              <Lock className="w-5 h-5 shrink-0" />
              <span>Permissão Insuficiente para Trilha de Auditoria Forense</span>
            </div>
            <p className="text-xs text-slate-700 font-sans leading-relaxed">
              A consulta direta à tabela imutável de logs de auditoria (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">public.audit_logs</code>) é de uso restrito a órgãos de controle interno e externo (CGE-RJ, TCE-RJ) e administradores de segurança do SGC-SEMPI.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-sempi-plum text-white text-xs font-mono uppercase font-semibold rounded-lg hover:bg-sempi-plum-hover transition-colors shadow-xs"
              >
                <span>Retornar ao Painel Principal</span>
              </Link>
            </div>
          </div>
        </HairlineCard>
      </div>
    );
  }

  // Montagem da query
  const { data: rawLogs } = await (
    supabase.from('audit_logs') as unknown as {
      select: (cols: string) => {
        order: (col: string, opt: { ascending: boolean }) => {
          limit: (n: number) => Promise<{ data: AuditLogComPerfil[] | null }>;
        };
      };
    }
  )
    .select(`
      *,
      perfis_usuarios (*)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  const logs = rawLogs || [];

  // Filtros em memória
  const logsFiltrados = logs.filter((log) => {
    const matchTabela = tabela === 'TODAS' || log.tabela_afetada === tabela;
    const matchAcao = acao === 'TODAS' || log.acao === acao;
    const matchBusca =
      !q ||
      log.tabela_afetada.toLowerCase().includes(q.toLowerCase()) ||
      log.registro_id.toLowerCase().includes(q.toLowerCase()) ||
      (log.perfis_usuarios?.nome_completo || '').toLowerCase().includes(q.toLowerCase()) ||
      (log.campos_alterados || []).some((c) => c.toLowerCase().includes(q.toLowerCase()));

    return matchTabela && matchAcao && matchBusca;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ledger-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
              Controle Interno e Integridade Governamental
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sempi-teal/10 text-sempi-teal border border-sempi-teal/20 text-[10px] font-mono font-bold">
              <ShieldCheck className="w-3 h-3" />
              <span>TRILHA IMUTÁVEL (RLS)</span>
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-ledger-text tracking-tight mt-0.5">
            Trilha de Auditoria Forense
          </h1>
        </div>

        <div className="text-left sm:text-right font-mono text-xs text-ledger-muted">
          <span>Servidor Ativo: </span>
          <span className="font-bold text-sempi-plum">{profile?.nome_completo}</span>
          <span className="block text-[10px]">Perfil: {profile?.role}</span>
        </div>
      </div>

      {/* Cartão de Informação de Segurança */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-start gap-3 text-xs">
        <div className="w-7 h-7 rounded-lg bg-sempi-plum/10 flex items-center justify-center text-sempi-plum shrink-0 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="font-sans text-slate-700 leading-relaxed">
          <span className="font-bold font-mono uppercase text-sempi-plum block text-[11px] mb-0.5">
            Garantia de Imutabilidade e Rastreabilidade Absoluta (CGE-RJ / TCE-RJ)
          </span>
          Todas as inserções, edições e exclusões realizadas em contratos, termos aditivos, fiscais, notas de empenho, eventos do SIAFE e atas são capturadas automaticamente em nível de banco de dados via Trigger <code className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">fn_process_audit_log</code>. Nenhuma alteração manual é permitida nesta trilha.
        </div>
      </div>

      {/* Tabela Paginada e Exportável */}
      <AuditoriaTableClient logs={logs} />
    </div>
  );
}
