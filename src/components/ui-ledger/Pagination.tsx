'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  currentPage,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(totalRecords, currentPage * pageSize);

  // Gera lista compacta de páginas para navegação
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border-t border-slate-200/80 text-xs font-sans ${className}`}
    >
      {/* Controles de Registros por Página e Intervalo Atual */}
      <div className="flex items-center gap-3 text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 font-mono uppercase">Exibir:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="px-2 py-1 text-xs font-mono font-semibold bg-slate-50 border border-slate-200 rounded-md text-slate-700 hover:bg-slate-100 focus:outline-hidden focus:ring-1 focus:ring-sempi-plum"
            aria-label="Selecionar quantidade de registros por página"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} por pág.
              </option>
            ))}
          </select>
        </div>

        <span className="text-slate-300">|</span>

        <span className="text-slate-600 font-mono text-[11px]">
          Exibindo <strong className="text-slate-900 font-bold">{startRecord}</strong>–
          <strong className="text-slate-900 font-bold">{endRecord}</strong> de{' '}
          <strong className="text-slate-900 font-bold">{totalRecords}</strong>
        </span>
      </div>

      {/* Botões de Navegação entre Páginas */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Primeira página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Números das páginas */}
        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1 text-slate-400 font-mono">
                  ...
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(Number(p))}
                className={`min-w-[28px] h-7 px-2 text-xs font-mono tabular-nums rounded-md transition-all ${
                  isCurrent
                    ? 'bg-sempi-plum text-white font-bold shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Próxima página"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          title="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
