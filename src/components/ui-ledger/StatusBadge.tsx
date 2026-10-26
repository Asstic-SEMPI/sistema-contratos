import React from 'react';
import { cn } from '@/lib/utils';
import type { StatusInstrumento, TipoInstrumento } from '@/lib/types/database.types';

interface StatusBadgeProps {
  status?: StatusInstrumento | string;
  tipoFormalizacao?: TipoInstrumento;
  diasRestantes?: number;
  className?: string;
}

export function StatusBadge({ status, tipoFormalizacao, diasRestantes, className }: StatusBadgeProps) {
  // Alerta de Vigência < 60 dias
  if (diasRestantes !== undefined && status === 'VIGENTE') {
    if (diasRestantes < 0) {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-red-200 text-red-700 bg-red-50 font-mono text-[11px] font-bold tabular-nums uppercase tracking-tight shadow-xs',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
          Vencido ({Math.abs(diasRestantes)}d)
        </span>
      );
    }
    if (diasRestantes <= 60) {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-200 text-amber-800 bg-amber-50 font-mono text-[11px] font-bold tabular-nums uppercase tracking-tight shadow-xs',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Expira em {diasRestantes}d
        </span>
      );
    }
  }

  // Tipo de Formalização (Art. 95)
  if (tipoFormalizacao) {
    if (tipoFormalizacao === 'NOTA_EMPENHO_FORCA_CONTRATO') {
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-teal-200 text-teal-800 bg-teal-50 font-mono text-[11px] font-semibold tracking-tight shadow-xs',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
          Art. 95 (Empenho)
        </span>
      );
    }
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-slate-200 text-slate-700 bg-slate-50 font-mono text-[11px] font-semibold tracking-tight shadow-xs',
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Contrato Formal
      </span>
    );
  }

  // Status Padrão
  switch (status) {
    case 'VIGENTE':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-200 text-emerald-800 bg-emerald-50 font-sans text-[11px] font-bold tracking-wide uppercase shadow-xs',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Vigente
        </span>
      );
    case 'ENCERRADO':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-slate-200 text-slate-700 bg-slate-100 font-sans text-[11px] font-semibold tracking-wide uppercase shadow-xs',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          Encerrado
        </span>
      );
    case 'RESCINDIDO':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-rose-200 text-rose-800 bg-rose-50 font-sans text-[11px] font-bold tracking-wide uppercase shadow-xs',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          Cancelado / Rescindido
        </span>
      );
    case 'SUSPENSO':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-200 text-amber-800 bg-amber-50 font-sans text-[11px] font-bold tracking-wide uppercase shadow-xs',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Suspenso
        </span>
      );
    case 'EM_FORMALIZACAO':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-blue-200 text-blue-800 bg-blue-50 font-sans text-[11px] font-bold tracking-wide uppercase shadow-xs',
            className
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Em Elaboração
        </span>
      );
    default:
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-slate-200 text-slate-700 bg-slate-50 text-[11px] font-semibold shadow-xs',
            className
          )}
        >
          {status}
        </span>
      );
  }
}
