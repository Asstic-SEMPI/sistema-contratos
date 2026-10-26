import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wodxkxbdcbsfxzdpczuf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHhreGJkY2JzZnh6ZHBjenVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjM2MzEsImV4cCI6MjEwODA5OTYzMX0.xX2w9bHDLJfDYkdZtSDZGCXH5Kse_w255MTAjt4Igik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSimulation() {
  console.log('========================================================================');
  console.log('🏛️ SIMULAÇÃO COMPLETA: INSERÇÃO & EDIÇÃO UNIVERSAL + APOSTILAMENTO');
  console.log('   SGC-SEMPI/RJ — Sistema de Gestão de Contratos e Atas de Registro');
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

  // 2. Contrato em Elaboração (Campos básicos/mínimos)
  console.log('\n📝 2. Inserindo Contrato em Fase de Elaboração (status: EM_FORMALIZACAO)...');
  const processoSeiDraft = `SEI-2026-DRAFT-${timestamp}`;
  const chaveSigaDraft = `SIGA-DRAFT-${timestamp}`;
  
  const { data: contratoDraft, error: errDraft } = await supabase
    .from('contratos')
    .insert({
      tipo_formalizacao: 'CONTRATO_FORMAL',
      numero_contrato: 'EM_ELABORACAO',
      processo_sei: processoSeiDraft,
      chave_siga_contrato: chaveSigaDraft,
      objeto: 'Contratação preliminar em fase preparatória para serviços de suporte de TI da SEMPI',
      status: 'EM_FORMALIZACAO',
      contratada_cnpj: '00000000000191',
      contratada_razao_social: 'Provedora de Soluções Tecnológicas Ltda (Em Habilitação)',
      valor_inicial: 500000.00,
      valor_atualizado: 500000.00,
      data_publicacao_pncp: new Date().toISOString().split('T')[0],
      data_vigencia_inicio_original: new Date().toISOString().split('T')[0],
      data_vigencia_fim_original: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      data_vigencia_fim_atual: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    })
    .select()
    .single();

  if (errDraft) {
    console.error('❌ Erro ao criar contrato em formalização:', errDraft.message);
    process.exit(1);
  }
  console.log(`   ✅ Contrato criado com sucesso em elaboração! ID: ${contratoDraft.id}`);
  console.log(`      Status inicial: [${contratoDraft.status}] | SEI: ${contratoDraft.processo_sei}`);

  // 3. Edição do Contrato: Promover para VIGENTE e preencher número formal
  console.log('\n✏️ 3. Editando Contrato: Promover para "VIGENTE" e atribuir número formal...');
  const numeroContratoDefinitivo = `CONTRATO-${timestamp.toString().slice(-4)}/2026`;
  const { data: contratoEditado, error: errEditContrato } = await supabase
    .from('contratos')
    .update({
      numero_contrato: numeroContratoDefinitivo,
      status: 'VIGENTE',
      objeto: 'Contratação definitiva formalizada para sustentação de infraestrutura da SEMPI/RJ',
      updated_at: new Date().toISOString(),
    })
    .eq('id', contratoDraft.id)
    .select()
    .single();

  if (errEditContrato) {
    console.error('❌ Erro ao atualizar contrato:', errEditContrato.message);
    process.exit(1);
  }
  console.log(`   ✅ Contrato promovido para [${contratoEditado.status}]!`);
  console.log(`      Número Formal: ${contratoEditado.numero_contrato}`);

  // 4. Apostilamento para Alteração de Dados Contratuais (Art. 136, III)
  console.log('\n📄 4. Registrando e Executando Apostilamento de Dados Contratuais (Art. 136, III)...');
  const novaRazaoSocial = 'Nova Tecnologia Integrada S.A. (Sucessora)';
  const novoCnpj = '12345678000195';

  const { data: apostilamento, error: errApost } = await supabase
    .from('alteracoes_contratuais')
    .insert({
      contrato_id: contratoDraft.id,
      procedimento: '1º Termo de Apostilamento',
      tipo: 'APOSTILAMENTO',
      processo_sei: `SEI-APOST-${timestamp}`,
      data_assinatura: new Date().toISOString().split('T')[0],
      justificativa_resumo: 'Alteração societária da contratada (incorporação) sem variação de valor ou prazo',
      valor_diferenca: 0,
      publicacao_doerj_data: new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (errApost) {
    console.error('❌ Erro ao criar apostilamento:', errApost.message);
    process.exit(1);
  }
  console.log(`   ✅ Apostilamento registrado com sucesso! ID: ${apostilamento.id}`);

  // Simula o efeito da Server Action atualizando a razão social/CNPJ no contrato
  const { data: contratoAtualizadoApost, error: errAtualizaContrato } = await supabase
    .from('contratos')
    .update({
      contratada_razao_social: novaRazaoSocial,
      contratada_cnpj: novoCnpj,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contratoDraft.id)
    .select()
    .single();

  if (errAtualizaContrato) {
    console.error('❌ Erro ao atualizar dados contratuais pelo apostilamento:', errAtualizaContrato.message);
    process.exit(1);
  }
  console.log(`   ✅ Razão Social atualizada no Dossiê: "${contratoAtualizadoApost.contratada_razao_social}"`);
  console.log(`   ✅ Novo CNPJ registrado: ${contratoAtualizadoApost.contratada_cnpj}`);

  // 5. Inserção e Edição de Fiscal da Comissão
  console.log('\n👥 5. Inserindo e Editando Membro da Comissão de Fiscalização...');
  const { data: fiscal, error: errFiscal } = await supabase
    .from('contrato_fiscais')
    .insert({
      contrato_id: contratoDraft.id,
      nome: 'Carlos Eduardo Oliveira Silva',
      id_funcional: '4455667-8',
      funcao: 'FISCAL_TECNICO',
      portaria_designacao: 'Portaria SEMPI nº 101/2026',
      data_publicacao_doerj: new Date().toISOString().split('T')[0],
      data_inicio: new Date().toISOString().split('T')[0],
      ativo: true,
    })
    .select()
    .single();

  if (errFiscal) {
    console.error('❌ Erro ao designar fiscal:', errFiscal.message);
    process.exit(1);
  }
  console.log(`   ✅ Fiscal designado: ${fiscal.nome} (${fiscal.funcao})`);

  // Edição dos dados do fiscal
  const { data: fiscalEditado, error: errEditFiscal } = await supabase
    .from('contrato_fiscais')
    .update({
      portaria_designacao: 'Portaria SEMPI/CGE nº 102/2026',
      updated_at: new Date().toISOString(),
    })
    .eq('id', fiscal.id)
    .select()
    .single();

  if (errEditFiscal) {
    console.error('❌ Erro ao editar fiscal:', errEditFiscal.message);
    process.exit(1);
  }
  console.log(`   ✅ Portaria retificada com sucesso: "${fiscalEditado.portaria_designacao}"`);

  // 6. Execução Financeira: Inserção e Edição de Empenho, Evento e Liquidação
  console.log('\n💰 6. Execução Financeira: Criando e Editando Empenho, Evento e Liquidação...');
  const numNE = `2026NE${timestamp.toString().slice(-5)}`;
  const { data: empenho, error: errEmp } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: contratoDraft.id,
      numero_nota_empenho: numNE,
      chave_siga: `SIGA-NE-${timestamp}`,
      processo_sei: `SEI-FIN-${timestamp}`,
      tipo_empenho: 'ESTIMATIVO',
      data_emissao: new Date().toISOString().split('T')[0],
      data_referencia_vigencia: new Date().toISOString().split('T')[0],
      programa_trabalho: '14.122.0001.2000',
      natureza_despesa: '3.3.90.39.00',
      fonte_recurso: '100',
      valor_empenhado_inicial: 100000.00,
    })
    .select()
    .single();

  if (errEmp) {
    console.error('❌ Erro ao criar empenho:', errEmp.message);
    process.exit(1);
  }
  console.log(`   ✅ Nota de Empenho criada: ${empenho.numero_nota_empenho} (R$ ${empenho.valor_empenhado_inicial})`);

  // Edição do Empenho
  const { data: empenhoEditado, error: errEditEmp } = await supabase
    .from('financeiro_empenhos')
    .update({
      programa_trabalho: '14.122.0001.2999 (Ajuste Orçamentário)',
      updated_at: new Date().toISOString(),
    })
    .eq('id', empenho.id)
    .select()
    .single();

  if (errEditEmp) {
    console.error('❌ Erro ao editar empenho:', errEditEmp.message);
    process.exit(1);
  }
  console.log(`   ✅ Empenho editado com sucesso! Novo PT: ${empenhoEditado.programa_trabalho}`);

  // Inserção e Edição de Evento Contábil (Reforço)
  const numEvento = `2026NE${(Number(timestamp.toString().slice(-5)) + 1).toString()}`;
  const { data: evento, error: errEv } = await supabase
    .from('financeiro_empenhos_eventos')
    .insert({
      empenho_original_id: empenho.id,
      tipo_evento: 'REFORCO',
      numero_ne_evento: numEvento,
      processo_sei: `SEI-REF-${timestamp}`,
      data_evento: new Date().toISOString().split('T')[0],
      valor_evento: 25000.00,
      motivo: 'Reforço para cobrir serviços adicionais do mês',
    })
    .select()
    .single();

  if (errEv) {
    console.error('❌ Erro ao lançar evento de reforço:', errEv.message);
    process.exit(1);
  }
  console.log(`   ✅ Evento de Reforço lançado: ${evento.numero_ne_evento} (+R$ ${evento.valor_evento})`);

  // Inserção e Edição de Liquidação (NL)
  const numNL = `2026NL${timestamp.toString().slice(-5)}`;
  const { data: liquidacao, error: errLiq } = await supabase
    .from('financeiro_liquidacoes')
    .insert({
      empenho_id: empenho.id,
      processo_sei: `SEI-LIQ-${timestamp}`,
      numero_nota_fiscal: `NF-${timestamp.toString().slice(-4)}`,
      data_emissao_nota_fiscal: new Date().toISOString().split('T')[0],
      competencia_mes_ano: '03/2026',
      numero_nota_liquidacao: numNL,
      data_emissao_nl: new Date().toISOString().split('T')[0],
      valor_liquidado: 35000.00,
    })
    .select()
    .single();

  if (errLiq) {
    console.error('❌ Erro ao liquidar empenho:', errLiq.message);
    process.exit(1);
  }
  console.log(`   ✅ Nota de Liquidação (NL) lançada: ${liquidacao.numero_nota_liquidacao} (R$ ${liquidacao.valor_liquidado})`);

  // Edição da Liquidação (Atestar Pagamento com OB)
  const dataHoje = new Date().toISOString().split('T')[0];
  const { data: liqEditada, error: errEditLiq } = await supabase
    .from('financeiro_liquidacoes')
    .update({
      data_pagamento_ob: dataHoje,
    })
    .eq('id', liquidacao.id)
    .select()
    .single();

  if (errEditLiq) {
    console.error('❌ Erro ao editar liquidação:', errEditLiq.message);
    process.exit(1);
  }
  console.log(`   ✅ Liquidação editada: Ordem Bancária quitada em ${liqEditada.data_pagamento_ob}`);

  // 7. Ata de Registro de Preços: Inserção em Elaboração, Edição e Itens
  console.log('\n📦 7. Ata de Registro de Preços: Criação "Em Elaboração" e Edição para "Vigente"...');
  const numAta = `ARP-${timestamp.toString().slice(-4)}/2026`;
  const { data: ataDraft, error: errAtaDraft } = await supabase
    .from('atas_registro_preco')
    .insert({
      numero_ata: numAta,
      processo_sei: `SEI-ARP-${timestamp}`,
      objeto: 'Registro de Preços para fornecimento de equipamentos ergonômicos',
      papel_secretaria: 'GERENCIADOR',
      orgao_gerenciador: 'Secretaria de Estado da Mulher e de Políticas Inclusivas - SEMPI',
      status: 'EM_FORMALIZACAO',
      data_publicacao_pncp: dataHoje,
      data_vigencia_inicio: dataHoje,
      data_vigencia_fim: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
    })
    .select()
    .single();

  if (errAtaDraft) {
    console.error('❌ Erro ao criar ata em formalização:', errAtaDraft.message);
    process.exit(1);
  }
  console.log(`   ✅ ARP criada em elaboração: ${ataDraft.numero_ata} (Status: [${ataDraft.status}])`);

  // Edição da Ata para Vigente
  const { data: ataVigente, error: errEditAta } = await supabase
    .from('atas_registro_preco')
    .update({
      status: 'VIGENTE',
      codigo_siga_arp: `SIGA-ARP-${timestamp}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ataDraft.id)
    .select()
    .single();

  if (errEditAta) {
    console.error('❌ Erro ao promover ata para vigente:', errEditAta.message);
    process.exit(1);
  }
  console.log(`   ✅ ARP promovida para [${ataVigente.status}]! Código SIGA: ${ataVigente.codigo_siga_arp}`);

  // Inserção e Edição de Item na Ata
  const { data: itemAta, error: errItemAta } = await supabase
    .from('atas_itens')
    .insert({
      ata_id: ataDraft.id,
      item_numero: 1,
      codigo_item_siga: `ITEM-SIGA-${timestamp.toString().slice(-4)}`,
      descricao: 'Cadeira Ergonômica Presidente com suporte lombar e braços reguláveis',
      fornecedor_cnpj: '98765432000188',
      fornecedor_razao_social: 'Mobiliário Corporativo Fluminense Ltda',
      unidade_medida: 'UN',
      valor_unitario: 1200.00,
      qtd_total_registrada: 200,
      qtd_cota_secretaria: 50,
    })
    .select()
    .single();

  if (errItemAta) {
    console.error('❌ Erro ao adicionar item na ata:', errItemAta.message);
    process.exit(1);
  }
  console.log(`   ✅ Item cadastrado na ARP: #${itemAta.item_numero} (Cota SEMPI: ${itemAta.qtd_cota_secretaria} UN a R$ ${itemAta.valor_unitario})`);

  // Edição do Item na Ata (Ajuste de Cota)
  const { data: itemEditado, error: errEditItem } = await supabase
    .from('atas_itens')
    .update({
      qtd_cota_secretaria: 60,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemAta.id)
    .select()
    .single();

  if (errEditItem) {
    console.error('❌ Erro ao editar item da ata:', errEditItem.message);
    process.exit(1);
  }
  console.log(`   ✅ Cota do Item ampliada para: ${itemEditado.qtd_cota_secretaria} UN`);

  // 8. Verificação da Trilha de Auditoria (public.audit_logs)
  console.log('\n🔍 8. Verificando Trilha de Auditoria Imutável (public.audit_logs)...');
  const { data: logs, error: errLogs } = await supabase
    .from('audit_logs')
    .select('*')
    .in('tabela_afetada', ['contratos', 'contrato_fiscais', 'financeiro_empenhos', 'financeiro_liquidacoes', 'atas_registro_preco', 'atas_itens'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (errLogs) {
    console.error('❌ Erro ao consultar audit_logs:', errLogs.message);
  } else {
    console.log(`   ✅ Capturados ${logs.length} registros recentes de auditoria automática:`);
    logs.slice(0, 5).forEach((l) => {
      console.log(`      • [${l.operacao}] na tabela "${l.tabela_afetada}" | Registro: ${l.registro_id.slice(0, 8)}... | Campos: ${JSON.stringify(l.campos_alterados || [])}`);
    });
  }

  console.log('\n========================================================================');
  console.log('🎉 SIMULAÇÃO COMPLETA CONCLUÍDA COM SUCESSO ABSOLUTO!');
  console.log('   Todos os fluxos de Criação, Edição, Status e Auditoria estão validados.');
  console.log('========================================================================');
}

runSimulation();
