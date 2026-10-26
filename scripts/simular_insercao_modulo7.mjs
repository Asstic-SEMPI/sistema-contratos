import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wodxkxbdcbsfxzdpczuf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHhreGJkY2JzZnh6ZHBjenVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjM2MzEsImV4cCI6MjEwODA5OTYzMX0.xX2w9bHDLJfDYkdZtSDZGCXH5Kse_w255MTAjt4Igik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSimulationAuditoria() {
  console.log('================================================================');
  console.log('🏛️ SIMULAÇÃO DE INSERÇÃO DE DADOS — MÓDULO 7: AUDITORIA FORENSE');
  console.log('Motor de Diff JSONB Automático & Blindagem de Imutabilidade (RLS)');
  console.log('Governo do Estado do Rio de Janeiro — SEMPI-RJ (CGE-RJ / TCE-RJ)');
  console.log('================================================================\n');

  // 1. Autenticação
  console.log('1️⃣ Autenticando com usuário administrador...');
  let authRes = await supabase.auth.signInWithPassword({
    email: 'admin@sempi.com',
    password: 'Admin@Sempi2026!',
  });

  if (authRes.error) {
    authRes = await supabase.auth.signInWithPassword({
      email: 'admin@sempi.rj.gov.br',
      password: 'Admin@Sempi2026!',
    });
  }

  if (authRes.error || !authRes.data.user) {
    console.error('❌ Falha na autenticação do admin:', authRes.error?.message);
    process.exit(1);
  }

  const user = authRes.data.user;
  console.log(`✅ Autenticado com sucesso! UID: ${user.id}\n`);

  // 2. Criação de Contrato para gerar log de INSERT
  const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
  console.log('2️⃣ Criando Contrato de Teste para disparar gatilho de auditoria (INSERT)...');
  const { data: contrato, error: errContrato } = await supabase
    .from('contratos')
    .insert({
      tipo_formalizacao: 'CONTRATO_FORMAL',
      numero_contrato: `AUDIT-${randomSuffix}/2026`,
      processo_sei: `SEI-310001/${randomSuffix}/2026`,
      chave_siga_contrato: `SIGA-AUDIT-${randomSuffix}`,
      contratada_cnpj: '00000000000191',
      contratada_razao_social: 'Banco do Brasil S.A.',
      objeto: 'Serviços de processamento de folha e arrecadação para auditoria.',
      valor_inicial: 100000.00,
      valor_atualizado: 100000.00,
      data_publicacao_pncp: '2026-03-01',
      data_vigencia_inicio_original: '2026-03-01',
      data_vigencia_fim_original: '2027-03-01',
      data_vigencia_fim_atual: '2027-03-01',
      status: 'VIGENTE',
      created_by: user.id,
    })
    .select()
    .single();

  if (errContrato || !contrato) {
    console.error('❌ Erro ao criar contrato:', errContrato?.message);
    process.exit(1);
  }
  console.log(`✅ Contrato criado: ${contrato.numero_contrato} (ID: ${contrato.id})\n`);

  // 3. Modificação do Contrato para gerar log de UPDATE com campos alterados
  console.log('3️⃣ Alterando status do Contrato de VIGENTE para SUSPENSO (Gatilho UPDATE)...');
  const { data: contratoAtualizado, error: errUpdate } = await supabase
    .from('contratos')
    .update({
      status: 'SUSPENSO',
      observacoes: 'Suspensão cautelar determinada pela fiscalização técnica.',
    })
    .eq('id', contrato.id)
    .select()
    .single();

  if (errUpdate || !contratoAtualizado) {
    console.error('❌ Erro ao atualizar contrato:', errUpdate?.message);
    process.exit(1);
  }
  console.log(`✅ Contrato atualizado para status SUSPENSO!\n`);

  // 4. Verificação do Log de Auditoria Gerado pelo Banco (Diff JSONB)
  console.log('4️⃣ Consultando a trilha de auditoria em public.audit_logs...');
  const { data: logs, error: errLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('registro_id', contrato.id)
    .order('created_at', { ascending: true });

  if (errLogs || !logs || logs.length === 0) {
    console.error('❌ Erro ao buscar logs de auditoria:', errLogs?.message);
    process.exit(1);
  }

  console.log(`  ↳ Foram capturados ${logs.length} eventos de auditoria para o registro ${contrato.id}:`);

  const insertLog = logs.find((l) => l.acao === 'INSERT');
  const updateLog = logs.find((l) => l.acao === 'UPDATE');

  if (insertLog) {
    console.log(`    ✅ Log de INSERT capturado com sucesso!`);
    console.log(`       - Tabela: ${insertLog.tabela_afetada}`);
    console.log(`       - Usuário ID: ${insertLog.usuario_id}`);
    console.log(`       - Campos gravados no dados_novos: ${Object.keys(insertLog.dados_novos).length}`);
  } else {
    console.error('    ❌ Log de INSERT não foi gravado!');
    process.exit(1);
  }

  if (updateLog) {
    console.log(`    ✅ Log de UPDATE capturado com sucesso!`);
    console.log(`       - Campos Alterados Detectados: ${JSON.stringify(updateLog.campos_alterados)}`);
    console.log(`       - Status Anterior (dados_antigos): "${updateLog.dados_antigos.status}"`);
    console.log(`       - Novo Status (dados_novos): "${updateLog.dados_novos.status}"`);

    const detectouStatus = updateLog.campos_alterados.includes('status');
    const detectouObs = updateLog.campos_alterados.includes('observacoes');

    if (detectouStatus && detectouObs) {
      console.log('       ✅ Motor de Diff JSONB identificou com precisão os campos modificados!\n');
    } else {
      console.error('       ❌ Falha na identificação dos campos alterados!');
      process.exit(1);
    }
  } else {
    console.error('    ❌ Log de UPDATE não foi gravado!');
    process.exit(1);
  }

  // 5. TESTE DE SEGURANÇA MÁXIMA: TENTATIVA DE VIOLAÇÃO DA TRILHA DE AUDITORIA
  console.log('5️⃣ TESTE DE SEGURANÇA MÁXIMA: Tentativa de adulteração direta em public.audit_logs...');
  console.log('   (O RLS do PostgreSQL deve bloquear qualquer UPDATE ou DELETE)');

  // 5.1 Tentativa de UPDATE em audit_logs
  console.log('  ↳ Tentando forjar registro de auditoria via UPDATE...');
  const { data: updateFraud, error: errUpdateFraud } = await supabase
    .from('audit_logs')
    .update({ acao: 'DELETE' })
    .eq('id', updateLog.id)
    .select();

  // Em Supabase com RLS sem política de UPDATE, o update retorna data: [] ou erro
  if (errUpdateFraud || (updateFraud && updateFraud.length === 0)) {
    console.log('    ✅ RLS BLOQUEOU A ADULTERAÇÃO (Nenhum registro alterado)!');
  } else {
    console.error('    ❌ FALHA CRÍTICA DE SEGURANÇA: Foi possível adulterar o log de auditoria!');
    process.exit(1);
  }

  // 5.2 Tentativa de DELETE em audit_logs
  console.log('  ↳ Tentando apagar rastro de auditoria via DELETE...');
  const { data: deleteFraud, error: errDeleteFraud } = await supabase
    .from('audit_logs')
    .delete()
    .eq('id', updateLog.id)
    .select();

  // Em Supabase com RLS sem política de DELETE, o delete retorna data: [] ou erro
  if (errDeleteFraud || (deleteFraud && deleteFraud.length === 0)) {
    console.log('    ✅ RLS BLOQUEOU A EXCLUSÃO (Trilha de auditoria 100% imutável)!\n');
  } else {
    console.error('    ❌ FALHA CRÍTICA DE SEGURANÇA: Foi possível deletar o log de auditoria!');
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎯 TODAS AS ASSERTIVAS DO MÓDULO 7 PASSARAM COM SUCESSO 100%!');
  console.log('   - Gravação automática de logs de auditoria via trigger: OK');
  console.log('   - Motor de Diff JSONB (campos_alterados, dados_antigos/novos): OK');
  console.log('   - Bloqueio estrito de UPDATE em audit_logs: OK');
  console.log('   - Bloqueio estrito de DELETE em audit_logs: OK');
  console.log('   - Imutabilidade forense homologada para CGE-RJ e TCE-RJ: OK');
  console.log('================================================================');
}

runSimulationAuditoria();
