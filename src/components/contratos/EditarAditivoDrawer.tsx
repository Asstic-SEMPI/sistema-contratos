'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlideOverDrawer } from '@/components/ui-ledger/SlideOverDrawer';
import { updateAlteracaoAction, type AlteracaoActionResponse } from '@/actions/alteracoes.actions';
import { formatCurrency, formatPercent } from '@/lib/utils';
import {
  Edit3,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Shuffle,
  FileText,
  AlertTriangle,
  Info,
  Sparkles,
} from 'lucide-react';
import type { Database, TipoContrato } from '@/lib/types/database.types';

type AlteracaoRow = Database['public']['Tables']['alteracoes_contratuais']['Row'];

interface EditarAditivoDrawerProps {
  alteracao: AlteracaoRow;
  contratoId: string;
  tipoContrato?: TipoContrato;
  valorInicialContrato: number; // Valor Base
  valorAtualizadoContrato: number;
  dataVigenciaFimAtual: string;
  isInstrumentoArt95?: boolean;
  triggerButton?: React.ReactNode;
}

export function EditarAditivoDrawer({
  alteracao,
  contratoId,
  tipoContrato = 'CONTINUO',
  valorInicialContrato,
  valorAtualizadoContrato,
  dataVigenciaFimAtual,
  isInstrumentoArt95 = false,
  triggerButton,
}: EditarAditivoDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AlteracaoActionResponse | null>(null);

  const isContinuo = tipoContrato === 'CONTINUO';
  const [tipo, setTipo] = useState(alteracao.tipo);
  const [finalidadeApostilamento, setFinalidadeApostilamento] = useState<'REAJUSTE_PRECO' | 'ALTERACAO_DADOS_CONTRATUAIS' | 'OUTROS'>('REAJUSTE_PRECO');
  
  // Se for contínuo e misto, o valor registrado na alteração pode conter a base + acréscimo
  // Inicializamos a parcela de acréscimo deduzindo o valor base se o valor registrado for maior que a base
  const initialAcrescimo = (isContinuo && tipo === 'ADITIVO_MISTO')
    ? Math.max(0, Number(alteracao.valor_diferenca) - valorInicialContrato)
    : Number(alteracao.valor_diferenca);

  const [acrescimoAditivado, setAcrescimoAditivado] = useState<number>(initialAcrescimo);
  const [emElaboracao, setEmElaboracao] = useState(false);

  const router = useRouter();

  // 1. Parcela de Renovação de Prazo (Contrato Contínuo)
  const parcelaRenovacaoPrazo = (isContinuo && (tipo === 'ADITIVO_PRAZO' || tipo === 'ADITIVO_MISTO'))
    ? valorInicialContrato
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

  // 3. Novo Valor Previsto no Contrato
  const diferencaLiquidaDesteUpdate = valorDiferencaTermo - Number(alteracao.valor_diferenca);
  const novoValorPrevistoContrato = valorAtualizadoContrato + diferencaLiquidaDesteUpdate;

  // 4. Teto Legal de 25% (Sempre sobre o Valor Base Inicial)
  const tetoLegal25 = valorInicialContrato * 0.25;
  const valorQueConsomeTeto = (tipo === 'ADITIVO_MISTO' || tipo === 'ADITIVO_VALOR') ? acrescimoAditivado : 0;
  const percentualConsumoTeto = valorInicialContrato > 0 ? (valorQueConsomeTeto / valorInicialContrato) * 100 : 0;
  const estouraTeto25 = valorQueConsomeTeto > tetoLegal25;

  const isApostilamentoDados = tipo === 'APOSTILAMENTO' && finalidadeApostilamento === 'ALTERACAO_DADOS_CONTRATUAIS';
  const exigePrazo = tipo === 'ADITIVO_PRAZO' || tipo === 'ADITIVO_MISTO';
  const exigeCampoAcrescimo = tipo === 'ADITIVO_VALOR' || tipo === 'ADITIVO_MISTO' || tipo === 'APOSTILAMENTO';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    formData.set('contrato_id', contratoId);
    formData.set('tipo', tipo);
    formData.set('em_elaboracao', emElaboracao ? 'true' : 'false');
    formData.set('valor_diferenca', String(valorDiferencaTermo));

    if (tipo === 'APOSTILAMENTO') {
      formData.set('finalidade_apostilamento', finalidadeApostilamento);
    }

    startTransition(async () => {
      const response = await updateAlteracaoAction(alteracao.id, formData);
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
          onClick={() => {
            setIsOpen(true);
            setResult(null);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-[11px] font-mono font-semibold text-slate-700 shadow-xs transition-colors cursor-pointer"
        >
          <Edit3 className="w-3 h-3 text-sempi-plum" />
          <span>Editar</span>
        </button>
      )}

      <SlideOverDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Editar ${alteracao.procedimento}`}
        subtitle={`Instrumento ${isInstrumentoArt95 ? 'Art. 95 (NE)' : 'Contrato Formal'} — ${isContinuo ? 'Contrato Contínuo' : 'Contrato de Escopo'}`}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs">
          {result && (
            <div
              className={`p-3.5 border rounded-lg text-xs flex items-start gap-2.5 shadow-xs ${
                result.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{result.message}</p>
                {result.errors && (
                  <ul className="mt-1 list-disc list-inside space-y-0.5 text-[11px]">
                    {Object.entries(result.errors).map(([campo, errs]) => (
                      <li key={campo}>
                        <strong className="capitalize">{campo.replace('_', ' ')}:</strong>{' '}
                        {errs.join(', ')}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Nome do Procedimento e Processo SEI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Nome do Procedimento *
              </label>
              <input
                type="text"
                name="procedimento"
                required
                defaultValue={alteracao.procedimento}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none"
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
                defaultValue={alteracao.processo_sei}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Chave SIGA do Termo Aditivo
            </label>
            <input
              type="text"
              name="chave_siga_termo"
              defaultValue={alteracao.chave_siga_termo || ''}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Justificativa Resumida / Parecer Jurídico *
            </label>
            <textarea
              name="justificativa_resumo"
              required
              rows={2}
              defaultValue={alteracao.justificativa_resumo}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Data de Assinatura do Termo *
            </label>
            <input
              type="date"
              name="data_assinatura"
              required
              defaultValue={alteracao.data_assinatura ? alteracao.data_assinatura.split('T')[0] : ''}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none"
            />
          </div>

          {/* Vigência se aplicável */}
          {exigePrazo && (
            <div className="p-4 border border-slate-200 bg-slate-50/70 rounded-xl space-y-3 shadow-xs">
              <div className="text-xs font-bold uppercase tracking-wider text-sempi-plum flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Prorrogação de Vigência</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Início da Vigência do Aditivo *
                  </label>
                  <input
                    type="date"
                    name="vigencia_termo_inicio"
                    required
                    defaultValue={alteracao.vigencia_termo_inicio ? alteracao.vigencia_termo_inicio.split('T')[0] : ''}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Término da Vigência do Aditivo *
                  </label>
                  <input
                    type="date"
                    name="vigencia_termo_fim"
                    required
                    defaultValue={alteracao.vigencia_termo_fim ? alteracao.vigencia_termo_fim.split('T')[0] : ''}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Regra de Contrato Contínuo por Prazo */}
          {isContinuo && tipo === 'ADITIVO_PRAZO' && (
            <div className="p-4 bg-sempi-plum/5 border border-sempi-plum/20 rounded-xl space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2 text-sempi-plum font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Regra de Contrato Contínuo — Renovação Automática do Valor Base</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed font-sans">
                Conforme Art. 106 e 107 da Lei 14.133/21, o aditivo de prazo em serviço contínuo adiciona o <strong>Valor Base (R$ {formatCurrency(valorInicialContrato)})</strong> referente ao novo ciclo anual.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white p-2.5 rounded-lg border border-sempi-plum/10">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Valor Base Replicado:</span>
                  <span className="font-bold text-sempi-plum">+ {formatCurrency(valorInicialContrato)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Novo Global Previsto:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(novoValorPrevistoContrato)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Campo de Acréscimo Aditivado */}
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
                    <span className="font-bold text-slate-900">+ {formatCurrency(valorInicialContrato)}</span>
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
                  defaultValue={acrescimoAditivado}
                  onChange={(e) => setAcrescimoAditivado(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono text-xs font-bold focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 outline-none"
                />
              </div>
            </div>
          )}

          {/* Demonstrativo Contábil */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-xs font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-600 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sempi-plum" />
                <span>Demonstrativo Contábil Retificado</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                Base: {formatCurrency(valorInicialContrato)}
              </span>
            </div>

            <div className="space-y-1.5 text-slate-700">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Valor Total Deste Termo:</span>
                <span className="text-sempi-plum">{formatCurrency(valorDiferencaTermo)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Valor Global Atualizado do Contrato:</span>
                <span>{formatCurrency(novoValorPrevistoContrato)}</span>
              </div>
            </div>

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
                    Atenção: O acréscimo aditivado de {formatCurrency(valorQueConsomeTeto)} excede o teto legal de 25% sobre o Valor Base.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Botões do Rodapé */}
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
              {isPending ? 'Salvando...' : 'Salvar Alteração'}
            </button>
          </div>
        </form>
      </SlideOverDrawer>
    </>
  );
}
