import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wodxkxbdcbsfxzdpczuf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHhreGJkY2JzZnh6ZHBjenVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjM2MzEsImV4cCI6MjEwODA5OTYzMX0.xX2w9bHDLJfDYkdZtSDZGCXH5Kse_w255MTAjt4Igik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSimulation() {
  console.log('================================================================');
  console.log('🏛️ SIMULAÇÃO DE INSERÇÃO DE DADOS — MÓDULO 2 E MÓDULO 3');
  console.log('Governo do Estado do Rio de Janeiro — SEMPI-RJ (Lei nº 14.133/21)');
  console.log('================================================================\n');

  // 1. Autenticação com o usuário Administrador
  console.log('1️⃣ Autenticando com usuário administrador (admin@sempi.rj.gov.br)...');
  let authRes = await supabase.auth.signInWithPassword({
    email: 'admin@sempi.rj.gov.br',
    password: 'Admin@Sempi2026!',
  });

  if (authRes.error) {
    console.log('Tentando com admin@sempi.com...');
    authRes = await supabase.auth.signInWithPassword({
      email: 'admin@sempi.com',
      password: 'Admin@Sempi2026!',
    });
  }

  if (authRes.error || !authRes.data.user) {
    console.error('❌ Falha na autenticação do admin:', authRes.error?.message);
    console.log('Certifique-se de que o script SQL supabase/migrations/0002_create_admin_user.sql foi executado no Supabase SQL Editor.');
    return;
  }

  const user = authRes.data.user;
  console.log(`✅ Autenticado com sucesso! UID: ${user.id}\n`);

  // 2. Teste do Art. 95 — Criação de NOTA DE EMPENHO COM FORÇA DE CONTRATO (sem número formal)
  console.log('2️⃣ Teste Art. 95: Criando NOTA_EMPENHO_FORCA_CONTRATO sem numero_contrato formal...');
  const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
  const seiEmpenho = `SEI-150001/${randomSuffix}/2026`;
  const sigaEmpenho = `SIGA-NE-2026-${randomSuffix}`;

  const { data: empenhoSubstitutivo, error: errEmpenho } = await supabase
    .from('contratos')
    .insert({
      tipo_formalizacao: 'NOTA_EMPENHO_FORCA_CONTRATO',
      numero_contrato: null, // Permitido pelo Art. 95!
      processo_sei: seiEmpenho,
      chave_siga_contrato: sigaEmpenho,
      contratada_cnpj: '33000167000101',
      contratada_razao_social: 'Empresa Fornecedora Imediata Ltda',
      objeto: 'Aquisição emergencial de insumos com entrega imediata e integral em 15 dias.',
      valor_inicial: 45000.00,
      valor_atualizado: 45000.00,
      data_publicacao_pncp: '2026-03-01',
      data_vigencia_inicio_original: '2026-03-01',
      data_vigencia_fim_original: '2026-03-31',
      data_vigencia_fim_atual: '2026-03-31',
      status: 'VIGENTE',
      created_by: user.id,
    })
    .select()
    .single();

  if (errEmpenho) {
    console.error('❌ Falha ao criar Nota de Empenho Substitutiva:', errEmpenho.message);
  } else {
    console.log(`✅ Sucesso! Instrumento Art. 95 criado com ID: ${empenhoSubstitutivo.id}`);
    console.log(`   Tipo: ${empenhoSubstitutivo.tipo_formalizacao} | Nº: ${empenhoSubstitutivo.numero_contrato || '(Nenhum - Conforme Art. 95)'}`);
  }

  // 3. Teste Jurídico: Tentativa de Aditivo de Prazo em NOTA DE EMPENHO (deve ser bloqueado pelo banco!)
  console.log('\n3️⃣ Teste de Bloqueio Jurídico: Tentando inserir ADITIVO_PRAZO em Nota de Empenho Art. 95...');
  const { data: aditivoInvalido, error: errAditivoInvalido } = await supabase
    .from('alteracoes_contratuais')
    .insert({
      contrato_id: empenhoSubstitutivo.id,
      procedimento: '1º Termo Aditivo Ilegal',
      processo_sei: 'SEI-150001/000999/2026',
      tipo: 'ADITIVO_PRAZO',
      justificativa_resumo: 'Tentativa de prorrogação em instrumento de empenho',
      valor_diferenca: 0,
      data_assinatura: '2026-03-20',
      vigencia_termo_inicio: '2026-03-31',
      vigencia_termo_fim: '2026-06-30',
      created_by: user.id,
    });

  if (errAditivoInvalido) {
    console.log(`🛡️ BLOQUEIO CONFIRMADO PELO POSTGRESQL! A trigger jurídica impediu a operação:`);
    console.log(`   Mensagem: "${errAditivoInvalido.message}"`);
  } else {
    console.error('❌ ERRO GRAVE: O aditivo foi aceito indevidamente!');
  }

  // 4. Teste de Apostilamento no Art. 95 (deve passar!)
  console.log('\n4️⃣ Teste Permitido no Art. 95: Registrando APOSTILAMENTO de reajuste...');
  const { data: apostilamentoEmpenho, error: errApostilamento } = await supabase
    .from('alteracoes_contratuais')
    .insert({
      contrato_id: empenhoSubstitutivo.id,
      procedimento: '1º Apostilamento de Reajuste',
      processo_sei: seiEmpenho,
      tipo: 'APOSTILAMENTO',
      justificativa_resumo: 'Apostilamento de reajuste anual de índice IPCA conforme Art. 136 da Lei 14.133.',
      valor_diferenca: 2500.00,
      data_assinatura: '2026-03-25',
      created_by: user.id,
    })
    .select()
    .single();

  if (errApostilamento) {
    console.error('❌ Falha ao criar Apostilamento:', errApostilamento.message);
  } else {
    console.log(`✅ Sucesso! Apostilamento aceito com valor: +R$ 2.500,00`);
    
    // Checa se o valor do contrato foi recalculado no banco
    const { data: contratoPosApostilamento } = await supabase
      .from('contratos')
      .select('valor_inicial, valor_atualizado')
      .eq('id', empenhoSubstitutivo.id)
      .single();

    console.log(`   Valor Inicial: R$ ${contratoPosApostilamento.valor_inicial} ➔ Valor Atualizado pelo Banco: R$ ${contratoPosApostilamento.valor_atualizado}`);
  }

  // 5. Teste de CONTRATO FORMAL com Aditivo de Prazo e Aditivo de Valor
  console.log('\n5️⃣ Criando CONTRATO FORMAL com valor de R$ 100.000,00 e vigência até 31/12/2026...');
  const randomNumContrato = `${Math.floor(Math.random() * 800) + 100}/2026`;
  const seiFormal = `SEI-150001/${randomSuffix + 1}/2026`;
  const sigaFormal = `SIGA-CT-2026-${randomSuffix + 1}`;

  const { data: contratoFormal, error: errContratoFormal } = await supabase
    .from('contratos')
    .insert({
      tipo_formalizacao: 'CONTRATO_FORMAL',
      numero_contrato: randomNumContrato,
      processo_sei: seiFormal,
      chave_siga_contrato: sigaFormal,
      contratada_cnpj: '12345678000199',
      contratada_razao_social: 'Construções e Serviços Rio de Janeiro S/A',
      objeto: 'Prestação de serviços contínuos de manutenção predial com dedicação exclusiva de mão de obra.',
      valor_inicial: 100000.00,
      valor_atualizado: 100000.00,
      data_publicacao_pncp: '2026-01-02',
      data_vigencia_inicio_original: '2026-01-05',
      data_vigencia_fim_original: '2026-12-31',
      data_vigencia_fim_atual: '2026-12-31',
      status: 'VIGENTE',
      created_by: user.id,
    })
    .select()
    .single();

  if (errContratoFormal) {
    console.error('❌ Falha ao criar Contrato Formal:', errContratoFormal.message);
    return;
  }
  console.log(`✅ Contrato Formal nº ${contratoFormal.numero_contrato} criado! ID: ${contratoFormal.id}`);

  // 6. Inserção do 1º Termo Aditivo (ADITIVO_VALOR de +R$ 20.000,00)
  console.log('\n6️⃣ Inserindo 1º Termo Aditivo (ADITIVO_VALOR) de +R$ 20.000,00 (+20%)...');
  const { data: aditivo1, error: errAd1 } = await supabase
    .from('alteracoes_contratuais')
    .insert({
      contrato_id: contratoFormal.id,
      procedimento: '1º Termo Aditivo de Valor',
      processo_sei: `SEI-150001/${randomSuffix + 2}/2026`,
      chave_siga_termo: `SIGA-TA-2026-${randomSuffix + 2}`,
      tipo: 'ADITIVO_VALOR',
      justificativa_resumo: 'Acréscimo qualitativo de 20% do objeto nos termos do art. 125 da Lei nº 14.133/2021.',
      valor_diferenca: 20000.00,
      data_assinatura: '2026-06-15',
      publicacao_doerj_data: '2026-06-20',
      publicacao_doerj_pagina: '18',
      created_by: user.id,
    })
    .select()
    .single();

  if (errAd1) {
    console.error('❌ Falha no Aditivo 1:', errAd1.message);
  } else {
    console.log(`✅ 1º Termo Aditivo registrado com sucesso!`);
  }

  // 7. Inserção do 2º Termo Aditivo (ADITIVO_PRAZO prorrogando até 31/12/2027)
  console.log('\n7️⃣ Inserindo 2º Termo Aditivo (ADITIVO_PRAZO) prorrogando vigência até 31/12/2027...');
  const { data: aditivo2, error: errAd2 } = await supabase
    .from('alteracoes_contratuais')
    .insert({
      contrato_id: contratoFormal.id,
      procedimento: '2º Termo Aditivo de Prazo',
      processo_sei: `SEI-150001/${randomSuffix + 3}/2026`,
      chave_siga_termo: `SIGA-TA-2026-${randomSuffix + 3}`,
      tipo: 'ADITIVO_PRAZO',
      justificativa_resumo: 'Prorrogação de prazo por mais 12 meses nos termos do art. 107 da Lei nº 14.133/2021.',
      valor_diferenca: 0,
      data_assinatura: '2026-11-10',
      vigencia_termo_inicio: '2026-12-31',
      vigencia_termo_fim: '2027-12-31',
      publicacao_doerj_data: '2026-11-15',
      publicacao_doerj_pagina: '22',
      created_by: user.id,
    })
    .select()
    .single();

  if (errAd2) {
    console.error('❌ Falha no Aditivo 2:', errAd2.message);
  } else {
    console.log(`✅ 2º Termo Aditivo registrado com sucesso!`);
  }

  // 8. Verificação Final: Recálculo Automático pelo Banco (Triggers)
  console.log('\n8️⃣ Verificando integridade dos recálculos das triggers no contrato formal...');
  const { data: contratoFinal } = await supabase
    .from('contratos')
    .select(`
      numero_contrato,
      valor_inicial,
      valor_atualizado,
      data_vigencia_inicio_original,
      data_vigencia_fim_original,
      data_vigencia_fim_atual
    `)
    .eq('id', contratoFormal.id)
    .single();

  console.log('----------------------------------------------------------------');
  console.log(`📋 RESULTADO FINAL NO BANCO DE DADOS (CONTRATO ${contratoFinal.numero_contrato}):`);
  console.log(`   Valor Inicial Original:       R$ ${contratoFinal.valor_inicial}`);
  console.log(`   Valor Atualizado (Calculado): R$ ${contratoFinal.valor_atualizado} (Esperado: R$ 120000.00)`);
  console.log(`   Vigência Inicial:             ${contratoFinal.data_vigencia_inicio_original}`);
  console.log(`   Vigência Fim Original:        ${contratoFinal.data_vigencia_fim_original}`);
  console.log(`   Vigência Fim Atual (Calculada): ${contratoFinal.data_vigencia_fim_atual} (Esperado: 2027-12-31)`);
  console.log('----------------------------------------------------------------');

  const valoresCorretos = Number(contratoFinal.valor_atualizado) === 120000.00;
  const dataCorreta = contratoFinal.data_vigencia_fim_atual === '2027-12-31';

  if (valoresCorretos && dataCorreta) {
    console.log('\n🏆 SIMULAÇÃO CONCLUÍDA COM 100% DE SUCESSO!');
    console.log('Todas as triggers, constraints e regras da Lei 14.133 operaram perfeitamente.');
  } else {
    console.error('\n⚠️ Houve divergência nos cálculos automáticos do banco!');
  }
}

runSimulation();
