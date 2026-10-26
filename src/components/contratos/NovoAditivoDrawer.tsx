'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlideOverDrawer } from '@/components/ui-ledger/SlideOverDrawer';
import { createAlteracaoAction, type AlteracaoActionResponse } from '@/actions/alteracoes.actions';
import { formatCurrency, formatPercent } from '@/lib/utils';
import {
  Plus,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Shuffle,
  FileText,
  AlertTriangle,
  Sparkles,
  Info,
} from 'lucide-react';
import type { TipoAlteracao, TipoInstrumento, TipoContrato } from '@/lib/types/database.types';

interface NovoAditivoDrawerProps {
  contratoId: string;
  tipoFormalizacao: TipoInstrumento;
  tipoContrato?: TipoContrato;
  valorInicial: number; // Valor Base
  valorAtualizado: number;
  vigenciaFimAtual: string;
}

export function NovoAditivoDrawer({
  contratoId,
  tipoFormalizacao,
  tipoContrato = 'CONTINUO',
  valorInicial,
  valorAtualizado,
  vigenciaFimAtual,
}: NovoAditivoDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isArt95 = tipoFormalizacao === 'NOTA_EMPENHO_FORCA_CONTRATO';
  const isContinuo = tipoContrato === 'CONTINUO';

  const [tipo, setTipo] = useState<TipoAlteracao>(isArt95 ? 'APOSTILAMENTO' : 'ADITIVO_PRAZO');
  // Para aditivo misto/valor: valor de acréscimo aditivado digitado pelo usuário
  const [acrescimoAditivado, setAcrescimoAditivado] = useState<number>(0);
  const [novaDataFim, setNovaDataFim] = useState<string>('');

  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AlteracaoActionResponse | null>(null);
  const router = useRouter();

  // 1. Cálculo da Parcela de Renovação de Prazo (Contrato Contínuo)
  const parcelaRenovacaoPrazo = (isContinuo && (tipo === 'ADITIVO_PRAZO' || tipo === 'ADITIVO_MISTO'))
    ? valorInicial
    : 0;

  // 2. Cálculo do Valor Diferença Total deste Termo
  let valorDiferencaTermo = 0;
  if (tipo === 'ADITIVO_PRAZO') {
    valorDiferencaTermo = parcelaRenovacaoPrazo;
  } else if (tipo === 'ADITIVO_MISTO') {
    valorDiferencaTermo = parcelaRenovacaoPrazo + acrescimoAditivado;
  } else if (tipo === 'ADITIVO_VALOR' || tipo === 'APOSTILAMENTO') {
    valorDiferencaTermo = acrescimoAditivado;
  }

  // 3. Novo Valor Global Previsto
  const novoValorPrevisto = valorAtualizado + valorDiferencaTermo;

  // 4. Cálculo do Teto Legal de 25% (Art. 125 da Lei 14.133/21)
  // O teto é SEMPRE calculado sobre o Valor Base (valorInicial)
  const tetoLegal25 = valorInicial * 0.25;
  // Apenas a alteração de valor (acréscimo quantitativo/qualitativo) consome o teto de 25%
  const valorQueConsomeTeto = (tipo === 'ADITIVO_MISTO' || tipo === 'ADITIVO_VALOR') ? acrescimoAditivado : 0;
  const percentualConsumoTeto = valorInicial > 0 ? (valorQueConsomeTeto / valorInicial) * 100 : 0;
  const estouraTeto25 = valorQueConsomeTeto > tetoLegal25;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    formData.set('contrato_id', contratoId);
    formData.set('tipo', tipo);
    // Envia o valor_diferenca total consolidado
    formData.set('valor_diferenca', String(valorDiferencaTermo));

    startTransition(async () => {
      const response = await createAlteracaoAction(formData);
      setResult(response);
      if (response.success) {
        setTimeout(() => {
          setIsOpen(false);
          router.refresh();
        }, 1200);
      }
    });
  };

  const exigePrazo = tipo === 'ADITIVO_PRAZO' || tipo === 'ADITIVO_MISTO';
  const exigeCampoAcrescimo = tipo === 'ADITIVO_VALOR' || tipo === 'ADITIVO_MISTO' || tipo === 'APOSTILAMENTO';

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setResult(null);
          setAcrescimoAditivado(0);
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sempi-plum hover:bg-sempi-plum-hover text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-xs transition-colors cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{isArt95 ? 'Novo Apostilamento' : 'Nova Alteração Contratual'}</span>
      </button>

      <SlideOverDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={isArt95 ? 'Lançar Apostilamento Contratual' : 'Registrar Alteração Contratual'}
        subtitle={`Instrumento ${tipoFormalizacao === 'CONTRATO_FORMAL' ? 'Formal' : 'Art. 95'} — Modalidade ${tipoContrato === 'CONTINUO' ? 'Contrato Contínuo' : 'Contrato de Escopo'}`}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs">
          {/* Alertas e Mensagens de Feedback */}
          {result?.message && !result.success && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-start gap-2.5 shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <span className="font-bold block">{result.message}</span>
                {result.errors && (
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                    {Object.entries(result.errors).map(([field, errs]) => (
                      <li key={field}>{errs[0]}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {result?.success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-bold">{result.message}</span>
            </div>
          )}

          {/* Banner Explicativo de Art. 95 se aplicável */}
          {isArt95 ? (
            <div className="p-3.5 bg-sempi-teal/10 border border-sempi-teal/30 text-sempi-teal rounded-lg leading-relaxed shadow-xs">
              ⚖️ <strong>Vedação do Art. 95 da Lei 14.133/21:</strong> Este instrumento foi formalizado exclusivamente por Nota de Empenho. É vedada a celebração de Termos Aditivos de Prazo ou de Valor. Somente <strong>Apostilamentos</strong> (reajuste por índice ou retificação de dotação) são admitidos.
            </div>
          ) : (
            /* Seleção do Tipo de Alteração Contratual */
            <div className="space-y-1.5">
              <label className="block font-semibold uppercase tracking-wider text-slate-700">
                Tipo de Alteração Contratual *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTipo('ADITIVO_PRAZO')}
                  className={`p-3 text-left border rounded-lg transition-all cursor-pointer ${
                    tipo === 'ADITIVO_PRAZO'
                      ? 'border-sempi-plum bg-sempi-plum/5 font-semibold text-sempi-plum shadow-xs ring-1 ring-sempi-plum/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-sempi-plum" />
                    <span className="text-xs font-bold">1. Aditivo de Prazo</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal leading-tight">
                    {isContinuo
                      ? 'Prorroga a vigência e replica o Valor Base para o novo ciclo anual.'
                      : 'Prorrogação de vigência sem alteração de valor.'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('ADITIVO_VALOR')}
                  className={`p-3 text-left border rounded-lg transition-all cursor-pointer ${
                    tipo === 'ADITIVO_VALOR'
                      ? 'border-sempi-plum bg-sempi-plum/5 font-semibold text-sempi-plum shadow-xs ring-1 ring-sempi-plum/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="w-3.5 h-3.5 text-sempi-plum" />
                    <span className="text-xs font-bold">2. Aditivo de Valor</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal leading-tight">
                    Acréscimo ou supressão quantitativa/qualitativa (sem alterar vigência).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('ADITIVO_MISTO')}
                  className={`p-3 text-left border rounded-lg transition-all cursor-pointer ${
                    tipo === 'ADITIVO_MISTO'
                      ? 'border-sempi-plum bg-sempi-plum/5 font-semibold text-sempi-plum shadow-xs ring-1 ring-sempi-plum/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Shuffle className="w-3.5 h-3.5 text-sempi-plum" />
                    <span className="text-xs font-bold">3. Aditivo Misto</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal leading-tight">
                    {isContinuo
                      ? 'Prorroga vigência (replica base) e adiciona acréscimo de valor.'
                      : 'Prorrogação de prazo concomitante com alteração de valor.'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('APOSTILAMENTO')}
                  className={`p-3 text-left border rounded-lg transition-all cursor-pointer ${
                    tipo === 'APOSTILAMENTO'
                      ? 'border-sempi-teal bg-sempi-teal/5 font-semibold text-sempi-teal shadow-xs ring-1 ring-sempi-teal/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5 text-sempi-teal" />
                    <span className="text-xs font-bold">4. Apostilamento</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal leading-tight">
                    Reajuste por índice oficial (IPCA/IGP-M) ou alteração de dados.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Identificação do Procedimento e Processo SEI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Nome do Procedimento *
              </label>
              <input
                type="text"
                name="procedimento"
                required
                placeholder={isArt95 ? 'Ex: 1º Apostilamento' : tipo === 'APOSTILAMENTO' ? 'Ex: 1º Apostilamento' : 'Ex: 1º Termo Aditivo'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Processo SEI-RJ *
              </label>
              <input
                type="text"
                name="processo_sei"
                required
                placeholder="SEI-150001/000789/2026"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Chave SIGA do Termo Aditivo (Opcional)
            </label>
            <input
              type="text"
              name="chave_siga_termo"
              placeholder="SIGA-TA-2026-00012"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none transition-all"
            />
          </div>

          {/* Justificativa Resumo */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Justificativa Resumida / Parecer Jurídico *
            </label>
            <textarea
              name="justificativa_resumo"
              required
              rows={2}
              placeholder="Fundamentação fática e legal (Art. 106, 107 ou 124 da Lei 14.133/21, Parecer PGE nº...)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none transition-all resize-none"
            />
          </div>

          {/* Data de Assinatura */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Data da Assinatura do Instrumento *
            </label>
            <input
              type="date"
              name="data_assinatura"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none transition-all"
            />
          </div>

          {/* Bloco de Vigência (Aditivo de Prazo ou Misto) */}
          {exigePrazo && (
            <div className="p-4 border border-slate-200 bg-slate-50/70 rounded-xl space-y-3 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-sempi-plum flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Prorrogação de Vigência</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Início da Nova Vigência *
                  </label>
                  <input
                    type="date"
                    name="vigencia_termo_inicio"
                    defaultValue={vigenciaFimAtual}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Término da Nova Vigência *
                  </label>
                  <input
                    type="date"
                    name="vigencia_termo_fim"
                    required
                    onChange={(e) => setNovaDataFim(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bloco de Regra de Contrato Contínuo por Prazo */}
          {isContinuo && tipo === 'ADITIVO_PRAZO' && (
            <div className="p-4 bg-sempi-plum/5 border border-sempi-plum/20 rounded-xl space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2 text-sempi-plum font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Regra de Contrato Contínuo — Renovação Automática do Valor Base</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed font-sans">
                Conforme Art. 106 e 107 da Lei 14.133/21, a prorrogação de prazo em contrato contínuo replica o <strong>Valor Base (R$ {formatCurrency(valorInicial)})</strong> para o novo ciclo de vigência.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white p-2.5 rounded-lg border border-sempi-plum/10">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Valor Base Replicado:</span>
                  <span className="font-bold text-sempi-plum">+ {formatCurrency(valorInicial)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Novo Global Atualizado:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(novoValorPrevisto)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bloco de Acréscimo Aditivado (Misto, Valor ou Apostilamento) */}
          {exigeCampoAcrescimo && (
            <div className="p-4 border border-slate-200 bg-slate-50/70 rounded-xl space-y-3.5 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-sempi-plum flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span>
                    {tipo === 'ADITIVO_MISTO'
                      ? 'Acréscimo Aditivado (Alteração de Valor)'
                      : 'Variação de Valor Contratual'}
                  </span>
                </div>
                {isContinuo && tipo === 'ADITIVO_MISTO' && (
                  <span className="text-[10px] font-mono text-sempi-teal font-bold bg-sempi-teal/10 px-2 py-0.5 rounded-full border border-sempi-teal/20">
                    Base + Acréscimo
                  </span>
                )}
              </div>

              {isContinuo && tipo === 'ADITIVO_MISTO' && (
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs space-y-1 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>1. Parcela de Renovação de Prazo (Base Contínua):</span>
                    <span className="font-bold text-slate-900">+ {formatCurrency(valorInicial)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  {tipo === 'ADITIVO_MISTO' ? '2. Valor do Acréscimo Aditivado (R$) *' : 'Valor da Diferença (R$) *'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Ex: 45000.00 (ou negativo para supressão)"
                  onChange={(e) => setAcrescimoAditivado(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-xs font-bold focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {tipo === 'ADITIVO_MISTO'
                    ? 'Informe apenas a parcela de alteração de valor (acréscimo ou supressão). O valor base será somado automaticamente.'
                    : 'Valores positivos indicam acréscimo/reajuste. Valores negativos indicam supressão.'}
                </span>
              </div>
            </div>
          )}

          {/* Painel Consolidado de Impacto Financeiro e Teto de 25% */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-xs font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-600 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sempi-plum" />
                <span>Demonstrativo Contábil do Termo Aditivo</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                Base: {formatCurrency(valorInicial)}
              </span>
            </div>

            <div className="space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Valor Atualizado Vigente Anterior:</span>
                <span className="font-bold">{formatCurrency(valorAtualizado)}</span>
              </div>

              {isContinuo && (tipo === 'ADITIVO_PRAZO' || tipo === 'ADITIVO_MISTO') && (
                <div className="flex justify-between text-sempi-teal font-semibold">
                  <span>(+) Renovação Prazo Contínuo (Valor Base):</span>
                  <span>+ {formatCurrency(valorInicial)}</span>
                </div>
              )}

              {(tipo === 'ADITIVO_MISTO' || tipo === 'ADITIVO_VALOR' || tipo === 'APOSTILAMENTO') && acrescimoAditivado !== 0 && (
                <div className="flex justify-between text-sempi-plum font-semibold">
                  <span>{acrescimoAditivado > 0 ? '(+) Acréscimo Aditivado:' : '(-) Supressão Aditivada:'}</span>
                  <span>{acrescimoAditivado > 0 ? '+' : ''}{formatCurrency(acrescimoAditivado)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold border-t border-slate-200 pt-2 text-sm text-slate-900">
                <span className="text-sempi-plum">Novo Valor Global Atualizado:</span>
                <span className="text-sempi-plum">{formatCurrency(novoValorPrevisto)}</span>
              </div>
            </div>

            {/* Cálculo de Teto de 25% (Sempre em cima do Valor Base) */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Teto Legal 25% sobre o Valor Base (Art. 125):</span>
                <span className="font-semibold text-slate-800">{formatCurrency(tetoLegal25)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Consumo Deste Aditivo no Teto de 25%:</span>
                <span className={`font-bold ${estouraTeto25 ? 'text-status-anomalia' : 'text-sempi-teal'}`}>
                  {formatPercent(percentualConsumoTeto)} ({formatCurrency(valorQueConsomeTeto)})
                </span>
              </div>

              {estouraTeto25 && (
                <div className="mt-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[10px] flex items-start gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    Atenção: O acréscimo aditivado de {formatCurrency(valorQueConsomeTeto)} excede o limite legal de 25% sobre o Valor Base de {formatCurrency(valorInicial)} (Art. 125 da Lei 14.133/21). Exige justificativa formal de excepcionalidade.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Publicações Oficiais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Data DOERJ
              </label>
              <input
                type="date"
                name="publicacao_doerj_data"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Página DOERJ
              </label>
              <input
                type="text"
                name="publicacao_doerj_pagina"
                placeholder="Ex: 14"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Data PNCP
              </label>
              <input
                type="date"
                name="publicacao_pncp_data"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Observações Adicionais
            </label>
            <textarea
              name="observacoes"
              rows={2}
              placeholder="Informações complementares de dotação ou processo..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none resize-none"
            />
          </div>

          {/* Botões de Ação */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 bg-sempi-plum hover:bg-sempi-plum-hover text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isPending ? 'Gravando no Banco...' : 'Confirmar e Salvar Aditivo'}
            </button>
          </div>
        </form>
      </SlideOverDrawer>
    </>
  );
}
