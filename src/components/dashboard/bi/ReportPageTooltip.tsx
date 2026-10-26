'use client';

import React from 'react';
import type { HierarchicalLevel1Contrato } from '@/lib/types/bi-analytics.types';
import { MoneyCell } from '@/components/ui-ledger/MoneyCell';
import { formatDate } from '@/lib/utils';
import { ShieldCheck, UserCheck, Calendar, FileText, Percent, Info } from 'lucide-react';

export function ReportPageTooltipContent({ contrato }: { contrato: HierarchicalLevel1Contrato }) {
  const cap25Usado = Number(contrato.percentual_acrescimo_acumulado) || 0;
  const isCapEstourado = cap25Usado > 25;

  return (
    <div className="w-80 p-3.5 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700/80 text-xs space-y-3 font-sans">
      {/* Cabeçalho do Dossiê */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
          <span>Dossiê Técnico SEMPI</span>
          <span className="text-teal-400 font-semibold">{contrato.tipo_formalizacao}</span>
        </div>
        <div className="font-bold text-sm text-slate-100 truncate">
          {contrato.numero_contrato || 'Nota de Empenho (Art. 95)'}
        </div>
        <div className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
          {contrato.contratada_razao_social}
        </div>
      </div>

      {/* Códigos Governamentais */}
      <div className="grid grid-cols-2 gap-2 p-2 bg-slate-800/80 rounded-lg text-[11px] font-mono">
        <div>
          <span className="text-slate-400 block text-[9px] uppercase">Processo SEI:</span>
          <span className="text-slate-200 font-bold truncate block">{contrato.processo_sei}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[9px] uppercase">Chave SIGA:</span>
          <span className="text-slate-200 font-bold truncate block">{contrato.chave_siga_contrato || 'N/A'}</span>
        </div>
      </div>

      {/* Fiscais e Portaria DOERJ */}
      <div className="space-y-1.5 pt-1 border-t border-slate-800 text-[11px]">
        <div className="flex items-start gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
          <div className="truncate">
            <span className="text-slate-400">Gestor: </span>
            <span className="font-semibold text-slate-200">
              {contrato.fiscais_info.gestor?.nome || 'Não designado'}
            </span>
            {contrato.fiscais_info.gestor?.portaria && (
              <span className="text-slate-400 text-[10px] block">
                Portaria DOERJ: {contrato.fiscais_info.gestor.portaria}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div className="truncate">
            <span className="text-slate-400">Fiscal Técnico: </span>
            <span className="font-semibold text-slate-200">
              {contrato.fiscais_info.fiscalTecnico?.nome || 'Não designado'}
            </span>
            {contrato.fiscais_info.fiscalTecnico?.portaria && (
              <span className="text-slate-400 text-[10px] block">
                Portaria DOERJ: {contrato.fiscais_info.fiscalTecnico.portaria}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Limite Legal de 25% (Art. 125 da Lei 14.133/21) */}
      <div className="pt-2 border-t border-slate-800 space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">
            {contrato.tipo_contrato === 'CONTINUO' ? 'Acréscimo Art. 125:' : 'Teto Legal Aditivos (Art. 125):'}
          </span>
          <span
            className={`font-bold tabular-nums ${
              isCapEstourado ? 'text-red-400' : 'text-teal-400'
            }`}
          >
            {cap25Usado.toFixed(1)}% / 25%
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isCapEstourado ? 'bg-red-500' : 'bg-teal-500'
            }`}
            style={{ width: `${Math.min(100, (cap25Usado / 25) * 100)}%` }}
          />
        </div>
        {contrato.tipo_contrato === 'CONTINUO' && (
          <div className="text-[9px] font-mono text-slate-400">
            Prorrogações contínuas não consomem o teto de 25%
          </div>
        )}
      </div>

      {/* Última Liquidação (Atesto NF) */}
      <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span>Último Atesto/OB:</span>
        </div>
        <span className="text-slate-200 font-semibold">
          {contrato.data_ultima_liquidacao
            ? formatDate(contrato.data_ultima_liquidacao)
            : 'Sem liquidações'}
        </span>
      </div>
    </div>
  );
}
