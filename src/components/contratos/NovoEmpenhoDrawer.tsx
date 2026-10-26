'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createEmpenhoAction, type FinanceiroActionResponse } from '@/actions/financeiro.actions';
import type { Database } from '@/lib/types/database.types';

type AlteracaoRow = Database['public']['Tables']['alteracoes_contratuais']['Row'];

interface NovoEmpenhoDrawerProps {
  contratoId: string;
  aditivos: AlteracaoRow[];
  dataVigenciaFimAtual: string;
}

export function NovoEmpenhoDrawer({
  contratoId,
  aditivos,
  dataVigenciaFimAtual,
}: NovoEmpenhoDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FinanceiroActionResponse | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    formData.set('contrato_id', contratoId);

    startTransition(async () => {
      const response = await createEmpenhoAction(formData);
      setResult(response);
      if (response.success) {
        setTimeout(() => {
          setIsOpen(false);
          router.refresh();
        }, 1200);
      }
    });
  };

  const hoje = new Date().toISOString().split('T')[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sempi-plum hover:bg-sempi-plum-hover text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Lançar Nota de Empenho (NE)</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-none animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white border-l border-ledger-border h-full flex flex-col shadow-none">
            {/* Cabeçalho */}
            <div className="p-4 border-b border-ledger-border bg-ledger-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
                  Execução Financeira — SIAFE-Rio & SIGA
                </span>
                <h2 className="text-base font-serif font-bold text-ledger-text">
                  Emissão de Nota de Empenho (NE)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-ledger-border text-ledger-muted hover:text-ledger-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {result?.message && !result.success && (
                <div className="p-3 bg-status-anomalia-bg/50 border border-status-anomalia text-status-anomalia flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">{result.message}</span>
                    {result.errors && (
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        {Object.entries(result.errors).map(([field, errs]) => (
                          <li key={field}>{errs[0]}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {result?.success && (
                <div className="p-3 bg-status-vigente-bg/50 border border-status-vigente text-status-vigente flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-semibold">{result.message}</span>
                </div>
              )}

              {/* Identificadores Oficiais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                    Número da NE (SIAFE-Rio) *
                  </label>
                  <input
                    type="text"
                    name="numero_nota_empenho"
                    required
                    placeholder="Ex: 2026NE00145"
                    className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                    Chave SIGA de Execução *
                  </label>
                  <input
                    type="text"
                    name="chave_siga"
                    required
                    placeholder="Ex: SIGA-EMP-2026-00431"
                    className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                    Processo SEI-RJ *
                  </label>
                  <input
                    type="text"
                    name="processo_sei"
                    required
                    placeholder="Ex: SEI-150001/000432/2026"
                    className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                    Modalidade do Empenho *
                  </label>
                  <select
                    name="tipo_empenho"
                    required
                    className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                  >
                    <option value="ORDINARIO">ORDINÁRIO (Despesa com montante exato)</option>
                    <option value="ESTIMATIVO">ESTIMATIVO (Despesas variáveis/serviços contínuos)</option>
                    <option value="GLOBAL">GLOBAL (Contratual com parcelamento)</option>
                  </select>
                </div>
              </div>

              {/* Datas e Cruzamento Temporal da Régua */}
              <div className="p-3 border border-ledger-border bg-ledger-subtle/30 space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-sempi-plum">
                  Cruzamento Temporal (Régua Chave SIGA x Vigência)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                      Data de Emissão da NE *
                    </label>
                    <input
                      type="date"
                      name="data_emissao"
                      defaultValue={hoje}
                      required
                      className="w-full px-3 py-2 bg-white border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                      Data Referência de Vigência *
                    </label>
                    <input
                      type="date"
                      name="data_referencia_vigencia"
                      defaultValue={hoje}
                      required
                      className="w-full px-3 py-2 bg-white border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                    />
                    <span className="text-[10px] text-ledger-muted mt-0.5 block">
                      Data base para a trigger classificar se pertence ao Contrato Inicial ou a Aditivo de Prazo.
                    </span>
                  </div>
                </div>

                {aditivos.length > 0 && (
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                      Vínculo Forçado a Termo Aditivo (Opcional)
                    </label>
                    <select
                      name="alteracao_id"
                      className="w-full px-3 py-2 bg-white border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                    >
                      <option value="">Detecção Automática pela Data de Referência</option>
                      {aditivos.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.procedimento} ({a.tipo})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Classificação Orçamentária SIAFE */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ledger-text border-b border-ledger-border pb-1">
                  Classificação Contábil e Dotação Orçamentária
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                      Programa Trabalho *
                    </label>
                    <input
                      type="text"
                      name="programa_trabalho"
                      required
                      placeholder="Ex: 14.122.0001.2001"
                      className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                      Natureza Despesa *
                    </label>
                    <input
                      type="text"
                      name="natureza_despesa"
                      required
                      placeholder="Ex: 3.3.90.39"
                      className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                      Fonte de Recursos *
                    </label>
                    <input
                      type="text"
                      name="fonte_recurso"
                      required
                      placeholder="Ex: 100"
                      className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                    Valor Empenhado Inicial (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="valor_empenhado_inicial"
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-sm font-bold focus:outline-none focus:border-sempi-plum"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="pt-3 border-t border-ledger-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-ledger-border text-ledger-text hover:bg-ledger-subtle transition-colors uppercase font-semibold text-[11px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-sempi-plum hover:bg-sempi-plum-hover text-white transition-colors uppercase font-semibold text-[11px] disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? 'Emitindo Empenho...' : 'Emitir Nota de Empenho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
