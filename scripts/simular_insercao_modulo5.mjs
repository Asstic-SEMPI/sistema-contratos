import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wodxkxbdcbsfxzdpczuf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHhreGJkY2JzZnh6ZHBjenVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjM2MzEsImV4cCI6MjEwODA5OTYzMX0.xX2w9bHDLJfDYkdZtSDZGCXH5Kse_w255MTAjt4Igik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSimulationFinanceiro() {
  console.log('================================================================');
  console.log('🏛️ SIMULAÇÃO DE INSERÇÃO DE DADOS — MÓDULO 5: EXECUÇÃO FINANCEIRA');
  console.log('SIAFE-Rio, Classificação Automática, Reforço/Anulação & Liquidação');
  console.log('Governo do Estado do Rio de Janeiro — SEMPI-RJ');
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

  // 2. Criação do Contrato Base
  const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
  console.log('2️⃣ Criando Contrato de Teste (Vigência: 01/01/2026 a 31/12/2026, Valor: R$ 200.000,00)...');
  const { data: contrato, error: errContrato } = await supabase
    .from('contratos')
    .insert({
      tipo_formalizacao: 'CONTRATO_FORMAL',
      numero_contrato: `FIN-${randomSuffix}/2026`,
      processo_sei: `SEI-310001/${randomSuffix}/2026`,
      chave_siga_contrato: `SIGA-FIN-${randomSuffix}`,
      contratada_cnpj: '11223344000199',
      contratada_razao_social: 'Serviços Financeiros e Tecnologia RJ Ltda',
      objeto: 'Prestação de serviços continuados de auditoria e TI.',
      valor_inicial: 200000.00,
      valor_atualizado: 200000.00,
      data_publicacao_pncp: '2026-01-02',
      data_vigencia_inicio_original: '2026-01-01',
      data_vigencia_fim_original: '2026-12-31',
      data_vigencia_fim_atual: '2026-12-31',
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

  // 3. Criação de 1º Termo Aditivo de Prazo (Vigência: 01/01/2027 a 31/12/2027)
  console.log('3️⃣ Registrando 1º Termo Aditivo de Prazo (01/01/2027 a 31/12/2027)...');
  const { data: aditivo, error: errAditivo } = await supabase
    .from('alteracoes_contratuais')
    .insert({
      contrato_id: contrato.id,
      procedimento: '1º Termo Aditivo',
      processo_sei: `SEI-310001/${randomSuffix}-AD1/2026`,
      tipo: 'ADITIVO_PRAZO',
      justificativa_resumo: 'Prorrogação de 12 meses nos termos da Lei 14.133/21.',
      valor_diferenca: 0,
      data_assinatura: '2026-11-15',
      vigencia_termo_inicio: '2027-01-01',
      vigencia_termo_fim: '2027-12-31',
      created_by: user.id,
    })
    .select()
    .single();

  if (errAditivo || !aditivo) {
    console.error('❌ Erro ao registrar aditivo:', errAditivo?.message);
    process.exit(1);
  }
  console.log(`✅ 1º Termo Aditivo registrado! ID: ${aditivo.id}\n`);

  // 4. TESTE 1: Régua Vigência x Chave SIGA (Trigger trg_classifica_empenho)
  console.log('4️⃣ TESTE 1: Classificação Automática de Janela de Vigência da NE...');
  
  // 4.1 NE dentro do período inicial (15/06/2026)
  const neNum1 = `2026NE${randomSuffix}`;
  const { data: neInicial, error: errNe1 } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: contrato.id,
      numero_nota_empenho: neNum1,
      chave_siga: `SIGA-NE-${randomSuffix}-1`,
      processo_sei: contrato.processo_sei,
      tipo_empenho: 'GLOBAL',
      data_emissao: '2026-06-15',
      data_referencia_vigencia: '2026-06-15',
      programa_trabalho: '14.122.0001.2001',
      natureza_despesa: '3.3.90.39.00',
      fonte_recurso: 'Fonte 100',
      valor_empenhado_inicial: 100000.00,
      created_by: user.id,
    })
    .select()
    .single();

  if (errNe1 || !neInicial) {
    console.error('❌ Falha ao emitir NE Inicial:', errNe1?.message);
    process.exit(1);
  }
  console.log(`  ↳ NE Inicial ${neInicial.numero_nota_empenho}:`);
  console.log(`    Data Vigência Ref: ${neInicial.data_referencia_vigencia}`);
  console.log(`    Vínculo Detectado pela Trigger: "${neInicial.vinculo_automatico_detectado}"`);
  if (neInicial.vinculo_automatico_detectado === 'CONTRATO_INICIAL') {
    console.log('    ✅ Trigger classificou corretamente como CONTRATO_INICIAL!');
  } else {
    console.error('    ❌ Falha na classificação do Contrato Inicial!');
    process.exit(1);
  }

  // 4.2 NE dentro do período do 1º Aditivo (10/05/2027)
  const neNum2 = `2027NE${randomSuffix}`;
  const { data: neAditivo, error: errNe2 } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: contrato.id,
      numero_nota_empenho: neNum2,
      chave_siga: `SIGA-NE-${randomSuffix}-2`,
      processo_sei: contrato.processo_sei,
      tipo_empenho: 'ESTIMATIVO',
      data_emissao: '2027-05-10',
      data_referencia_vigencia: '2027-05-10',
      programa_trabalho: '14.122.0001.2001',
      natureza_despesa: '3.3.90.39.00',
      fonte_recurso: 'Fonte 100',
      valor_empenhado_inicial: 50000.00,
      created_by: user.id,
    })
    .select()
    .single();

  if (errNe2 || !neAditivo) {
    console.error('❌ Falha ao emitir NE Aditivo:', errNe2?.message);
    process.exit(1);
  }
  console.log(`  ↳ NE no Período do Aditivo ${neAditivo.numero_nota_empenho}:`);
  console.log(`    Data Vigência Ref: ${neAditivo.data_referencia_vigencia}`);
  console.log(`    Vínculo Detectado pela Trigger: "${neAditivo.vinculo_automatico_detectado}"`);
  if (neAditivo.vinculo_automatico_detectado?.includes('1º Termo Aditivo')) {
    console.log('    ✅ Trigger vinculou corretamente ao 1º Termo Aditivo!');
  } else {
    console.error('    ❌ Falha no vínculo ao Aditivo!');
    process.exit(1);
  }

  // 4.3 NE fora de qualquer janela de vigência (15/01/2029)
  const neNum3 = `2029NE${randomSuffix}`;
  const { data: neFora, error: errNe3 } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: contrato.id,
      numero_nota_empenho: neNum3,
      chave_siga: `SIGA-NE-${randomSuffix}-3`,
      processo_sei: contrato.processo_sei,
      tipo_empenho: 'ORDINARIO',
      data_emissao: '2029-01-15',
      data_referencia_vigencia: '2029-01-15',
      programa_trabalho: '14.122.0001.2001',
      natureza_despesa: '3.3.90.39.00',
      fonte_recurso: 'Fonte 100',
      valor_empenhado_inicial: 10000.00,
      created_by: user.id,
    })
    .select()
    .single();

  if (errNe3 || !neFora) {
    console.error('❌ Falha ao emitir NE Fora da Vigência:', errNe3?.message);
    process.exit(1);
  }
  console.log(`  ↳ NE com data fora de vigência ${neFora.numero_nota_empenho}:`);
  console.log(`    Data Vigência Ref: ${neFora.data_referencia_vigencia}`);
  console.log(`    Vínculo Detectado pela Trigger: "${neFora.vinculo_automatico_detectado}"`);
  if (neFora.vinculo_automatico_detectado === 'ALERTA_FORA_DE_VIGENCIA') {
    console.log('    ✅ Trigger gerou ALERTA_FORA_DE_VIGENCIA com perfeição!\n');
  } else {
    console.error('    ❌ Falha na detecção de empenho fora da vigência!');
    process.exit(1);
  }

  // 5. TESTE 2: Eventos Filhos no SIAFE-Rio (Reforço e Anulação)
  console.log('5️⃣ TESTE 2: Árvore Genealógica de Empenho (Reforço & Anulação)...');
  console.log(`  ↳ Estado Inicial da NE ${neInicial.numero_nota_empenho}: R$ ${neInicial.valor_empenhado_inicial.toFixed(2)}`);

  // 5.1 Lançar Reforço de R$ 30.000,00
  console.log('  ↳ Inserindo Evento de REFORÇO de R$ 30.000,00 no SIAFE-Rio...');
  const eventoReforcoNum = `2026NE${randomSuffix}REF`;
  const { data: evReforco, error: errEvRef } = await supabase
    .from('financeiro_empenhos_eventos')
    .insert({
      empenho_original_id: neInicial.id,
      tipo_evento: 'REFORCO',
      numero_ne_evento: eventoReforcoNum,
      processo_sei: contrato.processo_sei,
      data_evento: '2026-07-01',
      valor_evento: 30000.00,
      motivo: 'Reforço orçamentário para expansão de postos de trabalho.',
      created_by: user.id,
    })
    .select()
    .single();

  if (errEvRef || !evReforco) {
    console.error('❌ Erro ao inserir evento de reforço:', errEvRef?.message);
    process.exit(1);
  }

  // Verificar recálculo na tabela pai pela trigger
  const { data: neAposReforco } = await supabase
    .from('financeiro_empenhos')
    .select('*')
    .eq('id', neInicial.id)
    .single();

  console.log(`    Valor Reforçado: R$ ${neAposReforco.valor_reforcado.toFixed(2)}`);
  console.log(`    Saldo Líquido Recalculado: R$ ${neAposReforco.saldo_empenho_liquido.toFixed(2)} (Esperado: R$ 130.000,00)`);
  if (Number(neAposReforco.saldo_empenho_liquido) === 130000.00) {
    console.log('    ✅ Saldo líquido atualizado para R$ 130.000,00 com sucesso!');
  } else {
    console.error('    ❌ Recálculo do saldo após reforço inconsistente!');
    process.exit(1);
  }

  // 5.2 Tentativa de Anulação Ilegal de R$ 150.000,00 (Superior ao saldo de R$ 130.000,00)
  console.log('  ↳ Tentativa de Anulação Ilegal de R$ 150.000,00 (deve ser barrada pelo banco)...');
  const { data: evIlegal, error: errEvIlegal } = await supabase
    .from('financeiro_empenhos_eventos')
    .insert({
      empenho_original_id: neInicial.id,
      tipo_evento: 'ANULACAO_PARCIAL',
      numero_ne_evento: `2026NE${randomSuffix}ERR`,
      processo_sei: contrato.processo_sei,
      data_evento: '2026-08-01',
      valor_evento: 150000.00,
      motivo: 'Tentativa de anular mais que o saldo disponível.',
      created_by: user.id,
    })
    .select()
    .single();

  if (errEvIlegal) {
    console.log(`    ✅ Constraint contábil chk_anulacao_limite BLOQUEOU com sucesso!`);
    console.log(`    Mensagem do Postgres: "${errEvIlegal.message}"`);
  } else {
    console.error('    ❌ FALHA CRÍTICA: O banco permitiu anular acima do saldo da NE!');
    process.exit(1);
  }

  // 5.3 Anulação Válida de R$ 10.000,00
  console.log('  ↳ Inserindo Anulação Válida de R$ 10.000,00...');
  const eventoAnulacaoNum = `2026NE${randomSuffix}ANU`;
  const { data: evAnulacao, error: errEvAnu } = await supabase
    .from('financeiro_empenhos_eventos')
    .insert({
      empenho_original_id: neInicial.id,
      tipo_evento: 'ANULACAO_PARCIAL',
      numero_ne_evento: eventoAnulacaoNum,
      processo_sei: contrato.processo_sei,
      data_evento: '2026-08-15',
      valor_evento: 10000.00,
      motivo: 'Ajuste contábil por glosa técnica do fiscal.',
      created_by: user.id,
    })
    .select()
    .single();

  if (errEvAnu || !evAnulacao) {
    console.error('❌ Erro na anulação válida:', errEvAnu?.message);
    process.exit(1);
  }

  const { data: neAposAnulacao } = await supabase
    .from('financeiro_empenhos')
    .select('*')
    .eq('id', neInicial.id)
    .single();

  console.log(`    Valor Anulado: R$ ${neAposAnulacao.valor_anulado.toFixed(2)}`);
  console.log(`    Novo Saldo Líquido: R$ ${neAposAnulacao.saldo_empenho_liquido.toFixed(2)} (Esperado: R$ 120.000,00)`);
  if (Number(neAposAnulacao.saldo_empenho_liquido) === 120000.00) {
    console.log('    ✅ Saldo líquido atualizado para R$ 120.000,00 com sucesso!\n');
  } else {
    console.error('    ❌ Recálculo do saldo após anulação inconsistente!');
    process.exit(1);
  }

  // 6. TESTE 3: Liquidações & Atestes de Notas Fiscais
  console.log('6️⃣ TESTE 3: Registro de Ateste de Nota Fiscal e Liquidação (NL)...');
  const numNF = `NF-${randomSuffix}`;
  const numNL = `2026NL${randomSuffix}`;
  const { data: liquidacao, error: errLiq } = await supabase
    .from('financeiro_liquidacoes')
    .insert({
      empenho_id: neInicial.id,
      processo_sei: contrato.processo_sei,
      numero_nota_fiscal: numNF,
      data_emissao_nota_fiscal: '2026-07-02',
      competencia_mes_ano: '06/2026',
      numero_nota_liquidacao: numNL,
      data_emissao_nl: '2026-07-05',
      valor_liquidado: 50000.00,
      data_pagamento_ob: '2026-07-10',
      created_by: user.id,
    })
    .select()
    .single();

  if (errLiq || !liquidacao) {
    console.error('❌ Erro ao registrar liquidação:', errLiq?.message);
    process.exit(1);
  }
  console.log(`  ↳ Liquidação Registrada:`);
  console.log(`    Nota Fiscal: ${liquidacao.numero_nota_fiscal} (Competência: ${liquidacao.competencia_mes_ano})`);
  console.log(`    Nota de Liquidação SIAFE: ${liquidacao.numero_nota_liquidacao}`);
  console.log(`    Valor Liquidado: R$ ${liquidacao.valor_liquidado.toFixed(2)}`);
  console.log(`    Data Pagamento Ordem Bancária (OB): ${liquidacao.data_pagamento_ob}`);
  console.log('    ✅ Liquidação inserida com vínculo perfeito ao empenho pai!\n');

  // 7. Consulta Consolidada em Árvore (Master-Detail)
  console.log('7️⃣ TESTE 4: Verificação da Tabela em Árvore (Master-Detail Relation)...');
  const { data: arvoreEmpenho, error: errTree } = await supabase
    .from('financeiro_empenhos')
    .select(`
      id,
      numero_nota_empenho,
      saldo_empenho_liquido,
      financeiro_empenhos_eventos (*),
      financeiro_liquidacoes (*)
    `)
    .eq('id', neInicial.id)
    .single();

  if (errTree || !arvoreEmpenho) {
    console.error('❌ Erro ao carregar árvore:', errTree?.message);
    process.exit(1);
  }

  console.log(`  ↳ Empenho ${arvoreEmpenho.numero_nota_empenho}:`);
  console.log(`    Eventos Filhos vinculados: ${arvoreEmpenho.financeiro_empenhos_eventos.length}`);
  console.log(`    Liquidações vinculadas: ${arvoreEmpenho.financeiro_liquidacoes.length}`);

  if (
    arvoreEmpenho.financeiro_empenhos_eventos.length === 2 &&
    arvoreEmpenho.financeiro_liquidacoes.length === 1
  ) {
    console.log('    ✅ Árvore Master-Detail íntegra com todos os eventos e liquidações!\n');
  } else {
    console.error('    ❌ Quantidade de nós filhos inesperada na árvore!');
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎯 TODAS AS ASSERTIVAS DO MÓDULO 5 PASSARAM COM SUCESSO 100%!');
  console.log('   - Classificação de vigência automática: OK');
  console.log('   - Reforço no SIAFE e recálculo de saldo líquido: OK');
  console.log('   - Bloqueio de anulação superior ao saldo (chk_anulacao_limite): OK');
  console.log('   - Ateste de Nota Fiscal e Liquidação no SIAFE-Rio: OK');
  console.log('   - Árvore genealógica completa: OK');
  console.log('================================================================');
}

runSimulationFinanceiro();
