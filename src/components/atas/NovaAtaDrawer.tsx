'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, AlertCircle, CheckCircle2, ShieldCheck, Share2 } from 'lucide-react';
import { createAtaAction, type AtaActionResponse } from '@/actions/atas.actions';

export function NovaAtaDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AtaActionResponse | null>(null);

  const [papel, setPapel] = useState<'GERENCIADOR' | 'PARTICIPANTE'>('GERENCIADOR');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const response = await createAtaAction(formData);
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
  const proximoAno = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    .toISOString()
    .split('T')[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sempi-plum hover:bg-sempi-plum-hover text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Nova Ata de Registro de Preços</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-full sm:max-w-xl md:max-w-2xl bg-white border-l border-ledger-border h-full flex flex-col shadow-drawer">
            {/* Cabeçalho */}
            <div className="p-4 border-b border-ledger-border bg-slate-50/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
                  Sistema de Registro de Preços (SRP) — Lei 14.133/2021
                </span>
                <h2 className="text-base font-serif font-bold text-ledger-text">
                  Cadastro de Ata de Registro de Preços (ARP)
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

              {/* Papel da SEMPI */}
              <div className="space-y-1">
                <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                  Papel da SEMPI no Registro de Preços *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 border cursor-pointer font-mono text-xs transition-colors ${
                      papel === 'GERENCIADOR'
                        ? 'border-sempi-plum bg-sempi-plum/5 text-sempi-plum font-semibold'
                        : 'border-ledger-border bg-white text-ledger-text hover:bg-ledger-subtle'
                    }`}
                  >
                    <input
                      type="radio"
                      name="papel_secretaria"
                      value="GERENCIADOR"
                      checked={papel === 'GERENCIADOR'}
                      onChange={() => setPapel('GERENCIADOR')}
                      className="sr-only"
                    />
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="block font-bold">Órgão Gerenciador</span>
                      <span className="text-[10px] text-ledger-muted">
                        A SEMPI conduziu a licitação e gerencia a Ata
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 border cursor-pointer font-mono text-xs transition-colors ${
                      papel === 'PARTICIPANTE'
                        ? 'border-sempi-teal bg-sempi-teal/5 text-sempi-teal font-semibold'
                        : 'border-ledger-border bg-white text-ledger-text hover:bg-ledger-subtle'
                    }`}
                  >
                    <input
                      type="radio"
                      name="papel_secretaria"
                      value="PARTICIPANTE"
                      checked={papel === 'PARTICIPANTE'}
                      onChange={() => setPapel('PARTICIPANTE')}
                      className="sr-only"
                    />
                    <Share2 className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="block font-bold">Participante / Carona</span>
                      <span className="text-[10px] text-ledger-muted">
                        Adesão a Ata gerenciada por outro órgão
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Número da Ata & Processo SEI */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Número da Ata (ARP) *
                  </label>
                  <input
                    type="text"
                    name="numero_ata"
                    required
                    placeholder="Ex: 004/2026 ou ARP-SEMPI-01"
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono tabular-nums text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Processo SEI-RJ *
                  </label>
                  <input
                    type="text"
                    name="processo_sei"
                    required
                    placeholder="SEI-310001/000250/2026"
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Código SIGA ARP & Órgão Gerenciador */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Código SIGA da ARP (Opcional)
                  </label>
                  <input
                    type="text"
                    name="codigo_siga_arp"
                    placeholder="Ex: SIGA-ARP-2026-04"
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Órgão Gerenciador da Ata *
                  </label>
                  <input
                    type="text"
                    name="orgao_gerenciador"
                    required
                    defaultValue={
                      papel === 'GERENCIADOR'
                        ? 'Secretaria de Estado da Mulher e de Políticas Inclusivas - SEMPI'
                        : ''
                    }
                    placeholder="Nome do Órgão que gerencia a Ata..."
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Objeto */}
              <div className="space-y-1">
                <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                  Objeto da Ata de Registro de Preços *
                </label>
                <textarea
                  name="objeto"
                  rows={3}
                  required
                  placeholder="Descrição minuciosa dos bens ou serviços registrados no SRP..."
                  className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-sans text-xs"
                />
              </div>

              {/* Datas de Publicação e Vigência */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Publicação PNCP *
                  </label>
                  <input
                    type="date"
                    name="data_publicacao_pncp"
                    required
                    defaultValue={hoje}
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Vigência Início *
                  </label>
                  <input
                    type="date"
                    name="data_vigencia_inicio"
                    required
                    defaultValue={hoje}
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Vigência Fim (1 ano) *
                  </label>
                  <input
                    type="date"
                    name="data_vigencia_fim"
                    required
                    defaultValue={proximoAno}
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Prorrogável e Observações */}
              <div className="p-3 bg-ledger-subtle border border-ledger-border space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-mono text-xs font-semibold text-ledger-text">
                  <input
                    type="checkbox"
                    name="prorrogavel"
                    value="true"
                    defaultChecked
                    className="h-4 w-4 rounded-none border-ledger-border text-sempi-plum focus:ring-0"
                  />
                  <span>Prorrogável por mais 1 ano (Art. 84 da Lei Federal nº 14.133/2021)</span>
                </label>
                <p className="text-[10px] text-ledger-muted font-sans">
                  A vigência da ata de registro de preços será de 1 (um) ano e poderá ser prorrogada por igual período, desde que comprovado o preço vantajoso.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                  Observações Gerais
                </label>
                <textarea
                  name="observacoes"
                  rows={2}
                  placeholder="Informações adicionais, despacho autorizativo, etc..."
                  className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-sans text-xs"
                />
              </div>

              {/* Botões */}
              <div className="pt-4 border-t border-ledger-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs uppercase font-semibold font-mono rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-sempi-plum hover:bg-sempi-plum-hover text-white text-xs uppercase font-semibold font-mono tracking-wider rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? 'Cadastrando Ata...' : 'Salvar Ata de Registro de Preços'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
