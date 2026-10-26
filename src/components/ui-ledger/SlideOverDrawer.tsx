'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export function SlideOverDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
}: SlideOverDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full ${sizeClasses[size]} bg-white border-l border-slate-200 h-full flex flex-col shadow-drawer animate-in slide-in-from-right duration-200`}
      >
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-serif font-bold text-slate-900 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 font-sans leading-tight">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/70 text-slate-400 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 font-sans">
          {children}
        </div>
      </div>
    </div>
  );
}
