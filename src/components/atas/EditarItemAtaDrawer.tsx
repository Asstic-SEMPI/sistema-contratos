'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Edit2, AlertCircle, CheckCircle2, PackageCheck } from 'lucide-react';
import { updateAtaItemAction, type AtaActionResponse } from '@/actions/atas.actions';
import { formatCurrency } from '@/lib/utils';
import type { Database } from '@/lib/types/database.types';

type ItemRow = Database['public']['Tables']['atas_itens']['Row'];

interface EditarItemAtaDrawerProps {
  ataId: string;
  item: ItemRow;
}

export function EditarItemAtaDrawer({ ataId, item }: EditarItemAtaDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AtaActionResponse | null>(null);

  const [valorUnitarioStr, setValorUnitarioStr] = useState(String(item.valor_unitario || ''));
  const [qtdTotalStr, setQtdTotalStr] = useState(String(item.qtd_total_registrada || ''));
  const [qtdCotaStr, setQtdCotaStr] = useState(String(item.qtd_cota_secretaria || ''));

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

    startTransition(async () => {
      const response = await updateAtaItemAction(item.id, ataId, formData);
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
        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-ledger-subtle text-ledger-text text-[11px] font-semibold border border-ledger-border uppercase tracking-wider transition-colors cursor-pointer"
        title="Editar Item do Catálogo"
      >
        <Edit2 className="w-3 h-3 text-ledger-muted" />
        <span>Editar</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-none animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white border-l border-ledger-border h-full flex flex-col shadow-none">
            {/* Cabeçalho */}
            <div className="p-4 border-b border-ledger-border bg-ledger-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
                  Catálogo de Itens da Ata — Edição
                </span>
                <h2 className="text-base font-serif font-bold text-ledger-text">
                  Editar Item #{item.item_numero} (SIGA: {item.codigo_item_siga})
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

              {/* Número do Item e Código SIGA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Número do Item na Ata *
                  </label>
                  <input
                    type="number"
                    name="item_numero"
                    required
                    defaultValue={item.item_numero}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Código Item SIGA *
                  </label>
                  <input
                    type="text"
                    name="codigo_item_siga"
                    required
                    defaultValue={item.codigo_item_siga}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white uppercase"
                  />
                </div>
              </div>

              {/* Descrição do Item */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                  Especificação Técnica / Descrição do Item *
                </label>
                <textarea
                  name="descricao"
                  required
                  rows={3}
                  defaultValue={item.descricao}
                  className="w-full p-2 text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                />
              </div>

              {/* Dados do Fornecedor do Item */}
              <div className="p-3 border border-ledger-border bg-ledger-subtle space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted block">
                  Beneficiário / Detentor da Cota
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                      CNPJ Fornecedor *
                    </label>
                    <input
                      type="text"
                      name="fornecedor_cnpj"
                      required
                      defaultValue={item.fornecedor_cnpj}
                      className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                      Razão Social Fornecedor *
                    </label>
                    <input
                      type="text"
                      name="fornecedor_razao_social"
                      required
                      defaultValue={item.fornecedor_razao_social}
                      className="w-full p-2 text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Unidade e Valores */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Unidade Medida *
                  </label>
                  <input
                    type="text"
                    name="unidade_medida"
                    required
                    defaultValue={item.unidade_medida}
                    placeholder="Ex: UN, MÊS, SERVIÇO"
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Valor Unitário (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    name="valor_unitario"
                    required
                    value={valorUnitarioStr}
                    onChange={(e) => setValorUnitarioStr(e.target.value)}
                    className="w-full p-2 font-mono tabular-nums text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Qtd Total Ata *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    name="qtd_total_registrada"
                    required
                    value={qtdTotalStr}
                    onChange={(e) => setQtdTotalStr(e.target.value)}
                    className="w-full p-2 font-mono tabular-nums text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Cota da SEMPI */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                  Qtd Cota da SEMPI *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  name="qtd_cota_secretaria"
                  required
                  value={qtdCotaStr}
                  onChange={(e) => setQtdCotaStr(e.target.value)}
                  className={`w-full p-2 font-mono tabular-nums text-xs border focus:outline-none bg-white ${
                    excedeTotal
                      ? 'border-status-anomalia text-status-anomalia focus:border-status-anomalia'
                      : 'border-ledger-border focus:border-sempi-plum'
                  }`}
                />
                {excedeTotal && (
                  <p className="text-[10px] text-status-anomalia mt-1">
                    A cota da SEMPI não pode exceder o total registrado na Ata.
                  </p>
                )}
                <p className="text-[10px] text-ledger-muted mt-1">
                  Já empenhado neste item: <span className="font-mono font-bold text-ledger-text">{item.qtd_empenhada_secretaria} {item.unidade_medida}</span>
                </p>
              </div>

              {/* Painel de Cálculo em Tempo Real */}
              <div className="p-3 border border-ledger-border bg-ledger-subtle grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-ledger-muted block">
                    Valor Total da Cota SEMPI
                  </span>
                  <span className="font-mono font-bold text-sempi-plum tabular-nums">
                    {formatCurrency(totalCotaSempi)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-ledger-muted block">
                    Valor Total da ARP
                  </span>
                  <span className="font-mono font-semibold text-ledger-text tabular-nums">
                    {formatCurrency(totalRegistrado)}
                  </span>
                </div>
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
                  disabled={isPending || excedeTotal}
                  className="px-4 py-1.5 bg-sempi-plum hover:bg-sempi-plum-hover text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
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
