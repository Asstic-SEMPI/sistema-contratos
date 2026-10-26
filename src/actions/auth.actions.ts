'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail institucional válido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export type ActionState = {
  success?: boolean;
  error?: string;
};

export async function loginAction(
  _prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const validation = loginSchema.safeParse({ email, password });
  if (!validation.success) {
    return {
      error: validation.error.errors[0]?.message || 'Dados inválidos',
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: validation.data.email,
    password: validation.data.password,
  });

  if (error) {
    return {
      error: error.message === 'Invalid login credentials'
        ? 'Credenciais incorretas ou usuário inativo.'
        : `Erro na autenticação: ${error.message}`,
    };
  }

  redirect('/');
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
