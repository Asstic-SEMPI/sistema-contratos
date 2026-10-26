'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBadgeProps {
  value: string;
  label?: string;
  className?: string;
  copyable?: boolean;
}

export function CodeBadge({ value, label, className, copyable = true }: CodeBadgeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!copyable) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback silencioso
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copyable ? `Clique para copiar: ${value}` : value}
      className={cn(
        'group inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 text-slate-800 rounded-md transition-all duration-150',
        copyable && 'hover:border-sempi-plum/40 hover:text-sempi-plum active:scale-95 cursor-pointer',
        className
      )}
    >
      {label && (
        <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-slate-500 select-none">
          {label}:
        </span>
      )}
      <span className="font-mono text-xs tabular-nums font-semibold tracking-tight">
        {value}
      </span>
      {copyable && (
        <span className="text-slate-400 group-hover:text-sempi-plum transition-colors ml-0.5">
          {copied ? (
            <Check className="w-3 h-3 text-emerald-600" />
          ) : (
            <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
          )}
        </span>
      )}
    </button>
  );
}
