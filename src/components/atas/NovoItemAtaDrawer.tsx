'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, AlertCircle, CheckCircle2, PackageCheck } from 'lucide-react';
import { createAtaItemAction, type AtaActionResponse } from '@/actions/atas.actions';
import { formatCurrency } from '@/lib/utils';

interface NovoItemAtaDrawerProps {
  ataId: string;
  proximoItemNumero: number;
}

export function NovoItemAtaDrawer({ ataId, proximoItemNumero }: NovoItemAtaDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AtaActionResponse | null>(null);

  const [valorUnitarioStr, setValorUnitarioStr] = useState('');
  const [qtdTotalStr, setQtdTotalStr] = useState('');
  const [qtdCotaStr, setQtdCotaStr] = useState('');

  const router = useRouter();

  const valorUnitario = parseFloat(valorUnitarioStr) || 0;
  const qtdTotal = parseFloat(qtdTotalStr) || 0;
  const qtdCota = parseFloat(qtdCotaStr) || 0;

  const totalRegistrado = valorUnitario * qtdTotal;
  const totalCotaSempi = valorUnitario * qtdCota;
  const excedeTotal = qtdCota > qtdTotal && qtdTotal > 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    formData.set('ata_id', ataId);

    startTransition(async () => {
      const response = await createAtaItemAction(formData);
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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sempi-plum hover:bg-sempi-plum-hover text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Adicionar Item ao Catálogo SIGA</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-none animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white border-l border-ledger-border h-full flex flex-col shadow-none">
            {/* Cabeçalho */}
            <div className="p-4 border-b border-ledger-border bg-ledger-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
                  Catálogo de Materiais e Serviços — SIGA-RJ
                </span>
                <h2 className="text-base font-serif font-bold text-ledger-text">
                  Novo Item da Ata de Registro de Preços
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
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{result.message}</span>
                </div>
              )}

              {/* Número do Item & Código SIGA */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Item Nº *
                  </label>
                  <input
                    type="number"
                    name="item_numero"
                    required
                    defaultValue={proximoItemNumero}
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono tabular-nums text-xs font-bold"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Código no Catálogo SIGA-RJ *
                  </label>
                  <input
                    type="text"
                    name="codigo_item_siga"
                    required
                    placeholder="Ex: SIGA-TI-2026-001"
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Descrição / Especificação do Item */}
              <div className="space-y-1">
                <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                  Descrição e Especificação Técnica *
                </label>
                <textarea
                  name="descricao"
                  rows={3}
                  required
                  placeholder="Especificação pormenorizada do material ou serviço registrado..."
                  className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-sans text-xs"
                />
              </div>

              {/* Fornecedor Beneficiário da Ata */}
              <div className="p-3 bg-ledger-subtle border border-ledger-border space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted font-bold">
                  Fornecedor Detentor do Item Registrado
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                      CNPJ do Fornecedor *
                    </label>
                    <input
                      type="text"
                      name="fornecedor_cnpj"
                      required
                      placeholder="00.000.000/0001-00"
                      className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono tabular-nums text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                      Razão Social do Fornecedor *
                    </label>
                    <input
                      type="text"
                      name="fornecedor_razao_social"
                      required
                      placeholder="Razão social completa..."
                      className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-sans text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Unidade de Medida & Valor Unitário */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Unidade de Medida *
                  </label>
                  <select
                    name="unidade_medida"
                    required
                    defaultValue="UN"
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                  >
                    <option value="UN">UN — Unidade</option>
                    <option value="SERVICO">SERVICO — Serviço</option>
                    <option value="HORA">HORA — Hora Técnica</option>
                    <option value="MES">MES — Mensal</option>
                    <option value="LOTE">LOTE — Lote</option>
                    <option value="PACOTE">PACOTE — Pacote</option>
                    <option value="LICENCA">LICENCA — Licença de Software</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Valor Unitário Registrado (R$) *
                  </label>
                  <input
                    type="number"
                    name="valor_unitario"
                    step="0.0001"
                    min="0.0001"
                    required
                    value={valorUnitarioStr}
                    onChange={(e) => setValorUnitarioStr(e.target.value)}
                    placeholder="0.0000"
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono tabular-nums text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Quantidade Total vs Cota da SEMPI */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Qtd Total Registrada na Ata *
                  </label>
                  <input
                    type="number"
                    name="qtd_total_registrada"
                    step="0.01"
                    min="0.01"
                    required
                    value={qtdTotalStr}
                    onChange={(e) => setQtdTotalStr(e.target.value)}
                    placeholder="Ex: 500.00"
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono tabular-nums text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Qtd Cota Reservada para SEMPI *
                  </label>
                  <input
                    type="number"
                    name="qtd_cota_secretaria"
                    step="0.01"
                    min="0.01"
                    required
                    value={qtdCotaStr}
                    onChange={(e) => setQtdCotaStr(e.target.value)}
                    placeholder="Ex: 100.00"
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono tabular-nums text-xs font-bold text-sempi-plum"
                  />
                </div>
              </div>

              {/* Resumo de Projeção Financeira e Validação */}
              <div className="p-3 bg-ledger-subtle border border-ledger-border space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
                  Valores Globais Projetados do Item:
                </div>
                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <div>
                    <span className="text-ledger-muted block text-[10px]">Valor Total da Ata:</span>
                    <span className="font-bold tabular-nums">{formatCurrency(totalRegistrado)}</span>
                  </div>
                  <div>
                    <span className="text-ledger-muted block text-[10px]">Teto da Cota SEMPI:</span>
                    <span className="font-bold tabular-nums text-sempi-plum">
                      {formatCurrency(totalCotaSempi)}
                    </span>
                  </div>
                </div>

                {excedeTotal && (
                  <div className="p-2 bg-status-anomalia-bg text-status-anomalia font-mono text-[10px] border border-status-anomalia">
                    ⚠️ A cota reservada para a SEMPI ({qtdCota}) não pode ser maior que a quantidade total registrada ({qtdTotal}).
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
                  disabled={isPending || excedeTotal}
                  className="px-4 py-2 bg-sempi-plum hover:bg-sempi-plum-hover text-white text-xs uppercase font-semibold font-mono tracking-wider transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Gravando no SIGA...' : 'Salvar Item na Ata'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
