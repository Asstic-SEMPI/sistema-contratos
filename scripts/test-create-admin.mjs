import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wodxkxbdcbsfxzdpczuf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHhreGJkY2JzZnh6ZHBjenVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjM2MzEsImV4cCI6MjEwODA5OTYzMX0.xX2w9bHDLJfDYkdZtSDZGCXH5Kse_w255MTAjt4Igik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const email = 'admin@sempi.com';
  const password = 'Admin@Sempi2026!';

  console.log('Tentando cadastrar usuário via auth.signUp...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome_completo: 'Administrador do Sistema SEMPI',
        id_funcional: '9999999-1',
        cpf: '000.000.000-00',
        setor: 'Gabinete / Assessoria de Contratos',
        role: 'ADMIN',
      },
    },
  });

  if (authError) {
    console.error('Erro no signUp:', authError.message);
    return;
  }

  console.log('Usuário auth criado/retornado:', authData.user?.id);
  console.log('Session criada?:', !!authData.session);

  if (authData.user) {
    // Tenta inserir na tabela perfis_usuarios
    console.log('Tentando inserir perfil do usuário...');
    const { data: profileData, error: profileError } = await supabase
      .from('perfis_usuarios')
      .upsert({
        id: authData.user.id,
        nome_completo: 'Administrador do Sistema SEMPI',
        id_funcional: '9999999-1',
        cpf: '000.000.000-00',
        setor: 'Gabinete / Assessoria de Contratos',
        role: 'ADMIN',
        ativo: true,
      })
      .select();

    if (profileError) {
      console.error('Erro ao inserir perfil:', profileError.message);
    } else {
      console.log('Perfil criado com sucesso:', profileData);
    }
  }
}

main();
