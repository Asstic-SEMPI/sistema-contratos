'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, AlertCircle, CheckCircle2, TrendingDown, Layers } from 'lucide-react';
import { registrarConsumoAtaAction, type AtaActionResponse } from '@/actions/atas.actions';
import { formatCurrency } from '@/lib/utils';
import type { Database } from '@/lib/types/database.types';

type AtaItemRow = Database['public']['Tables']['atas_itens']['Row'];

interface EmpenhoOpcao {
  id: string;
  numero_nota_empenho: string;
  chave_siga: string;
  saldo_empenho_liquido: number;
}

interface RegistrarConsumoDrawerProps {
  ataId: string;
  item: AtaItemRow;
  empenhosDisponiveis: EmpenhoOpcao[];
  triggerButton?: React.ReactNode;
}

export function RegistrarConsumoDrawer({
  ataId,
  item,
  empenhosDisponiveis,
  triggerButton,
}: RegistrarConsumoDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AtaActionResponse | null>(null);

  const [qtdConsumirStr, setQtdConsumirStr] = useState('');
  const router = useRouter();

  const qtdConsumir = parseFloat(qtdConsumirStr) || 0;
  const saldoDisponivel = Number(item.saldo_disponivel) || 0;
  const saldoProjetado = saldoDisponivel - qtdConsumir;
  const excedeSaldo = qtdConsumir > saldoDisponivel;
  const valorFinanceiroConsumo = qtdConsumir * Number(item.valor_unitario);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    formData.set('ata_item_id', item.id);

    startTransition(async () => {
      const response = await registrarConsumoAtaAction(formData, ataId);
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
      {triggerButton ? (
        <span onClick={() => setIsOpen(true)} className="cursor-pointer inline-block">
          {triggerButton}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-ledger-subtle border border-ledger-border text-[11px] font-mono font-semibold text-sempi-plum transition-colors"
        >
          <TrendingDown className="w-3 h-3" />
          <span>Abater Cota (NE)</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-none animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white border-l border-ledger-border h-full flex flex-col shadow-none">
            {/* Cabeçalho */}
            <div className="p-4 border-b border-ledger-border bg-ledger-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
                  Controle de Saldo de Ata — Abate de Cota
                </span>
                <h2 className="text-base font-serif font-bold text-ledger-text">
                  Baixa de Saldo por Nota de Empenho
                </h2>
                <div className="text-xs font-mono text-sempi-plum mt-0.5">
                  Item #{item.item_numero} — {item.codigo_item_siga} (Saldo Atual: {saldoDisponivel} {item.unidade_medida})
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

              {/* Informações Fixas do Item */}
              <div className="p-3 bg-ledger-subtle border border-ledger-border space-y-2">
                <div className="font-mono text-xs">
                  <span className="text-ledger-muted">Descrição: </span>
                  <span className="font-sans font-medium text-ledger-text">{item.descricao}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1 border-t border-ledger-border/60">
                  <div>
                    <span className="text-ledger-muted block text-[10px]">Preço Unitário:</span>
                    <span className="font-bold">{formatCurrency(item.valor_unitario)}</span>
                  </div>
                  <div>
                    <span className="text-ledger-muted block text-[10px]">Cota SEMPI:</span>
                    <span className="font-bold">{item.qtd_cota_secretaria} {item.unidade_medida}</span>
                  </div>
                  <div>
                    <span className="text-ledger-muted block text-[10px]">Saldo Disponível:</span>
                    <span className="font-bold text-status-vigente">{saldoDisponivel} {item.unidade_medida}</span>
                  </div>
                </div>
              </div>

              {/* Seleção da Nota de Empenho Vinculada */}
              <div className="space-y-1">
                <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                  Nota de Empenho (SIAFE-Rio) que Abate o Item *
                </label>
                {empenhosDisponiveis.length > 0 ? (
                  <select
                    name="empenho_id"
                    required
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                  >
                    <option value="">Selecione uma Nota de Empenho...</option>
                    {empenhosDisponiveis.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.numero_nota_empenho} — {emp.chave_siga} (Saldo NE: {formatCurrency(emp.saldo_empenho_liquido)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      name="empenho_id"
                      required
                      placeholder="Informe o UUID da Nota de Empenho..."
                      className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                    />
                    <p className="text-[10px] text-ledger-muted font-sans">
                      Dica: Você também pode colar o ID da Nota de Empenho emitida no módulo de Execução Financeira.
                    </p>
                  </div>
                )}
              </div>

              {/* Quantidade a Consumir */}
              <div className="space-y-1">
                <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                  Quantidade a Abater ({item.unidade_medida}) *
                </label>
                <input
                  type="number"
                  name="quantidade_consumida"
                  step="0.01"
                  min="0.01"
                  required
                  value={qtdConsumirStr}
                  onChange={(e) => setQtdConsumirStr(e.target.value)}
                  placeholder={`Máximo: ${saldoDisponivel}`}
                  className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono tabular-nums text-sm font-bold text-sempi-plum"
                />
              </div>

              {/* Projeção de Abate e Trava da Constraint */}
              <div className="p-3 bg-ledger-subtle border border-ledger-border space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
                  Impacto no Saldo da Cota da SEMPI:
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  <div>
                    <span className="text-ledger-muted block text-[10px]">Saldo Atual:</span>
                    <span className="font-bold">{saldoDisponivel}</span>
                  </div>
                  <div>
                    <span className="text-ledger-muted block text-[10px]">Abate (-)</span>
                    <span className="font-bold text-status-anomalia">-{qtdConsumir}</span>
                  </div>
                  <div>
                    <span className="text-ledger-muted block text-[10px]">Saldo Remanescente:</span>
                    <span
                      className={`font-bold ${
                        excedeSaldo ? 'text-status-anomalia underline' : 'text-sempi-plum'
                      }`}
                    >
                      {saldoProjetado}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-ledger-border/60 font-mono text-[11px] flex justify-between">
                  <span className="text-ledger-muted">Total Financeiro Desta Baixa:</span>
                  <span className="font-bold text-ledger-text">
                    {formatCurrency(valorFinanceiroConsumo)}
                  </span>
                </div>

                {excedeSaldo && (
                  <div className="p-2 bg-status-anomalia-bg text-status-anomalia font-mono text-[10px] border border-status-anomalia">
                    ⚠️ BLOQUEIO DA TRIGGER: A quantidade solicitada ({qtdConsumir}) é maior do que o saldo disponível ({saldoDisponivel}). A constraint contábil chk_empenho_nao_excede_cota rejeitará a operação.
                  </div>
                )}
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
                  disabled={isPending || excedeSaldo}
                  className="px-4 py-2 bg-sempi-plum hover:bg-sempi-plum-hover text-white text-xs uppercase font-semibold font-mono tracking-wider transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Abatendo Cota...' : 'Confirmar Abate de Cota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
