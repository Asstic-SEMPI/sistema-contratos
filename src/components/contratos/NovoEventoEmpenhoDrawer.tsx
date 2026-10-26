'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, AlertCircle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { createEventoEmpenhoAction, type FinanceiroActionResponse } from '@/actions/financeiro.actions';
import { formatCurrency } from '@/lib/utils';
import type { Database } from '@/lib/types/database.types';

type EmpenhoRow = Database['public']['Tables']['financeiro_empenhos']['Row'];

interface NovoEventoEmpenhoDrawerProps {
  contratoId: string;
  empenho: EmpenhoRow;
  triggerButton?: React.ReactNode;
}

export function NovoEventoEmpenhoDrawer({
  contratoId,
  empenho,
  triggerButton,
}: NovoEventoEmpenhoDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FinanceiroActionResponse | null>(null);

  const [tipoEvento, setTipoEvento] = useState<'REFORCO' | 'ANULACAO_PARCIAL' | 'ANULACAO_TOTAL'>('REFORCO');
  const [valorEventoStr, setValorEventoStr] = useState('');
  const router = useRouter();

  const valorEvento = parseFloat(valorEventoStr) || 0;
  const saldoAtual = Number(empenho.saldo_empenho_liquido) || 0;

  // Cálculo de projeção
  let novoSaldoProjetado = saldoAtual;
  let excedeLimiteAnulacao = false;

  if (tipoEvento === 'REFORCO') {
    novoSaldoProjetado = saldoAtual + valorEvento;
  } else {
    novoSaldoProjetado = saldoAtual - valorEvento;
    if (valorEvento > saldoAtual) {
      excedeLimiteAnulacao = true;
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    formData.set('empenho_original_id', empenho.id);

    startTransition(async () => {
      const response = await createEventoEmpenhoAction(formData, contratoId);
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
      {triggerButton ? (
        <span onClick={() => setIsOpen(true)} className="cursor-pointer inline-block">
          {triggerButton}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-ledger-subtle border border-ledger-border text-[11px] font-mono font-semibold text-ledger-text transition-colors"
        >
          <Plus className="w-3 h-3 text-sempi-plum" />
          <span>+ Evento SIAFE</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-none animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white border-l border-ledger-border h-full flex flex-col shadow-none">
            {/* Cabeçalho */}
            <div className="p-4 border-b border-ledger-border bg-ledger-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
                  SIAFE-Rio — Eventos Contábeis do Empenho
                </span>
                <h2 className="text-base font-serif font-bold text-ledger-text">
                  Reforço ou Anulação de NE
                </h2>
                <div className="text-xs font-mono text-sempi-plum mt-0.5">
                  NE Original: <span className="font-bold">{empenho.numero_nota_empenho}</span> (Saldo Líquido Atual: {formatCurrency(saldoAtual)})
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

              {/* Tipo de Evento */}
              <div className="space-y-1">
                <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                  Natureza do Evento Contábil *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <label
                    className={`flex items-center justify-center gap-1.5 p-2 border cursor-pointer font-mono text-[11px] font-semibold transition-colors ${
                      tipoEvento === 'REFORCO'
                        ? 'border-status-vigente bg-status-vigente-bg text-status-vigente'
                        : 'border-ledger-border bg-white text-ledger-text hover:bg-ledger-subtle'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo_evento"
                      value="REFORCO"
                      checked={tipoEvento === 'REFORCO'}
                      onChange={() => setTipoEvento('REFORCO')}
                      className="sr-only"
                    />
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>REFORÇO</span>
                  </label>

                  <label
                    className={`flex items-center justify-center gap-1.5 p-2 border cursor-pointer font-mono text-[11px] font-semibold transition-colors ${
                      tipoEvento === 'ANULACAO_PARCIAL'
                        ? 'border-status-anomalia bg-status-anomalia-bg text-status-anomalia'
                        : 'border-ledger-border bg-white text-ledger-text hover:bg-ledger-subtle'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo_evento"
                      value="ANULACAO_PARCIAL"
                      checked={tipoEvento === 'ANULACAO_PARCIAL'}
                      onChange={() => setTipoEvento('ANULACAO_PARCIAL')}
                      className="sr-only"
                    />
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>ANULAÇÃO PARCIAL</span>
                  </label>

                  <label
                    className={`flex items-center justify-center gap-1.5 p-2 border cursor-pointer font-mono text-[11px] font-semibold transition-colors ${
                      tipoEvento === 'ANULACAO_TOTAL'
                        ? 'border-status-anomalia bg-status-anomalia-bg text-status-anomalia'
                        : 'border-ledger-border bg-white text-ledger-text hover:bg-ledger-subtle'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo_evento"
                      value="ANULACAO_TOTAL"
                      checked={tipoEvento === 'ANULACAO_TOTAL'}
                      onChange={() => {
                        setTipoEvento('ANULACAO_TOTAL');
                        setValorEventoStr(saldoAtual.toString());
                      }}
                      className="sr-only"
                    />
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>ANULAÇÃO TOTAL</span>
                  </label>
                </div>
              </div>

              {/* Número da NE do Evento & Processo SEI */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Número NE do Evento (SIAFE-Rio) *
                  </label>
                  <input
                    type="text"
                    name="numero_ne_evento"
                    required
                    placeholder="Ex: 2026NE00200"
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono tabular-nums text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Processo SEI do Evento *
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
              </div>

              {/* Chave SIGA & Data do Evento */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Chave SIGA do Evento (Opcional)
                  </label>
                  <input
                    type="text"
                    name="chave_siga"
                    placeholder="Ex: SIGA-REF-001"
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Data do Evento Contábil *
                  </label>
                  <input
                    type="date"
                    name="data_evento"
                    required
                    defaultValue={hoje}
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Valor do Evento */}
              <div className="space-y-1">
                <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                  Valor do Evento (R$) *
                </label>
                <input
                  type="number"
                  name="valor_evento"
                  step="0.01"
                  min="0.01"
                  required
                  value={valorEventoStr}
                  onChange={(e) => setValorEventoStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono tabular-nums text-sm font-semibold"
                />
              </div>

              {/* Caixa de Impacto Contábil em Tempo Real */}
              <div className="p-3 bg-ledger-subtle border border-ledger-border space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
                  Impacto Contábil Projetado no Saldo Líquido:
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  <div>
                    <span className="text-ledger-muted block text-[10px]">Saldo Atual:</span>
                    <span className="font-bold tabular-nums">{formatCurrency(saldoAtual)}</span>
                  </div>
                  <div>
                    <span className="text-ledger-muted block text-[10px]">
                      {tipoEvento === 'REFORCO' ? 'Reforço (+):' : 'Anulação (-):'}
                    </span>
                    <span
                      className={`font-bold tabular-nums ${
                        tipoEvento === 'REFORCO' ? 'text-status-vigente' : 'text-status-anomalia'
                      }`}
                    >
                      {tipoEvento === 'REFORCO' ? '+' : '-'}
                      {formatCurrency(valorEvento)}
                    </span>
                  </div>
                  <div>
                    <span className="text-ledger-muted block text-[10px]">Saldo Projetado:</span>
                    <span
                      className={`font-bold tabular-nums ${
                        excedeLimiteAnulacao ? 'text-status-anomalia underline' : 'text-sempi-plum'
                      }`}
                    >
                      {formatCurrency(novoSaldoProjetado)}
                    </span>
                  </div>
                </div>

                {excedeLimiteAnulacao && (
                  <div className="p-2 bg-status-anomalia-bg text-status-anomalia font-mono text-[10px] border border-status-anomalia">
                    ⚠️ BLOQUEIO DA TRIGGER: O valor da anulação ({formatCurrency(valorEvento)}) é superior ao saldo empenhado disponível ({formatCurrency(saldoAtual)}). A constraint contábil rejeitará esta operação.
                  </div>
                )}
              </div>

              {/* Justificativa / Motivo */}
              <div className="space-y-1">
                <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                  Motivo e Justificativa Contábil *
                </label>
                <textarea
                  name="motivo"
                  rows={3}
                  required
                  placeholder="Informe a motivação formal para o reforço ou anulação da despesa..."
                  className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-sans text-xs"
                />
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
                  disabled={isPending || excedeLimiteAnulacao}
                  className="px-4 py-2 bg-sempi-plum hover:bg-sempi-plum-hover text-white text-xs uppercase font-semibold font-mono tracking-wider transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Gravando no SIAFE...' : 'Confirmar Evento Contábil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
