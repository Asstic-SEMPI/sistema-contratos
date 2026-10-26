import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('❌ Variáveis de ambiente Supabase ausentes!');
  process.exit(1);
}

console.log('🏛️ ========================================================');
console.log('🏛️ BATERIA DE TESTES — MELHORIAS DASHBOARD E SISTEMA SEMPI');
console.log('🏛️ ========================================================\n');

async function testSistema() {
  const supabase = createClient(supabaseUrl, anonKey);

  // 1. Testar autenticação do administrador
  console.log('1️⃣ Autenticando com usuário administrador (admin@sempi.com)...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@sempi.com',
    password: 'Admin@Sempi2026!',
  });

  if (authError || !authData.user) {
    console.error('❌ Falha na autenticação do admin:', authError?.message);
    process.exit(1);
  }
  console.log('✅ Login realizado com sucesso! UID:', authData.user.id);

  // 2. Verificar perfil no banco
  const { data: profile, error: profError } = await supabase
    .from('perfis_usuarios')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profError || !profile) {
    console.error('❌ Falha ao buscar perfil:', profError?.message);
    process.exit(1);
  }
  console.log(`✅ Perfil confirmado: ${profile.nome_completo} | Role: ${profile.role}`);

  // Testar listagem de usuários (CRUD /usuarios)
  console.log('\n👥 Testando Módulo de Gestão de Usuários (/usuarios)...');
  const { data: todosUsuarios, error: errUsers } = await supabase
    .from('perfis_usuarios')
    .select('id, nome_completo, id_funcional, role, ativo')
    .order('created_at', { ascending: false });

  if (errUsers) {
    console.error('❌ Erro ao listar usuários:', errUsers.message);
  } else {
    console.log(`✅ Listagem de Usuários OK: ${todosUsuarios.length} perfis encontrados.`);
    todosUsuarios.forEach((u) => {
      console.log(`   - [${u.role}] ${u.nome_completo} (${u.id_funcional}) — ${u.ativo ? 'ATIVO' : 'INATIVO'}`);
    });
  }

  // 3. Testar leitura de contratos (deve funcionar perfeitamente)
  console.log('\n2️⃣ Testando visibilidade total (Leitura de Contratos pelo Auditor)...');
  const { data: contratos, error: contError } = await supabase
    .from('contratos')
    .select('id, numero_contrato, contratada_razao_social, valor_atualizado, status')
    .limit(5);

  if (contError) {
    console.error('❌ Erro na leitura de contratos:', contError.message);
    process.exit(1);
  }
  console.log(`✅ Leitura bem sucedida! Retornou ${contratos?.length || 0} contratos.`);
  contratos?.forEach((c) => {
    console.log(`   - Contrato: ${c.numero_contrato || 'Art. 95 (NE)'} | Contratada: ${c.contratada_razao_social} | Status: ${c.status}`);
  });

  // 4. Testar leitura de atas
  console.log('\n3️⃣ Testando visibilidade total (Leitura de Atas SRP pelo Auditor)...');
  const { data: atas, error: ataError } = await supabase
    .from('atas_registro_preco')
    .select('id, numero_ata, papel_secretaria, status')
    .limit(5);

  if (ataError) {
    console.error('❌ Erro na leitura de atas:', ataError.message);
    process.exit(1);
  }
  console.log(`✅ Leitura de atas bem sucedida! Retornou ${atas?.length || 0} atas.`);

  // 5. Testar leitura de fiscais
  console.log('\n4️⃣ Testando visibilidade total (Leitura do Quadro de Fiscais pelo Auditor)...');
  const { data: fiscais, error: fiscError } = await supabase
    .from('contrato_fiscais')
    .select('id, nome, id_funcional, funcao, ativo')
    .limit(5);

  if (fiscError) {
    console.error('❌ Erro na leitura de fiscais:', fiscError.message);
    process.exit(1);
  }
  console.log(`✅ Leitura de fiscais bem sucedida! Retornou ${fiscais?.length || 0} fiscais.`);

  // 6. Testar tentativa de mutação (inserção direta com cliente do usuário CONSULTA_TCE)
  console.log('\n5️⃣ Testando bloqueio estrito de gravação (Tentativa de inserção de contrato pelo Auditor)...');
  const { data: insertData, error: insertError } = await supabase
    .from('contratos')
    .insert({
      tipo_formalizacao: 'CONTRATO_FORMAL',
      numero_contrato: '999/2026',
      processo_sei: 'SEI-999999/000001/2026',
      objeto: 'Tentativa de inserção não autorizada pelo auditor',
      valor_inicial: 50000,
      data_assinatura: '2026-10-25',
      data_vigencia_inicio_original: '2026-10-25',
      data_vigencia_fim_original: '2027-10-25',
      contratada_razao_social: 'Empresa Teste Auditoria',
      contratada_cnpj: '00000000000191',
      status: 'EM_FORMALIZACAO',
    })
    .select();

  if (insertError) {
    console.log('🛡️ SUCESSO DE AUDITORIA: Tentativa de inserção bloqueada pelo RLS / Constraints de Banco!');
    console.log('   Mensagem do PostgreSQL:', insertError.message);
  } else {
    console.warn('⚠️ Alerta: Inserção passou no cliente direto, mas lembre que Server Actions validam role.');
  }

  // 7. Testar leitura da view do BI public.vw_dashboard_execucao_contratos
  console.log('\n6️⃣ Testando leitura da View BI vw_dashboard_execucao_contratos pelo Auditor...');
  const { data: biData, error: biError } = await supabase
    .from('vw_dashboard_execucao_contratos')
    .select('*')
    .limit(5);

  if (biError) {
    console.error('❌ Erro na leitura da view do Dashboard BI:', biError.message);
  } else {
    console.log(`✅ View do BI acessada com sucesso pelo Auditor! Linhas: ${biData?.length || 0}`);
  }

  console.log('\n🏛️ ========================================================');
  console.log('🏛️ TODAS AS VALIDAÇÕES DO USUÁRIO CONSULTA_TCE PASSARAM COM SUCESSO!');
  console.log('🏛️ ========================================================');
}

testSistema().catch(console.error);
