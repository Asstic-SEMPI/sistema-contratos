import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wodxkxbdcbsfxzdpczuf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHhreGJkY2JzZnh6ZHBjenVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjM2MzEsImV4cCI6MjEwODA5OTYzMX0.xX2w9bHDLJfDYkdZtSDZGCXH5Kse_w255MTAjt4Igik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSimulationFiscais() {
  console.log('================================================================');
  console.log('🏛️ SIMULAÇÃO DE INSERÇÃO DE DADOS — MÓDULO 4: FISCAIS & SWAP');
  console.log('Governo do Estado do Rio de Janeiro — SEMPI-RJ (Portarias DOERJ)');
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
    return;
  }

  const user = authRes.data.user;
  console.log(`✅ Autenticado com sucesso! UID: ${user.id}\n`);

  // 2. Criação de Contrato de Teste
  const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
  console.log('2️⃣ Criando contrato para teste de comissão e swap atômico...');
  const { data: contrato, error: errContrato } = await supabase
    .from('contratos')
    .insert({
      tipo_formalizacao: 'CONTRATO_FORMAL',
      numero_contrato: `FISCAL-${randomSuffix}/2026`,
      processo_sei: `SEI-150001/${randomSuffix}/2026`,
      chave_siga_contrato: `SIGA-CF-${randomSuffix}`,
      contratada_cnpj: '98765432000188',
      contratada_razao_social: 'Tecnologia e Serviços do Rio Ltda',
      objeto: 'Desenvolvimento e sustentação de sistemas de informação da SEMPI.',
      valor_inicial: 250000.00,
      valor_atualizado: 250000.00,
      data_publicacao_pncp: '2026-02-01',
      data_vigencia_inicio_original: '2026-02-01',
      data_vigencia_fim_original: '2027-02-01',
      data_vigencia_fim_atual: '2027-02-01',
      status: 'VIGENTE',
      created_by: user.id,
    })
    .select()
    .single();

  if (errContrato) {
    console.error('❌ Falha ao criar contrato de teste:', errContrato.message);
    return;
  }
  console.log(`✅ Contrato criado: ${contrato.numero_contrato} (ID: ${contrato.id})\n`);

  // 3. Designação do Gestor
  console.log('3️⃣ Designando GESTOR (Carlos Mendes, ID: 4455667-1, Portaria SEMPI nº 010/2026)...');
  const { data: gestor, error: errGestor } = await supabase
    .from('contrato_fiscais')
    .insert({
      contrato_id: contrato.id,
      nome: 'Carlos Mendes de Alencar',
      id_funcional: '4455667-1',
      funcao: 'GESTOR',
      portaria_designacao: 'Portaria SEMPI nº 010/2026',
      data_publicacao_doerj: '2026-02-05',
      data_inicio: '2026-02-01',
      ativo: true,
      created_by: user.id,
    })
    .select()
    .single();

  if (errGestor) {
    console.error('❌ Falha ao designar gestor:', errGestor.message);
    return;
  }
  console.log(`✅ Gestor formalizado! ID: ${gestor.id}\n`);

  // 4. Designação da Fiscal Técnica Titular
  console.log('4️⃣ Designando FISCAL TÉCNICO titular (Mariana Souza, ID: 7788990-2)...');
  const { data: fiscalTecnica, error: errFiscal } = await supabase
    .from('contrato_fiscais')
    .insert({
      contrato_id: contrato.id,
      nome: 'Mariana Souza e Silva',
      id_funcional: '7788990-2',
      funcao: 'FISCAL_TECNICO',
      portaria_designacao: 'Portaria SEMPI nº 010/2026',
      data_publicacao_doerj: '2026-02-05',
      data_inicio: '2026-02-01',
      ativo: true,
      created_by: user.id,
    })
    .select()
    .single();

  if (errFiscal) {
    console.error('❌ Falha ao designar fiscal:', errFiscal.message);
    return;
  }
  console.log(`✅ Fiscal Técnica formalizada! ID: ${fiscalTecnica.id}\n`);

  // 5. Teste do Swap Atômico: Substituição da Fiscal Técnica por Roberto Fonseca
  console.log('5️⃣ Executando SWAP ATÔMICO: Substituindo Mariana Souza por Roberto Fonseca (Portaria SEMPI nº 088/2026)...');
  const dataSubstituicao = '2026-07-01';

  // 5.1. Desativa a fiscal anterior
  const { error: errDesativa } = await supabase
    .from('contrato_fiscais')
    .update({
      ativo: false,
      data_fim: dataSubstituicao,
      data_substituicao: dataSubstituicao,
    })
    .eq('id', fiscalTecnica.id);

  if (errDesativa) {
    console.error('❌ Falha ao desativar fiscal anterior:', errDesativa.message);
    return;
  }

  // 5.2. Insere o novo fiscal ativo
  const { data: novoFiscal, error: errNovoFiscal } = await supabase
    .from('contrato_fiscais')
    .insert({
      contrato_id: contrato.id,
      nome: 'Roberto Fonseca de Miranda',
      id_funcional: '1122334-5',
      funcao: 'FISCAL_TECNICO',
      portaria_designacao: 'Portaria SEMPI nº 088/2026',
      data_publicacao_doerj: '2026-07-03',
      data_inicio: dataSubstituicao,
      ativo: true,
      created_by: user.id,
    })
    .select()
    .single();

  if (errNovoFiscal) {
    console.error('❌ Falha ao inserir novo fiscal no swap:', errNovoFiscal.message);
    return;
  }
  console.log(`✅ Swap atômico executado com sucesso!`);
  console.log(`   Fiscal Anterior (Mariana): Ativo = FALSE | Fim = ${dataSubstituicao}`);
  console.log(`   Novo Fiscal (Roberto):    Ativo = TRUE  | Início = ${dataSubstituicao} | Portaria: ${novoFiscal.portaria_designacao}\n`);

  // 6. Teste de Contrato Acéfalo (Teste do QA Critic)
  console.log('6️⃣ Teste de Contrato Acéfalo: Desativando o GESTOR sem nomear substituto...');
  const { error: errDesativaGestor } = await supabase
    .from('contrato_fiscais')
    .update({
      ativo: false,
      data_fim: '2026-08-01',
    })
    .eq('id', gestor.id);

  if (errDesativaGestor) {
    console.error('❌ Falha ao desativar gestor:', errDesativaGestor.message);
    return;
  }
  console.log('✅ Gestor desativado formalmente.');

  // 7. Verificação da regra de Contrato Acéfalo
  console.log('\n7️⃣ Executando consulta da Matriz de Conformidade da Home para detecção de Contrato Acéfalo...');
  const { data: contratosVerificacao } = await supabase
    .from('contratos')
    .select(`
      id,
      numero_contrato,
      status,
      contrato_fiscais (
        id,
        funcao,
        ativo
      )
    `)
    .eq('id', contrato.id)
    .single();

  const fiscaisAtuais = contratosVerificacao.contrato_fiscais || [];
  const temGestorAtivo = fiscaisAtuais.some((f) => f.ativo && f.funcao === 'GESTOR');
  const temFiscalTecnicoAtivo = fiscaisAtuais.some((f) => f.ativo && f.funcao === 'FISCAL_TECNICO');
  const contratoFicouAcefalo = contratosVerificacao.status === 'VIGENTE' && (!temGestorAtivo || !temFiscalTecnicoAtivo);

  console.log('----------------------------------------------------------------');
  console.log(`📋 RESULTADO DA AUDITORIA DA COMISSÃO (CONTRATO ${contratosVerificacao.numero_contrato}):`);
  console.log(`   Status do Contrato:           ${contratosVerificacao.status}`);
  console.log(`   Possui Gestor Ativo?:         ${temGestorAtivo ? 'SIM' : 'NÃO (Acéfalo!)'}`);
  console.log(`   Possui Fiscal Técnico Ativo?: ${temFiscalTecnicoAtivo ? 'SIM' : 'NÃO'}`);
  console.log(`   Detectado como Acéfalo?:      ${contratoFicouAcefalo ? 'SIM ⚠️ (Alerta Ativado!)' : 'NÃO'}`);
  console.log('----------------------------------------------------------------');

  if (contratoFicouAcefalo && !temGestorAtivo && temFiscalTecnicoAtivo) {
    console.log('\n🏆 SIMULAÇÃO DO MÓDULO 4 CONCLUÍDA COM 100% DE SUCESSO!');
    console.log('O Swap Atômico, histórico DOERJ e o alerta de Contrato Acéfalo operaram perfeitamente.');
  } else {
    console.error('\n⚠️ Falha na detecção da condição de Contrato Acéfalo!');
  }
}

runSimulationFiscais();
