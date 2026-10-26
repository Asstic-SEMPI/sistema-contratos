import React from 'react';
import { redirect } from 'next/navigation';
import { getUsuariosAction } from '@/actions/usuarios.actions';
import { getUserProfile } from '@/lib/auth/get-user-profile';
import { UsuariosTableClient } from '@/components/usuarios/UsuariosTableClient';
import { Users, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  const { profile } = await getUserProfile();

  // Apenas Administradores podem acessar a gestão de usuários e perfis
  if (profile?.role !== 'ADMIN') {
    redirect('/');
  }

  const usuarios = await getUsuariosAction();

  return (
    <div className="space-y-6">
      {/* Título de Dossiê Editorial Swiss Ledger */}
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 mb-1.5">
          <span>Controle de Acesso & Segurança</span>
          <span>/</span>
          <span className="text-sempi-plum font-semibold">SEMPI-RJ</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
          Gestão de Usuários & Perfis Funcionais (RBAC)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Administração de contas, permissões de acesso por perfil governamental e auditoria de usuários.
        </p>
      </div>

      <UsuariosTableClient
        usuarios={usuarios}
        currentUserRole={profile?.role}
      />
    </div>
  );
}
