import React from 'react';
import { formatDate } from '@/lib/utils';
import { Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CodeBadge } from '@/components/ui-ledger/CodeBadge';

interface BlocoVigencia {
  id: string;
  nome: string;
  tipo: 'CONTRATO_INICIAL' | 'ADITIVO';
  dataInicio: string;
  dataFim: string;
}

interface ReguaTemporalProps {
  vigenciaInicioOriginal: string;
  vigenciaFimOriginal: string;
  vigenciaFimAtual: string;
  aditivosPrazo: Array<{
    id: string;
    procedimento: string;
    vigencia_termo_inicio: string | null;
    vigencia_termo_fim: string | null;
  }>;
  empenhos: Array<{
    id: string;
    numero_nota_empenho: string;
    chave_siga: string;
    data_referencia_vigencia: string;
    vinculo_automatico_detectado: string | null;
  }>;
}

export function ReguaTemporalVigencia({
  vigenciaInicioOriginal,
  vigenciaFimOriginal,
  vigenciaFimAtual,
  aditivosPrazo,
  empenhos,
}: ReguaTemporalProps) {
  // Constrói os blocos cronológicos de vigência
  const blocos: BlocoVigencia[] = [
    {
      id: 'inicial',
      nome: 'Contrato Inicial',
      tipo: 'CONTRATO_INICIAL',
      dataInicio: vigenciaInicioOriginal,
      dataFim: vigenciaFimOriginal,
    },
    ...aditivosPrazo
      .filter((a) => a.vigencia_termo_inicio && a.vigencia_termo_fim)
      .map((a) => ({
        id: a.id,
        nome: a.procedimento,
        tipo: 'ADITIVO' as const,
        dataInicio: a.vigencia_termo_inicio!,
        dataFim: a.vigencia_termo_fim!,
      })),
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-sempi-plum/10 text-sempi-plum rounded-md">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Régua Temporal: Janelas de Vigência x Chave SIGA / SIAFE-Rio
          </span>
        </div>
        <div className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
          Vigência Global: <strong className="text-slate-800">{formatDate(vigenciaInicioOriginal)}</strong> até <strong className="text-sempi-plum">{formatDate(vigenciaFimAtual)}</strong>
        </div>
      </div>

      {/* Blocos de Vigência Visual Responsivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {blocos.map((bloco, idx) => {
          const empenhosNesteBloco = empenhos.filter(
            (e) =>
              e.vinculo_automatico_detectado === bloco.nome ||
              (bloco.tipo === 'CONTRATO_INICIAL' && e.vinculo_automatico_detectado === 'CONTRATO_INICIAL')
          );

          return (
            <div
              key={bloco.id}
              className={`p-4 border rounded-xl transition-all ${
                bloco.tipo === 'CONTRATO_INICIAL'
                  ? 'border-slate-200 bg-slate-50/60 shadow-xs'
                  : 'border-teal-200 bg-teal-50/30 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-900 text-sm">
                  {idx + 1}. {bloco.nome}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                  bloco.tipo === 'CONTRATO_INICIAL' ? 'bg-slate-200 text-slate-700' : 'bg-teal-100 text-teal-800'
                }`}>
                  {bloco.tipo === 'CONTRATO_INICIAL' ? 'Base' : 'Aditivo de Prazo'}
                </span>
              </div>

              <div className="text-xs font-mono text-slate-500 flex items-center gap-1.5 mb-3">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {formatDate(bloco.dataInicio)} ➔ {formatDate(bloco.dataFim)}
                </span>
              </div>

              {/* Empenhos alocados automaticamente nesta janela */}
              <div className="border-t border-slate-200/60 pt-2.5 space-y-1.5">
                <div className="text-[11px] font-mono uppercase text-slate-500 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Empenhos Vinculados ({empenhosNesteBloco.length})</span>
                </div>
                {empenhosNesteBloco.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {empenhosNesteBloco.map((emp) => (
                      <CodeBadge
                        key={emp.id}
                        value={emp.numero_nota_empenho}
                        className="text-[11px] py-0.5"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">
                    Nenhuma NE emitida nesta janela.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
