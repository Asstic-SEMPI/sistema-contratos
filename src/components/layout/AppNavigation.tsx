'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Layers,
  Users,
  ShieldCheck,
  Building2,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  Menu,
  X,
  UserCog,
  Palette,
} from 'lucide-react';
import { CodeBadge } from '@/components/ui-ledger/CodeBadge';
import { signOutAction } from '@/actions/auth.actions';
import type { Database } from '@/lib/types/database.types';

type PerfilUsuario = Database['public']['Tables']['perfis_usuarios']['Row'];

interface AppNavigationProps {
  userEmail?: string;
  profile?: PerfilUsuario | null;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Matriz de Gestão',
    sublabel: 'Visão Executiva & Alertas',
    icon: LayoutDashboard,
  },
  {
    href: '/contratos',
    label: 'Contratos & Art. 95',
    sublabel: 'Instrumentos & Aditivos',
    icon: FileText,
  },
  {
    href: '/atas',
    label: 'Atas de Registro de Preço',
    sublabel: 'Gerenciadas & Participantes',
    icon: Layers,
  },
  {
    href: '/fiscais',
    label: 'Comissão de Fiscalização',
    sublabel: 'Portarias DOERJ & Servidores',
    icon: Users,
  },
  {
    href: '/auditoria',
    label: 'Auditoria Forense',
    sublabel: 'Trilha JSONB Imutável',
    icon: ShieldCheck,
  },
  {
    href: '/usuarios',
    label: 'Usuários & Perfis',
    sublabel: 'Controle RBAC & Acessos',
    icon: UserCog,
  },
  {
    href: '/perfil',
    label: 'Meu Perfil & Temas',
    sublabel: 'Segurança & Cores',
    icon: Palette,
  },
];

export function AppNavigation({ userEmail, profile, children }: AppNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Barra de Topo Governamental Oficial */}
      <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Botão Hambúrguer Mobile / Tablet */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Abrir Menu de Navegação"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-sempi-plum text-white flex items-center justify-center font-bold rounded-lg shadow-xs group-hover:bg-sempi-plum-hover transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 leading-tight">
                  Governo do Estado do Rio de Janeiro
                </div>
                <div className="text-base font-serif font-bold text-sempi-plum leading-tight">
                  SGC — SEMPI
                </div>
              </div>
            </Link>

            <div className="hidden lg:block h-5 w-[1px] bg-slate-200 mx-2" />

            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200/60 rounded-md font-medium">
                Exercício 2026
              </span>
              <span>•</span>
              <span className="text-sempi-teal font-semibold">Lei nº 14.133/21</span>
            </div>
          </div>

          {/* Informações do Servidor & Perfil RBAC */}
          <div className="flex items-center gap-2 sm:gap-4">
            {profile ? (
              <div className="flex items-center gap-2.5">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">
                    {profile.nome_completo}
                  </div>
                  <div className="flex items-center gap-1.5 justify-end text-[11px] text-slate-500 mt-0.5">
                    <span className="truncate max-w-[150px]">{profile.setor}</span>
                    <span>•</span>
                    <CodeBadge
                      value={profile.id_funcional}
                      label="ID"
                      copyable={false}
                      className="py-0 px-1 text-[10px] bg-slate-100 text-slate-700 border-slate-200"
                    />
                  </div>
                </div>

                <div className="px-2.5 py-1 bg-sempi-plum text-white text-[10px] font-mono uppercase tracking-wider font-bold rounded-md shadow-xs">
                  {profile.role}
                </div>
              </div>
            ) : userEmail ? (
              <div className="text-xs font-mono text-slate-500 hidden sm:block">{userEmail}</div>
            ) : null}

            <form action={signOutAction}>
              <button
                type="submit"
                title="Encerrar Sessão"
                className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal com Sidebar Responsiva */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Backdrop escuro no mobile */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-150"
          />
        )}

        {/* Sidebar Lateral (Desktop fixa / Mobile deslizante) */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-50 md:z-0
            w-72 md:w-64 bg-white border-r border-slate-200/80 shrink-0
            flex flex-col justify-between shadow-drawer md:shadow-none
            transition-transform duration-200 ease-in-out
            ${mobileMenuOpen ? 'translate-x-0 top-16 md:top-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <div className="p-4 space-y-1 overflow-y-auto">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
              Navegação Estruturada
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    group flex items-start gap-3 px-3.5 py-3 rounded-lg border transition-all duration-150
                    ${
                      isActive
                        ? 'bg-sempi-plum/5 border-sempi-plum/20 text-sempi-plum font-semibold shadow-xs'
                        : 'border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-200/60'
                    }
                  `}
                >
                  <Icon
                    className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${
                      isActive ? 'text-sempi-plum' : 'text-slate-400 group-hover:text-sempi-plum'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs flex items-center justify-between">
                      <span>{item.label}</span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isActive
                            ? 'text-sempi-plum opacity-100 translate-x-0.5'
                            : 'text-slate-300 opacity-0 group-hover:opacity-100'
                        }`}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5 font-normal">
                      {item.sublabel}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Rodapé da Sidebar */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 text-[10px] font-mono text-slate-500 space-y-1">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-slate-700">SGC-SEMPI/RJ</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-sm text-[9px]">
                v1.1.0-PROD
              </span>
            </div>
            <div className="text-[9px] text-slate-400">
              SEI-RJ • SIGA-RJ • SIAFE-Rio
            </div>
          </div>
        </aside>

        {/* Área Principal de Conteúdo Fluida e Protegida contra Rompimento */}
        <main className="flex-1 min-w-0 w-full p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto w-full space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
