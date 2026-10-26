'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, AlertCircle, CheckCircle2, FileCheck2 } from 'lucide-react';
import { createLiquidacaoAction, type FinanceiroActionResponse } from '@/actions/financeiro.actions';
import { formatCurrency } from '@/lib/utils';
import type { Database } from '@/lib/types/database.types';

type EmpenhoRow = Database['public']['Tables']['financeiro_empenhos']['Row'];

interface NovaLiquidacaoDrawerProps {
  contratoId: string;
  empenho: EmpenhoRow;
  triggerButton?: React.ReactNode;
}

export function NovaLiquidacaoDrawer({
  contratoId,
  empenho,
  triggerButton,
}: NovaLiquidacaoDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FinanceiroActionResponse | null>(null);

  const router = useRouter();
  const saldoLiquido = Number(empenho.saldo_empenho_liquido) || 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    formData.set('empenho_id', empenho.id);

    startTransition(async () => {
      const response = await createLiquidacaoAction(formData, contratoId);
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
  const mesAtual = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;

  return (
    <>
      {triggerButton ? (
        <span onClick={() => setIsOpen(true)} className="cursor-pointer inline-block">
          {triggerButton}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-ledger-subtle border border-ledger-border text-[11px] font-mono font-semibold text-sempi-teal transition-colors"
        >
          <FileCheck2 className="w-3 h-3" />
          <span>+ Liquidar (NF/NL)</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-none animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white border-l border-ledger-border h-full flex flex-col shadow-none">
            {/* Cabeçalho */}
            <div className="p-4 border-b border-ledger-border bg-ledger-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
                  SIAFE-Rio — Liquidação da Despesa & Ateste Fiscal
                </span>
                <h2 className="text-base font-serif font-bold text-ledger-text">
                  Registro de Nota Fiscal & Nota de Liquidação (NL)
                </h2>
                <div className="text-xs font-mono text-sempi-plum mt-0.5">
                  NE Vinculada: <span className="font-bold">{empenho.numero_nota_empenho}</span> (Saldo Líquido: {formatCurrency(saldoLiquido)})
                </div>
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
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{result.message}</span>
                </div>
              )}

              {/* Processo SEI da Liquidação */}
              <div className="space-y-1">
                <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                  Processo SEI de Liquidação / Pagamento *
                </label>
                <input
                  type="text"
                  name="processo_sei"
                  required
                  defaultValue={empenho.processo_sei}
                  placeholder="SEI-310001/000123/2026"
                  className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                />
              </div>

              {/* Dados da Nota Fiscal */}
              <div className="p-3 bg-ledger-subtle border border-ledger-border space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted font-bold">
                  Comprovante Fiscal (Atestado pela Fiscalização)
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                      Número da Nota Fiscal (NF) *
                    </label>
                    <input
                      type="text"
                      name="numero_nota_fiscal"
                      required
                      placeholder="Ex: NF-0004289"
                      className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono tabular-nums text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                      Data Emissão NF *
                    </label>
                    <input
                      type="date"
                      name="data_emissao_nota_fiscal"
                      required
                      defaultValue={hoje}
                      className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Competência Faturada (Mês/Ano) *
                  </label>
                  <input
                    type="text"
                    name="competencia_mes_ano"
                    required
                    defaultValue={mesAtual}
                    placeholder="MM/AAAA (ex: 02/2026)"
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono tabular-nums text-xs"
                  />
                </div>
              </div>

              {/* Dados da Nota de Liquidação (SIAFE-Rio) */}
              <div className="p-3 bg-ledger-subtle border border-ledger-border space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted font-bold">
                  Dados Contábeis no SIAFE-Rio
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                      Número da Nota de Liquidação (NL) *
                    </label>
                    <input
                      type="text"
                      name="numero_nota_liquidacao"
                      required
                      placeholder="Ex: 2026NL00120"
                      className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono tabular-nums text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                      Data Emissão NL *
                    </label>
                    <input
                      type="date"
                      name="data_emissao_nl"
                      required
                      defaultValue={hoje}
                      className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                      Valor Liquidado (R$) *
                    </label>
                    <input
                      type="number"
                      name="valor_liquidado"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono tabular-nums text-sm font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                      Data Pagamento OB (Ordem Bancária)
                    </label>
                    <input
                      type="date"
                      name="data_pagamento_ob"
                      placeholder="Opcional"
                      className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="pt-4 border-t border-ledger-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 border border-ledger-border hover:bg-ledger-subtle text-ledger-text text-xs uppercase font-semibold font-mono transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-sempi-teal hover:bg-sempi-teal/90 text-white text-xs uppercase font-semibold font-mono tracking-wider transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Gravando no SIAFE...' : 'Confirmar Liquidação (NL)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
