/**
 * Utilitário de exportação de dados em CSV com BOM UTF-8
 * Garante abertura imediata no Microsoft Excel sem corromper acentos ou caracteres especiais.
 */

export interface ExportColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => string | number | boolean | null | undefined);
}

export function exportToCSV<T extends Record<string, any>>(
  filename: string,
  data: T[],
  columns: ExportColumn<T>[]
) {
  if (!data || data.length === 0) {
    alert('Nenhum registro para exportar.');
    return;
  }

  // Cabeçalhos
  const headerRow = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(';');

  // Linhas de dados
  const rows = data.map((item) => {
    return columns
      .map((col) => {
        let val: any;
        if (typeof col.accessor === 'function') {
          val = col.accessor(item);
        } else {
          val = item[col.accessor];
        }

        if (val === null || val === undefined) {
          return '""';
        }
        if (typeof val === 'number') {
          // Formato brasileiro com vírgula para Excel
          return `"${val.toLocaleString('pt-BR')}"`;
        }
        if (typeof val === 'boolean') {
          return val ? '"SIM"' : '"NÃO"';
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(';');
  });

  // BOM UTF-8 (\uFEFF) para forçar o Excel a reconhecer UTF-8
  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
