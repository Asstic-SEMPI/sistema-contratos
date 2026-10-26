'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { SlideOverDrawer } from '@/components/ui-ledger/SlideOverDrawer';
import { updateFiscalAction, type FiscalActionResponse } from '@/actions/fiscais.actions';
import { formatDate } from '@/lib/utils';
import {
  Edit2,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  History,
  ShieldAlert,
  Calendar,
  FileText,
  User,
  RotateCcw,
} from 'lucide-react';
import type { Database } from '@/lib/types/database.types';

type FiscalRow = Database['public']['Tables']['contrato_fiscais']['Row'];

interface EditarFiscalDrawerProps {
  contratoId: string;
  fiscal: FiscalRow;
}

export function EditarFiscalDrawer({ contratoId, fiscal }: EditarFiscalDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<FiscalActionResponse | null>(null);
  const [isReativando, setIsReativando] = useState(false);
  const router = useRouter();

  const isHistoricoInativo = !fiscal.ativo;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);

    const formData = new FormData(e.currentTarget);
    if (isHistoricoInativo) {
      formData.set('ativo', isReativando ? 'true' : 'false');
    }

    startTransition(async () => {
      const response = await updateFiscalAction(fiscal.id, contratoId, formData);
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
      {isHistoricoInativo ? (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsReativando(false);
            setResult(null);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-[11px] font-mono font-semibold rounded-md border border-slate-300 shadow-xs transition-all cursor-pointer"
          title="Ver histórico e retificar dados da designação deste fiscal inativo"
        >
          <History className="w-3.5 h-3.5 text-slate-500" />
          <span>Histórico / Retificar</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setResult(null);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-mono font-semibold rounded-md border border-slate-200 shadow-xs transition-all cursor-pointer"
          title="Editar dados da designação do fiscal"
        >
          <Edit2 className="w-3 h-3 text-slate-400" />
          <span>Editar</span>
        </button>
      )}

      <SlideOverDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={isHistoricoInativo ? 'Registro Histórico de Fiscalização' : 'Editar Membro da Comissão'}
        subtitle={
          isHistoricoInativo
            ? 'Servidor substituído ou desligado da comissão contratual'
            : 'Atualização cadastral e portaria de fiscal em exercício formal'
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs">
          {/* Mensagens de Feedback */}
          {result && (
            <div
              className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 shadow-xs ${
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

          {/* Banner de Fiscal Inativo / Substituído */}
          {isHistoricoInativo ? (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-600/10 flex items-center justify-center text-amber-800">
                    <History className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-900 uppercase tracking-tight">
                    Fiscal Substituído / Inativo na Comissão
                  </span>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Desligado em {fiscal.data_fim ? formatDate(fiscal.data_fim) : 'Data não informada'}
                </span>
              </div>
              <p className="text-[11px] text-amber-800/90 font-sans leading-relaxed">
                Este servidor atuou como <strong>{fiscal.funcao}</strong> no período de{' '}
                <strong className="font-mono">{formatDate(fiscal.data_inicio)}</strong> até{' '}
                <strong className="font-mono">{fiscal.data_fim ? formatDate(fiscal.data_fim) : 'Indeterminado'}</strong>, 
                conforme Portaria <strong>{fiscal.portaria_designacao}</strong>.
              </p>

              {/* Opção de Reativação */}
              <div className="pt-2.5 border-t border-amber-200/60 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isReativando}
                    onChange={(e) => setIsReativando(e.target.checked)}
                    className="w-4 h-4 rounded text-sempi-plum focus:ring-sempi-plum/20 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-sempi-plum" />
                    <span>Reativar este servidor na comissão ativa do contrato</span>
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 shadow-xs">
              <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Servidor com <strong>atuação ativa em vigor</strong>. Qualquer alteração de portaria ou período será auditada.
              </span>
            </div>
          )}

          {/* Nome do Servidor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nome Completo do Servidor *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="nome"
                required
                defaultValue={fiscal.nome}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 transition-all outline-none"
              />
            </div>
          </div>

          {/* ID Funcional */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              ID Funcional (Matrícula RJ) *
            </label>
            <input
              type="text"
              name="id_funcional"
              required
              defaultValue={fiscal.id_funcional}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono tabular-nums font-semibold focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 transition-all outline-none"
            />
          </div>

          {/* Função na Comissão */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Função Formal na Comissão *
            </label>
            <select
              name="funcao"
              required
              defaultValue={fiscal.funcao}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 transition-all outline-none cursor-pointer"
            >
              <option value="GESTOR">GESTOR (Coordenação Geral - Art. 117 da Lei 14.133/21)</option>
              <option value="FISCAL_TECNICO">FISCAL TÉCNICO (Atesto de Execução do Objeto)</option>
              <option value="FISCAL_ADMINISTRATIVO">FISCAL ADMINISTRATIVO (Certidões e Encargos)</option>
              <option value="FISCAL_SETORIAL">FISCAL SETORIAL (Unidade Descentralizada)</option>
              <option value="SUPLENTE">SUPLENTE (Substituição Imediata)</option>
            </select>
          </div>

          {/* Portaria de Designação */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Portaria de Designação DOERJ *
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="portaria_designacao"
                required
                defaultValue={fiscal.portaria_designacao}
                placeholder="Ex: Portaria SEMPI nº 123/2026"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 transition-all outline-none"
              />
            </div>
          </div>

          {/* Publicação DOERJ e Data de Início */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Data de Publicação DOERJ *
              </label>
              <input
                type="date"
                name="data_publicacao_doerj"
                required
                defaultValue={fiscal.data_publicacao_doerj ? fiscal.data_publicacao_doerj.split('T')[0] : ''}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Início da Atuação *
              </label>
              <input
                type="date"
                name="data_inicio"
                required
                defaultValue={fiscal.data_inicio ? fiscal.data_inicio.split('T')[0] : ''}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 transition-all outline-none"
              />
            </div>
          </div>

          {/* Data de Término */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {isHistoricoInativo ? 'Data de Término / Substituição' : 'Término da Atuação (Opcional se em exercício)'}
            </label>
            <input
              type="date"
              name="data_fim"
              defaultValue={fiscal.data_fim ? fiscal.data_fim.split('T')[0] : ''}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:border-sempi-plum focus:ring-1 focus:ring-sempi-plum/20 transition-all outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              {isHistoricoInativo
                ? 'Data registrada em que o servidor deixou formalmente a comissão de fiscalização.'
                : 'Deixe em branco enquanto o fiscal estiver desempenhando ativamente suas funções.'}
            </span>
          </div>

          {/* Botões de Ação do Rodapé */}
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
              className="px-5 py-2 bg-sempi-plum hover:bg-sempi-plum-hover text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>
                {isPending
                  ? 'Salvando...'
                  : isReativando
                  ? 'Reativar e Salvar Fiscal'
                  : isHistoricoInativo
                  ? 'Salvar Retificação Histórica'
                  : 'Atualizar Fiscal'}
              </span>
            </button>
          </div>
        </form>
      </SlideOverDrawer>
    </>
  );
}
