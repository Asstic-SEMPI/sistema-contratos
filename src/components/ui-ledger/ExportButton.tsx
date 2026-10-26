'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { exportToCSV, type ExportColumn } from '@/lib/utils/exportData';

interface ExportButtonProps<T extends Record<string, any>> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  label?: string;
  className?: string;
}

export function ExportButton<T extends Record<string, any>>({
  data,
  columns,
  filename,
  label = 'Exportar CSV',
  className = '',
}: ExportButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    try {
      setIsExporting(true);
      exportToCSV(filename, data, columns);
    } catch (err) {
      console.error('Erro na exportação:', err);
      alert('Ocorreu um erro ao gerar o arquivo de exportação.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting || data.length === 0}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg shadow-2xs disabled:opacity-50 disabled:pointer-events-none transition-colors ${className}`}
      title={`Exportar ${data.length} registros para arquivo compatível com Excel`}
    >
      {isExporting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-sempi-plum" />
      ) : (
        <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
      )}
      <span>{label}</span>
    </button>
  );
}
