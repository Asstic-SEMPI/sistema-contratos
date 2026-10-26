'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Edit2, AlertCircle, CheckCircle2, FileCheck2 } from 'lucide-react';
import { updateLiquidacaoAction, type FinanceiroActionResponse } from '@/actions/financeiro.actions';
import type { Database } from '@/lib/types/database.types';

type LiquidacaoRow = Database['public']['Tables']['financeiro_liquidacoes']['Row'];

interface EditarLiquidacaoDrawerProps {
  contratoId: string;
  liquidacao: LiquidacaoRow;
}

export function EditarLiquidacaoDrawer({
  contratoId,
  liquidacao,
}: EditarLiquidacaoDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FinanceiroActionResponse | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    formData.set('empenho_id', liquidacao.empenho_id);

    startTransition(async () => {
      const response = await updateLiquidacaoAction(liquidacao.id, contratoId, formData);
      setResult(response);
      if (response.success) {
        setTimeout(() => {
          setIsOpen(false);
          router.refresh();
        }, 1200);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white hover:bg-ledger-subtle text-ledger-text text-[10px] font-semibold border border-ledger-border uppercase tracking-wider transition-colors cursor-pointer"
        title="Editar Liquidação"
      >
        <Edit2 className="w-2.5 h-2.5 text-ledger-muted" />
        <span>Editar</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-none animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white border-l border-ledger-border h-full flex flex-col shadow-none">
            {/* Cabeçalho */}
            <div className="p-4 border-b border-ledger-border bg-ledger-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
                  Ateste & Contabilidade — Edição de NL
                </span>
                <h2 className="text-base font-serif font-bold text-ledger-text">
                  Editar Liquidação {liquidacao.numero_nota_liquidacao}
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
                          <li key={field}>
                            <strong>{field}:</strong> {errs.join(', ')}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {result?.success && (
                <div className="p-3 bg-status-vigente-bg/50 border border-status-vigente text-status-vigente flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{result.message}</span>
                </div>
              )}

              {/* Processo SEI de Ateste */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                  Processo SEI de Ateste *
                </label>
                <input
                  type="text"
                  name="processo_sei"
                  required
                  defaultValue={liquidacao.processo_sei}
                  className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                />
              </div>

              {/* Dados da NF: Número e Emissão */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Número da NF *
                  </label>
                  <input
                    type="text"
                    name="numero_nota_fiscal"
                    required
                    defaultValue={liquidacao.numero_nota_fiscal}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Emissão da NF *
                  </label>
                  <input
                    type="date"
                    name="data_emissao_nota_fiscal"
                    required
                    defaultValue={liquidacao.data_emissao_nota_fiscal ? liquidacao.data_emissao_nota_fiscal.split('T')[0] : ''}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Competência e Número da NL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Competência (MM/AAAA) *
                  </label>
                  <input
                    type="text"
                    name="competencia_mes_ano"
                    required
                    defaultValue={liquidacao.competencia_mes_ano}
                    placeholder="03/2026"
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Número da NL (SIAFE) *
                  </label>
                  <input
                    type="text"
                    name="numero_nota_liquidacao"
                    required
                    defaultValue={liquidacao.numero_nota_liquidacao}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white uppercase"
                  />
                </div>
              </div>

              {/* Data NL e Valor Liquidado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Data da NL *
                  </label>
                  <input
                    type="date"
                    name="data_emissao_nl"
                    required
                    defaultValue={liquidacao.data_emissao_nl ? liquidacao.data_emissao_nl.split('T')[0] : ''}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Valor Liquidado (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 font-mono text-xs text-ledger-muted">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      name="valor_liquidado"
                      required
                      defaultValue={liquidacao.valor_liquidado}
                      className="w-full p-2 pl-9 font-mono tabular-nums text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Data Pagamento OB (Ordem Bancária) */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                  Data Pagamento / Ordem Bancária (OB)
                </label>
                <input
                  type="date"
                  name="data_pagamento_ob"
                  defaultValue={liquidacao.data_pagamento_ob ? liquidacao.data_pagamento_ob.split('T')[0] : ''}
                  className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                />
              </div>

              <div className="pt-4 border-t border-ledger-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 border border-ledger-border text-xs font-semibold uppercase tracking-wider text-ledger-muted hover:bg-ledger-subtle cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-sempi-plum hover:bg-sempi-plum-hover text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>{isPending ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
