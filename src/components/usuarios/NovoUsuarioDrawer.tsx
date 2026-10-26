'use client';

import React, { useState } from 'react';
import { SlideOverDrawer } from '@/components/ui-ledger/SlideOverDrawer';
import { createUsuarioAction } from '@/actions/usuarios.actions';
import { UserPlus, Shield, Mail, Key, User, Building, IdCard, Loader2 } from 'lucide-react';
import type { UserRole } from '@/lib/types/database.types';

interface NovoUsuarioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NovoUsuarioDrawer({ isOpen, onClose, onSuccess }: NovoUsuarioDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await createUsuarioAction(formData);

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
      title="Cadastrar Novo Usuário"
      subtitle="Criação de credenciais de acesso e perfil funcional no SGC-SEMPI"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
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
              placeholder="Ex: Maria da Silva Souza"
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sempi-plum/20 focus:border-sempi-plum"
            />
          </div>
        </div>

        {/* Email e Senha Inicial */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              E-mail Funcional <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                name="email"
                required
                placeholder="servidor@sempi.rj.gov.br"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sempi-plum/20 focus:border-sempi-plum"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Senha Provisória <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="Mínimo 6 dígitos"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sempi-plum/20 focus:border-sempi-plum"
              />
            </div>
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
                placeholder="Ex: 5098123-4"
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
              placeholder="000.000.000-00"
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
                placeholder="Ex: Subsecretaria de Gestão"
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
                defaultValue="FISCAL"
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

        {/* Aviso de Perfil Somente Leitura */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-800">
          <strong>Atenção sobre o perfil Consulta/Auditoria:</strong> Usuários com perfil <code>CONSULTA_TCE</code> conseguem visualizar todos os dossiês, contratos, aditivos, empenhos e liquidações do sistema, mas não possuem permissão para realizar nenhuma edição ou cadastro.
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
                <span>Cadastrando...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Salvar Usuário</span>
              </>
            )}
          </button>
        </div>
      </form>
    </SlideOverDrawer>
  );
}
