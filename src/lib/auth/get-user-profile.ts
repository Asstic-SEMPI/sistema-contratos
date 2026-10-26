import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/types/database.types';

export type UserProfile = Database['public']['Tables']['perfis_usuarios']['Row'];

export async function getUserProfile(): Promise<{
  user: { id: string; email?: string } | null;
  profile: UserProfile | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from('perfis_usuarios')
    .select('*')
    .eq('id', user.id)
    .single();

  return { user, profile };
}
