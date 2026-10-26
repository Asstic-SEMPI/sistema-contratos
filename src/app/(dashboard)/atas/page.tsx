import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { HairlineCard } from '@/components/ui-ledger/HairlineCard';
import { CodeBadge } from '@/components/ui-ledger/CodeBadge';
import { StatusBadge } from '@/components/ui-ledger/StatusBadge';
import { NovaAtaDrawer } from '@/components/atas/NovaAtaDrawer';
import { formatDate, getDiasAteVencimento } from '@/lib/utils';
import {
  Layers,
  ShieldCheck,
  Share2,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  Package,
} from 'lucide-react';
import type { Database } from '@/lib/types/database.types';

import { getUserProfile } from '@/lib/auth/get-user-profile';
import { AtasTableClient } from '@/components/atas/AtasTableClient';

interface AtasPageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

type AtaComItens = Database['public']['Tables']['atas_registro_preco']['Row'] & {
  atas_itens: Database['public']['Tables']['atas_itens']['Row'][];
};

export default async function AtasPage({ searchParams }: AtasPageProps) {
  const { tab = 'gerenciadas' } = await searchParams;
  const { profile } = await getUserProfile();
  const supabase = await createClient();

  // Busca todas as atas com a contagem e detalhes de itens
  const { data: rawAtas } = await supabase
    .from('atas_registro_preco')
    .select(`
      *,
      atas_itens (
        id,
        item_numero,
        valor_unitario,
        qtd_cota_secretaria,
        qtd_empenhada_secretaria,
        saldo_disponivel
      )
    `)
    .order('created_at', { ascending: false });

  const atas = (rawAtas || []) as unknown as AtaComItens[];

  const atasGerenciadas = atas.filter((a) => a.papel_secretaria === 'GERENCIADOR');
  const atasParticipantes = atas.filter((a) => a.papel_secretaria === 'PARTICIPANTE');
  const totalItensGlobal = atas.reduce((acc, a) => acc + (a.atas_itens?.length || 0), 0);

  const canCreate = profile && profile.role !== 'CONSULTA_TCE';

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ledger-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
              Módulo de Atas de Registro de Preços — Lei Federal nº 14.133/2021
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-sempi-teal/10 text-sempi-teal border border-sempi-teal/20">
              SRP
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-ledger-text tracking-tight mt-0.5">
            Atas de Registro de Preços (SRP)
          </h1>
        </div>
        {canCreate && (
          <div className="shrink-0">
            <NovaAtaDrawer />
          </div>
        )}
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HairlineCard className="p-4 bg-white">
          <div className="flex items-center justify-between text-xs text-ledger-muted font-mono uppercase mb-2">
            <span>Total de Atas</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-ledger-text">
            {atas.length}
          </div>
          <div className="text-[11px] text-ledger-muted mt-1">
            Instrumentos registrados no SGC
          </div>
        </HairlineCard>

        <HairlineCard className="p-4 bg-white">
          <div className="flex items-center justify-between text-xs text-ledger-muted font-mono uppercase mb-2">
            <span>Atas Gerenciadas</span>
            <div className="w-7 h-7 rounded-lg bg-sempi-plum/10 flex items-center justify-center text-sempi-plum">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-sempi-plum">
            {atasGerenciadas.length}
          </div>
          <div className="text-[11px] text-ledger-muted mt-1">
            Licitação própria SEMPI
          </div>
        </HairlineCard>

        <HairlineCard className="p-4 bg-white">
          <div className="flex items-center justify-between text-xs text-ledger-muted font-mono uppercase mb-2">
            <span>Participantes / Adesões</span>
            <div className="w-7 h-7 rounded-lg bg-sempi-teal/10 flex items-center justify-center text-sempi-teal">
              <Share2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-sempi-teal">
            {atasParticipantes.length}
          </div>
          <div className="text-[11px] text-ledger-muted mt-1">
            Adesões a órgãos externos (Caronas)
          </div>
        </HairlineCard>

        <HairlineCard className="p-4 bg-white">
          <div className="flex items-center justify-between text-xs text-ledger-muted font-mono uppercase mb-2">
            <span>Catálogo SIGA</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-mono tabular-nums font-bold text-ledger-text">
            {totalItensGlobal}
          </div>
          <div className="text-[11px] text-ledger-muted mt-1">
            Itens cadastrados com controle de cota
          </div>
        </HairlineCard>
      </div>

      {/* DataGrid Denso e Paginado de Atas com Exportação CSV */}
      <AtasTableClient atas={atas} initialTab={tab} />
    </div>
  );
}
