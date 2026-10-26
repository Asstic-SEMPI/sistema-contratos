'use client';

import React, { useState } from 'react';
import { changePasswordAction } from '@/actions/usuarios.actions';
import { useTheme, THEMES } from '@/components/theme/ThemeProvider';
import {
  User,
  Key,
  Shield,
  Palette,
  Check,
  CheckCircle,
  AlertTriangle,
  Mail,
  Building,
  IdCard,
  Lock,
  Loader2,
} from 'lucide-react';
import type { PerfilUsuarioRow } from '@/actions/usuarios.actions';

interface MeuPerfilClientProps {
  userEmail?: string;
  profile: PerfilUsuarioRow | null;
}

export function MeuPerfilClient({ userEmail, profile }: MeuPerfilClientProps) {
  const { currentThemeId, setTheme } = useTheme();

  // Estados de Senha
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de Confirmação de Tema
  const [themeFeedback, setThemeFeedback] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await changePasswordAction(formData);

    setIsChangingPassword(false);

    if (!res.success) {
      setPasswordMsg({ type: 'error', text: res.message });
      return;
    }

    setPasswordMsg({ type: 'success', text: res.message });
    (e.target as HTMLFormElement).reset();
  };

  const handleSelectTheme = (themeId: string) => {
    setTheme(themeId);
    const themeObj = THEMES.find((t) => t.id === themeId);
    setThemeFeedback(`Tema "${themeObj?.name}" aplicado com sucesso!`);
    setTimeout(() => setThemeFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Grade de 2 Colunas: Dados Funcionais e Alteração de Senha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloco 1: Dados do Servidor Conectado */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-sempi-plum" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight font-sans">
              Dados do Usuário Conectado
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Nome Completo:</span>
              <span className="text-sm font-bold text-slate-900">{profile?.nome_completo || 'Servidor SEMPI'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400 block">E-mail:</span>
                <span className="font-mono text-slate-700">{userEmail || 'servidor@sempi.rj.gov.br'}</span>
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400 block">ID Funcional:</span>
                <span className="font-mono font-bold text-slate-800">{profile?.id_funcional || 'N/A'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400 block">CPF:</span>
                <span className="font-mono text-slate-700">{profile?.cpf || '000.000.000-00'}</span>
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-400 block">Lotação / Setor:</span>
                <span className="text-slate-700 font-medium">{profile?.setor || 'SEMPI-RJ'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400">Perfil de Acesso (RBAC):</span>
              <span className="px-2.5 py-1 rounded-sm bg-sempi-plum/10 text-sempi-plum font-mono font-bold text-[11px] uppercase">
                {profile?.role || 'FISCAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Bloco 2: Módulo de Alteração de Senha */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Lock className="w-5 h-5 text-sempi-plum" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight font-sans">
              Segurança & Alteração de Senha
            </h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3.5 text-xs font-sans">
            {passwordMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {passwordMsg.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  name="newPassword"
                  required
                  minLength={6}
                  placeholder="Mínimo de 6 dígitos"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sempi-plum/20 focus:border-sempi-plum"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={6}
                  placeholder="Repita a nova senha"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sempi-plum/20 focus:border-sempi-plum"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sempi-plum text-white hover:bg-sempi-plum-hover rounded-lg font-semibold text-xs shadow-xs disabled:opacity-50 transition-colors"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Atualizando senha...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Salvar Nova Senha</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Bloco 3: Seleção de Temas de Cores do Sistema (Mais 5 Opções com Persistência) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-sempi-plum" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight font-sans">
                Personalização Visual — Temas do Sistema
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Escolha uma das 6 paletas cromáticas institucionais. Sua seleção é salva e aplicada instantaneamente a todas as telas do sistema.
            </p>
          </div>

          {themeFeedback && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-md animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>{themeFeedback}</span>
            </span>
          )}
        </div>

        {/* Grid de Paletas Temáticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {THEMES.map((theme) => {
            const isSelected = currentThemeId === theme.id;

            return (
              <div
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-sempi-plum bg-sempi-plum/5 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-900">
                      {theme.name}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sempi-plum text-white text-[10px] font-mono font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Ativo</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {theme.description}
                  </p>
                </div>

                {/* Visualizador da Paleta de Cores */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg shadow-2xs border border-black/10 flex items-center justify-center text-white text-[10px] font-mono"
                    style={{ backgroundColor: theme.colors.primary }}
                    title={`Primária: ${theme.colors.primary}`}
                  >
                    P
                  </div>
                  <div
                    className="w-7 h-7 rounded-lg shadow-2xs border border-black/10 flex items-center justify-center text-white text-[10px] font-mono"
                    style={{ backgroundColor: theme.colors.secondary }}
                    title={`Secundária: ${theme.colors.secondary}`}
                  >
                    S
                  </div>
                  <div
                    className="w-7 h-7 rounded-lg shadow-2xs border border-black/10"
                    style={{ backgroundColor: theme.colors.primaryLight }}
                    title={`Superfície: ${theme.colors.primaryLight}`}
                  />
                  <div
                    className="w-7 h-7 rounded-lg shadow-2xs border border-black/10"
                    style={{ backgroundColor: theme.colors.secondaryLight }}
                    title={`Acento: ${theme.colors.secondaryLight}`}
                  />
                  <span className="text-[10px] font-mono text-slate-400 ml-auto">
                    {theme.colors.primary}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
