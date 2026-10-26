import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wodxkxbdcbsfxzdpczuf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZHhreGJkY2JzZnh6ZHBjenVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjM2MzEsImV4cCI6MjEwODA5OTYzMX0.xX2w9bHDLJfDYkdZtSDZGCXH5Kse_w255MTAjt4Igik';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSimulationAtas() {
  console.log('================================================================');
  console.log('🏛️ SIMULAÇÃO DE INSERÇÃO DE DADOS — MÓDULO 6: ATAS & COTAS');
  console.log('Sistema de Registro de Preços (SRP) — Abate de Cota por Empenho');
  console.log('Governo do Estado do Rio de Janeiro — SEMPI-RJ');
  console.log('================================================================\n');

  // 1. Autenticação do Administrador
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

  // 2. Criação da Ata de Registro de Preços (Gerenciada pela SEMPI)
  const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
  const numAta = `ARP-${randomSuffix}/2026`;
  console.log(`2️⃣ Criando Ata de Registro de Preços Gerenciada: ${numAta}...`);
  const { data: ata, error: errAta } = await supabase
    .from('atas_registro_preco')
    .insert({
      numero_ata: numAta,
      processo_sei: `SEI-310001/${randomSuffix}/2026`,
      codigo_siga_arp: `SIGA-ARP-${randomSuffix}`,
      papel_secretaria: 'GERENCIADOR',
      orgao_gerenciador: 'Secretaria de Estado da Mulher e de Políticas Inclusivas - SEMPI',
      objeto: 'Registro de Preços para aquisição de equipamentos de tecnologia e postos de trabalho.',
      data_publicacao_pncp: '2026-03-01',
      data_vigencia_inicio: '2026-03-01',
      data_vigencia_fim: '2027-03-01',
      prorrogavel: true,
      status: 'VIGENTE',
      created_by: user.id,
    })
    .select()
    .single();

  if (errAta || !ata) {
    console.error('❌ Erro ao criar Ata de Registro de Preços:', errAta?.message);
    process.exit(1);
  }
  console.log(`✅ Ata criada com sucesso! ID: ${ata.id} (Papel: ${ata.papel_secretaria})\n`);

  // 3. Cadastro de Item no Catálogo SIGA-RJ com Cota Reservada
  console.log('3️⃣ Registrando Item #1 no Catálogo SIGA:');
  console.log('   - Quantidade Total Registrada: 500 UN');
  console.log('   - Cota Reservada para SEMPI: 100 UN');
  console.log('   - Valor Unitário: R$ 5.000,00');

  const { data: item, error: errItem } = await supabase
    .from('atas_itens')
    .insert({
      ata_id: ata.id,
      item_numero: 1,
      codigo_item_siga: `SIGA-TI-${randomSuffix}`,
      descricao: 'Estação de trabalho móvel com processador de alta performance.',
      fornecedor_cnpj: '00360305000104',
      fornecedor_razao_social: 'Tecnologia Rio Equipamentos S.A.',
      unidade_medida: 'UN',
      valor_unitario: 5000.00,
      qtd_total_registrada: 500.00,
      qtd_cota_secretaria: 100.00,
    })
    .select()
    .single();

  if (errItem || !item) {
    console.error('❌ Erro ao cadastrar item na ata:', errItem?.message);
    process.exit(1);
  }

  console.log(`  ↳ Item Criado: Item #${item.item_numero} (${item.codigo_item_siga})`);
  console.log(`    Cota SEMPI: ${item.qtd_cota_secretaria} UN`);
  console.log(`    Qtd Empenhada Inicial: ${item.qtd_empenhada_secretaria} UN`);
  console.log(`    Saldo Disponível Inicial (Coluna Gerada): ${item.saldo_disponivel} UN`);
  if (Number(item.saldo_disponivel) === 100.00) {
    console.log('    ✅ Coluna gerada saldo_disponivel calculou 100.00 UN com exatidão!\n');
  } else {
    console.error('    ❌ Cálculo inicial do saldo disponível incorreto!');
    process.exit(1);
  }

  // 4. Criação de Contrato Decorrente da Ata e Notas de Empenho
  console.log('4️⃣ Criando Contrato Formal derivado da Ata e emitindo Notas de Empenho...');
  const { data: contrato, error: errContrato } = await supabase
    .from('contratos')
    .insert({
      ata_origem_id: ata.id,
      tipo_formalizacao: 'CONTRATO_FORMAL',
      numero_contrato: `CTR-ARP-${randomSuffix}/2026`,
      processo_sei: `SEI-310001/${randomSuffix}-CTR/2026`,
      chave_siga_contrato: `SIGA-CTR-${randomSuffix}`,
      contratada_cnpj: item.fornecedor_cnpj,
      contratada_razao_social: item.fornecedor_razao_social,
      objeto: 'Fornecimento de equipamentos derivados da Ata de Registro de Preços.',
      valor_inicial: 500000.00,
      valor_atualizado: 500000.00,
      data_publicacao_pncp: '2026-03-05',
      data_vigencia_inicio_original: '2026-03-05',
      data_vigencia_fim_original: '2027-03-05',
      data_vigencia_fim_atual: '2027-03-05',
      status: 'VIGENTE',
      created_by: user.id,
    })
    .select()
    .single();

  if (errContrato || !contrato) {
    console.error('❌ Erro ao criar contrato derivado da ata:', errContrato?.message);
    process.exit(1);
  }

  // NE 1 (para o 1º lote de 80 unidades)
  const { data: ne1, error: errNe1 } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: contrato.id,
      numero_nota_empenho: `2026NE${randomSuffix}A`,
      chave_siga: `SIGA-NE-${randomSuffix}-A`,
      processo_sei: contrato.processo_sei,
      tipo_empenho: 'ORDINARIO',
      data_emissao: '2026-03-10',
      data_referencia_vigencia: '2026-03-10',
      programa_trabalho: '14.122.0001.2001',
      natureza_despesa: '4.4.90.52.00',
      fonte_recurso: 'Fonte 100',
      valor_empenhado_inicial: 400000.00, // 80 un x R$ 5.000,00
      created_by: user.id,
    })
    .select()
    .single();

  if (errNe1 || !ne1) {
    console.error('❌ Erro ao emitir NE 1:', errNe1?.message);
    process.exit(1);
  }

  // NE 2 (para testes subsequentes)
  const { data: ne2, error: errNe2 } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: contrato.id,
      numero_nota_empenho: `2026NE${randomSuffix}B`,
      chave_siga: `SIGA-NE-${randomSuffix}-B`,
      processo_sei: contrato.processo_sei,
      tipo_empenho: 'ORDINARIO',
      data_emissao: '2026-03-15',
      data_referencia_vigencia: '2026-03-15',
      programa_trabalho: '14.122.0001.2001',
      natureza_despesa: '4.4.90.52.00',
      fonte_recurso: 'Fonte 100',
      valor_empenhado_inicial: 100000.00,
      created_by: user.id,
    })
    .select()
    .single();

  if (errNe2 || !ne2) {
    console.error('❌ Erro ao emitir NE 2:', errNe2?.message);
    process.exit(1);
  }
  console.log(`✅ Contrato e Notas de Empenho (${ne1.numero_nota_empenho} e ${ne2.numero_nota_empenho}) emitidas!\n`);

  // 5. TESTE 1: Abate de Cota Válido de 80 unidades
  console.log('5️⃣ TESTE 1: Registrando Abate Válido de 80 unidades pela NE 1...');
  const { data: consumo1, error: errConsumo1 } = await supabase
    .from('atas_consumo_empenhos')
    .insert({
      ata_item_id: item.id,
      empenho_id: ne1.id,
      quantidade_consumida: 80.00,
      created_by: user.id,
    })
    .select()
    .single();

  if (errConsumo1 || !consumo1) {
    console.error('❌ Erro no consumo válido de 80 unidades:', errConsumo1?.message);
    process.exit(1);
  }

  // Verifica se a trigger trg_sync_consumo_ata recalculou a tabela atas_itens
  const { data: itemAposConsumo1 } = await supabase
    .from('atas_itens')
    .select('*')
    .eq('id', item.id)
    .single();

  console.log(`  ↳ Item após 1º Abate:`);
  console.log(`    Qtd Empenhada: ${itemAposConsumo1.qtd_empenhada_secretaria} UN (Esperado: 80.00 UN)`);
  console.log(`    Saldo Disponível: ${itemAposConsumo1.saldo_disponivel} UN (Esperado: 20.00 UN)`);

  if (
    Number(itemAposConsumo1.qtd_empenhada_secretaria) === 80.00 &&
    Number(itemAposConsumo1.saldo_disponivel) === 20.00
  ) {
    console.log('    ✅ Trigger e Coluna Gerada funcionaram perfeitamente! Saldo restante: 20 UN.\n');
  } else {
    console.error('    ❌ Recálculo inconsistente após 1º consumo!');
    process.exit(1);
  }

  // 6. TESTE 2: Tentativa de Estouro de Cota (Tentativa de consumir 21 unidades quando só restam 20)
  console.log('6️⃣ TESTE 2: Tentativa de Estouro de Cota (21 unidades quando o saldo é 20)...');
  console.log('   (Deve ser BLOQUEADO pela constraint chk_empenho_nao_excede_cota)');

  const { data: consumoIlegal, error: errConsumoIlegal } = await supabase
    .from('atas_consumo_empenhos')
    .insert({
      ata_item_id: item.id,
      empenho_id: ne2.id,
      quantidade_consumida: 21.00,
      created_by: user.id,
    })
    .select()
    .single();

  if (errConsumoIlegal) {
    console.log(`  ✅ PostgreSQL BLOQUEOU com sucesso a tentativa de estouro de cota!`);
    console.log(`  Mensagem do Banco: "${errConsumoIlegal.message}"\n`);
  } else {
    console.error('  ❌ FALHA GRAVE: O banco permitiu que a SEMPI consumisse além da sua cota autorizada!');
    process.exit(1);
  }

  // 7. TESTE 3: Abate Válido de 15 unidades pela NE 2
  console.log('7️⃣ TESTE 3: Registrando Abate Válido de 15 unidades pela NE 2...');
  const { data: consumo2, error: errConsumo2 } = await supabase
    .from('atas_consumo_empenhos')
    .insert({
      ata_item_id: item.id,
      empenho_id: ne2.id,
      quantidade_consumida: 15.00,
      created_by: user.id,
    })
    .select()
    .single();

  if (errConsumo2 || !consumo2) {
    console.error('❌ Erro no consumo de 15 unidades:', errConsumo2?.message);
    process.exit(1);
  }

  const { data: itemFinal } = await supabase
    .from('atas_itens')
    .select('*')
    .eq('id', item.id)
    .single();

  console.log(`  ↳ Item após 2º Abate:`);
  console.log(`    Total Empenhado: ${itemFinal.qtd_empenhada_secretaria} UN (80 + 15 = 95.00 UN)`);
  console.log(`    Saldo Disponível Final: ${itemFinal.saldo_disponivel} UN (100 - 95 = 5.00 UN)`);

  if (
    Number(itemFinal.qtd_empenhada_secretaria) === 95.00 &&
    Number(itemFinal.saldo_disponivel) === 5.00
  ) {
    console.log('    ✅ Saldo final consolidado com total precisão: 5.00 UN restantes!\n');
  } else {
    console.error('    ❌ Recálculo inconsistente após 2º consumo!');
    process.exit(1);
  }

  // 8. TESTE 4: Verificação de Integridade das Relações (Ata ➔ Itens ➔ Consumos ➔ Empenhos ➔ Contrato)
  console.log('8️⃣ TESTE 4: Consulta Completa da Ata de Registro de Preços e seus Vínculos...');
  const { data: dossieAta, error: errDossie } = await supabase
    .from('atas_registro_preco')
    .select(`
      id,
      numero_ata,
      papel_secretaria,
      atas_itens (
        id,
        item_numero,
        saldo_disponivel,
        atas_consumo_empenhos (
          id,
          quantidade_consumida,
          empenho_id
        )
      ),
      contratos (
        id,
        numero_contrato
      )
    `)
    .eq('id', ata.id)
    .single();

  if (errDossie || !dossieAta) {
    console.error('❌ Erro ao consultar dossiê completo:', errDossie?.message);
    process.exit(1);
  }

  const itemConsultado = dossieAta.atas_itens[0];
  console.log(`  ↳ Ata: ${dossieAta.numero_ata}`);
  console.log(`  ↳ Contratos Originados: ${dossieAta.contratos.length}`);
  console.log(`  ↳ Itens Registrados: ${dossieAta.atas_itens.length}`);
  console.log(`  ↳ Baixas de Cota Registradas no Item: ${itemConsultado.atas_consumo_empenhos.length}`);

  if (
    dossieAta.contratos.length === 1 &&
    dossieAta.atas_itens.length === 1 &&
    itemConsultado.atas_consumo_empenhos.length === 2
  ) {
    console.log('  ✅ Todos os relacionamentos íntegros e auditáveis!\n');
  } else {
    console.error('  ❌ Estrutura relacional divergente do esperado!');
    process.exit(1);
  }

  console.log('================================================================');
  console.log('🎯 TODAS AS ASSERTIVAS DO MÓDULO 6 PASSARAM COM SUCESSO 100%!');
  console.log('   - Criação de Ata de Registro de Preços (Gerenciadora/Participante): OK');
  console.log('   - Cadastro de Itens SIGA com cotas e saldo gerado: OK');
  console.log('   - Vínculo com Contrato e Notas de Empenho: OK');
  console.log('   - Abate automático de saldo via trigger (trg_sync_consumo_ata): OK');
  console.log('   - Bloqueio de estouro de cota (chk_empenho_nao_excede_cota): OK');
  console.log('================================================================');
}

runSimulationAtas();
