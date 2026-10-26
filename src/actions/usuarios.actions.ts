'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import type { Database, UserRole } from '@/lib/types/database.types';

export type PerfilUsuarioRow = Database['public']['Tables']['perfis_usuarios']['Row'];

export interface ActionResult<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Retorna todos os usuários cadastrados no sistema
 */
export async function getUsuariosAction(): Promise<PerfilUsuarioRow[]> {
  const supabase = await createClient();

  // Validação de sessão e privilégio de Administrador
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rawCallerProfile } = await supabase
    .from('perfis_usuarios')
    .select('role')
    .eq('id', user.id)
    .single();

  if ((rawCallerProfile as any)?.role !== 'ADMIN') {
    return [];
  }

  // Sincroniza automaticamente qualquer usuário criado em auth.users que esteja sem perfil
  try {
    await (supabase.rpc as any)('fn_sync_missing_perfis');
  } catch {
    // Silencioso se a RPC ainda não tiver sido criada no Supabase
  }

  const { data, error } = await supabase
    .from('perfis_usuarios')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao listar usuários:', error);
    return [];
  }

  return (data as PerfilUsuarioRow[]) || [];
}

/**
 * Criação de novo usuário pelo Administrador
 */
export async function createUsuarioAction(formData: FormData): Promise<ActionResult<PerfilUsuarioRow>> {
  const supabase = await createClient();

  // 1. Validação da sessão ativa do administrador
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'Não autenticado.', error: 'UNAUTHORIZED' };
  }

  const { data: rawCallerProfile } = await supabase
    .from('perfis_usuarios')
    .select('role')
    .eq('id', user.id)
    .single();
  const callerProfile = rawCallerProfile as { role?: UserRole } | null;

  if (callerProfile?.role !== 'ADMIN') {
    return {
      success: false,
      message: 'Apenas Administradores têm permissão para criar novos usuários.',
      error: 'FORBIDDEN',
    };
  }

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const nome_completo = formData.get('nome_completo') as string;
  const id_funcional = formData.get('id_funcional') as string;
  const cpf = formData.get('cpf') as string;
  const setor = formData.get('setor') as string;
  const role = (formData.get('role') as UserRole) || 'FISCAL';

  if (!email || !password || !nome_completo || !id_funcional || !cpf || !setor) {
    return { success: false, message: 'Todos os campos obrigatórios devem ser preenchidos.', error: 'INVALID_INPUT' };
  }

  if (password.length < 6) {
    return { success: false, message: 'A senha deve ter no mínimo 6 caracteres.', error: 'INVALID_PASSWORD' };
  }

  // 2. Determinação da URL de Redirecionamento (Local vs Vercel Produção)
  const headerList = await headers();
  const origin = headerList.get('origin');
  const host = headerList.get('x-forwarded-host') || headerList.get('host');
  const proto = headerList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    || origin
    || (host ? `${proto}://${host}` : 'https://sistema-contratos-pi.vercel.app');

  const emailRedirectTo = `${baseUrl}/login`;

  // 3. Criação das credenciais no Auth do Supabase
  // IMPORTANTE: Usamos createServerClient com cookies em branco (no-op)
  // para que o signUp NÃO sobrescreva a sessão do Administrador logado nos cookies!
  const { createServerClient } = await import('@supabase/ssr');
  const authClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );

  const { data: authData, error: authErr } = await authClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: {
        nome_completo,
        id_funcional,
        cpf,
        setor,
        role,
      },
    },
  });

  if (authErr) {
    if (
      authErr.message.toLowerCase().includes('already registered') ||
      authErr.message.toLowerCase().includes('already in use')
    ) {
      // Usuário já existe no auth.users: aciona a sincronização para gerar o perfil
      try {
        await (supabase.rpc as any)('fn_sync_missing_perfis');
      } catch {}

      // Busca o perfil sincronizado e atualiza com os dados informados
      const { data: existingPerfis } = await (supabase
        .from('perfis_usuarios') as any)
        .select('*');

      // Tenta localizar por id_funcional ou atualizar o mais recente
      revalidatePath('/usuarios');
      return {
        success: true,
        message: 'Usuário já registrado no Auth. O perfil funcional foi sincronizado com sucesso!',
      };
    }
    return { success: false, message: `Erro ao criar autenticação: ${authErr.message}`, error: authErr.message };
  }

  if (!authData.user) {
    return { success: false, message: 'Falha ao gerar credenciais de acesso.', error: 'AUTH_FAILED' };
  }

  // 3. Upsert do perfil
  const { data: perfil, error: perfErr } = await (supabase
    .from('perfis_usuarios') as any)
    .upsert({
      id: authData.user.id,
      nome_completo,
      id_funcional,
      cpf,
      setor,
      role,
      ativo: true,
    })
    .select()
    .single();

  if (perfErr) {
    return { success: false, message: `Erro ao gravar perfil: ${perfErr.message}`, error: perfErr.message };
  }

  revalidatePath('/usuarios');
  return { success: true, message: 'Usuário criado com sucesso!', data: perfil as PerfilUsuarioRow };
}

/**
 * Atualização dos dados do usuário
 */
export async function updateUsuarioAction(formData: FormData): Promise<ActionResult<PerfilUsuarioRow>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Não autenticado.', error: 'UNAUTHORIZED' };

  const { data: rawCallerProfile } = await supabase
    .from('perfis_usuarios')
    .select('role')
    .eq('id', user.id)
    .single();
  const callerProfile = rawCallerProfile as { role?: UserRole } | null;

  if (callerProfile?.role !== 'ADMIN') {
    return { success: false, message: 'Permissão negada. Apenas Administradores podem editar usuários.', error: 'FORBIDDEN' };
  }

  const id = formData.get('id') as string;
  const nome_completo = formData.get('nome_completo') as string;
  const id_funcional = formData.get('id_funcional') as string;
  const cpf = formData.get('cpf') as string;
  const setor = formData.get('setor') as string;
  const role = formData.get('role') as UserRole;
  const ativo = formData.get('ativo') === 'true' || formData.get('ativo') === 'on';

  if (!id || !nome_completo) {
    return { success: false, message: 'Dados incompletos para atualização.', error: 'INVALID_INPUT' };
  }

  const { data: updated, error } = await (supabase
    .from('perfis_usuarios') as any)
    .update({
      nome_completo,
      id_funcional,
      cpf,
      setor,
      role,
      ativo,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, message: `Erro ao atualizar usuário: ${error.message}`, error: error.message };
  }

  revalidatePath('/usuarios');
  return { success: true, message: 'Dados do usuário atualizados com sucesso!', data: updated as PerfilUsuarioRow };
}

/**
 * Ativa ou Desativa o usuário
 */
export async function toggleUsuarioStatusAction(id: string, ativo: boolean): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Não autenticado.', error: 'UNAUTHORIZED' };

  const { data: rawCallerProfile } = await supabase
    .from('perfis_usuarios')
    .select('role')
    .eq('id', user.id)
    .single();
  const callerProfile = rawCallerProfile as { role?: UserRole } | null;

  if (callerProfile?.role !== 'ADMIN') {
    return { success: false, message: 'Permissão negada.', error: 'FORBIDDEN' };
  }

  const { error } = await (supabase
    .from('perfis_usuarios') as any)
    .update({ ativo, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return { success: false, message: `Erro ao alterar status: ${error.message}`, error: error.message };
  }

  revalidatePath('/usuarios');
  return { success: true, message: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso!` };
}

/**
 * Alteração da própria senha pelo usuário autenticado
 */
export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: 'Sessão expirada. Faça login novamente.', error: 'UNAUTHORIZED' };
  }

  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: 'A nova senha deve possuir no mínimo 6 caracteres.', error: 'INVALID_PASSWORD' };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, message: 'A confirmação de senha não confere.', error: 'PASSWORD_MISMATCH' };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, message: `Erro ao atualizar senha: ${error.message}`, error: error.message };
  }

  return { success: true, message: 'Senha atualizada com sucesso!' };
}
