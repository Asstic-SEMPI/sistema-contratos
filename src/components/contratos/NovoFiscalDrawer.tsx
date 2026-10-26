'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, UserPlus, Users, ArrowRightLeft, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { designarFiscalAction, swapFiscalAction, type FiscalActionResponse } from '@/actions/fiscais.actions';
import type { Database } from '@/lib/types/database.types';

type FiscalRow = Database['public']['Tables']['contrato_fiscais']['Row'];

interface NovoFiscalDrawerProps {
  contratoId: string;
  fiscaisAtivos: FiscalRow[];
}

export function NovoFiscalDrawer({ contratoId, fiscaisAtivos }: NovoFiscalDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [modo, setModo] = useState<'DESIGNACAO' | 'SWAP'>('DESIGNACAO');
  const [fiscalParaSubstituir, setFiscalParaSubstituir] = useState<string>(
    fiscaisAtivos.length > 0 ? fiscaisAtivos[0].id : ''
  );

  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FiscalActionResponse | null>(null);
  const router = useRouter();

  const fiscalSelecionadoObj = fiscaisAtivos.find((f) => f.id === fiscalParaSubstituir);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    formData.set('contrato_id', contratoId);

    startTransition(async () => {
      let response: FiscalActionResponse;
      if (modo === 'DESIGNACAO') {
        response = await designarFiscalAction(formData);
      } else {
        formData.set('fiscal_anterior_id', fiscalParaSubstituir);
        if (fiscalSelecionadoObj) {
          formData.set('funcao', fiscalSelecionadoObj.funcao);
        }
        response = await swapFiscalAction(formData);
      }

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
        <UserPlus className="w-3.5 h-3.5" />
        <span>Designar / Substituir Fiscal</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-none animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white border-l border-ledger-border h-full flex flex-col shadow-none">
            {/* Cabeçalho */}
            <div className="p-4 border-b border-ledger-border bg-ledger-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
                  Comissão de Fiscalização — DOERJ
                </span>
                <h2 className="text-base font-serif font-bold text-ledger-text">
                  {modo === 'DESIGNACAO' ? 'Designar Servidor para Comissão' : 'Substituição Atômica (Swap de Fiscal)'}
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

            {/* Alternância de Modo (Designação vs. Swap) */}
            <div className="px-5 pt-3 flex gap-2 border-b border-ledger-border bg-white">
              <button
                type="button"
                onClick={() => {
                  setModo('DESIGNACAO');
                  setResult(null);
                }}
                className={`pb-2.5 px-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                  modo === 'DESIGNACAO'
                    ? 'border-sempi-plum text-sempi-plum'
                    : 'border-transparent text-ledger-muted hover:text-ledger-text'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Nova Designação</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModo('SWAP');
                  setResult(null);
                }}
                disabled={fiscaisAtivos.length === 0}
                className={`pb-2.5 px-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                  modo === 'SWAP'
                    ? 'border-sempi-teal text-sempi-teal'
                    : 'border-transparent text-ledger-muted hover:text-ledger-text disabled:opacity-40'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Substituição (Swap Atômico)</span>
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

              {/* MODO SWAP: Seleção do Fiscal Atual a ser Substituído */}
              {modo === 'SWAP' && (
                <div className="p-3 bg-sempi-teal-light/40 border border-sempi-teal/40 space-y-2">
                  <label className="block font-semibold uppercase tracking-wider text-sempi-teal">
                    1. Selecione o Fiscal Ativo a ser Substituído *
                  </label>
                  <select
                    value={fiscalParaSubstituir}
                    onChange={(e) => setFiscalParaSubstituir(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-teal"
                  >
                    {fiscaisAtivos.map((f) => (
                      <option key={f.id} value={f.id}>
                        [{f.funcao}] {f.nome} — ID: {f.id_funcional} (Portaria: {f.portaria_designacao})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-ledger-muted">
                    O servidor selecionado terá sua atuação encerrada formalmente no dia da substituição.
                  </p>
                </div>
              )}

              {/* Dados do Servidor (Novo ou Designado) */}
              <div className="space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ledger-text border-b border-ledger-border pb-1">
                  {modo === 'SWAP' ? '2. Dados do Novo Servidor Substituto' : 'Dados do Servidor Designado'}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                      Nome Completo do Servidor *
                    </label>
                    <input
                      type="text"
                      name={modo === 'SWAP' ? 'nome_novo' : 'nome'}
                      required
                      placeholder="Ex: Carlos Eduardo de Oliveira"
                      className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border text-xs focus:outline-none focus:border-sempi-plum"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                      ID Funcional (Padrão RJ) *
                    </label>
                    <input
                      type="text"
                      name={modo === 'SWAP' ? 'id_funcional_novo' : 'id_funcional'}
                      required
                      placeholder="Ex: 4321987-1"
                      className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                    />
                  </div>
                </div>

                {modo === 'DESIGNACAO' && (
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                      Função na Comissão de Fiscalização *
                    </label>
                    <select
                      name="funcao"
                      required
                      className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                    >
                      <option value="GESTOR">GESTOR (Responsável pela coordenação)</option>
                      <option value="FISCAL_TECNICO">FISCAL_TECNICO (Atesto de execução técnica)</option>
                      <option value="FISCAL_ADMINISTRATIVO">FISCAL_ADMINISTRATIVO (Atesto de obrigações/controles)</option>
                      <option value="SUPLENTE">SUPLENTE (Substituto em ausências)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Dados da Portaria DOERJ */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-ledger-text border-b border-ledger-border pb-1">
                  Publicação Oficial no Diário Oficial (DOERJ)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                      Portaria de Designação *
                    </label>
                    <input
                      type="text"
                      name={modo === 'SWAP' ? 'nova_portaria' : 'portaria_designacao'}
                      required
                      placeholder="Ex: Portaria SEMPI nº 045/2026"
                      className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                      Data da Publicação no DOERJ *
                    </label>
                    <input
                      type="date"
                      name="data_publicacao_doerj"
                      required
                      className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                      {modo === 'SWAP' ? 'Data da Substituição / Início *' : 'Data de Início da Atuação *'}
                    </label>
                    <input
                      type="date"
                      name={modo === 'SWAP' ? 'data_substituicao' : 'data_inicio'}
                      required
                      className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                    />
                  </div>

                  {modo === 'DESIGNACAO' && (
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                        Data de Término Prevista (Opcional)
                      </label>
                      <input
                        type="date"
                        name="data_fim"
                        className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
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
                  {isPending ? 'Processando...' : modo === 'SWAP' ? 'Executar Substituição' : 'Formalizar Designação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
