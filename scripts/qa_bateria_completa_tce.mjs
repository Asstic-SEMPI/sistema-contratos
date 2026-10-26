import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wodxkxbdcbsfxzdpczuf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHhreGJkY2JzZnh6ZHBjenVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjM2MzEsImV4cCI6MjEwODA5OTYzMX0.xX2w9bHDLJfDYkdZtSDZGCXH5Kse_w255MTAjt4Igik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

let testesPassados = 0;
let testesFalhos = 0;
const relatorioErros = [];

function assert(condicao, titulo, detalhes = '') {
  if (condicao) {
    console.log(`   ✅ [PASS] ${titulo}`);
    testesPassados++;
  } else {
    console.error(`   ❌ [FAIL] ${titulo}`);
    if (detalhes) console.error(`      Motivo: ${detalhes}`);
    testesFalhos++;
    relatorioErros.push({ titulo, detalhes });
  }
}

async function runQABattery() {
  console.log('========================================================================');
  console.log('🔍 BATERIA DE AUDITORIA E TESTES DE ESTRESSE — AGENTE QA CRÍTICO (TCE-RJ)');
  console.log('   Simulação Implacável de Regras de Negócio, Integridade Contábil & RLS');
  console.log('   Secretaria de Estado da Mulher e de Políticas Inclusivas — SEMPI/RJ');
  console.log('========================================================================\n');

  // Autenticação com o Administrador do Sistema
  console.log('🔑 [AUTENTICAÇÃO] Fazendo login como Administrador...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@sempi.com',
    password: 'Admin@Sempi2026!',
  });

  if (authError || !authData.user) {
    console.error('❌ Falha crítica: não foi possível autenticar o admin.');
    process.exit(1);
  }
  console.log(`   Usuário logado: ${authData.user.email} (ID: ${authData.user.id})\n`);

  const timestamp = Date.now();
  const hoje = new Date().toISOString().split('T')[0];
  const proximoAno = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0];

  // =========================================================================
  // BATERIA 1: Art. 95 (Contrato Formal vs. Empenho com Força de Contrato)
  // =========================================================================
  console.log('📋 BATERIA 1: Integridade Jurídica do Art. 95 da Lei 14.133/2021');

  // 1.1 Tentar criar CONTRATO_FORMAL como VIGENTE com numero_contrato = NULL (deve falhar)
  console.log('   Subteste 1.1: Criar CONTRATO_FORMAL vigente sem número de contrato...');
  const { data: cFormalInvalido, error: errCFormalInvalido } = await supabase
    .from('contratos')
    .insert({
      tipo_formalizacao: 'CONTRATO_FORMAL',
      numero_contrato: null,
      processo_sei: `SEI-TEST-1.1-${timestamp}`,
      chave_siga_contrato: `SIGA-1.1-${timestamp}`,
      contratada_cnpj: '11222333000144',
      contratada_razao_social: 'Empresa Teste Formal Sem Numero',
      objeto: 'Tentativa indevida de formalização sem numeração',
      valor_inicial: 100000.00,
      valor_atualizado: 100000.00,
      data_publicacao_pncp: hoje,
      data_vigencia_inicio_original: hoje,
      data_vigencia_fim_original: proximoAno,
      data_vigencia_fim_atual: proximoAno,
      status: 'VIGENTE',
    })
    .select()
    .single();

  assert(
    !!errCFormalInvalido,
    'Banco rejeitou CONTRATO_FORMAL vigente sem número de contrato (chk_numero_contrato_obrigatorio)',
    errCFormalInvalido ? errCFormalInvalido.message : 'Deveria ter disparado erro de constraint'
  );

  // 1.2 Criar NOTA_EMPENHO_FORCA_CONTRATO sem numero_contrato (deve passar)
  console.log('   Subteste 1.2: Criar NOTA_EMPENHO_FORCA_CONTRATO sem número de contrato...');
  const { data: cArt95Valido, error: errCArt95Valido } = await supabase
    .from('contratos')
    .insert({
      tipo_formalizacao: 'NOTA_EMPENHO_FORCA_CONTRATO',
      numero_contrato: null,
      processo_sei: `SEI-TEST-1.2-${timestamp}`,
      chave_siga_contrato: `SIGA-1.2-${timestamp}`,
      contratada_cnpj: '11222333000144',
      contratada_razao_social: 'Fornecedora Material Permanente RJ',
      objeto: 'Aquisição com entrega imediata e integral (Art. 95)',
      valor_inicial: 80000.00,
      valor_atualizado: 80000.00,
      data_publicacao_pncp: hoje,
      data_vigencia_inicio_original: hoje,
      data_vigencia_fim_original: proximoAno,
      data_vigencia_fim_atual: proximoAno,
      status: 'VIGENTE',
    })
    .select()
    .single();

  assert(
    !errCArt95Valido && !!cArt95Valido,
    'Banco aceitou NOTA_EMPENHO_FORCA_CONTRATO sem número de contrato formal',
    errCArt95Valido?.message
  );

  // 1.3 Tentar inserir ADITIVO_VALOR em NOTA_EMPENHO_FORCA_CONTRATO (deve falhar)
  if (cArt95Valido) {
    console.log('   Subteste 1.3: Tentar lançar ADITIVO_VALOR em Nota de Empenho Art. 95...');
    const { data: aditivoInvalido, error: errAditivoInvalido } = await supabase
      .from('alteracoes_contratuais')
      .insert({
        contrato_id: cArt95Valido.id,
        procedimento: '1º Termo Aditivo',
        tipo: 'ADITIVO_VALOR',
        processo_sei: `SEI-ADIT-INV-${timestamp}`,
        data_assinatura: hoje,
        justificativa_resumo: 'Tentativa vedada de aditar valor em compra imediata',
        valor_diferenca: 10000.00,
      })
      .select()
      .single();

    assert(
      !!errAditivoInvalido,
      'Trigger jurídica (trg_check_aditivo_instrumento) bloqueou Termo Aditivo em Nota de Empenho Art. 95',
      errAditivoInvalido ? errAditivoInvalido.message : 'Deveria ter sido bloqueado'
    );

    // 1.4 Inserir APOSTILAMENTO em NOTA_EMPENHO_FORCA_CONTRATO (deve passar)
    console.log('   Subteste 1.4: Lançar APOSTILAMENTO legalmente admitido em Nota de Empenho Art. 95...');
    const { data: apostilamentoValido, error: errApostilamentoValido } = await supabase
      .from('alteracoes_contratuais')
      .insert({
        contrato_id: cArt95Valido.id,
        procedimento: '1º Apostilamento',
        tipo: 'APOSTILAMENTO',
        processo_sei: `SEI-APOST-VAL-${timestamp}`,
        data_assinatura: hoje,
        justificativa_resumo: 'Reajuste ou adequação cadastral permitida',
        valor_diferenca: 0,
      })
      .select()
      .single();

    assert(
      !errApostilamentoValido && !!apostilamentoValido,
      'Apostilamento em NOTA_EMPENHO_FORCA_CONTRATO aceito em estrita conformidade legal',
      errApostilamentoValido?.message
    );
  }

  // =========================================================================
  // BATERIA 2: Régua Temporal de Vigência x Classificação Chave SIGA
  // =========================================================================
  console.log('\n⏱️ BATERIA 2: Régua Temporal de Vigência e Classificação de Empenhos (SIAFE vs. SIGA)');

  // Criar Contrato Formal Base com vigência 2026-01-01 a 2026-12-31
  const { data: contratoBase, error: errCBase } = await supabase
    .from('contratos')
    .insert({
      tipo_formalizacao: 'CONTRATO_FORMAL',
      numero_contrato: `QA-CONTRATO-${timestamp.toString().slice(-4)}/2026`,
      processo_sei: `SEI-BASE-${timestamp}`,
      chave_siga_contrato: `SIGA-BASE-${timestamp}`,
      contratada_cnpj: '33444555000166',
      contratada_razao_social: 'Consórcio Fluminense de Engenharia',
      objeto: 'Prestação de serviços contínuos de manutenção predial',
      valor_inicial: 200000.00,
      valor_atualizado: 200000.00,
      data_publicacao_pncp: '2026-01-01',
      data_vigencia_inicio_original: '2026-01-01',
      data_vigencia_fim_original: '2026-12-31',
      data_vigencia_fim_atual: '2026-12-31',
      status: 'VIGENTE',
    })
    .select()
    .single();

  assert(!errCBase && !!contratoBase, 'Contrato formal base criado com sucesso', errCBase?.message);

  if (contratoBase) {
    // 2.1 Adicionar 1º Termo Aditivo de Prazo (2027-01-01 a 2027-12-31)
    const { data: aditivoPrazo, error: errAditivoPrazo } = await supabase
      .from('alteracoes_contratuais')
      .insert({
        contrato_id: contratoBase.id,
        procedimento: '1º Termo Aditivo de Prazo',
        tipo: 'ADITIVO_PRAZO',
        processo_sei: `SEI-ADIT-PRAZO-${timestamp}`,
        data_assinatura: '2026-11-01',
        vigencia_termo_inicio: '2027-01-01',
        vigencia_termo_fim: '2027-12-31',
        justificativa_resumo: 'Prorrogação de vigência por 12 meses',
        valor_diferenca: 0,
      })
      .select()
      .single();

    assert(!errAditivoPrazo && !!aditivoPrazo, '1º Termo Aditivo de Prazo inserido com sucesso', errAditivoPrazo?.message);

    // 2.2 Verificar se o contrato atualizou data_vigencia_fim_atual automaticamente
    const { data: contratoSync } = await supabase
      .from('contratos')
      .select('data_vigencia_fim_atual')
      .eq('id', contratoBase.id)
      .single();

    assert(
      contratoSync?.data_vigencia_fim_atual === '2027-12-31',
      'Trigger trg_sync_contrato_aditivos atualizou vigência fim do contrato para 2027-12-31',
      `Esperado 2027-12-31, recebido: ${contratoSync?.data_vigencia_fim_atual}`
    );

    // 2.3 Empenho A: data_referencia_vigencia dentro do Contrato Inicial (2026-05-10)
    console.log('   Subteste 2.3: Inserir Empenho dentro do Contrato Inicial (2026-05-10)...');
    const { data: empA, error: errEmpA } = await supabase
      .from('financeiro_empenhos')
      .insert({
        contrato_id: contratoBase.id,
        numero_nota_empenho: `2026NE${Math.floor(Math.random() * 90000 + 10000)}`,
        chave_siga: `SIGA-EMPA-${timestamp}`,
        processo_sei: `SEI-FIN-A-${timestamp}`,
        tipo_empenho: 'ESTIMATIVO',
        data_emissao: '2026-05-10',
        data_referencia_vigencia: '2026-05-10',
        programa_trabalho: '14.122.0001.2000',
        natureza_despesa: '3.3.90.39.00',
        fonte_recurso: '100',
        valor_empenhado_inicial: 50000.00,
      })
      .select()
      .single();

    assert(
      !errEmpA && empA?.vinculo_automatico_detectado === 'CONTRATO_INICIAL',
      'Trigger trg_classifica_empenho vinculou Empenho A a "CONTRATO_INICIAL"',
      `Recebido: ${empA?.vinculo_automatico_detectado}`
    );

    // 2.4 Empenho B: data_referencia_vigencia dentro do 1º Termo Aditivo (2027-03-15)
    console.log('   Subteste 2.4: Inserir Empenho dentro do 1º Termo Aditivo (2027-03-15)...');
    const { data: empB, error: errEmpB } = await supabase
      .from('financeiro_empenhos')
      .insert({
        contrato_id: contratoBase.id,
        numero_nota_empenho: `2027NE${Math.floor(Math.random() * 90000 + 10000)}`,
        chave_siga: `SIGA-EMPB-${timestamp}`,
        processo_sei: `SEI-FIN-B-${timestamp}`,
        tipo_empenho: 'ESTIMATIVO',
        data_emissao: '2027-03-15',
        data_referencia_vigencia: '2027-03-15',
        programa_trabalho: '14.122.0001.2000',
        natureza_despesa: '3.3.90.39.00',
        fonte_recurso: '100',
        valor_empenhado_inicial: 50000.00,
      })
      .select()
      .single();

    assert(
      !errEmpB && empB?.alteracao_id === aditivoPrazo.id,
      'Trigger trg_classifica_empenho vinculou Empenho B ao 1º Termo Aditivo de Prazo',
      `Alteracao_id recebido: ${empB?.alteracao_id}`
    );

    // 2.5 Empenho C: data_referencia_vigencia fora de qualquer vigência (2029-01-01)
    console.log('   Subteste 2.5: Inserir Empenho fora de qualquer vigência (2029-01-01)...');
    const { data: empC, error: errEmpC } = await supabase
      .from('financeiro_empenhos')
      .insert({
        contrato_id: contratoBase.id,
        numero_nota_empenho: `2029NE${Math.floor(Math.random() * 90000 + 10000)}`,
        chave_siga: `SIGA-EMPC-${timestamp}`,
        processo_sei: `SEI-FIN-C-${timestamp}`,
        tipo_empenho: 'ORDINARIO',
        data_emissao: '2029-01-01',
        data_referencia_vigencia: '2029-01-01',
        programa_trabalho: '14.122.0001.2000',
        natureza_despesa: '3.3.90.39.00',
        fonte_recurso: '100',
        valor_empenhado_inicial: 10000.00,
      })
      .select()
      .single();

    assert(
      !errEmpC && empC?.vinculo_automatico_detectado === 'ALERTA_FORA_DE_VIGENCIA',
      'Trigger trg_classifica_empenho gerou anomalia "ALERTA_FORA_DE_VIGENCIA" para data de 2029',
      `Recebido: ${empC?.vinculo_automatico_detectado}`
    );
  }

  // =========================================================================
  // BATERIA 3: Árvore Genealógica de Empenho (Reforço, Anulação e Liquidação)
  // =========================================================================
  console.log('\n🌳 BATERIA 3: Cálculos da Árvore de Empenhos e Limites de Anulação');

  if (contratoBase) {
    const { data: empenhoMae, error: errMae } = await supabase
      .from('financeiro_empenhos')
      .insert({
        contrato_id: contratoBase.id,
        numero_nota_empenho: `2026NE${Math.floor(Math.random() * 90000 + 10000)}`,
        chave_siga: `SIGA-MAE-${timestamp}`,
        processo_sei: `SEI-MAE-${timestamp}`,
        tipo_empenho: 'ORDINARIO',
        data_emissao: hoje,
        data_referencia_vigencia: hoje,
        programa_trabalho: '14.122.0001.2000',
        natureza_despesa: '3.3.90.39.00',
        fonte_recurso: '100',
        valor_empenhado_inicial: 100000.00,
      })
      .select()
      .single();

    assert(!errMae && !!empenhoMae, 'Empenho Original de R$ 100.000,00 registrado com sucesso', errMae?.message);

    if (empenhoMae) {
      // 3.1 Reforço de R$ 30.000,00
      console.log('   Subteste 3.1: Lançar Evento de REFORÇO de R$ 30.000,00...');
      const { data: evReforco, error: errReforco } = await supabase
        .from('financeiro_empenhos_eventos')
        .insert({
          empenho_original_id: empenhoMae.id,
          tipo_evento: 'REFORCO',
          numero_ne_evento: `2026NE${Math.floor(Math.random() * 90000 + 10000)}`,
          processo_sei: `SEI-REF-${timestamp}`,
          data_evento: hoje,
          valor_evento: 30000.00,
          motivo: 'Acréscimo de despesa orçamentária',
        })
        .select()
        .single();

      // Verificar recálculo na tabela pai
      const { data: empenhoAposReforco } = await supabase
        .from('financeiro_empenhos')
        .select('valor_reforcado, saldo_empenho_liquido')
        .eq('id', empenhoMae.id)
        .single();

      assert(
        empenhoAposReforco?.saldo_empenho_liquido === 130000.00,
        'Trigger trg_sync_eventos_empenho elevou saldo líquido para R$ 130.000,00',
        `Saldo recebido: ${empenhoAposReforco?.saldo_empenho_liquido}`
      );

      // 3.2 Tentativa de Anulação Excedente de R$ 150.000,00 (maior que o saldo de 130.000,00)
      console.log('   Subteste 3.2: Tentar anular R$ 150.000,00 em um empenho de R$ 130.000,00...');
      const { data: evAnulacaoInvalida, error: errAnulacaoInvalida } = await supabase
        .from('financeiro_empenhos_eventos')
        .insert({
          empenho_original_id: empenhoMae.id,
          tipo_evento: 'ANULACAO_PARCIAL',
          numero_ne_evento: `2026NE${Math.floor(Math.random() * 90000 + 10000)}`,
          processo_sei: `SEI-ANUL-INV-${timestamp}`,
          data_evento: hoje,
          valor_evento: 150000.00,
          motivo: 'Tentativa indevida de anular acima do saldo do empenho',
        })
        .select()
        .single();

      assert(
        !!errAnulacaoInvalida,
        'Constraint contábil chk_anulacao_limite barrou anulação de R$ 150.000,00 acima do saldo',
        errAnulacaoInvalida ? errAnulacaoInvalida.message : 'Deveria ter falhado'
      );

      // 3.3 Anulação Válida de R$ 20.000,00
      console.log('   Subteste 3.3: Lançar anulação parcial válida de R$ 20.000,00...');
      const { data: evAnulacaoValida, error: errAnulacaoValida } = await supabase
        .from('financeiro_empenhos_eventos')
        .insert({
          empenho_original_id: empenhoMae.id,
          tipo_evento: 'ANULACAO_PARCIAL',
          numero_ne_evento: `2026NE${Math.floor(Math.random() * 90000 + 10000)}`,
          processo_sei: `SEI-ANUL-VAL-${timestamp}`,
          data_evento: hoje,
          valor_evento: 20000.00,
          motivo: 'Economia processual',
        })
        .select()
        .single();

      const { data: empenhoAposAnulacao } = await supabase
        .from('financeiro_empenhos')
        .select('valor_anulado, saldo_empenho_liquido')
        .eq('id', empenhoMae.id)
        .single();

      assert(
        empenhoAposAnulacao?.saldo_empenho_liquido === 110000.00,
        'Saldo líquido reduzido corretamente para R$ 110.000,00 após anulação parcial',
        `Saldo recebido: ${empenhoAposAnulacao?.saldo_empenho_liquido}`
      );

      // 3.4 Liquidação de R$ 45.000,00
      console.log('   Subteste 3.4: Lançar Ateste e Nota de Liquidação (NL)...');
      const { data: liquidacao, error: errLiq } = await supabase
        .from('financeiro_liquidacoes')
        .insert({
          empenho_id: empenhoMae.id,
          processo_sei: `SEI-LIQ-${timestamp}`,
          numero_nota_fiscal: `NF-QA-${timestamp.toString().slice(-4)}`,
          data_emissao_nota_fiscal: hoje,
          competencia_mes_ano: '03/2026',
          numero_nota_liquidacao: `2026NL${Math.floor(Math.random() * 90000 + 10000)}`,
          data_emissao_nl: hoje,
          valor_liquidado: 45000.00,
        })
        .select()
        .single();

      assert(!errLiq && !!liquidacao, 'Nota de Liquidação de R$ 45.000,00 lançada com sucesso', errLiq?.message);
    }
  }

  // =========================================================================
  // BATERIA 4: Atas de Registro de Preços e Estouro de Cota
  // =========================================================================
  console.log('\n📦 BATERIA 4: Atas de Registro de Preços e Limites Rígidos de Cota');

  // Criar Ata de Teste
  const { data: ataQA, error: errAtaQA } = await supabase
    .from('atas_registro_preco')
    .insert({
      numero_ata: `ARP-QA-${timestamp.toString().slice(-4)}/2026`,
      processo_sei: `SEI-ARP-QA-${timestamp}`,
      objeto: 'Registro de Preços para fornecimento de computadores de alto desempenho',
      papel_secretaria: 'GERENCIADOR',
      orgao_gerenciador: 'Secretaria de Estado da Mulher e de Políticas Inclusivas - SEMPI',
      data_publicacao_pncp: hoje,
      data_vigencia_inicio: hoje,
      data_vigencia_fim: proximoAno,
      status: 'VIGENTE',
    })
    .select()
    .single();

  assert(!errAtaQA && !!ataQA, 'ARP criada com sucesso', errAtaQA?.message);

  if (ataQA && contratoBase) {
    // 4.1 Inserir Item com Cota SEMPI = 100 UN
    const { data: itemAta, error: errItemAta } = await supabase
      .from('atas_itens')
      .insert({
        ata_id: ataQA.id,
        item_numero: 1,
        codigo_item_siga: `ITEM-QA-${timestamp.toString().slice(-4)}`,
        descricao: 'Notebook Corporativo 32GB RAM',
        fornecedor_cnpj: '99888777000155',
        fornecedor_razao_social: 'Tecnologia Rio Distribuidora S.A.',
        unidade_medida: 'UN',
        valor_unitario: 5000.00,
        qtd_total_registrada: 300,
        qtd_cota_secretaria: 100,
      })
      .select()
      .single();

    assert(
      !errItemAta && itemAta?.saldo_disponivel === 100,
      'Item inserido com saldo_disponivel inicial calculado em 100 UN',
      errItemAta?.message
    );

    // Criar Empenho para consumir da Ata
    const { data: empenhoConsumidor } = await supabase
      .from('financeiro_empenhos')
      .insert({
        contrato_id: contratoBase.id,
        numero_nota_empenho: `2026NE${Math.floor(Math.random() * 90000 + 10000)}`,
        chave_siga: `SIGA-CONS-${timestamp}`,
        processo_sei: `SEI-CONS-${timestamp}`,
        tipo_empenho: 'ORDINARIO',
        data_emissao: hoje,
        data_referencia_vigencia: hoje,
        programa_trabalho: '14.122.0001.2000',
        natureza_despesa: '4.4.90.52.00',
        fonte_recurso: '100',
        valor_empenhado_inicial: 500000.00,
      })
      .select()
      .single();

    if (itemAta && empenhoConsumidor) {
      // 4.2 Abater 80 UN válidas
      console.log('   Subteste 4.2: Abater 80 UN da cota da SEMPI...');
      const { data: consumoA, error: errConsumoA } = await supabase
        .from('atas_consumo_empenhos')
        .insert({
          ata_item_id: itemAta.id,
          empenho_id: empenhoConsumidor.id,
          quantidade_consumida: 80,
        })
        .select()
        .single();

      // Verificar recálculo do saldo
      const { data: itemRecalculado } = await supabase
        .from('atas_itens')
        .select('qtd_empenhada_secretaria, saldo_disponivel')
        .eq('id', itemAta.id)
        .single();

      assert(
        itemRecalculado?.qtd_empenhada_secretaria === 80 && itemRecalculado?.saldo_disponivel === 20,
        'Trigger trg_sync_consumo_ata atualizou empenhado para 80 UN e saldo_disponivel para 20 UN',
        `Saldo: ${itemRecalculado?.saldo_disponivel}`
      );

      // 4.3 Tentativa de Abater 25 UN (maior que o saldo restante de 20 UN)
      console.log('   Subteste 4.3: Tentar abater 25 UN quando o saldo restante é de apenas 20 UN...');
      const { data: consumoEstouro, error: errConsumoEstouro } = await supabase
        .from('atas_consumo_empenhos')
        .insert({
          ata_item_id: itemAta.id,
          empenho_id: empenhoConsumidor.id,
          quantidade_consumida: 25,
        })
        .select()
        .single();

      assert(
        !!errConsumoEstouro,
        'Constraint chk_empenho_nao_excede_cota barrou estouro de cota da SEMPI com sucesso',
        errConsumoEstouro ? errConsumoEstouro.message : 'Deveria ter disparado erro de constraint'
      );
    }
  }

  // =========================================================================
  // BATERIA 5: Governança, Fiscais e Contrato Acéfalo
  // =========================================================================
  console.log('\n👥 BATERIA 5: Governança de Fiscais e Detecção de Contrato Acéfalo');

  // Criar contrato vigente sem fiscais (deve ser acéfalo)
  const { data: contratoAcefalo, error: errCAcefalo } = await supabase
    .from('contratos')
    .insert({
      tipo_formalizacao: 'CONTRATO_FORMAL',
      numero_contrato: `QA-ACEFALO-${timestamp.toString().slice(-4)}/2026`,
      processo_sei: `SEI-ACEF-${timestamp}`,
      chave_siga_contrato: `SIGA-ACEF-${timestamp}`,
      contratada_cnpj: '55666777000188',
      contratada_razao_social: 'Serviços Gerais Fluminense Ltda',
      objeto: 'Contrato vigente para teste de acefalia funcional',
      valor_inicial: 50000.00,
      valor_atualizado: 50000.00,
      data_publicacao_pncp: hoje,
      data_vigencia_inicio_original: hoje,
      data_vigencia_fim_original: proximoAno,
      data_vigencia_fim_atual: proximoAno,
      status: 'VIGENTE',
    })
    .select()
    .single();

  assert(!errCAcefalo && !!contratoAcefalo, 'Contrato vigente sem fiscais criado para teste', errCAcefalo?.message);

  if (contratoAcefalo) {
    // 5.1 Verificar fiscais ativos (esperado 0)
    const { data: fiscaisIniciais } = await supabase
      .from('contrato_fiscais')
      .select('id, funcao, ativo')
      .eq('contrato_id', contratoAcefalo.id)
      .eq('ativo', true);

    const temGestorOuTecnico = (fiscaisIniciais || []).some((f) =>
      ['GESTOR', 'FISCAL_TECNICO'].includes(f.funcao)
    );
    assert(
      !temGestorOuTecnico,
      'Contrato corretamente identificado como ACÉFALO (0 gestores ou fiscais técnicos ativos)',
      `Fiscais ativos: ${fiscaisIniciais?.length}`
    );

    // 5.2 Designar Gestor e Fiscal Técnico
    console.log('   Subteste 5.2: Designar Gestor e Fiscal Técnico formalmente...');
    const { data: fiscalTecnico } = await supabase
      .from('contrato_fiscais')
      .insert({
        contrato_id: contratoAcefalo.id,
        nome: 'Mariana Duarte Mendes',
        id_funcional: '9988776-5',
        funcao: 'FISCAL_TECNICO',
        portaria_designacao: 'Portaria SEMPI nº 200/2026',
        data_publicacao_doerj: hoje,
        data_inicio: hoje,
        ativo: true,
      })
      .select()
      .single();

    const { data: gestor } = await supabase
      .from('contrato_fiscais')
      .insert({
        contrato_id: contratoAcefalo.id,
        nome: 'Roberto Antunes Siqueira',
        id_funcional: '1122334-0',
        funcao: 'GESTOR',
        portaria_designacao: 'Portaria SEMPI nº 200/2026',
        data_publicacao_doerj: hoje,
        data_inicio: hoje,
        ativo: true,
      })
      .select()
      .single();

    assert(
      !!fiscalTecnico && !!gestor,
      'Comissão de fiscalização regularizada: Fiscal Técnico e Gestor formalmente designados'
    );

    // 5.3 Simular Swap Atômico (Substituição de Fiscal Técnico)
    console.log('   Subteste 5.3: Executar Swap Atômico de Fiscal Técnico com substituto...');
    // Desativa o anterior
    await supabase
      .from('contrato_fiscais')
      .update({ ativo: false, data_fim: hoje })
      .eq('id', fiscalTecnico.id);

    // Insere o novo titular
    const { data: novoFiscalTecnico } = await supabase
      .from('contrato_fiscais')
      .insert({
        contrato_id: contratoAcefalo.id,
        nome: 'Juliana Paes Vasconcelos',
        id_funcional: '3344556-7',
        funcao: 'FISCAL_TECNICO',
        portaria_designacao: 'Portaria SEMPI nº 210/2026',
        data_publicacao_doerj: hoje,
        data_inicio: hoje,
        ativo: true,
      })
      .select()
      .single();

    // Validar status dos fiscais
    const { data: fiscaisAposSwap } = await supabase
      .from('contrato_fiscais')
      .select('nome, ativo, funcao')
      .eq('contrato_id', contratoAcefalo.id);

    const ativosCount = (fiscaisAposSwap || []).filter((f) => f.ativo).length;
    const inativosCount = (fiscaisAposSwap || []).filter((f) => !f.ativo).length;

    assert(
      ativosCount === 2 && inativosCount === 1,
      'Swap de Fiscal efetuado: titular anterior desativado e nova titular ativada com sucesso',
      `Ativos: ${ativosCount}, Inativos: ${inativosCount}`
    );
  }

  // =========================================================================
  // BATERIA 6: Rescisão Contratual e Imutabilidade de Auditoria
  // =========================================================================
  console.log('\n🛡️ BATERIA 6: Rescisão Contratual & Auditoria Forense');

  if (contratoAcefalo) {
    // 6.1 Rescindir/Cancelar Contrato
    console.log('   Subteste 6.1: Cancelar/Rescindir Contrato...');
    const { data: contratoRescindido, error: errResc } = await supabase
      .from('contratos')
      .update({
        status: 'RESCINDIDO',
        observacoes: 'Rescisão amigável fundamentada no Art. 137 da Lei 14.133/21',
        updated_at: new Date().toISOString(),
      })
      .eq('id', contratoAcefalo.id)
      .select()
      .single();

    assert(
      !errResc && contratoRescindido?.status === 'RESCINDIDO',
      'Contrato rescindido com sucesso (status = RESCINDIDO)',
      errResc?.message
    );
  }

  // 6.2 Verificar logs gravados em public.audit_logs
  console.log('   Subteste 6.2: Verificar persistência de diffs em public.audit_logs...');
  const { data: logsRecentes, error: errLogsRecentes } = await supabase
    .from('audit_logs')
    .select('id, tabela_afetada, acao, campos_alterados')
    .order('created_at', { ascending: false })
    .limit(10);

  assert(
    !errLogsRecentes && (logsRecentes || []).length > 0,
    `Trilha de auditoria capturou ${(logsRecentes || []).length} operações com integridade forense`,
    errLogsRecentes?.message
  );

  // 6.3 Teste de Adulteração de Auditoria (Tentativa de UPDATE em audit_logs)
  console.log('   Subteste 6.3: Tentar adulterar registros de auditoria via UPDATE...');
  if (logsRecentes && logsRecentes.length > 0) {
    const { data: updateAuditoria, error: errUpdateAuditoria } = await supabase
      .from('audit_logs')
      .update({ usuario_id: '00000000-0000-0000-0000-000000000000' })
      .neq('id', 0)
      .select();

    assert(
      !updateAuditoria || updateAuditoria.length === 0,
      'Blindagem RLS impediu adulteração em public.audit_logs (0 linhas alteradas)',
      `Resultado: ${JSON.stringify(updateAuditoria)}`
    );

    // 6.4 Teste de Exclusão de Auditoria (Tentativa de DELETE em audit_logs)
    console.log('   Subteste 6.4: Tentar apagar rastros de auditoria via DELETE...');
    const { data: deleteAuditoria, error: errDeleteAuditoria } = await supabase
      .from('audit_logs')
      .delete()
      .neq('id', 0)
      .select();

    assert(
      !deleteAuditoria || deleteAuditoria.length === 0,
      'Blindagem RLS impediu exclusão em public.audit_logs (0 linhas apagadas)',
      `Resultado: ${JSON.stringify(deleteAuditoria)}`
    );
  }

  // =========================================================================
  // RELATÓRIO CONSOLIDADO DO AUDITOR QA
  // =========================================================================
  console.log('\n========================================================================');
  console.log(`📊 RELATÓRIO CONSOLIDADO DO AUDITOR QA (TCE-RJ / CGE-RJ):`);
  console.log(`   Testes Executados: ${testesPassados + testesFalhos}`);
  console.log(`   ✅ Aprovados:      ${testesPassados}`);
  console.log(`   ❌ Reprovados:     ${testesFalhos}`);
  console.log('========================================================================');

  if (testesFalhos > 0) {
    console.error('\n⚠️ ANOMALIAS ENCONTRADAS PELO ANALISTA DE QA:');
    relatorioErros.forEach((err, idx) => {
      console.error(`   ${idx + 1}. [FALHA] ${err.titulo}`);
      if (err.detalhes) console.error(`      Detalhes: ${err.detalhes}`);
    });
    process.exit(1);
  } else {
    console.log('\n🏆 PARECER FINAL DO AUDITOR: APROVADO COM EXCELÊNCIA!');
    console.log('   Todas as travas jurídicas da Lei 14.133/21, constraints contábeis e RLS foram atestadas.');
  }
}

runQABattery();
