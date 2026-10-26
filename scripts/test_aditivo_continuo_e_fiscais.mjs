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
console.log('🏛️ SIMULAÇÃO DE CASOS DE BORDA: ADITIVOS CONTÍNUOS & FISCAIS');
console.log('🏛️ ========================================================\n');

async function runSimulation() {
  const supabase = createClient(supabaseUrl, anonKey);

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

  const timestamp = Date.now().toString().slice(-4);

  // -------------------------------------------------------------
  // CASO 1: Contrato 15/2026 - Valor Base 250.000,00 - 1º TA Prazo
  // Valor Atualizado esperado: R$ 500.000,00
  // -------------------------------------------------------------
  console.log('\n2️⃣ [CASO 1] Teste de Contrato Contínuo com 1º Termo Aditivo de Prazo...');
  const numeroContrato1 = `15/${timestamp}`;
  const valorBase1 = 250000.00;

  const { data: c1, error: errC1 } = await supabase
    .from('contratos')
    .insert({
      numero_contrato: numeroContrato1,
      tipo_formalizacao: 'CONTRATO_FORMAL',
      tipo_contrato: 'CONTINUO',
      tipo_licitacao: 'PREGAO_ELETRONICO',
      emergencial: false,
      processo_sei: `SEI-TESTE-${timestamp}-1`,
      chave_siga_contrato: `SIGA-${timestamp}-1`,
      objeto: 'Prestação de serviços contínuos de suporte técnico SEMPI',
      contratada_razao_social: 'ALPHA TECNOLOGIA CONTINUA LTDA',
      contratada_cnpj: '12345678000199',
      valor_inicial: valorBase1,
      valor_atualizado: valorBase1,
      data_publicacao_pncp: '2026-01-01',
      data_vigencia_inicio_original: '2026-01-01',
      data_vigencia_fim_original: '2027-01-01',
      data_vigencia_fim_atual: '2027-01-01',
      status: 'VIGENTE',
      created_by: authData.user.id,
    })
    .select('id, valor_inicial, valor_atualizado')
    .single();

  if (errC1 || !c1) {
    console.error('❌ Falha ao criar Contrato 1:', errC1?.message);
    process.exit(1);
  }
  console.log(`✅ Contrato 1 criado: ${numeroContrato1} | Valor Base: R$ ${c1.valor_inicial.toLocaleString('pt-BR')}`);

  // Regra de Contrato Contínuo: Aditivo de Prazo replica o valor base
  const valorDiferencaAditivo1 = valorBase1; // 250.000,00
  console.log(`   ➕ Lançando 1º Termo Aditivo (Prazo) com prorrogação e replicação de base: R$ ${valorDiferencaAditivo1.toLocaleString('pt-BR')}...`);

  const { data: ad1, error: errAd1 } = await supabase
    .from('alteracoes_contratuais')
    .insert({
      contrato_id: c1.id,
      procedimento: '1º Termo Aditivo',
      processo_sei: `SEI-AD1-${timestamp}`,
      tipo: 'ADITIVO_PRAZO',
      justificativa_resumo: 'Prorrogação de vigência por 12 meses nos termos do Art. 106/107 da Lei 14.133/21',
      valor_diferenca: valorDiferencaAditivo1,
      data_assinatura: '2026-12-01',
      vigencia_termo_inicio: '2027-01-02',
      vigencia_termo_fim: '2028-01-01',
      created_by: authData.user.id,
    })
    .select('id')
    .single();

  if (errAd1) {
    console.error('❌ Falha ao inserir Aditivo 1:', errAd1.message);
    process.exit(1);
  }

  // Verificar recálculo do Contrato 1 via Trigger
  const { data: c1Atualizado } = await supabase
    .from('contratos')
    .select('id, valor_inicial, valor_atualizado, data_vigencia_fim_atual')
    .eq('id', c1.id)
    .single();

  console.log(`   📊 Valor Atualizado no Banco: R$ ${Number(c1Atualizado.valor_atualizado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`   📅 Nova Vigência Fim: ${c1Atualizado.data_vigencia_fim_atual}`);

  const esperado1 = 500000.00;
  if (Math.abs(Number(c1Atualizado.valor_atualizado) - esperado1) < 0.01) {
    console.log(`   ✅ SUCESSO: R$ ${esperado1.toLocaleString('pt-BR')} conferido com exatidão matemática!`);
  } else {
    console.error(`   ❌ DIVERGÊNCIA: Esperado ${esperado1}, obtido ${c1Atualizado.valor_atualizado}`);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // CASO 2: Contrato 17/2026 - Valor Base 350.000,00 - 1º TA Misto (R$ 45.000,00)
  // Valor Atualizado esperado: R$ 745.000,00
  // -------------------------------------------------------------
  console.log('\n3️⃣ [CASO 2] Teste de Contrato Contínuo com 1º Termo Aditivo Misto...');
  const numeroContrato2 = `17/${timestamp}`;
  const valorBase2 = 350000.00;
  const acrescimoAditivado2 = 45000.00;

  const { data: c2, error: errC2 } = await supabase
    .from('contratos')
    .insert({
      numero_contrato: numeroContrato2,
      tipo_formalizacao: 'CONTRATO_FORMAL',
      tipo_contrato: 'CONTINUO',
      tipo_licitacao: 'PREGAO_ELETRONICO',
      emergencial: false,
      processo_sei: `SEI-TESTE-${timestamp}-2`,
      chave_siga_contrato: `SIGA-${timestamp}-2`,
      objeto: 'Prestação de serviços operacionais contínuos',
      contratada_razao_social: 'BETA SERVICOS CONTINUOS LTDA',
      contratada_cnpj: '98765432000188',
      valor_inicial: valorBase2,
      valor_atualizado: valorBase2,
      data_publicacao_pncp: '2026-01-01',
      data_vigencia_inicio_original: '2026-01-01',
      data_vigencia_fim_original: '2027-01-01',
      data_vigencia_fim_atual: '2027-01-01',
      status: 'VIGENTE',
      created_by: authData.user.id,
    })
    .select('id, valor_inicial, valor_atualizado')
    .single();

  if (errC2 || !c2) {
    console.error('❌ Falha ao criar Contrato 2:', errC2?.message);
    process.exit(1);
  }
  console.log(`✅ Contrato 2 criado: ${numeroContrato2} | Valor Base: R$ ${c2.valor_inicial.toLocaleString('pt-BR')}`);

  // Testar regra do teto de 25% (Art. 125 Lei 14.133/21): Teto é sobre o valor base
  const tetoLegal2 = valorBase2 * 0.25; // 87.500,00
  console.log(`   ⚖️ Teto Legal de 25% (sobre Valor Base R$ 350.000,00): R$ ${tetoLegal2.toLocaleString('pt-BR')}`);
  console.log(`   ⚖️ Acréscimo Aditivado: R$ ${acrescimoAditivado2.toLocaleString('pt-BR')} (${((acrescimoAditivado2 / valorBase2) * 100).toFixed(2)}% <= 25% ✅)`);

  // Regra de Contrato Contínuo Misto: Base Replicada + Acréscimo
  const valorDiferencaAditivo2 = valorBase2 + acrescimoAditivado2; // 350.000 + 45.000 = 395.000,00
  console.log(`   ➕ Lançando 1º Termo Aditivo (Misto) com valor_diferenca = R$ ${valorDiferencaAditivo2.toLocaleString('pt-BR')}...`);

  const { data: ad2, error: errAd2 } = await supabase
    .from('alteracoes_contratuais')
    .insert({
      contrato_id: c2.id,
      procedimento: '1º Termo Aditivo Misto',
      processo_sei: `SEI-AD2-${timestamp}`,
      tipo: 'ADITIVO_MISTO',
      justificativa_resumo: 'Prorrogação de 12 meses + acréscimo qualitativo de 12.86%',
      valor_diferenca: valorDiferencaAditivo2,
      data_assinatura: '2026-12-01',
      vigencia_termo_inicio: '2027-01-02',
      vigencia_termo_fim: '2028-01-01',
      created_by: authData.user.id,
    })
    .select('id')
    .single();

  if (errAd2) {
    console.error('❌ Falha ao inserir Aditivo 2:', errAd2.message);
    process.exit(1);
  }

  // Verificar recálculo do Contrato 2 via Trigger
  const { data: c2Atualizado } = await supabase
    .from('contratos')
    .select('id, valor_inicial, valor_atualizado, data_vigencia_fim_atual')
    .eq('id', c2.id)
    .single();

  console.log(`   📊 Valor Atualizado no Banco: R$ ${Number(c2Atualizado.valor_atualizado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  const esperado2 = 745000.00;
  if (Math.abs(Number(c2Atualizado.valor_atualizado) - esperado2) < 0.01) {
    console.log(`   ✅ SUCESSO: R$ ${esperado2.toLocaleString('pt-BR')} conferido com exatidão matemática!`);
  } else {
    console.error(`   ❌ DIVERGÊNCIA: Esperado ${esperado2}, obtido ${c2Atualizado.valor_atualizado}`);
    process.exit(1);
  }

  // -------------------------------------------------------------
  // CASO 3: Teste de Fiscais e Inativação / Retificação
  // -------------------------------------------------------------
  console.log('\n4️⃣ [CASO 3] Teste de Gestão de Fiscais: Designação, Inativação e Histórico...');
  
  // Designar Gestor
  const { data: fGestor, error: errFG } = await supabase
    .from('contrato_fiscais')
    .insert({
      contrato_id: c1.id,
      nome: 'DR. CARLOS EDUARDO SILVA',
      id_funcional: '99887766',
      funcao: 'GESTOR',
      portaria_designacao: 'Portaria SEMPI nº 101/2026',
      data_publicacao_doerj: '2026-01-02',
      data_inicio: '2026-01-01',
      ativo: true,
      created_by: authData.user.id,
    })
    .select('id, ativo, data_fim')
    .single();

  if (errFG) {
    console.error('❌ Falha ao designar gestor:', errFG.message);
    process.exit(1);
  }
  console.log(`   ✅ Gestor Ativo cadastrado: ID ${fGestor.id}`);

  // Inativar o Gestor (substituição)
  console.log('   🔄 Inativando Gestor (inserindo data de encerramento e data de substituição)...');
  const { error: errInat } = await supabase
    .from('contrato_fiscais')
    .update({
      ativo: false,
      data_fim: '2026-06-30',
      data_substituicao: '2026-06-30',
    })
    .eq('id', fGestor.id);

  if (errInat) {
    console.error('❌ Falha ao inativar fiscal:', errInat.message);
    process.exit(1);
  }

  // Conferir estado inativo
  const { data: fInativo } = await supabase
    .from('contrato_fiscais')
    .select('id, nome, ativo, data_fim, data_substituicao')
    .eq('id', fGestor.id)
    .single();

  console.log(`   📋 Status após inativação: Ativo=${fInativo.ativo} | Data Fim=${fInativo.data_fim} | Data Substituição: ${fInativo.data_substituicao}`);
  if (!fInativo.ativo && fInativo.data_fim === '2026-06-30') {
    console.log('   ✅ Fiscal Inativo com histórico preservado perfeitamente!');
  } else {
    console.error('   ❌ Estado do fiscal inativo inconsistente!');
    process.exit(1);
  }

  // Reativar fiscal
  console.log('   🔄 Retificando / Reativando fiscal para validar suporte a reativação...');
  const { error: errReat } = await supabase
    .from('contrato_fiscais')
    .update({
      ativo: true,
      data_fim: null,
      data_substituicao: null,
    })
    .eq('id', fGestor.id);

  if (errReat) {
    console.error('❌ Falha ao reativar fiscal:', errReat.message);
    process.exit(1);
  }
  console.log('   ✅ Reativação de fiscal concluída com sucesso!');

  console.log('\n🏛️ ========================================================');
  console.log('🏛️ TODOS OS TESTES PASSARAM COM 100% DE SUCESSO! 🎯');
  console.log('🏛️ ========================================================');
}

runSimulation().catch((err) => {
  console.error('❌ Erro inesperado:', err);
  process.exit(1);
});
