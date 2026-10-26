import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata valor numérico para Moeda Real (R$) com suporte tabular
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata data no formato brasileiro DD/MM/AAAA
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  // Evita desvio de fuso para strings no formato YYYY-MM-DD
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

/**
 * Formata percentual com 2 casas decimais
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '0,00%';
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/**
 * Formata CNPJ (00.000.000/0000-00)
 */
export function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return '—';
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return cnpj;
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Formata CPF (000.000.000-00)
 */
export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '—';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/**
 * Calcula a diferença em dias entre a data atual e a data de vencimento
 */
export function getDiasAteVencimento(dataFim: string): number {
  const [ano, mes, dia] = dataFim.split('-').map(Number);
  const dataAlvo = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  dataAlvo.setHours(0, 0, 0, 0);

  const diffTime = dataAlvo.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
