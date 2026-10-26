import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { HairlineCard } from '@/components/ui-ledger/HairlineCard';
import { CodeBadge } from '@/components/ui-ledger/CodeBadge';
import { StatusBadge } from '@/components/ui-ledger/StatusBadge';
import { MoneyCell } from '@/components/ui-ledger/MoneyCell';
import { NovoItemAtaDrawer } from '@/components/atas/NovoItemAtaDrawer';
import { EditarAtaDrawer } from '@/components/atas/EditarAtaDrawer';
import { EditarItemAtaDrawer } from '@/components/atas/EditarItemAtaDrawer';
import { RegistrarConsumoDrawer } from '@/components/atas/RegistrarConsumoDrawer';
import { formatDate, formatCNPJ, formatCurrency, getDiasAteVencimento } from '@/lib/utils';
import {
  FileText,
  ShieldCheck,
  Share2,
  Calendar,
  Building2,
  Package,
  Layers,
  ArrowLeft,
  Clock,
  TrendingDown,
  Info,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import type { Database } from '@/lib/types/database.types';
import { getUserProfile } from '@/lib/auth/get-user-profile';

interface DossiêAtaPageProps {
  params: Promise<{
    id: string;
  }>;
}

type ItemComConsumos = Database['public']['Tables']['atas_itens']['Row'] & {
  atas_consumo_empenhos: (Database['public']['Tables']['atas_consumo_empenhos']['Row'] & {
    financeiro_empenhos: Database['public']['Tables']['financeiro_empenhos']['Row'] | null;
  })[];
};

type AtaCompleta = Database['public']['Tables']['atas_registro_preco']['Row'] & {
  atas_itens: ItemComConsumos[];
  contratos: Database['public']['Tables']['contratos']['Row'][];
};

export default async function DossiêAtaPage({ params }: DossiêAtaPageProps) {
  const { id } = await params;
  const { profile } = await getUserProfile();
  const canEdit = profile ? profile.role !== 'CONSULTA_TCE' : false;
  const supabase = await createClient();

  // 1. Busca dados da Ata, Itens e Consumos
  const { data: rawAta, error } = await supabase
    .from('atas_registro_preco')
    .select(`
      *,
      atas_itens (
        *,
        atas_consumo_empenhos (
          *,
          financeiro_empenhos (*)
        )
      ),
      contratos (
        id,
        numero_contrato,
        tipo_formalizacao,
        processo_sei,
        chave_siga_contrato,
        contratada_razao_social,
        contratada_cnpj,
        valor_atualizado,
        status,
        data_vigencia_fim_atual
      )
    `)
    .eq('id', id)
    .single();

  if (error || !rawAta) {
    notFound();
  }

  const ata = rawAta as unknown as AtaCompleta;

  // 2. Busca lista de todos os empenhos disponíveis no sistema para permitir o abate
  const { data: rawEmpenhos } = await (
    supabase.from('financeiro_empenhos') as unknown as {
      select: (cols: string) => {
        order: (col: string, opt: { ascending: boolean }) => {
          limit: (n: number) => Promise<{
            data: Array<{
              id: string;
              numero_nota_empenho: string;
              chave_siga: string;
              saldo_empenho_liquido: number;
            }> | null;
          }>;
        };
      };
    }
  )
    .select('id, numero_nota_empenho, chave_siga, saldo_empenho_liquido')
    .order('data_emissao', { ascending: false })
    .limit(50);

  const empenhosDisponiveis = (rawEmpenhos || []).map((e) => ({
    id: e.id,
    numero_nota_empenho: e.numero_nota_empenho,
    chave_siga: e.chave_siga,
    saldo_empenho_liquido: Number(e.saldo_empenho_liquido),
  }));

  const itens = (ata.atas_itens || []).sort((a, b) => a.item_numero - b.item_numero);
  const contratosDerivados = ata.contratos || [];

  // Cálculos consolidados da Ata
  const totalItens = itens.length;
  const proximoNumeroItem = totalItens > 0 ? Math.max(...itens.map((i) => i.item_numero)) + 1 : 1;

  const valorTotalRegistrado = itens.reduce(
    (acc, i) => acc + Number(i.valor_unitario) * Number(i.qtd_total_registrada),
    0
  );

  const valorTetoCotaSempi = itens.reduce(
    (acc, i) => acc + Number(i.valor_unitario) * Number(i.qtd_cota_secretaria),
    0
  );

  const valorEmpenhadoSempi = itens.reduce(
    (acc, i) => acc + Number(i.valor_unitario) * Number(i.qtd_empenhada_secretaria),
    0
  );

  const valorSaldoDisponivelSempi = valorTetoCotaSempi - valorEmpenhadoSempi;

  const percentualConsumidoGeral =
    valorTetoCotaSempi > 0 ? (valorEmpenhadoSempi / valorTetoCotaSempi) * 100 : 0;

  const diasRestantesVigencia = getDiasAteVencimento(ata.data_vigencia_fim);

  return (
    <div className="space-y-6">
      {/* Botão Voltar e Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ledger-border pb-3">
        <div className="flex items-center gap-2">
          <Link
            href="/atas"
            className="inline-flex items-center gap-1 text-xs font-mono uppercase text-ledger-muted hover:text-ledger-text transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Atas</span>
          </Link>
          <span className="text-ledger-border">/</span>
          <span className="text-xs font-mono text-ledger-text font-bold">
            ARP nº {ata.numero_ata}
          </span>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2 flex-wrap">
            <EditarAtaDrawer ata={ata} />
            <NovoItemAtaDrawer ataId={ata.id} proximoItemNumero={proximoNumeroItem} />
          </div>
        )}
      </div>

      {/* Cartão de Identificação Principal da Ata */}
      <HairlineCard className="p-6 bg-white space-y-4" noPadding>
        <div className="p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-ledger-muted">
                  Ata de Registro de Preços — Lei 14.133/2021
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    ata.papel_secretaria === 'GERENCIADOR'
                      ? 'bg-sempi-plum/10 text-sempi-plum border-sempi-plum/30'
                      : 'bg-sempi-teal/10 text-sempi-teal border-sempi-teal/30'
                  }`}
                >
                  {ata.papel_secretaria === 'GERENCIADOR' ? (
                    <ShieldCheck className="w-3 h-3" />
                  ) : (
                    <Share2 className="w-3 h-3" />
                  )}
                  {ata.papel_secretaria === 'GERENCIADOR' ? 'ÓRGÃO GERENCIADOR' : 'PARTICIPANTE / CARONA'}
                </span>
              </div>
              <h1 className="text-2xl font-serif font-bold text-ledger-text tracking-tight flex items-center gap-3 flex-wrap">
                <span>Ata nº {ata.numero_ata}</span>
                <StatusBadge status={ata.status} />
              </h1>
              <p className="text-xs text-slate-600 font-sans max-w-3xl pt-1 leading-relaxed">
                {ata.objeto}
              </p>
            </div>

            {/* Identificadores Rápidos com One-Click Copy */}
            <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2 shrink-0 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] font-mono uppercase text-ledger-muted block mb-0.5">
                  Processo SEI-RJ
                </span>
                <CodeBadge value={ata.processo_sei} />
              </div>
              {ata.codigo_siga_arp && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-ledger-muted block mb-0.5">
                    Código SIGA ARP
                  </span>
                  <CodeBadge value={ata.codigo_siga_arp} />
                </div>
              )}
            </div>
          </div>

          {/* Grid de Metadados Institucionais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-ledger-border text-xs font-mono">
            <div>
              <span className="text-[10px] uppercase text-ledger-muted block">Órgão Gerenciador</span>
              <span className="font-semibold text-ledger-text font-sans">{ata.orgao_gerenciador}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-ledger-muted block">Publicação PNCP</span>
              <span className="text-ledger-text">{formatDate(ata.data_publicacao_pncp)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-ledger-muted block">Período de Vigência</span>
              <span className="text-ledger-text font-bold">
                {formatDate(ata.data_vigencia_inicio)} até {formatDate(ata.data_vigencia_fim)}
              </span>
              <span
                className={`text-[10px] block ${
                  diasRestantesVigencia <= 30
                    ? 'text-status-anomalia font-bold'
                    : diasRestantesVigencia <= 60
                    ? 'text-status-alerta font-bold'
                    : 'text-ledger-muted'
                }`}
              >
                ({diasRestantesVigencia > 0 ? `${diasRestantesVigencia} dias restantes` : 'Vigência expirada'})
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-ledger-muted block">Prorrogabilidade</span>
              <span className="text-ledger-text">
                {ata.prorrogavel ? 'Prorrogável por +1 ano (Art. 84)' : 'Não Prorrogável'}
              </span>
            </div>
          </div>
        </div>
      </HairlineCard>

      {/* Painel de Execução e Consumo da Cota da SEMPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <HairlineCard className="p-4 bg-white">
          <div className="text-xs text-ledger-muted font-mono uppercase mb-2">Total Registrado na Ata</div>
          <MoneyCell value={valorTotalRegistrado} size="xl" />
          <span className="text-[10px] font-mono text-ledger-muted block mt-1">
            Capacidade global ({totalItens} {totalItens === 1 ? 'item' : 'itens'})
          </span>
        </HairlineCard>

        <HairlineCard className="p-4 bg-white">
          <div className="text-xs text-ledger-muted font-mono uppercase mb-2">Teto da Cota da SEMPI</div>
          <MoneyCell value={valorTetoCotaSempi} size="xl" className="text-sempi-plum" />
          <span className="text-[10px] font-mono text-ledger-muted block mt-1">
            Limite orçamentário autorizado
          </span>
        </HairlineCard>

        <HairlineCard className="p-4 bg-white">
          <div className="text-xs text-ledger-muted font-mono uppercase mb-2">Total Empenhado SEMPI</div>
          <MoneyCell value={valorEmpenhadoSempi} size="xl" className="text-sempi-teal" />
          <span className="text-[10px] font-mono text-ledger-muted block mt-1">
            {percentualConsumidoGeral.toFixed(1)}% da cota consumida
          </span>
        </HairlineCard>

        <HairlineCard className="p-4 bg-white">
          <div className="text-xs text-ledger-muted font-mono uppercase mb-2">Saldo Disponível da Cota</div>
          <MoneyCell
            value={valorSaldoDisponivelSempi}
            size="xl"
            className="text-status-vigente"
          />
          <span className="text-[10px] font-mono text-status-vigente block mt-1 font-medium">
            Disponível para novas emissões
          </span>
        </HairlineCard>
      </div>

      {/* Barra Visual de Consumo da Cota */}
      <HairlineCard title="Taxa de Consumo da Cota SEMPI" noPadding>
        <div className="p-4 bg-white space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-1">
            <span className="text-ledger-muted">
              Consumido: <span className="font-bold text-sempi-plum">{formatCurrency(valorEmpenhadoSempi)}</span> ({percentualConsumidoGeral.toFixed(1)}%)
            </span>
            <span className="text-ledger-muted">
              Saldo Restante: <span className="font-bold text-status-vigente">{formatCurrency(valorSaldoDisponivelSempi)}</span> ({(100 - percentualConsumidoGeral).toFixed(1)}%)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full border border-slate-200 overflow-hidden flex">
            <div
              className="h-full bg-sempi-plum transition-all duration-300 rounded-l-full"
              style={{ width: `${Math.min(percentualConsumidoGeral, 100)}%` }}
            />
            <div
              className="h-full bg-emerald-100 transition-all duration-300"
              style={{ width: `${Math.max(100 - percentualConsumidoGeral, 0)}%` }}
            />
          </div>
        </div>
      </HairlineCard>

      {/* Seção Principal: Catálogo de Itens da Ata (SIGA-RJ) Protegido contra Quebras */}
      <HairlineCard
        title={`Itens Registrados no Catálogo SIGA-RJ (${itens.length})`}
        subtitle="Controle estrito de cotas, preços unitários, fornecedores e abatimento de saldo"
        action={
          canEdit ? (
            <NovoItemAtaDrawer ataId={ata.id} proximoItemNumero={proximoNumeroItem} />
          ) : undefined
        }
        noPadding
      >
        <div className="table-responsive-container">
          <table className="w-full text-left border-collapse text-xs min-w-[1050px]">
            <thead>
              <tr className="border-b border-ledger-border bg-slate-50 text-[11px] font-mono uppercase text-ledger-muted tracking-wider">
                <th className="p-3 w-12 text-center font-semibold">Item</th>
                <th className="p-3 font-semibold">Código SIGA</th>
                <th className="p-3 font-semibold">Especificação Técnica</th>
                <th className="p-3 font-semibold">Fornecedor Beneficiário</th>
                <th className="p-3 text-right font-semibold">Preço Unitário</th>
                <th className="p-3 text-right font-semibold">Qtd Total</th>
                <th className="p-3 text-right font-semibold">Cota SEMPI</th>
                <th className="p-3 text-right font-semibold">Empenhado</th>
                <th className="p-3 text-right font-semibold">Saldo Disponível</th>
                <th className="p-3 text-center font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ledger-border font-mono">
              {itens.length > 0 ? (
                itens.map((item) => {
                  const saldoItem = Number(item.saldo_disponivel);
                  const cotaItem = Number(item.qtd_cota_secretaria);
                  const empenhadoItem = Number(item.qtd_empenhada_secretaria);
                  const pctConsumido = cotaItem > 0 ? (empenhadoItem / cotaItem) * 100 : 0;
                  const consumos = item.atas_consumo_empenhos || [];

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 text-center font-bold text-ledger-text">
                          #{item.item_numero}
                        </td>
                        <td className="p-3 font-bold text-sempi-plum">
                          <CodeBadge value={item.codigo_item_siga} />
                        </td>
                        <td className="p-3 font-sans text-xs text-ledger-text max-w-[240px]">
                          <p className="line-clamp-2 text-slate-700" title={item.descricao}>
                            {item.descricao}
                          </p>
                        </td>
                        <td className="p-3 font-sans text-xs max-w-[180px]">
                          <div className="truncate font-semibold text-ledger-text">{item.fornecedor_razao_social}</div>
                          <div className="font-mono text-[10px] text-ledger-muted">
                            {formatCNPJ(item.fornecedor_cnpj)}
                          </div>
                        </td>
                        <td className="p-3 text-right tabular-nums">
                          <MoneyCell value={item.valor_unitario} size="sm" />
                          <span className="text-[10px] text-ledger-muted block">/{item.unidade_medida}</span>
                        </td>
                        <td className="p-3 text-right tabular-nums text-ledger-muted">
                          {item.qtd_total_registrada} {item.unidade_medida}
                        </td>
                        <td className="p-3 text-right tabular-nums font-bold text-ledger-text">
                          {cotaItem} {item.unidade_medida}
                        </td>
                        <td className="p-3 text-right tabular-nums text-sempi-plum font-semibold">
                          {empenhadoItem} {item.unidade_medida}
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full ml-auto mt-0.5 overflow-hidden">
                            <div
                              className="h-full bg-sempi-plum rounded-full"
                              style={{ width: `${Math.min(pctConsumido, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-3 text-right tabular-nums font-bold">
                          <span
                            className={
                              saldoItem === 0
                                ? 'text-status-anomalia font-bold'
                                : 'text-status-vigente'
                            }
                          >
                            {saldoItem} {item.unidade_medida}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {canEdit ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <EditarItemAtaDrawer ataId={ata.id} item={item} />
                              <RegistrarConsumoDrawer
                                ataId={ata.id}
                                item={item}
                                empenhosDisponiveis={empenhosDisponiveis}
                              />
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Histórico de Abates deste Item */}
                      {consumos.length > 0 && (
                        <tr className="bg-slate-50/50 border-b border-ledger-border">
                          <td colSpan={10} className="p-3 pl-8 sm:pl-12">
                            <div className="text-[10px] font-mono uppercase text-ledger-muted mb-1.5 font-semibold">
                              ↳ Baixas Registradas por Nota de Empenho vinculada:
                            </div>
                            <div className="space-y-1.5">
                              {consumos.map((cons) => (
                                <div
                                  key={cons.id}
                                  className="flex flex-wrap items-center gap-3 text-xs font-mono bg-white p-2 rounded border border-ledger-border"
                                >
                                  <span className="text-ledger-muted">
                                    Data: {formatDate(cons.created_at)}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-ledger-muted">NE:</span>
                                    <CodeBadge
                                      value={cons.financeiro_empenhos?.numero_nota_empenho || 'NE SIAFE'}
                                    />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-ledger-muted">Chave SIGA:</span>
                                    <CodeBadge
                                      value={cons.financeiro_empenhos?.chave_siga || '—'}
                                    />
                                  </div>
                                  <span className="font-bold text-sempi-plum">
                                    Abate: {cons.quantidade_consumida} {item.unidade_medida}
                                  </span>
                                  <span className="text-ledger-muted">
                                    Financeiro: {formatCurrency(Number(cons.quantidade_consumida) * Number(item.valor_unitario))}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-xs text-ledger-muted font-mono">
                    Nenhum item adicionado a esta Ata de Registro de Preços ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </HairlineCard>

      {/* Seção de Contratos Decorrentes desta Ata Protegido contra Quebras */}
      <HairlineCard
        title={`Contratos e Empenhos Originados desta Ata (${contratosDerivados.length})`}
        subtitle="Instrumentos contratuais formalizados com amparo neste Registro de Preços"
        noPadding
      >
        <div className="table-responsive-container">
          <table className="w-full text-left border-collapse text-xs min-w-[850px]">
            <thead>
              <tr className="border-b border-ledger-border bg-slate-50 text-[11px] font-mono uppercase text-ledger-muted tracking-wider">
                <th className="p-3.5 font-semibold">Instrumento</th>
                <th className="p-3.5 font-semibold">Processo SEI</th>
                <th className="p-3.5 font-semibold">Chave SIGA</th>
                <th className="p-3.5 font-semibold">Contratada</th>
                <th className="p-3.5 font-semibold">Vigência Atual</th>
                <th className="p-3.5 font-semibold text-right">Valor Atualizado</th>
                <th className="p-3.5 font-semibold text-center">Status</th>
                <th className="p-3.5 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ledger-border font-mono">
              {contratosDerivados.length > 0 ? (
                contratosDerivados.map((cont) => (
                  <tr key={cont.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-bold text-ledger-text">
                      {cont.numero_contrato ? (
                        <CodeBadge value={cont.numero_contrato} />
                      ) : (
                        <span className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                          Art. 95 (Empenho)
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <CodeBadge value={cont.processo_sei} />
                    </td>
                    <td className="p-3.5">
                      <CodeBadge value={cont.chave_siga_contrato} />
                    </td>
                    <td className="p-3.5 font-sans text-xs">
                      <div className="font-semibold truncate max-w-[180px] text-ledger-text">
                        {cont.contratada_razao_social}
                      </div>
                      <div className="font-mono text-[10px] text-ledger-muted">
                        {formatCNPJ(cont.contratada_cnpj)}
                      </div>
                    </td>
                    <td className="p-3.5">{formatDate(cont.data_vigencia_fim_atual)}</td>
                    <td className="p-3.5 text-right tabular-nums font-bold">
                      <MoneyCell value={cont.valor_atualizado} size="sm" />
                    </td>
                    <td className="p-3.5 text-center">
                      <StatusBadge status={cont.status} />
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        href={`/contratos/${cont.id}`}
                        className="text-xs font-semibold text-sempi-plum hover:text-sempi-plum-hover hover:underline font-mono"
                      >
                        Abrir Contrato →
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-xs text-ledger-muted font-mono">
                    Nenhum contrato formalizado com base nesta Ata de Registro de Preços até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </HairlineCard>
    </div>
  );
}
