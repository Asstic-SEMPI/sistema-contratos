'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Edit2, AlertCircle, CheckCircle2, ShieldCheck, Share2 } from 'lucide-react';
import { updateAtaAction, type AtaActionResponse } from '@/actions/atas.actions';
import type { Database } from '@/lib/types/database.types';

type AtaRow = Database['public']['Tables']['atas_registro_preco']['Row'];

interface EditarAtaDrawerProps {
  ata: AtaRow;
}

export function EditarAtaDrawer({ ata }: EditarAtaDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AtaActionResponse | null>(null);

  const [papel, setPapel] = useState<'GERENCIADOR' | 'PARTICIPANTE'>(
    (ata.papel_secretaria as 'GERENCIADOR' | 'PARTICIPANTE') || 'GERENCIADOR'
  );
  const [status, setStatus] = useState<string>(ata.status || 'VIGENTE');
  const router = useRouter();

  const isEmElaboracao = status === 'EM_FORMALIZACAO';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    formData.set('papel_secretaria', papel);
    formData.set('status', status);

    startTransition(async () => {
      const response = await updateAtaAction(ata.id, formData);
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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-ledger-subtle text-ledger-text text-xs font-semibold border border-ledger-border uppercase tracking-wider transition-colors cursor-pointer"
        title="Editar Ata de Registro de Preços"
      >
        <Edit2 className="w-3.5 h-3.5 text-ledger-muted" />
        <span>Editar ARP</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-none animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white border-l border-ledger-border h-full flex flex-col shadow-none">
            {/* Cabeçalho */}
            <div className="p-4 border-b border-ledger-border bg-ledger-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
                  Sistema de Registro de Preços (SRP) — Edição de Ata
                </span>
                <h2 className="text-base font-serif font-bold text-ledger-text">
                  Editar ARP {ata.numero_ata}
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

              {/* Seletor de Status do Instrumento */}
              <div className="p-3 border border-ledger-border bg-ledger-subtle space-y-2">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted">
                  Situação / Status da Ata *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'VIGENTE', label: 'Vigente', color: 'border-status-vigente text-status-vigente' },
                    { id: 'EM_FORMALIZACAO', label: 'Em Elaboração', color: 'border-blue-600 text-blue-800' },
                    { id: 'SUSPENSO', label: 'Suspenso', color: 'border-status-alerta text-status-alerta' },
                    { id: 'RESCINDIDO', label: 'Cancelado', color: 'border-status-anomalia text-status-anomalia' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatus(s.id)}
                      className={`p-2 border text-center font-semibold text-[11px] uppercase transition-all cursor-pointer ${
                        status === s.id
                          ? `bg-white shadow-sm ring-1 ring-sempi-plum ${s.color}`
                          : 'bg-ledger-bg border-ledger-border text-ledger-muted opacity-70'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {isEmElaboracao && (
                  <p className="text-[10px] text-blue-700 bg-blue-50 p-2 border border-blue-200">
                    ℹ️ <strong>Modo Em Elaboração:</strong> Apenas campos essenciais (Processo SEI, Número e Objeto) são obrigatórios. Publicações no PNCP e datas de vigência poderão ser preenchidas posteriormente.
                  </p>
                )}
              </div>

              {/* Papel da SEMPI */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1.5">
                  Papel da Secretaria (SEMPI) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPapel('GERENCIADOR')}
                    className={`p-2.5 border text-left flex items-start gap-2 transition-all cursor-pointer ${
                      papel === 'GERENCIADOR'
                        ? 'border-sempi-plum bg-sempi-plum/5 text-sempi-plum font-semibold'
                        : 'border-ledger-border bg-white text-ledger-muted'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs">Órgão Gerenciador</span>
                      <span className="text-[10px] font-normal opacity-80">
                        SEMPI conduz a licitação e gerencia cotas
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPapel('PARTICIPANTE')}
                    className={`p-2.5 border text-left flex items-start gap-2 transition-all cursor-pointer ${
                      papel === 'PARTICIPANTE'
                        ? 'border-sempi-petroleum bg-sempi-petroleum/5 text-sempi-petroleum font-semibold'
                        : 'border-ledger-border bg-white text-ledger-muted'
                    }`}
                  >
                    <Share2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs">Órgão Participante</span>
                      <span className="text-[10px] font-normal opacity-80">
                        SEMPI utiliza cota de ata externa
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Órgão Gerenciador */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                  Órgão Gerenciador *
                </label>
                <input
                  type="text"
                  name="orgao_gerenciador"
                  required
                  defaultValue={ata.orgao_gerenciador}
                  className="w-full p-2 text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                />
              </div>

              {/* Número da Ata e Código SIGA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Número da Ata (ARP) *
                  </label>
                  <input
                    type="text"
                    name="numero_ata"
                    required
                    defaultValue={ata.numero_ata}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Código SIGA da ARP
                  </label>
                  <input
                    type="text"
                    name="codigo_siga_arp"
                    defaultValue={ata.codigo_siga_arp || ''}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white uppercase"
                  />
                </div>
              </div>

              {/* Processo SEI */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                  Processo SEI-RJ *
                </label>
                <input
                  type="text"
                  name="processo_sei"
                  required
                  defaultValue={ata.processo_sei}
                  className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                />
              </div>

              {/* Objeto */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                  Objeto da Ata *
                </label>
                <textarea
                  name="objeto"
                  required
                  rows={3}
                  defaultValue={ata.objeto}
                  className="w-full p-2 text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                />
              </div>

              {/* Datas de Vigência e PNCP */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Publicação PNCP {isEmElaboracao ? '' : '*'}
                  </label>
                  <input
                    type="date"
                    name="data_publicacao_pncp"
                    required={!isEmElaboracao}
                    defaultValue={ata.data_publicacao_pncp ? ata.data_publicacao_pncp.split('T')[0] : ''}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Início Vigência {isEmElaboracao ? '' : '*'}
                  </label>
                  <input
                    type="date"
                    name="data_vigencia_inicio"
                    required={!isEmElaboracao}
                    defaultValue={ata.data_vigencia_inicio ? ata.data_vigencia_inicio.split('T')[0] : ''}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                    Fim Vigência {isEmElaboracao ? '' : '*'}
                  </label>
                  <input
                    type="date"
                    name="data_vigencia_fim"
                    required={!isEmElaboracao}
                    defaultValue={ata.data_vigencia_fim ? ata.data_vigencia_fim.split('T')[0] : ''}
                    className="w-full p-2 font-mono text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Prorrogável e Observações */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit_prorrogavel"
                  name="prorrogavel"
                  value="true"
                  defaultChecked={!!ata.prorrogavel}
                  className="rounded-none border-ledger-border text-sempi-plum focus:ring-0 cursor-pointer"
                />
                <label htmlFor="edit_prorrogavel" className="text-xs text-ledger-text cursor-pointer">
                  Ata prorrogável por igual período (Art. 84 da Lei 14.133/21)
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ledger-muted mb-1">
                  Observações Gerais
                </label>
                <textarea
                  name="observacoes"
                  rows={2}
                  defaultValue={ata.observacoes || ''}
                  className="w-full p-2 text-xs border border-ledger-border focus:border-sempi-plum focus:outline-none bg-white"
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
