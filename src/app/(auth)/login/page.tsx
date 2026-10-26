'use client';

import React, { useActionState } from 'react';
import { loginAction } from '@/actions/auth.actions';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Building2 } from 'lucide-react';

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ledger-paper">
      {/* Moldura Arquitetônica Central */}
      <div className="w-full max-w-md bg-white border border-ledger-border shadow-none">
        {/* Cabeçalho Institucional Governo RJ / SEMPI */}
        <div className="px-8 pt-8 pb-6 border-b border-ledger-border bg-ledger-subtle/50 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-sempi-plum text-white mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="text-[10px] font-sans font-bold tracking-[0.2em] text-ledger-muted uppercase">
            Governo do Estado do Rio de Janeiro
          </div>
          <h1 className="text-xl font-serif font-bold text-sempi-plum mt-1">
            SGC — SEMPI
          </h1>
          <p className="text-xs text-ledger-muted mt-1 leading-relaxed">
            Sistema de Gestão de Contratos e Atas de Registro de Preços
          </p>
          <div className="inline-block mt-2 px-2 py-0.5 bg-white border border-ledger-border text-[10px] font-mono text-ledger-muted uppercase">
            Lei Federal nº 14.133/2021
          </div>
        </div>

        {/* Formulário de Autenticação */}
        <form action={formAction} className="p-8 space-y-5">
          {state?.error && (
            <div className="p-3 bg-status-anomalia-bg/50 border border-status-anomalia text-status-anomalia text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ledger-text mb-1.5">
              E-mail Institucional
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ledger-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                name="email"
                required
                placeholder="servidor@sempi.rj.gov.br"
                className="w-full pl-9 pr-3 py-2 bg-ledger-subtle border border-ledger-border text-xs font-mono text-ledger-text focus:outline-none focus:border-sempi-plum focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ledger-text">
                Senha de Acesso
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-ledger-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-ledger-subtle border border-ledger-border text-xs font-mono text-ledger-text focus:outline-none focus:border-sempi-plum focus:bg-white transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 px-4 bg-sempi-plum hover:bg-sempi-plum-hover text-white text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{isPending ? 'Verificando Credenciais...' : 'Acessar o Sistema'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Rodapé de Segurança e Conformidade */}
        <div className="px-8 py-3 bg-ledger-subtle border-t border-ledger-border flex items-center justify-between text-[11px] text-ledger-muted font-mono">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-sempi-teal" />
            <span>RBAC & RLS Ativos</span>
          </span>
          <span>Ambiente Seguro</span>
        </div>
      </div>
    </div>
  );
}
