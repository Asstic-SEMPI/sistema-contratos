'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Edit2, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { updateEmpenhoAction, type FinanceiroActionResponse } from '@/actions/financeiro.actions';
import type { Database } from '@/lib/types/database.types';

type EmpenhoRow = Database['public']['Tables']['financeiro_empenhos']['Row'];
type AlteracaoRow = Database['public']['Tables']['alteracoes_contratuais']['Row'];

interface EditarEmpenhoDrawerProps {
  contratoId: string;
  empenho: EmpenhoRow;
  aditivos: AlteracaoRow[];
}

export function EditarEmpenhoDrawer({
  contratoId,
  empenho,
  aditivos,
}: EditarEmpenhoDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FinanceiroActionResponse | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const response = await updateEmpenhoAction(empenho.id, contratoId, formData);
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
        title="Editar Nota de Empenho"
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
                  Execução Financeira — Edição de Empenho
                </span>
                <h2 className="text-base font-serif font-bold text-ledger-text">
                  Editar Nota de Empenho {empenho.numero_nota_empenho}
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

              {/* Número do Empenho e Chave SIGA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Número da NE *
                  </label>
                  <input
                    type="text"
                    name="numero_nota_empenho"
                    required
                    defaultValue={empenho.numero_nota_empenho}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Chave SIGA NE *
                  </label>
                  <input
                    type="text"
                    name="chave_siga"
                    required
                    defaultValue={empenho.chave_siga}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white uppercase"
                  />
                </div>
              </div>

              {/* Processo SEI e Tipo de Empenho */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Processo SEI *
                  </label>
                  <input
                    type="text"
                    name="processo_sei"
                    required
                    defaultValue={empenho.processo_sei}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Tipo de Empenho *
                  </label>
                  <select
                    name="tipo_empenho"
                    required
                    defaultValue={empenho.tipo_empenho}
                    className="w-full p-2 text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  >
                    <option value="ORDINARIO">ORDINÁRIO (Pagamento Único)</option>
                    <option value="ESTIMATIVO">ESTIMATIVO (Contratos Contínuos/Serviços)</option>
                    <option value="GLOBAL">GLOBAL (Obras / Parcelas Fixas)</option>
                  </select>
                </div>
              </div>

              {/* Datas: Emissão e Referência de Vigência */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Data de Emissão (SIAFE-Rio) *
                  </label>
                  <input
                    type="date"
                    name="data_emissao"
                    required
                    defaultValue={empenho.data_emissao ? empenho.data_emissao.split('T')[0] : ''}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Data Referência Vigência *
                  </label>
                  <input
                    type="date"
                    name="data_referencia_vigencia"
                    required
                    defaultValue={empenho.data_referencia_vigencia ? empenho.data_referencia_vigencia.split('T')[0] : ''}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Vínculo de Aditivo / Bloco */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                  Vínculo com Termo Aditivo (Opcional)
                </label>
                <select
                  name="alteracao_id"
                  defaultValue={empenho.alteracao_id || ''}
                  className="w-full p-2 text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                >
                  <option value="">Contrato Inicial (Sem aditivo específico)</option>
                  {aditivos.map((aditivo) => (
                    <option key={aditivo.id} value={aditivo.id}>
                      {aditivo.procedimento || aditivo.tipo} — SEI: {aditivo.processo_sei}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dotação Orçamentária */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Prog. Trabalho *
                  </label>
                  <input
                    type="text"
                    name="programa_trabalho"
                    required
                    defaultValue={empenho.programa_trabalho}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Natureza Despesa *
                  </label>
                  <input
                    type="text"
                    name="natureza_despesa"
                    required
                    defaultValue={empenho.natureza_despesa}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Fonte Recurso *
                  </label>
                  <input
                    type="text"
                    name="fonte_recurso"
                    required
                    defaultValue={empenho.fonte_recurso}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Valor Empenhado Inicial */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                  Valor Empenhado Inicial (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 font-mono text-xs text-ledger-muted">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    name="valor_empenhado_inicial"
                    required
                    defaultValue={empenho.valor_empenhado_inicial}
                    className="w-full p-2 pl-9 font-mono tabular-nums text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
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
                  disabled={isPending}
                  className="px-4 py-1.5 bg-sempi-plum hover:bg-sempi-plum-hover text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
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
