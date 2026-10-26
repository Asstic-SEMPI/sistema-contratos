import React from 'react';
import { getUserProfile } from '@/lib/auth/get-user-profile';
import { MeuPerfilClient } from '@/components/perfil/MeuPerfilClient';
import type { PerfilUsuarioRow } from '@/actions/usuarios.actions';

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
  const { user, profile } = await getUserProfile();

  return (
    <div className="space-y-6">
      {/* Título de Dossiê Editorial Swiss Ledger */}
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 mb-1.5">
          <span>Configurações & Preferências</span>
          <span>/</span>
          <span className="text-sempi-plum font-semibold">SEMPI-RJ</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
          Meu Perfil, Segurança & Temas
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Gerenciamento de credenciais de acesso, alteração de senha e personalização cromática do sistema.
        </p>
      </div>

      <MeuPerfilClient
        userEmail={user?.email}
        profile={profile as unknown as PerfilUsuarioRow}
      />
    </div>
  );
}
