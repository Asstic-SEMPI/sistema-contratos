'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Building2, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';
import { createContratoAction, type ContratoActionResponse } from '@/actions/contratos.actions';
import type { TipoInstrumento, TipoContrato, TipoLicitacao } from '@/lib/types/database.types';

interface NovoContratoDrawerProps {
  atasDisponiveis?: Array<{ id: string; numero_ata: string; objeto: string }>;
}

export function NovoContratoDrawer({ atasDisponiveis = [] }: NovoContratoDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tipoFormalizacao, setTipoFormalizacao] = useState<TipoInstrumento>('CONTRATO_FORMAL');
  const [tipoContrato, setTipoContrato] = useState<TipoContrato>('CONTINUO');
  const [tipoLicitacao, setTipoLicitacao] = useState<TipoLicitacao>('PREGAO_ELETRONICO');
  const [emergencial, setEmergencial] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ContratoActionResponse | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    formData.set('tipo_formalizacao', tipoFormalizacao);
    formData.set('tipo_contrato', tipoContrato);
    formData.set('tipo_licitacao', tipoLicitacao);
    formData.set('emergencial', emergencial ? 'true' : 'false');

    startTransition(async () => {
      const response = await createContratoAction(formData);
      setResult(response);
      if (response.success && response.contratoId) {
        setTimeout(() => {
          setIsOpen(false);
          router.push(`/contratos/${response.contratoId}`);
        }, 800);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sempi-plum hover:bg-sempi-plum-hover text-white text-xs font-semibold rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Novo Instrumento</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-full sm:max-w-xl md:max-w-2xl bg-white border-l border-ledger-border h-full flex flex-col shadow-drawer">
            {/* Cabeçalho da Gaveta */}
            <div className="p-4 border-b border-ledger-border bg-slate-50/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ledger-muted">
                  Formalização Governamental
                </span>
                <h2 className="text-base font-serif font-bold text-ledger-text">
                  Cadastrar Novo Instrumento Contratual
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

            {/* Formulário com Scroll Técnico */}
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
                  <span className="font-semibold">{result.message} Redirecionando...</span>
                </div>
              )}

              {/* Seletor de Tipo de Formalização (Art. 95) */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1.5">
                  Tipo de Formalização (Lei nº 14.133/2021)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoFormalizacao('CONTRATO_FORMAL')}
                    className={`p-3 text-left border transition-all ${
                      tipoFormalizacao === 'CONTRATO_FORMAL'
                        ? 'border-sempi-plum bg-sempi-plum/5 font-semibold text-sempi-plum'
                        : 'border-ledger-border hover:bg-ledger-subtle text-ledger-text'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileCheck className="w-4 h-4" />
                      <span>Contrato Formal</span>
                    </div>
                    <p className="text-[10px] text-ledger-muted font-normal">
                      Instrumento padrão assinado pelas partes com numeração anual.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoFormalizacao('NOTA_EMPENHO_FORCA_CONTRATO')}
                    className={`p-3 text-left border transition-all ${
                      tipoFormalizacao === 'NOTA_EMPENHO_FORCA_CONTRATO'
                        ? 'border-sempi-teal bg-sempi-teal/5 font-semibold text-sempi-teal'
                        : 'border-ledger-border hover:bg-ledger-subtle text-ledger-text'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Building2 className="w-4 h-4" />
                      <span>Art. 95 (Empenho)</span>
                    </div>
                    <p className="text-[10px] text-ledger-muted font-normal">
                      Substitutivo de contrato para entrega imediata ou dispensa.
                    </p>
                  </button>
                </div>

                {tipoFormalizacao === 'NOTA_EMPENHO_FORCA_CONTRATO' && (
                  <div className="mt-2 p-2.5 bg-sempi-teal-light border border-sempi-teal/30 text-[11px] text-sempi-teal leading-relaxed">
                    ⚖️ <strong>Vedação Jurídica (Art. 95):</strong> Instrumentos formalizados exclusivamente por Nota de Empenho não admitem Termos Aditivos de Prazo ou Valor. Apenas apostilamentos são permitidos.
                  </div>
                )}
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

              {/* Grid de Campos Identificadores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                    {tipoFormalizacao === 'CONTRATO_FORMAL' ? 'Número do Contrato *' : 'Número do Instrumento / OF'}
                  </label>
                  <input
                    type="text"
                    name="numero_contrato"
                    required={tipoFormalizacao === 'CONTRATO_FORMAL'}
                    placeholder={tipoFormalizacao === 'CONTRATO_FORMAL' ? 'Ex: 014/2026' : 'Ex: OF-002/2026 (Opcional)'}
                    className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                    Processo SEI-RJ *
                  </label>
                  <input
                    type="text"
                    name="processo_sei"
                    required
                    placeholder="SEI-150001/000432/2026"
                    className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                  Chave SIGA do Instrumento *
                </label>
                <input
                  type="text"
                  name="chave_siga_contrato"
                  required
                  placeholder="SIGA-CT-2026-00431"
                  className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                />
              </div>

              {/* Dados da Contratada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                    CNPJ da Contratada *
                  </label>
                  <input
                    type="text"
                    name="contratada_cnpj"
                    required
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                    Razão Social da Contratada *
                  </label>
                  <input
                    type="text"
                    name="contratada_razao_social"
                    required
                    placeholder="Nome Empresarial Completo"
                    className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border text-xs focus:outline-none focus:border-sempi-plum"
                  />
                </div>
              </div>

              {/* Objeto */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                  Objeto da Contratação *
                </label>
                <textarea
                  name="objeto"
                  required
                  rows={3}
                  placeholder="Descrição sucinta e clara do objeto pactuado..."
                  className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border text-xs focus:outline-none focus:border-sempi-plum resize-none"
                />
              </div>

              {/* Valores e Vigências */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                    Valor Inicial (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="valor_inicial"
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                    Data Publicação PNCP *
                  </label>
                  <input
                    type="date"
                    name="data_publicacao_pncp"
                    required
                    className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                    Vigência Início *
                  </label>
                  <input
                    type="date"
                    name="data_vigencia_inicio_original"
                    required
                    className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                    Vigência Fim *
                  </label>
                  <input
                    type="date"
                    name="data_vigencia_fim_original"
                    required
                    className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                  />
                </div>
              </div>

              {/* Vínculo com Ata de Origem */}
              {atasDisponiveis.length > 0 && (
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                    Vinculado à Ata de Registro de Preços (Opcional)
                  </label>
                  <select
                    name="ata_origem_id"
                    className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border font-mono text-xs focus:outline-none focus:border-sempi-plum"
                  >
                    <option value="">Nenhuma (Contratação Direta / Licitação Própria)</option>
                    {atasDisponiveis.map((ata) => (
                      <option key={ata.id} value={ata.id}>
                        ARP nº {ata.numero_ata} — {ata.objeto.slice(0, 40)}...
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block font-semibold uppercase tracking-wider text-ledger-text mb-1">
                  Observações Gerais
                </label>
                <textarea
                  name="observacoes"
                  rows={2}
                  placeholder="Dotação orçamentária, parecer jurídico de referência, etc."
                  className="w-full px-3 py-2 bg-ledger-subtle border border-ledger-border text-xs focus:outline-none focus:border-sempi-plum resize-none"
                />
              </div>

              {/* Botões de Ação */}
              <div className="pt-4 border-t border-ledger-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors uppercase font-semibold text-xs rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-sempi-plum hover:bg-sempi-plum-hover text-white transition-colors uppercase font-semibold text-xs rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? 'Validando e Gravando...' : 'Cadastrar Instrumento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
