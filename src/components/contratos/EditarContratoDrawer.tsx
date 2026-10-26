'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Edit3, AlertCircle, CheckCircle2 } from 'lucide-react';
import { updateContratoAction, type ContratoActionResponse } from '@/actions/contratos.actions';
import type { Database, TipoContrato, TipoLicitacao } from '@/lib/types/database.types';

type ContratoRow = Database['public']['Tables']['contratos']['Row'];

interface EditarContratoDrawerProps {
  contrato: ContratoRow;
  triggerButton?: React.ReactNode;
}

export function EditarContratoDrawer({ contrato, triggerButton }: EditarContratoDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ContratoActionResponse | null>(null);

  const [tipoFormalizacao, setTipoFormalizacao] = useState(contrato.tipo_formalizacao);
  const [status, setStatus] = useState(contrato.status);
  const [tipoContrato, setTipoContrato] = useState<TipoContrato>(contrato.tipo_contrato || 'CONTINUO');
  const [tipoLicitacao, setTipoLicitacao] = useState<TipoLicitacao>(contrato.tipo_licitacao || 'PREGAO_ELETRONICO');
  const [emergencial, setEmergencial] = useState<boolean>(contrato.emergencial || false);
  const router = useRouter();

  const isElaboracao = status === 'EM_FORMALIZACAO';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    formData.set('tipo_formalizacao', tipoFormalizacao);
    formData.set('status', status);
    formData.set('tipo_contrato', tipoContrato);
    formData.set('tipo_licitacao', tipoLicitacao);
    formData.set('emergencial', emergencial ? 'true' : 'false');

    startTransition(async () => {
      const response = await updateContratoAction(contrato.id, formData);
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-ledger-subtle border border-ledger-border text-ledger-text text-xs font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5 text-sempi-plum" />
          <span>Editar Contrato</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-full sm:max-w-xl md:max-w-2xl bg-white border-l border-ledger-border h-full flex flex-col shadow-drawer">
            {/* Cabeçalho */}
            <div className="p-4 border-b border-ledger-border bg-slate-50/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
                  Edição de Instrumento Contratual
                </span>
                <h2 className="text-base font-serif font-bold text-ledger-text">
                  Editar {contrato.numero_contrato || 'Contrato'} — Processo {contrato.processo_sei}
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

              {/* Status do Contrato */}
              <div className="space-y-1">
                <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                  Status do Instrumento *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 'VIGENTE', label: 'Vigente', color: 'border-status-vigente bg-status-vigente-bg/20 text-status-vigente' },
                    { val: 'SUSPENSO', label: 'Suspenso', color: 'border-status-alerta bg-status-alerta-bg/20 text-status-alerta' },
                    { val: 'RESCINDIDO', label: 'Cancelado / Rescindido', color: 'border-status-anomalia bg-status-anomalia-bg/20 text-status-anomalia' },
                    { val: 'EM_FORMALIZACAO', label: 'Em Elaboração', color: 'border-ledger-border-strong bg-ledger-subtle text-ledger-text' },
                  ].map((s) => (
                    <label
                      key={s.val}
                      className={`flex items-center justify-center p-2 border cursor-pointer font-mono text-[11px] font-semibold transition-colors ${
                        status === s.val ? s.color : 'border-ledger-border bg-white text-ledger-muted hover:bg-ledger-subtle'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status_radio"
                        value={s.val}
                        checked={status === s.val}
                        onChange={() => setStatus(s.val as any)}
                        className="sr-only"
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
                {isElaboracao && (
                  <div className="p-2 bg-ledger-subtle border border-ledger-border text-[10px] font-mono text-ledger-muted">
                    ℹ️ MODO EM ELABORAÇÃO ATIVO: Apenas campos básicos de registro inicial são obrigatórios. Prazos, publicações e chaves definitivas podem ser preenchidos quando o contrato for formalizado.
                  </div>
                )}
              </div>

              {/* Tipo de Instrumento */}
              <div className="space-y-1">
                <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                  Modalidade do Instrumento *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-2.5 border cursor-pointer font-mono text-xs transition-colors ${
                      tipoFormalizacao === 'CONTRATO_FORMAL'
                        ? 'border-sempi-plum bg-sempi-plum/5 text-sempi-plum font-semibold'
                        : 'border-ledger-border bg-white text-ledger-text hover:bg-ledger-subtle'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo_formalizacao_radio"
                      value="CONTRATO_FORMAL"
                      checked={tipoFormalizacao === 'CONTRATO_FORMAL'}
                      onChange={() => setTipoFormalizacao('CONTRATO_FORMAL')}
                      className="sr-only"
                    />
                    <span className="block font-bold">Contrato Formal</span>
                    <span className="text-[10px] text-ledger-muted">
                      Instrumento assinado com número formal e publicação
                    </span>
                  </label>

                  <label
                    className={`p-2.5 border cursor-pointer font-mono text-xs transition-colors ${
                      tipoFormalizacao === 'NOTA_EMPENHO_FORCA_CONTRATO'
                        ? 'border-sempi-teal bg-sempi-teal/5 text-sempi-teal font-semibold'
                        : 'border-ledger-border bg-white text-ledger-text hover:bg-ledger-subtle'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo_formalizacao_radio"
                      value="NOTA_EMPENHO_FORCA_CONTRATO"
                      checked={tipoFormalizacao === 'NOTA_EMPENHO_FORCA_CONTRATO'}
                      onChange={() => setTipoFormalizacao('NOTA_EMPENHO_FORCA_CONTRATO')}
                      className="sr-only"
                    />
                    <span className="block font-bold">Nota de Empenho (Art. 95)</span>
                    <span className="text-[10px] text-ledger-muted">
                      Força de contrato (entrega imediata / dispensa)
                    </span>
                  </label>
                </div>
              </div>

              {/* Informações da Contratação e Licitação (Lei 14.133/2021) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block">
                  Regime de Execução & Licitação
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-slate-700 text-[11px] mb-1">
                      1) Tipo de Contrato *
                    </label>
                    <select
                      name="tipo_contrato"
                      value={tipoContrato}
                      onChange={(e) => setTipoContrato(e.target.value as TipoContrato)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-mono text-xs focus:outline-none focus:border-sempi-plum"
                    >
                      <option value="CONTINUO">Contínuo</option>
                      <option value="ESCOPO">Escopo</option>
                    </select>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {tipoContrato === 'CONTINUO' ? 'Serviços/fornecimento contínuo' : 'Execução de entrega certa'}
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-slate-700 text-[11px] mb-1">
                      2) Tipo de Licitação *
                    </label>
                    <select
                      name="tipo_licitacao"
                      value={tipoLicitacao}
                      onChange={(e) => setTipoLicitacao(e.target.value as TipoLicitacao)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-mono text-xs focus:outline-none focus:border-sempi-plum"
                    >
                      <option value="PREGAO_ELETRONICO">Pregão Eletrônico</option>
                      <option value="DISPENSA_LICITACAO">Dispensa de Licitação</option>
                      <option value="INEXIGIBILIDADE">Inexigibilidade</option>
                      <option value="CONCORRENCIA">Concorrência</option>
                    </select>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Hipótese / modalidade
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-slate-700 text-[11px] mb-1">
                      3) Emergencial *
                    </label>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <button
                        type="button"
                        onClick={() => setEmergencial(false)}
                        className={`flex-1 py-1.5 px-2 text-center text-xs font-mono font-semibold rounded-md border transition-all ${
                          !emergencial
                            ? 'bg-white border-slate-300 text-slate-800 shadow-xs'
                            : 'bg-slate-100 border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Não
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmergencial(true)}
                        className={`flex-1 py-1.5 px-2 text-center text-xs font-mono font-semibold rounded-md border transition-all ${
                          emergencial
                            ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs font-bold'
                            : 'bg-slate-100 border-transparent text-slate-400 hover:text-rose-600'
                        }`}
                      >
                        Sim
                      </button>
                    </div>
                  </div>
                </div>

                {emergencial && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-[11px] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Caráter Emergencial Declarado:</strong> Contratação com fulcro no Art. 75, VIII da Lei nº 14.133/2021 (dispensa emergencial com vigência máxima improrrogável de até 1 ano).
                    </div>
                  </div>
                )}
              </div>

              {/* Número do Contrato e Processo SEI */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Número do Contrato {tipoFormalizacao === 'CONTRATO_FORMAL' && !isElaboracao ? '*' : '(Opcional)'}
                  </label>
                  <input
                    type="text"
                    name="numero_contrato"
                    defaultValue={contrato.numero_contrato || ''}
                    placeholder="Ex: 014/2026"
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
                    defaultValue={contrato.processo_sei}
                    placeholder="SEI-310001/000123/2026"
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Chave SIGA e Valor Inicial */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Chave SIGA do Contrato {!isElaboracao ? '*' : '(Opcional em elaboração)'}
                  </label>
                  <input
                    type="text"
                    name="chave_siga_contrato"
                    defaultValue={contrato.chave_siga_contrato}
                    placeholder="Ex: SIGA-CT-2026-001"
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Valor Inicial (R$) {!isElaboracao ? '*' : '(Estimado)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="valor_inicial"
                    defaultValue={contrato.valor_inicial}
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono tabular-nums text-xs font-bold"
                  />
                </div>
              </div>

              {/* Dados da Contratada */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    CNPJ da Contratada {!isElaboracao ? '*' : '(Opcional)'}
                  </label>
                  <input
                    type="text"
                    name="contratada_cnpj"
                    defaultValue={contrato.contratada_cnpj}
                    placeholder="00.000.000/0001-00"
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono tabular-nums text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Razão Social da Contratada {!isElaboracao ? '*' : '(Opcional)'}
                  </label>
                  <input
                    type="text"
                    name="contratada_razao_social"
                    defaultValue={contrato.contratada_razao_social}
                    placeholder="Razão Social completa..."
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-sans text-xs"
                  />
                </div>
              </div>

              {/* Objeto */}
              <div className="space-y-1">
                <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                  Objeto do Instrumento *
                </label>
                <textarea
                  name="objeto"
                  rows={3}
                  required
                  defaultValue={contrato.objeto}
                  placeholder="Descrição minuciosa do objeto contratado..."
                  className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-sans text-xs"
                />
              </div>

              {/* Datas de Publicação e Vigência */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Publicação PNCP {!isElaboracao ? '*' : ''}
                  </label>
                  <input
                    type="date"
                    name="data_publicacao_pncp"
                    defaultValue={contrato.data_publicacao_pncp}
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Início da Vigência {!isElaboracao ? '*' : ''}
                  </label>
                  <input
                    type="date"
                    name="data_vigencia_inicio_original"
                    defaultValue={contrato.data_vigencia_inicio_original}
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                    Término da Vigência {!isElaboracao ? '*' : ''}
                  </label>
                  <input
                    type="date"
                    name="data_vigencia_fim_original"
                    defaultValue={contrato.data_vigencia_fim_original}
                    className="w-full p-2 bg-white border border-ledger-border focus:border-sempi-plum focus:outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1">
                <label className="font-mono text-ledger-muted uppercase text-[10px] block">
                  Observações Gerais
                </label>
                <textarea
                  name="observacoes"
                  rows={2}
                  defaultValue={contrato.observacoes || ''}
                  placeholder="Informações adicionais, despacho, etc..."
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
                  disabled={isPending}
                  className="px-4 py-2 bg-sempi-plum hover:bg-sempi-plum-hover text-white text-xs uppercase font-semibold font-mono tracking-wider transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Salvando Alterações...' : 'Atualizar Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
