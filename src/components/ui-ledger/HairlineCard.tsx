import React from 'react';
import { cn } from '@/lib/utils';

interface HairlineCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export function HairlineCard({
  title,
  subtitle,
  action,
  noPadding = false,
  className,
  children,
  ...props
}: HairlineCardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-ledger-border shadow-xs rounded-xl overflow-hidden transition-shadow duration-150',
        className
      )}
      {...props}
    >
      {(title || action || subtitle) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-ledger-border bg-slate-50/60">
          <div>
            {title && (
              <h3 className="text-xs font-bold uppercase tracking-wider text-ledger-text font-sans">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-ledger-muted font-normal mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-2 self-start sm:self-auto">{action}</div>}
        </div>
      )}
      <div className={cn(!noPadding && 'p-4 sm:p-5')}>{children}</div>
    </div>
  );
}
