'use client';

import React, { useState } from 'react';
import { SlideOverDrawer } from '@/components/ui-ledger/SlideOverDrawer';
import { updateUsuarioAction, type PerfilUsuarioRow } from '@/actions/usuarios.actions';
import { UserCheck, Shield, User, Building, IdCard, Loader2 } from 'lucide-react';
import type { UserRole } from '@/lib/types/database.types';

interface EditarUsuarioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: PerfilUsuarioRow | null;
  onSuccess?: () => void;
}

export function EditarUsuarioDrawer({ isOpen, onClose, usuario, onSuccess }: EditarUsuarioDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!usuario) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await updateUsuarioAction(formData);

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Perfil de Usuário"
      subtitle={`Alterando permissões e dados funcionais de ${usuario.nome_completo}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        <input type="hidden" name="id" value={usuario.id} />

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}

        {/* Nome Completo */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Nome Completo <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              name="nome_completo"
              required
              defaultValue={usuario.nome_completo}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sempi-plum/20 focus:border-sempi-plum"
            />
          </div>
        </div>

        {/* ID Funcional e CPF */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              ID Funcional <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                name="id_funcional"
                required
                defaultValue={usuario.id_funcional}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sempi-plum/20 focus:border-sempi-plum"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              CPF <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cpf"
              required
              defaultValue={usuario.cpf}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sempi-plum/20 focus:border-sempi-plum"
            />
          </div>
        </div>

        {/* Setor e Perfil de Acesso */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Setor / Departamento <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                name="setor"
                required
                defaultValue={usuario.setor}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sempi-plum/20 focus:border-sempi-plum"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Perfil de Acesso (RBAC) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <select
                name="role"
                required
                defaultValue={usuario.role}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sempi-plum/20 focus:border-sempi-plum font-semibold"
              >
                <option value="ADMIN">Administrador Geral</option>
                <option value="GESTOR_CONTRATOS">Gestor de Contratos</option>
                <option value="FINANCEIRO">Financeiro / Contábil</option>
                <option value="FISCAL">Fiscal de Contrato</option>
                <option value="CONSULTA_TCE">Consulta / Auditoria (Somente Leitura)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Ativo/Inativo */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div>
            <span className="font-semibold text-slate-800 block">Status da Conta</span>
            <span className="text-[11px] text-slate-500">
              Usuários inativos são bloqueados de realizar login no sistema
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="ativo"
              defaultChecked={usuario.ativo}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Botões do Rodapé */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sempi-plum text-white hover:bg-sempi-plum-hover rounded-lg font-semibold shadow-xs disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Atualizar Usuário</span>
              </>
            )}
          </button>
        </div>
      </form>
    </SlideOverDrawer>
  );
}
