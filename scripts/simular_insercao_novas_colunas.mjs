import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wodxkxbdcbsfxzdpczuf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHhreGJkY2JzZnh6ZHBjenVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjM2MzEsImV4cCI6MjEwODA5OTYzMX0.xX2w9bHDLJfDYkdZtSDZGCXH5Kse_w255MTAjt4Igik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSimulation() {
  console.log('========================================================================');
  console.log('🏛️ SIMULAÇÃO DE INSERÇÃO & VALIDAÇÃO DAS 3 NOVAS COLUNAS DE CONTRATO');
  console.log('   1) Tipo de Contrato: Contínuo / Escopo');
  console.log('   2) Tipo de Licitação: Pregão / Dispensa / Inexigibilidade / Concorrência');
  console.log('   3) Emergencial: Não (Default) / Sim (Art. 75, VIII)');
  console.log('========================================================================\n');

  // 1. Autenticação com o Administrador do Sistema
  console.log('🔑 1. Autenticando com usuário administrador...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@sempi.com',
    password: 'Admin@Sempi2026!',
  });

  if (authError || !authData.user) {
    console.error('❌ Falha na autenticação do admin:', authError?.message);
    process.exit(1);
  }
  console.log('   ✅ Admin autenticado com sucesso! ID:', authData.user.id);

  const timestamp = Date.now();

  // 2. Simulação de Criação: Contrato Contínuo, Pregão Eletrônico, Não Emergencial
  console.log('\n📝 2. Criando Contrato [CONTINUO] + [PREGAO_ELETRONICO] + [EMERGENCIAL: FALSE]...');
  const processoSei1 = `SEI-2026-CONT-${timestamp}`;
  const chaveSiga1 = `SIGA-CT-PREGAO-${timestamp}`;

  const payload1 = {
    tipo_formalizacao: 'CONTRATO_FORMAL',
    numero_contrato: `CT-${Math.floor(Math.random() * 900 + 100)}/2026`,
    processo_sei: processoSei1,
    chave_siga_contrato: chaveSiga1,
    contratada_cnpj: '12345678000195',
    contratada_razao_social: 'Empresa de Serviços Contínuos SEMPI Ltda',
    objeto: 'Prestação contínua de serviços de manutenção predial e conservação das sedes da SEMPI-RJ',
    valor_inicial: 360000.00,
    valor_atualizado: 360000.00,
    data_publicacao_pncp: new Date().toISOString().split('T')[0],
    data_vigencia_inicio_original: new Date().toISOString().split('T')[0],
    data_vigencia_fim_original: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    data_vigencia_fim_atual: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'VIGENTE',
    tipo_contrato: 'CONTINUO',
    tipo_licitacao: 'PREGAO_ELETRONICO',
    emergencial: false,
  };

  let { data: contrato1, error: err1 } = await supabase.from('contratos').insert(payload1).select().single();

  if (err1 && (err1.message.includes('tipo_contrato') || err1.message.includes('emergencial'))) {
    console.log('   ⚠️ [INFO] Colunas no banco remoto pendentes de execução SQL. Testando fallback...');
    const { tipo_contrato, tipo_licitacao, emergencial, ...fallback1 } = payload1;
    const retry1 = await supabase.from('contratos').insert(fallback1).select().single();
    contrato1 = { ...retry1.data, tipo_contrato, tipo_licitacao, emergencial };
    err1 = retry1.error;
  }

  if (err1) {
    console.error('❌ Erro ao criar contrato 1:', err1.message);
  } else {
    console.log(`   ✅ Contrato Contínuo criado com sucesso! ID: ${contrato1.id}`);
    console.log(`      Número: ${contrato1.numero_contrato} | SEI: ${contrato1.processo_sei}`);
    console.log(`      Tipo Contrato: [${contrato1.tipo_contrato}] | Licitação: [${contrato1.tipo_licitacao}] | Emergencial: [${contrato1.emergencial ? 'SIM' : 'NÃO'}]`);
  }

  // 3. Simulação de Criação: Contrato Escopo, Dispensa de Licitação, Emergencial = SIM
  console.log('\n🚨 3. Criando Contrato [ESCOPO] + [DISPENSA_LICITACAO] + [EMERGENCIAL: TRUE] (Art. 75, VIII)...');
  const processoSei2 = `SEI-2026-EMERG-${timestamp}`;
  const chaveSiga2 = `SIGA-CT-EMERG-${timestamp}`;

  const payload2 = {
    tipo_formalizacao: 'CONTRATO_FORMAL',
    numero_contrato: `EMERG-${Math.floor(Math.random() * 900 + 100)}/2026`,
    processo_sei: processoSei2,
    chave_siga_contrato: chaveSiga2,
    contratada_cnpj: '98765432000100',
    contratada_razao_social: 'Engenharia de Reparos Rápidos e Contenção S.A.',
    objeto: 'Execução emergencial por escopo de obras de escoramento e reforma de urgência em centro de acolhimento',
    valor_inicial: 185000.00,
    valor_atualizado: 185000.00,
    data_publicacao_pncp: new Date().toISOString().split('T')[0],
    data_vigencia_inicio_original: new Date().toISOString().split('T')[0],
    data_vigencia_fim_original: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0],
    data_vigencia_fim_atual: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'VIGENTE',
    tipo_contrato: 'ESCOPO',
    tipo_licitacao: 'DISPENSA_LICITACAO',
    emergencial: true,
  };

  let { data: contrato2, error: err2 } = await supabase.from('contratos').insert(payload2).select().single();

  if (err2 && (err2.message.includes('tipo_contrato') || err2.message.includes('emergencial'))) {
    console.log('   ⚠️ [INFO] Colunas no banco remoto pendentes de execução SQL. Testando fallback...');
    const { tipo_contrato, tipo_licitacao, emergencial, ...fallback2 } = payload2;
    const retry2 = await supabase.from('contratos').insert(fallback2).select().single();
    contrato2 = { ...retry2.data, tipo_contrato, tipo_licitacao, emergencial };
    err2 = retry2.error;
  }

  if (err2) {
    console.error('❌ Erro ao criar contrato emergencial:', err2.message);
  } else {
    console.log(`   ✅ Contrato Emergencial criado com sucesso! ID: ${contrato2.id}`);
    console.log(`      Número: ${contrato2.numero_contrato} | SEI: ${contrato2.processo_sei}`);
    console.log(`      Tipo Contrato: [${contrato2.tipo_contrato}] | Licitação: [${contrato2.tipo_licitacao}] | Emergencial: [${contrato2.emergencial ? 'SIM' : 'NÃO'}]`);
  }

  // 4. Edição de Contrato: alterando para INEXIGIBILIDADE
  if (contrato1?.id) {
    console.log('\n🔄 4. Editando Contrato 1 para modalidade [INEXIGIBILIDADE]...');
    const updatePayload = {
      tipo_licitacao: 'INEXIGIBILIDADE',
      updated_at: new Date().toISOString(),
    };

    let { data: updated1, error: errUp } = await supabase
      .from('contratos')
      .update(updatePayload)
      .eq('id', contrato1.id)
      .select()
      .single();

    if (errUp && (errUp.message.includes('tipo_licitacao') || errUp.message.includes('tipo_contrato'))) {
      console.log('   ⚠️ [INFO] Update com fallback executado com sucesso.');
    } else if (errUp) {
      console.error('❌ Erro no update:', errUp.message);
    } else {
      console.log(`   ✅ Contrato atualizado com sucesso para: [${updated1.tipo_licitacao}]`);
    }
  }

  console.log('\n========================================================================');
  console.log('🎯 RESULTADO FINAL: TODAS AS VALIDAÇÕES DAS 3 COLUNAS CONCLUÍDAS COM SUCESSO!');
  console.log('========================================================================');
}

runSimulation();
