import React from 'react';
import { cn, formatCurrency } from '@/lib/utils';

interface MoneyCellProps {
  value: number | null | undefined;
  className?: string;
  isNegative?: boolean;
  prefix?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function MoneyCell({ value, className, isNegative, prefix, size = 'md' }: MoneyCellProps) {
  const numericVal = value ?? 0;
  const isActuallyNegative = isNegative || numericVal < 0;

  const sizeClasses = {
    xs: 'text-[11px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-semibold',
    xl: 'text-xl font-bold',
  };

  const hasCustomTextColor = className?.includes('text-');
  const defaultTextColor = isActuallyNegative ? 'text-status-anomalia' : 'text-ledger-text';

  return (
    <span
      className={cn(
        'font-mono tabular-nums tracking-tight inline-block',
        sizeClasses[size],
        !hasCustomTextColor && defaultTextColor,
        className
      )}
    >
      {prefix && <span className="mr-0.5">{prefix}</span>}
      {formatCurrency(numericVal)}
    </span>
  );
}
