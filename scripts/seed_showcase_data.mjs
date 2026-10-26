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

const supabase = createClient(supabaseUrl, anonKey);

console.log('🏛️ =========================================================================');
console.log('🏛️ SEMPI/RJ — CARGA DE DADOS DE ALTA FIDELIDADE PARA APRESENTAÇÃO EXECUTIVA');
console.log('🏛️ =========================================================================\n');

async function seed() {
  // 1. Autenticação com Administrador
  console.log('1️⃣ Autenticando com usuário administrador (admin@sempi.com)...');
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@sempi.com',
    password: 'Admin@Sempi2026!',
  });

  if (authErr || !auth.user) {
    console.error('❌ Falha na autenticação do admin:', authErr?.message);
    process.exit(1);
  }
  const adminId = auth.user.id;
  console.log('✅ Administrador autenticado! UID:', adminId);

  // 2. Limpeza prévia segura e atômica
  console.log('\n2️⃣ Limpando registros residuais anteriores...');
  await supabase.from('atas_consumo_empenhos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('financeiro_liquidacoes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('financeiro_empenhos_eventos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('financeiro_empenhos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('contrato_fiscais').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('alteracoes_contratuais').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('contratos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('atas_itens').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('atas_registro_preco').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('✅ Banco de dados limpo e preparado.');

  // -------------------------------------------------------------------------
  // 3. ATAS DE REGISTRO DE PREÇOS
  // -------------------------------------------------------------------------
  console.log('\n3️⃣ Cadastrando Atas de Registro de Preços e seus Itens...');

  // Ata 1: Kits de Acolhimento e Higiene (SEMPI Gerenciadora)
  const { data: ataKits, error: errAta1 } = await supabase
    .from('atas_registro_preco')
    .insert({
      numero_ata: '001/2025',
      processo_sei: 'SEI-310001/000210/2025',
      codigo_siga_arp: 'SIGA-RJ-ARP-2025-001',
      papel_secretaria: 'GERENCIADOR',
      orgao_gerenciador: 'Secretaria de Estado da Mulher e de Políticas Inclusivas - SEMPI',
      objeto: 'Registro de Preços para aquisição continuada de kits emergenciais de acolhimento, higiene e vestuário básico para mulheres e crianças abrigadas nos Centros Integrados de Atendimento à Mulher (CIAMs) e Casas de Passagem.',
      data_publicacao_pncp: '2025-02-18',
      data_vigencia_inicio: '2025-02-15',
      data_vigencia_fim: '2026-02-15',
      status: 'VIGENTE',
      created_by: adminId,
    })
    .select('id')
    .single();

  if (errAta1) throw new Error(`Falha Ata 1: ${errAta1.message}`);

  const { data: itemKitAdulto, error: errItem1 } = await supabase
    .from('atas_itens')
    .insert({
      ata_id: ataKits.id,
      item_numero: 1,
      codigo_item_siga: 'ITEM-SIGA-77401',
      descricao: 'Kit de Acolhimento Adulto Feminino (Itens de higiene íntima, sabonete bactericida, escova dental, toalha, muda de roupa de emergência e sandálias)',
      unidade_medida: 'UNIDADE',
      qtd_total_registrada: 5000,
      qtd_cota_secretaria: 3000,
      valor_unitario: 180.00,
      fornecedor_cnpj: '19.340.892/0001-15',
      fornecedor_razao_social: 'MED-CARE DISTRIBUIDORA DE PRODUTOS DE HIGIENE E CORRELATOS S.A.',
    })
    .select('id')
    .single();

  if (errItem1) throw new Error(`Falha Item 1: ${errItem1.message}`);

  const { data: itemKitInfantil, error: errItem2 } = await supabase
    .from('atas_itens')
    .insert({
      ata_id: ataKits.id,
      item_numero: 2,
      codigo_item_siga: 'ITEM-SIGA-77402',
      descricao: 'Kit Primeira Infância de Emergência (Fraldas descartáveis, pomada, lenços umedecidos, mamadeira higienizada, roupas de algodão)',
      unidade_medida: 'UNIDADE',
      qtd_total_registrada: 2500,
      qtd_cota_secretaria: 1500,
      valor_unitario: 220.00,
      fornecedor_cnpj: '19.340.892/0001-15',
      fornecedor_razao_social: 'MED-CARE DISTRIBUIDORA DE PRODUTOS DE HIGIENE E CORRELATOS S.A.',
    })
    .select('id')
    .single();

  if (errItem2) throw new Error(`Falha Item 2: ${errItem2.message}`);

  // Ata 2: Microinformática Corporativa (SEMPI Gerenciadora)
  const { data: ataTI, error: errAta2 } = await supabase
    .from('atas_registro_preco')
    .insert({
      numero_ata: '003/2025',
      processo_sei: 'SEI-310001/000412/2025',
      codigo_siga_arp: 'SIGA-RJ-ARP-2025-003',
      papel_secretaria: 'GERENCIADOR',
      orgao_gerenciador: 'Secretaria de Estado da Mulher e de Políticas Inclusivas - SEMPI',
      objeto: 'Registro de Preços para fornecimento de computadores portáteis corporativos e estações de atendimento humanizado com garantia on-site de 36 meses.',
      data_publicacao_pncp: '2025-04-03',
      data_vigencia_inicio: '2025-04-01',
      data_vigencia_fim: '2026-04-01',
      status: 'VIGENTE',
      created_by: adminId,
    })
    .select('id')
    .single();

  if (errAta2) throw new Error(`Falha Ata 2: ${errAta2.message}`);

  await supabase.from('atas_itens').insert([
    {
      ata_id: ataTI.id,
      item_numero: 1,
      codigo_item_siga: 'ITEM-SIGA-88120',
      descricao: 'Notebook Corporativo 14" Intel Core i7 32GB RAM SSD 512GB NVMe com leitor biométrico e maleta antichoque',
      unidade_medida: 'UNIDADE',
      qtd_total_registrada: 150,
      qtd_cota_secretaria: 80,
      valor_unitario: 5800.00,
      fornecedor_cnpj: '00.776.574/0001-56',
      fornecedor_razao_social: 'DELL COMPUTADORES DO BRASIL LTDA',
    },
    {
      ata_id: ataTI.id,
      item_numero: 2,
      codigo_item_siga: 'ITEM-SIGA-88125',
      descricao: 'Monitor Profissional 24" IPS Full HD regulável em altura com suporte VESA e hub USB integrado',
      unidade_medida: 'UNIDADE',
      qtd_total_registrada: 200,
      qtd_cota_secretaria: 100,
      valor_unitario: 980.00,
      fornecedor_cnpj: '00.776.574/0001-56',
      fornecedor_razao_social: 'DELL COMPUTADORES DO BRASIL LTDA',
    },
  ]);

  // Ata 3: Nuvem Governamental (SEMPI Participante - SEPLAG Gerenciadora)
  const { data: ataNuvem, error: errAta3 } = await supabase
    .from('atas_registro_preco')
    .insert({
      numero_ata: '010/2025',
      processo_sei: 'SEI-120001/001850/2024',
      codigo_siga_arp: 'SIGA-RJ-ARP-2024-055',
      papel_secretaria: 'PARTICIPANTE',
      orgao_gerenciador: 'Secretaria de Estado de Planejamento e Gestão - SEPLAG/RJ',
      objeto: 'Contratação corporativa estadual de serviços gerenciados de computação em nuvem, banco de dados e licenciamento corporativo para a Administração Direta.',
      data_publicacao_pncp: '2025-01-12',
      data_vigencia_inicio: '2025-01-10',
      data_vigencia_fim: '2026-01-10',
      status: 'VIGENTE',
      created_by: adminId,
    })
    .select('id')
    .single();

  if (errAta3) throw new Error(`Falha Ata 3: ${errAta3.message}`);

  await supabase.from('atas_itens').insert({
    ata_id: ataNuvem.id,
    item_numero: 1,
    codigo_item_siga: 'ITEM-SIGA-99001',
    descricao: 'Unidade de Serviço em Nuvem Governamental (USN) com suporte técnico premium 24x7',
    unidade_medida: 'USN',
    qtd_total_registrada: 500000,
    qtd_cota_secretaria: 50000,
    valor_unitario: 15.00,
    fornecedor_cnpj: '03.220.912/0001-44',
    fornecedor_razao_social: 'CLOUD-BRASIL HOSPEDAGEM E DADOS GOVERNAMENTAIS S.A.',
  });

  console.log('✅ 3 Atas de Registro de Preços e 5 Itens homologados.');

  // -------------------------------------------------------------------------
  // 4. CONTRATOS ADMINISTRATIVOS DA SEMPI/RJ
  // -------------------------------------------------------------------------
  console.log('\n4️⃣ Cadastrando Contratos Administrativos e Dossiês Oficiais...');

  // CTR 1: Vigilância Patrimonial CIAMs (Contínuo)
  const { data: ctr1 } = await supabase
    .from('contratos')
    .insert({
      numero_contrato: '001/2025',
      tipo_formalizacao: 'CONTRATO_FORMAL',
      tipo_contrato: 'CONTINUO',
      tipo_licitacao: 'PREGAO_ELETRONICO',
      emergencial: false,
      processo_sei: 'SEI-310001/000150/2025',
      chave_siga_contrato: 'SIGA-RJ-2025-CTR-00001',
      contratada_cnpj: '04.281.932/0001-45',
      contratada_razao_social: 'RIO SEGURANÇA E VIGILÂNCIA PATRIMONIAL LTDA',
      objeto: 'Prestação de serviços contínuos de vigilância armada e desarmada para as sedes dos Centros Integrados de Atendimento à Mulher (CIAM Baixada Fluminense, CIAM Capital e CIAM São Gonçalo) e Casas de Passagem da SEMPI.',
      valor_inicial: 1200000.00,
      valor_atualizado: 1200000.00,
      data_publicacao_pncp: '2025-01-02',
      data_vigencia_inicio_original: '2025-01-01',
      data_vigencia_fim_original: '2026-01-01',
      data_vigencia_fim_atual: '2026-01-01',
      status: 'VIGENTE',
      created_by: adminId,
    })
    .select('id')
    .single();

  // CTR 2: Apoio Multidisciplinar Psicossocial (Contínuo)
  const { data: ctr2 } = await supabase
    .from('contratos')
    .insert({
      numero_contrato: '004/2025',
      tipo_formalizacao: 'CONTRATO_FORMAL',
      tipo_contrato: 'CONTINUO',
      tipo_licitacao: 'PREGAO_ELETRONICO',
      emergencial: false,
      processo_sei: 'SEI-310001/000380/2025',
      chave_siga_contrato: 'SIGA-RJ-2025-CTR-00004',
      contratada_cnpj: '18.420.519/0001-88',
      contratada_razao_social: 'CIAM ASSISTÊNCIA E SERVIÇOS PSICOSSOCIAIS S.A.',
      objeto: 'Prestação de serviços operacionais e apoio técnico especializado com psicólogas, assistentes sociais e advogadas para atendimento a mulheres em situação de violência doméstica e de gênero.',
      valor_inicial: 840000.00,
      valor_atualizado: 840000.00,
      data_publicacao_pncp: '2025-02-01',
      data_vigencia_inicio_original: '2025-02-01',
      data_vigencia_fim_original: '2026-02-01',
      data_vigencia_fim_atual: '2026-02-01',
      status: 'VIGENTE',
      created_by: adminId,
    })
    .select('id')
    .single();

  // CTR 3: Limpeza e Conservação Predial (Contínuo com Apostilamento IPCA)
  const { data: ctr3 } = await supabase
    .from('contratos')
    .insert({
      numero_contrato: '012/2025',
      tipo_formalizacao: 'CONTRATO_FORMAL',
      tipo_contrato: 'CONTINUO',
      tipo_licitacao: 'PREGAO_ELETRONICO',
      emergencial: false,
      processo_sei: 'SEI-310001/000620/2025',
      chave_siga_contrato: 'SIGA-RJ-2025-CTR-00012',
      contratada_cnpj: '09.112.344/0001-20',
      contratada_razao_social: 'LIMP-RIO CONSERVAÇÃO E HIGIENIZAÇÃO PREDIAL EIRELI',
      objeto: 'Serviços contínuos de limpeza, asseio, conservação predial e desinfecção ambiental com fornecimento de mão de obra e insumos nas dependências da SEMPI-RJ.',
      valor_inicial: 560000.00,
      valor_atualizado: 560000.00,
      data_publicacao_pncp: '2025-03-01',
      data_vigencia_inicio_original: '2025-03-01',
      data_vigencia_fim_original: '2026-03-01',
      data_vigencia_fim_atual: '2026-03-01',
      status: 'VIGENTE',
      created_by: adminId,
    })
    .select('id')
    .single();

  // CTR 4: Enlaces Central 190 / Disque Mulher (Contínuo - Caso do Usuário: Base 250k -> 1º TA Prazo = 500k)
  const { data: ctr4 } = await supabase
    .from('contratos')
    .insert({
      numero_contrato: '015/2025',
      tipo_formalizacao: 'CONTRATO_FORMAL',
      tipo_contrato: 'CONTINUO',
      tipo_licitacao: 'PREGAO_ELETRONICO',
      emergencial: false,
      processo_sei: 'SEI-310001/000780/2025',
      chave_siga_contrato: 'SIGA-RJ-2025-CTR-00015',
      contratada_cnpj: '27.481.902/0001-33',
      contratada_razao_social: 'ALPHA TELECOM E CONECTIVIDADE GOVERNAMENTAL S.A.',
      objeto: 'Serviços de conectividade de dados de alta disponibilidade, links dedicados de fibra óptica redundantes e telefonia SIP para o Centro de Atendimento à Mulher.',
      valor_inicial: 250000.00,
      valor_atualizado: 250000.00,
      data_publicacao_pncp: '2025-04-01',
      data_vigencia_inicio_original: '2025-04-01',
      data_vigencia_fim_original: '2026-04-01',
      data_vigencia_fim_atual: '2026-04-01',
      status: 'VIGENTE',
      created_by: adminId,
    })
    .select('id')
    .single();

  // CTR 5: Logística e Abastecimento de Abrigamento (Contínuo - Caso do Usuário: Base 350k -> 1º TA Misto 45k = 745k)
  const { data: ctr5 } = await supabase
    .from('contratos')
    .insert({
      numero_contrato: '017/2025',
      tipo_formalizacao: 'CONTRATO_FORMAL',
      tipo_contrato: 'CONTINUO',
      tipo_licitacao: 'PREGAO_ELETRONICO',
      emergencial: false,
      processo_sei: 'SEI-310001/000890/2025',
      chave_siga_contrato: 'SIGA-RJ-2025-CTR-00017',
      contratada_cnpj: '31.905.112/0001-66',
      contratada_razao_social: 'BETA SUPORTE OPERACIONAL E LOGÍSTICA DE ABRIGAMENTO LTDA',
      objeto: 'Serviços de operação logística, gestão de estoque avançado e transporte dedicado de mantimentos para os abrigos de proteção a mulheres da SEMPI.',
      valor_inicial: 350000.00,
      valor_atualizado: 350000.00,
      data_publicacao_pncp: '2025-05-01',
      data_vigencia_inicio_original: '2025-05-01',
      data_vigencia_fim_original: '2026-05-01',
      data_vigencia_fim_atual: '2026-05-01',
      status: 'VIGENTE',
      created_by: adminId,
    })
    .select('id')
    .single();

  // CTR 6: Veículos Descaracterizados / Patrulha Maria da Penha (Contínuo)
  const { data: ctr6 } = await supabase
    .from('contratos')
    .insert({
      numero_contrato: '021/2026',
      tipo_formalizacao: 'CONTRATO_FORMAL',
      tipo_contrato: 'CONTINUO',
      tipo_licitacao: 'PREGAO_ELETRONICO',
      emergencial: false,
      processo_sei: 'SEI-310001/000095/2026',
      chave_siga_contrato: 'SIGA-RJ-2026-CTR-00021',
      contratada_cnpj: '22.845.671/0001-03',
      contratada_razao_social: 'FROTA-RIO LOCAÇÃO DE VEÍCULOS E TRANSPORTE INTEGRADO LTDA',
      objeto: 'Locação de 12 veículos de passeio descaracterizados com seguro integral e rastreamento para remoção de mulheres sob medidas protetivas e patrulhamento de suporte.',
      valor_inicial: 432000.00,
      valor_atualizado: 432000.00,
      data_publicacao_pncp: '2026-01-15',
      data_vigencia_inicio_original: '2026-01-15',
      data_vigencia_fim_original: '2027-01-15',
      data_vigencia_fim_atual: '2027-01-15',
      status: 'VIGENTE',
      created_by: adminId,
    })
    .select('id')
    .single();

  // CTR 7: Campanha Institucional "Agosto Lilás" (Escopo com Aditivo de Valor)
  const { data: ctr7 } = await supabase
    .from('contratos')
    .insert({
      numero_contrato: '025/2026',
      tipo_formalizacao: 'CONTRATO_FORMAL',
      tipo_contrato: 'ESCOPO',
      tipo_licitacao: 'CONCORRENCIA',
      emergencial: false,
      processo_sei: 'SEI-310001/000280/2026',
      chave_siga_contrato: 'SIGA-RJ-2026-CTR-00025',
      contratada_cnpj: '14.730.982/0001-50',
      contratada_razao_social: 'EDITORA E PRODUTORA DE EVENTOS AGOSTO LILÁS LTDA',
      objeto: 'Criação, diagramação, impressão de cartilhas educativas e organização da Caravana Estadual de Conscientização Agosto Lilás 2026.',
      valor_inicial: 320000.00,
      valor_atualizado: 320000.00,
      data_publicacao_pncp: '2026-02-01',
      data_vigencia_inicio_original: '2026-02-01',
      data_vigencia_fim_original: '2026-08-31',
      data_vigencia_fim_atual: '2026-08-31',
      status: 'VIGENTE',
      created_by: adminId,
    })
    .select('id')
    .single();

  // CTR 8: Reforma e Acessibilidade do CIAM Baixada (Escopo com Supressão)
  const { data: ctr8 } = await supabase
    .from('contratos')
    .insert({
      numero_contrato: '028/2026',
      tipo_formalizacao: 'CONTRATO_FORMAL',
      tipo_contrato: 'ESCOPO',
      tipo_licitacao: 'CONCORRENCIA',
      emergencial: false,
      processo_sei: 'SEI-310001/000350/2026',
      chave_siga_contrato: 'SIGA-RJ-2026-CTR-00028',
      contratada_cnpj: '05.992.143/0001-77',
      contratada_razao_social: 'ENGE-RIO CONSTRUÇÃO E REFORMAS DE CENTROS DE ACOLHIMENTO LTDA',
      objeto: 'Execução de obras civis para modernização, acessibilidade, criação de brinquedoteca e adaptação de dormitórios no CIAM Baixada Fluminense.',
      valor_inicial: 680000.00,
      valor_atualizado: 680000.00,
      data_publicacao_pncp: '2026-03-01',
      data_vigencia_inicio_original: '2026-03-01',
      data_vigencia_fim_original: '2026-11-30',
      data_vigencia_fim_atual: '2026-11-30',
      status: 'VIGENTE',
      created_by: adminId,
    })
    .select('id')
    .single();

  // CTR 9: Refeições Prontas Emergenciais (Art. 95 - Força de Contrato por Empenho)
  const { data: ctr9 } = await supabase
    .from('contratos')
    .insert({
      numero_contrato: null, // Proibido número formal no Art. 95
      tipo_formalizacao: 'NOTA_EMPENHO_FORCA_CONTRATO',
      tipo_contrato: 'ESCOPO',
      tipo_licitacao: 'DISPENSA_LICITACAO',
      emergencial: true,
      processo_sei: 'SEI-310001/000490/2026',
      chave_siga_contrato: 'SIGA-RJ-2026-EMP-00049',
      contratada_cnpj: '08.314.920/0001-11',
      contratada_razao_social: 'NUTRI-RIO REFEIÇÕES COLETIVAS E ALIMENTAÇÃO HOSPITALAR LTDA',
      objeto: 'Fornecimento emergencial de refeições preparadas e balanceadas para mulheres e dependentes acolhidos em caráter de urgência extrema.',
      valor_inicial: 88000.00,
      valor_atualizado: 88000.00,
      data_publicacao_pncp: '2026-02-15',
      data_vigencia_inicio_original: '2026-02-15',
      data_vigencia_fim_original: '2026-06-15',
      data_vigencia_fim_atual: '2026-06-15',
      status: 'VIGENTE',
      created_by: adminId,
    })
    .select('id')
    .single();

  // CTR 10: Aquisição de Kits de Acolhimento via ARP 001/2025
  const { data: ctr10 } = await supabase
    .from('contratos')
    .insert({
      numero_contrato: '033/2026',
      tipo_formalizacao: 'CONTRATO_FORMAL',
      tipo_contrato: 'ESCOPO',
      tipo_licitacao: 'PREGAO_ELETRONICO',
      emergencial: false,
      ata_origem_id: ataKits.id,
      processo_sei: 'SEI-310001/000550/2026',
      chave_siga_contrato: 'SIGA-RJ-2026-CTR-00033',
      contratada_cnpj: '19.340.892/0001-15',
      contratada_razao_social: 'MED-CARE DISTRIBUIDORA DE PRODUTOS DE HIGIENE E CORRELATOS S.A.',
      objeto: 'Fornecimento de 1.200 kits adulto feminino e 600 kits infantil decorrentes da Ata de Registro de Preços nº 001/2025 da SEMPI/RJ.',
      valor_inicial: 348000.00, // 1200*180 + 600*220
      valor_atualizado: 348000.00,
      data_publicacao_pncp: '2026-03-01',
      data_vigencia_inicio_original: '2026-03-01',
      data_vigencia_fim_original: '2026-09-01',
      data_vigencia_fim_atual: '2026-09-01',
      status: 'VIGENTE',
      created_by: adminId,
    })
    .select('id')
    .single();

  // CTR 11: Contrato Crítico Vencendo em < 30 dias (Para disparar alerta no Dashboard)
  const dataHoje = new Date();
  const dataFimCritica = new Date(dataHoje.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: ctr11 } = await supabase
    .from('contratos')
    .insert({
      numero_contrato: '035/2025',
      tipo_formalizacao: 'CONTRATO_FORMAL',
      tipo_contrato: 'CONTINUO',
      tipo_licitacao: 'PREGAO_ELETRONICO',
      emergencial: false,
      processo_sei: 'SEI-310001/000115/2025',
      chave_siga_contrato: 'SIGA-RJ-2025-CTR-00035',
      contratada_cnpj: '07.192.483/0001-22',
      contratada_razao_social: 'SEG-TEC MONITORAMENTO ELETRÔNICO E ALARMES LTDA',
      objeto: 'Manutenção preventiva e corretiva dos sistemas de CFTV, alarmes perimetrais e botões de pânico dos centros de atendimento à mulher da SEMPI.',
      valor_inicial: 180000.00,
      valor_atualizado: 180000.00,
      data_publicacao_pncp: '2025-11-01',
      data_vigencia_inicio_original: '2025-11-01',
      data_vigencia_fim_original: dataFimCritica,
      data_vigencia_fim_atual: dataFimCritica,
      status: 'VIGENTE',
      created_by: adminId,
    })
    .select('id')
    .single();

  // CTR 12: Contrato em Atenção Vencendo em 45 dias (Safra 31-60 dias)
  const dataFimAtencao = new Date(dataHoje.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: ctr12 } = await supabase
    .from('contratos')
    .insert({
      numero_contrato: '038/2026',
      tipo_formalizacao: 'CONTRATO_FORMAL',
      tipo_contrato: 'CONTINUO',
      tipo_licitacao: 'PREGAO_ELETRONICO',
      emergencial: false,
      processo_sei: 'SEI-310001/000410/2026',
      chave_siga_contrato: 'SIGA-RJ-2026-CTR-00038',
      contratada_cnpj: '02.481.092/0001-89',
      contratada_razao_social: 'SOFT-RIO TECNOLOGIA E SUPORTE DE SISTEMAS LTDA',
      objeto: 'Suporte técnico aos sistemas legados e prontuário digital das abrigadas nos CIAMs.',
      valor_inicial: 240000.00,
      valor_atualizado: 240000.00,
      data_publicacao_pncp: '2025-12-10',
      data_vigencia_inicio_original: '2025-12-10',
      data_vigencia_fim_original: dataFimAtencao,
      data_vigencia_fim_atual: dataFimAtencao,
      status: 'VIGENTE',
      created_by: adminId,
    })
    .select('id')
    .single();

  console.log('✅ 12 Contratos Administrativos inseridos com total integridade.');

  // -------------------------------------------------------------------------
  // 5. TERMOS ADITIVOS E APOSTILAMENTOS
  // -------------------------------------------------------------------------
  console.log('\n5️⃣ Inserindo Termos Aditivos e Apostilamentos com disparo de Triggers...');

  // CTR 1 Aditivo 1 (Prazo: + 1.200.000,00)
  const { data: adCtr1 } = await supabase
    .from('alteracoes_contratuais')
    .insert({
      contrato_id: ctr1.id,
      procedimento: '1º Termo Aditivo',
      processo_sei: 'SEI-310001/000150/2025-AD1',
      chave_siga_termo: 'SIGA-RJ-2025-CTR-00001-AD1',
      tipo: 'ADITIVO_PRAZO',
      justificativa_resumo: 'Prorrogação de vigência contratual por 12 (doze) meses adicionais nos moldes do Art. 106 e 107 da Lei Federal nº 14.133/2021.',
      valor_diferenca: 1200000.00,
      data_assinatura: '2025-12-10',
      vigencia_termo_inicio: '2026-01-02',
      vigencia_termo_fim: '2027-01-01',
      publicacao_doerj_data: '2025-12-15',
      publicacao_doerj_pagina: 'DOERJ p. 12',
      created_by: adminId,
    })
    .select('id')
    .single();

  // CTR 2 Aditivo 1 (Misto: + 935.000,00 [840k base + 95k acréscimo])
  const { data: adCtr2 } = await supabase
    .from('alteracoes_contratuais')
    .insert({
      contrato_id: ctr2.id,
      procedimento: '1º Termo Aditivo Misto',
      processo_sei: 'SEI-310001/000380/2025-AD1',
      chave_siga_termo: 'SIGA-RJ-2025-CTR-00004-AD1',
      tipo: 'ADITIVO_MISTO',
      justificativa_resumo: 'Prorrogação de vigência por 12 meses somada à ampliação de 2 equipes psicossociais volantes (acréscimo qualitativo de 11.31%).',
      valor_diferenca: 935000.00,
      data_assinatura: '2026-01-15',
      vigencia_termo_inicio: '2026-02-02',
      vigencia_termo_fim: '2027-02-01',
      publicacao_doerj_data: '2026-01-20',
      publicacao_doerj_pagina: 'DOERJ p. 18',
      created_by: adminId,
    })
    .select('id')
    .single();

  // CTR 3 Apostilamento 1 (Reajuste IPCA + 27.160,00)
  await supabase
    .from('alteracoes_contratuais')
    .insert({
      contrato_id: ctr3.id,
      procedimento: '1º Apostilamento',
      processo_sei: 'SEI-310001/000620/2025-AP1',
      tipo: 'APOSTILAMENTO',
      justificativa_resumo: 'Reajuste ordinário anual de preços com base na variação acumulada do IPCA/IBGE (4,85%).',
      valor_diferenca: 27160.00,
      data_assinatura: '2025-09-01',
      publicacao_doerj_data: '2025-09-05',
      publicacao_doerj_pagina: 'DOERJ p. 09',
      created_by: adminId,
    });

  // CTR 4 Aditivo 1 (Prazo: + 250.000,00 -> Global 500k)
  const { data: adCtr4 } = await supabase
    .from('alteracoes_contratuais')
    .insert({
      contrato_id: ctr4.id,
      procedimento: '1º Termo Aditivo',
      processo_sei: 'SEI-310001/000780/2025-AD1',
      chave_siga_termo: 'SIGA-RJ-2025-CTR-00015-AD1',
      tipo: 'ADITIVO_PRAZO',
      justificativa_resumo: 'Renovação do ciclo de vigência dos links de fibra óptica por mais 12 meses nos termos do Art. 106 da Lei 14.133/21.',
      valor_diferenca: 250000.00,
      data_assinatura: '2026-03-10',
      vigencia_termo_inicio: '2026-04-02',
      vigencia_termo_fim: '2027-04-01',
      publicacao_doerj_data: '2026-03-15',
      publicacao_doerj_pagina: 'DOERJ p. 22',
      created_by: adminId,
    })
    .select('id')
    .single();

  // CTR 5 Aditivo 1 (Misto: + 395.000,00 -> Global 745k)
  const { data: adCtr5 } = await supabase
    .from('alteracoes_contratuais')
    .insert({
      contrato_id: ctr5.id,
      procedimento: '1º Termo Aditivo Misto',
      processo_sei: 'SEI-310001/000890/2025-AD1',
      chave_siga_termo: 'SIGA-RJ-2025-CTR-00017-AD1',
      tipo: 'ADITIVO_MISTO',
      justificativa_resumo: 'Prorrogação contratual por 12 meses e inclusão de rota de abastecimento para novo abrigo regional da Baixada (+ R$ 45.000,00).',
      valor_diferenca: 395000.00,
      data_assinatura: '2026-04-12',
      vigencia_termo_inicio: '2026-05-02',
      vigencia_termo_fim: '2027-05-01',
      publicacao_doerj_data: '2026-04-18',
      publicacao_doerj_pagina: 'DOERJ p. 14',
      created_by: adminId,
    })
    .select('id')
    .single();

  // CTR 7 Aditivo 1 (Valor: + 48.000,00)
  await supabase
    .from('alteracoes_contratuais')
    .insert({
      contrato_id: ctr7.id,
      procedimento: '1º Termo Aditivo de Valor',
      processo_sei: 'SEI-310001/000280/2026-AD1',
      tipo: 'ADITIVO_VALOR',
      justificativa_resumo: 'Acréscimo de 15% no escopo de impressões para inclusão de mais 5 municípios no circuito de palestras.',
      valor_diferenca: 48000.00,
      data_assinatura: '2026-04-02',
      publicacao_doerj_data: '2026-04-05',
      created_by: adminId,
    });

  // CTR 8 Aditivo 1 (Supressão: - 54.400,00)
  await supabase
    .from('alteracoes_contratuais')
    .insert({
      contrato_id: ctr8.id,
      procedimento: '1º Termo de Supressão',
      processo_sei: 'SEI-310001/000350/2026-AD1',
      tipo: 'ADITIVO_VALOR',
      justificativa_resumo: 'Supressão consensual de 8% de serviços em razão de aproveitamento de revestimentos originais do imóvel.',
      valor_diferenca: -54400.00,
      data_assinatura: '2026-05-10',
      publicacao_doerj_data: '2026-05-15',
      created_by: adminId,
    });

  console.log('✅ Alterações Contratuais inseridas e integradas com as Triggers de recálculo.');

  // -------------------------------------------------------------------------
  // 6. COMISSÃO DE FISCALIZAÇÃO E GESTÃO DE CONTRATOS
  // -------------------------------------------------------------------------
  console.log('\n6️⃣ Designando Comissões de Fiscalização com Portarias DOERJ...');

  const fiscaisParaInserir = [
    // CTR 1 (Vigilância)
    {
      contrato_id: ctr1.id,
      nome: 'Dr. Roberto Guimarães Coutinho',
      id_funcional: '4389102-1',
      funcao: 'GESTOR',
      portaria_designacao: 'Portaria SEMPI nº 012/2025',
      data_publicacao_doerj: '2025-01-05',
      data_inicio: '2025-01-01',
      ativo: true,
      created_by: adminId,
    },
    {
      contrato_id: ctr1.id,
      nome: 'Dra. Camila Vasconcelos Ribeiro',
      id_funcional: '5098231-4',
      funcao: 'FISCAL_TECNICO',
      portaria_designacao: 'Portaria SEMPI nº 013/2025',
      data_publicacao_doerj: '2025-01-05',
      data_inicio: '2025-01-01',
      ativo: true,
      created_by: adminId,
    },
    {
      contrato_id: ctr1.id,
      nome: 'Sr. Luiz Felipe Nogueira',
      id_funcional: '4410293-8',
      funcao: 'FISCAL_ADMINISTRATIVO',
      portaria_designacao: 'Portaria SEMPI nº 014/2025',
      data_publicacao_doerj: '2025-01-05',
      data_inicio: '2025-01-01',
      ativo: true,
      created_by: adminId,
    },

    // CTR 2 (Apoio Psicossocial)
    {
      contrato_id: ctr2.id,
      nome: 'Dra. Danielle Monsores de Oliveira',
      id_funcional: '4291880-3',
      funcao: 'GESTOR',
      portaria_designacao: 'Portaria SEMPI nº 025/2025',
      data_publicacao_doerj: '2025-02-05',
      data_inicio: '2025-02-01',
      ativo: true,
      created_by: adminId,
    },
    {
      contrato_id: ctr2.id,
      nome: 'Dra. Juliana Prado de Mendonça',
      id_funcional: '5120394-0',
      funcao: 'FISCAL_TECNICO',
      portaria_designacao: 'Portaria SEMPI nº 026/2025',
      data_publicacao_doerj: '2025-02-05',
      data_inicio: '2025-02-01',
      ativo: true,
      created_by: adminId,
    },

    // CTR 3 (Limpeza) - Com Fiscal Ativo e Fiscal Histórico
    {
      contrato_id: ctr3.id,
      nome: 'Sr. Fernando Albuquerque Leite',
      id_funcional: '4398112-9',
      funcao: 'GESTOR',
      portaria_designacao: 'Portaria SEMPI nº 050/2025',
      data_publicacao_doerj: '2025-03-05',
      data_inicio: '2025-03-01',
      ativo: true,
      created_by: adminId,
    },
    {
      contrato_id: ctr3.id,
      nome: 'Sra. Beatriz Helena Fontes',
      id_funcional: '5087321-7',
      funcao: 'FISCAL_TECNICO',
      portaria_designacao: 'Portaria SEMPI nº 051/2025',
      data_publicacao_doerj: '2025-09-01',
      data_inicio: '2025-09-01',
      ativo: true,
      created_by: adminId,
    },
    {
      contrato_id: ctr3.id,
      nome: 'Sr. Marcos Túlio Sampaio',
      id_funcional: '4401923-0',
      funcao: 'FISCAL_TECNICO',
      portaria_designacao: 'Portaria SEMPI nº 038/2025',
      data_publicacao_doerj: '2025-03-05',
      data_inicio: '2025-03-01',
      data_fim: '2025-08-31',
      data_substituicao: '2025-08-31',
      ativo: false, // Histórico para demonstrar o drawer de retificação/histórico
      created_by: adminId,
    },

    // CTR 4 (Telecom)
    {
      contrato_id: ctr4.id,
      nome: 'Eng. Marcelo Dantas de Arruda',
      id_funcional: '4421098-2',
      funcao: 'GESTOR',
      portaria_designacao: 'Portaria SEMPI nº 070/2025',
      data_publicacao_doerj: '2025-04-05',
      data_inicio: '2025-04-01',
      ativo: true,
      created_by: adminId,
    },
    {
      contrato_id: ctr4.id,
      nome: 'Tec. Vanessa Carvalho Ramos',
      id_funcional: '5134902-6',
      funcao: 'FISCAL_TECNICO',
      portaria_designacao: 'Portaria SEMPI nº 071/2025',
      data_publicacao_doerj: '2025-04-05',
      data_inicio: '2025-04-01',
      ativo: true,
      created_by: adminId,
    },

    // CTR 5 (Logística de Abrigamento)
    {
      contrato_id: ctr5.id,
      nome: 'Dra. Patrícia Helena Silveira',
      id_funcional: '4390012-4',
      funcao: 'GESTOR',
      portaria_designacao: 'Portaria SEMPI nº 085/2025',
      data_publicacao_doerj: '2025-05-05',
      data_inicio: '2025-05-01',
      ativo: true,
      created_by: adminId,
    },
    {
      contrato_id: ctr5.id,
      nome: 'Dr. Thiago Barcellos Neves',
      id_funcional: '5102938-1',
      funcao: 'FISCAL_TECNICO',
      portaria_designacao: 'Portaria SEMPI nº 086/2025',
      data_publicacao_doerj: '2025-05-05',
      data_inicio: '2025-05-01',
      ativo: true,
      created_by: adminId,
    },

    // CTR 6 (Veículos)
    {
      contrato_id: ctr6.id,
      nome: 'Ten. Cel. Maurício Paes de Carvalho',
      id_funcional: '4378901-2',
      funcao: 'GESTOR',
      portaria_designacao: 'Portaria SEMPI nº 008/2026',
      data_publicacao_doerj: '2026-01-18',
      data_inicio: '2026-01-15',
      ativo: true,
      created_by: adminId,
    },
    {
      contrato_id: ctr6.id,
      nome: 'Sgt. Cláudia Esteves Toledo',
      id_funcional: '5078120-9',
      funcao: 'FISCAL_TECNICO',
      portaria_designacao: 'Portaria SEMPI nº 009/2026',
      data_publicacao_doerj: '2026-01-18',
      data_inicio: '2026-01-15',
      ativo: true,
      created_by: adminId,
    },

    // CTR 7 (Agosto Lilás)
    {
      contrato_id: ctr7.id,
      nome: 'Dra. Mariana Costa e Silva',
      id_funcional: '4439011-5',
      funcao: 'GESTOR',
      portaria_designacao: 'Portaria SEMPI nº 019/2026',
      data_publicacao_doerj: '2026-02-05',
      data_inicio: '2026-02-01',
      ativo: true,
      created_by: adminId,
    },
    {
      contrato_id: ctr7.id,
      nome: 'Sra. Luciana Borges Duarte',
      id_funcional: '5140921-3',
      funcao: 'FISCAL_TECNICO',
      portaria_designacao: 'Portaria SEMPI nº 020/2026',
      data_publicacao_doerj: '2026-02-05',
      data_inicio: '2026-02-01',
      ativo: true,
      created_by: adminId,
    },

    // CTR 8 (Reforma CIAM)
    {
      contrato_id: ctr8.id,
      nome: 'Dr. Carlos Alberto Fagundes',
      id_funcional: '4381092-7',
      funcao: 'GESTOR',
      portaria_designacao: 'Portaria SEMPI nº 031/2026',
      data_publicacao_doerj: '2026-03-05',
      data_inicio: '2026-03-01',
      ativo: true,
      created_by: adminId,
    },
    {
      contrato_id: ctr8.id,
      nome: 'Eng. Alexandre Meireles Sampaio',
      id_funcional: '5099234-8',
      funcao: 'FISCAL_TECNICO',
      portaria_designacao: 'Portaria SEMPI nº 032/2026',
      data_publicacao_doerj: '2026-03-05',
      data_inicio: '2026-03-01',
      ativo: true,
      created_by: adminId,
    },

    // CTR 9 (Art. 95 Refeições)
    {
      contrato_id: ctr9.id,
      nome: 'Dra. Juliana Prado de Mendonça',
      id_funcional: '5120394-0',
      funcao: 'GESTOR',
      portaria_designacao: 'Portaria SEMPI nº 027/2026',
      data_publicacao_doerj: '2026-02-18',
      data_inicio: '2026-02-15',
      ativo: true,
      created_by: adminId,
    },
    {
      contrato_id: ctr9.id,
      nome: 'Nutr. Larissa Guimarães Peixoto',
      id_funcional: '5110821-4',
      funcao: 'FISCAL_TECNICO',
      portaria_designacao: 'Portaria SEMPI nº 028/2026',
      data_publicacao_doerj: '2026-02-18',
      data_inicio: '2026-02-15',
      ativo: true,
      created_by: adminId,
    },

    // CTR 10 (Kits ARP)
    {
      contrato_id: ctr10.id,
      nome: 'Dra. Danielle Monsores de Oliveira',
      id_funcional: '4291880-3',
      funcao: 'GESTOR',
      portaria_designacao: 'Portaria SEMPI nº 040/2026',
      data_publicacao_doerj: '2026-03-05',
      data_inicio: '2026-03-01',
      ativo: true,
      created_by: adminId,
    },
    {
      contrato_id: ctr10.id,
      nome: 'Sr. Luiz Felipe Nogueira',
      id_funcional: '4410293-8',
      funcao: 'FISCAL_TECNICO',
      portaria_designacao: 'Portaria SEMPI nº 041/2026',
      data_publicacao_doerj: '2026-03-05',
      data_inicio: '2026-03-01',
      ativo: true,
      created_by: adminId,
    },

    // CTR 11 (Crítico)
    {
      contrato_id: ctr11.id,
      nome: 'Eng. Marcelo Dantas de Arruda',
      id_funcional: '4421098-2',
      funcao: 'GESTOR',
      portaria_designacao: 'Portaria SEMPI nº 098/2025',
      data_publicacao_doerj: '2025-11-05',
      data_inicio: '2025-11-01',
      ativo: true,
      created_by: adminId,
    },
    {
      contrato_id: ctr11.id,
      nome: 'Tec. Vanessa Carvalho Ramos',
      id_funcional: '5134902-6',
      funcao: 'FISCAL_TECNICO',
      portaria_designacao: 'Portaria SEMPI nº 099/2025',
      data_publicacao_doerj: '2025-11-05',
      data_inicio: '2025-11-01',
      ativo: true,
      created_by: adminId,
    },

    // CTR 12 (Atenção)
    {
      contrato_id: ctr12.id,
      nome: 'Dr. Roberto Guimarães Coutinho',
      id_funcional: '4389102-1',
      funcao: 'GESTOR',
      portaria_designacao: 'Portaria SEMPI nº 115/2025',
      data_publicacao_doerj: '2025-12-15',
      data_inicio: '2025-12-10',
      ativo: true,
      created_by: adminId,
    },
    {
      contrato_id: ctr12.id,
      nome: 'Sra. Beatriz Helena Fontes',
      id_funcional: '5087321-7',
      funcao: 'FISCAL_TECNICO',
      portaria_designacao: 'Portaria SEMPI nº 116/2025',
      data_publicacao_doerj: '2025-12-15',
      data_inicio: '2025-12-10',
      ativo: true,
      created_by: adminId,
    },
  ];

  const { error: errFisc } = await supabase.from('contrato_fiscais').insert(fiscaisParaInserir);
  if (errFisc) throw new Error(`Falha Fiscais: ${errFisc.message}`);
  console.log(`✅ ${fiscaisParaInserir.length} Fiscais e Gestores designados com sucesso.`);

  // -------------------------------------------------------------------------
  // 7. NOTAS DE EMPENHO (SIAFE-Rio)
  // -------------------------------------------------------------------------
  console.log('\n7️⃣ Emitindo Notas de Empenho (SIAFE-Rio)...');

  // Empenhos do CTR 1 (Vigilância)
  const { data: ne1A } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: ctr1.id,
      processo_sei: 'SEI-310001/000150/2025',
      chave_siga: 'SIGA-RJ-2025-CTR-00001',
      numero_nota_empenho: '2025NE00015',
      tipo_empenho: 'ESTIMATIVO',
      data_emissao: '2025-01-10',
      data_referencia_vigencia: '2025-01-10', // Cairá no Contrato Inicial
      programa_trabalho: '14.422.0125.2100',
      natureza_despesa: '3.3.90.37.01',
      fonte_recurso: '100',
      valor_empenhado_inicial: 1200000.00,
      created_by: adminId,
    })
    .select('id')
    .single();

  const { data: ne1B } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: ctr1.id,
      alteracao_id: adCtr1.id,
      processo_sei: 'SEI-310001/000150/2025-AD1',
      chave_siga: 'SIGA-RJ-2025-CTR-00001-AD1',
      numero_nota_empenho: '2026NE00008',
      tipo_empenho: 'ESTIMATIVO',
      data_emissao: '2026-01-05',
      data_referencia_vigencia: '2026-01-05', // Cairá no 1º Termo Aditivo
      programa_trabalho: '14.422.0125.2100',
      natureza_despesa: '3.3.90.37.01',
      fonte_recurso: '100',
      valor_empenhado_inicial: 1200000.00,
      created_by: adminId,
    })
    .select('id')
    .single();

  // Empenhos do CTR 2 (Apoio Psicossocial)
  const { data: ne2A } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: ctr2.id,
      processo_sei: 'SEI-310001/000380/2025',
      chave_siga: 'SIGA-RJ-2025-CTR-00004',
      numero_nota_empenho: '2025NE00042',
      tipo_empenho: 'GLOBAL',
      data_emissao: '2025-02-05',
      data_referencia_vigencia: '2025-02-05',
      programa_trabalho: '14.422.0125.2105',
      natureza_despesa: '3.3.90.39.05',
      fonte_recurso: '100',
      valor_empenhado_inicial: 840000.00,
      created_by: adminId,
    })
    .select('id')
    .single();

  const { data: ne2B } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: ctr2.id,
      alteracao_id: adCtr2.id,
      processo_sei: 'SEI-310001/000380/2025-AD1',
      chave_siga: 'SIGA-RJ-2025-CTR-00004-AD1',
      numero_nota_empenho: '2026NE00033',
      tipo_empenho: 'GLOBAL',
      data_emissao: '2026-02-05',
      data_referencia_vigencia: '2026-02-05',
      programa_trabalho: '14.422.0125.2105',
      natureza_despesa: '3.3.90.39.05',
      fonte_recurso: '100',
      valor_empenhado_inicial: 935000.00,
      created_by: adminId,
    })
    .select('id')
    .single();

  // Empenho CTR 3 (Limpeza)
  const { data: ne3A } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: ctr3.id,
      processo_sei: 'SEI-310001/000620/2025',
      chave_siga: 'SIGA-RJ-2025-CTR-00012',
      numero_nota_empenho: '2025NE00078',
      tipo_empenho: 'ESTIMATIVO',
      data_emissao: '2025-03-05',
      data_referencia_vigencia: '2025-03-05',
      programa_trabalho: '14.422.0125.2100',
      natureza_despesa: '3.3.90.37.02',
      fonte_recurso: '100',
      valor_empenhado_inicial: 560000.00,
      created_by: adminId,
    })
    .select('id')
    .single();

  // Empenhos CTR 4 (Telecom: 250k inicial + 250k aditivo)
  const { data: ne4A } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: ctr4.id,
      processo_sei: 'SEI-310001/000780/2025',
      chave_siga: 'SIGA-RJ-2025-CTR-00015',
      numero_nota_empenho: '2025NE00115',
      tipo_empenho: 'GLOBAL',
      data_emissao: '2025-04-05',
      data_referencia_vigencia: '2025-04-05',
      programa_trabalho: '14.126.0125.2110',
      natureza_despesa: '3.3.90.39.08',
      fonte_recurso: '100',
      valor_empenhado_inicial: 250000.00,
      created_by: adminId,
    })
    .select('id')
    .single();

  const { data: ne4B } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: ctr4.id,
      alteracao_id: adCtr4.id,
      processo_sei: 'SEI-310001/000780/2025-AD1',
      chave_siga: 'SIGA-RJ-2025-CTR-00015-AD1',
      numero_nota_empenho: '2026NE00048',
      tipo_empenho: 'GLOBAL',
      data_emissao: '2026-04-05',
      data_referencia_vigencia: '2026-04-05',
      programa_trabalho: '14.126.0125.2110',
      natureza_despesa: '3.3.90.39.08',
      fonte_recurso: '100',
      valor_empenhado_inicial: 250000.00,
      created_by: adminId,
    })
    .select('id')
    .single();

  // Empenhos CTR 5 (Logística)
  const { data: ne5A } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: ctr5.id,
      processo_sei: 'SEI-310001/000890/2025',
      chave_siga: 'SIGA-RJ-2025-CTR-00017',
      numero_nota_empenho: '2025NE00140',
      tipo_empenho: 'ESTIMATIVO',
      data_emissao: '2025-05-05',
      data_referencia_vigencia: '2025-05-05',
      programa_trabalho: '14.422.0125.2105',
      natureza_despesa: '3.3.90.39.12',
      fonte_recurso: '100',
      valor_empenhado_inicial: 350000.00,
      created_by: adminId,
    })
    .select('id')
    .single();

  const { data: ne5B } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: ctr5.id,
      alteracao_id: adCtr5.id,
      processo_sei: 'SEI-310001/000890/2025-AD1',
      chave_siga: 'SIGA-RJ-2025-CTR-00017-AD1',
      numero_nota_empenho: '2026NE00062',
      tipo_empenho: 'ESTIMATIVO',
      data_emissao: '2026-05-05',
      data_referencia_vigencia: '2026-05-05',
      programa_trabalho: '14.422.0125.2105',
      natureza_despesa: '3.3.90.39.12',
      fonte_recurso: '100',
      valor_empenhado_inicial: 395000.00,
      created_by: adminId,
    })
    .select('id')
    .single();

  // Empenho CTR 6 (Veículos)
  const { data: ne6A } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: ctr6.id,
      processo_sei: 'SEI-310001/000095/2026',
      chave_siga: 'SIGA-RJ-2026-CTR-00021',
      numero_nota_empenho: '2026NE00018',
      tipo_empenho: 'GLOBAL',
      data_emissao: '2026-01-20',
      data_referencia_vigencia: '2026-01-20',
      programa_trabalho: '14.422.0125.2100',
      natureza_despesa: '3.3.90.39.20',
      fonte_recurso: '100',
      valor_empenhado_inicial: 432000.00,
      created_by: adminId,
    })
    .select('id')
    .single();

  // Empenho CTR 7 (Agosto Lilás)
  const { data: ne7A } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: ctr7.id,
      processo_sei: 'SEI-310001/000280/2026',
      chave_siga: 'SIGA-RJ-2026-CTR-00025',
      numero_nota_empenho: '2026NE00029',
      tipo_empenho: 'ORDINARIO',
      data_emissao: '2026-02-10',
      data_referencia_vigencia: '2026-02-10',
      programa_trabalho: '14.422.0125.2120',
      natureza_despesa: '3.3.90.39.30',
      fonte_recurso: '100',
      valor_empenhado_inicial: 320000.00,
      created_by: adminId,
    })
    .select('id')
    .single();

  // Empenho CTR 8 (Reforma CIAM)
  const { data: ne8A } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: ctr8.id,
      processo_sei: 'SEI-310001/000350/2026',
      chave_siga: 'SIGA-RJ-2026-CTR-00028',
      numero_nota_empenho: '2026NE00052',
      tipo_empenho: 'ORDINARIO',
      data_emissao: '2026-03-05',
      data_referencia_vigencia: '2026-03-05',
      programa_trabalho: '14.422.0125.1050',
      natureza_despesa: '4.4.90.51.01',
      fonte_recurso: '100',
      valor_empenhado_inicial: 680000.00,
      created_by: adminId,
    })
    .select('id')
    .single();

  // Empenho CTR 9 (Art. 95 Refeições)
  const { data: ne9A } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: ctr9.id,
      processo_sei: 'SEI-310001/000490/2026',
      chave_siga: 'SIGA-RJ-2026-EMP-00049',
      numero_nota_empenho: '2026NE00067',
      tipo_empenho: 'ORDINARIO',
      data_emissao: '2026-02-20',
      data_referencia_vigencia: '2026-02-20',
      programa_trabalho: '14.422.0125.2105',
      natureza_despesa: '3.3.90.30.01',
      fonte_recurso: '100',
      valor_empenhado_inicial: 88000.00,
      created_by: adminId,
    })
    .select('id')
    .single();

  // Empenho CTR 10 (Kits de Acolhimento via Ata)
  const { data: ne10A } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: ctr10.id,
      processo_sei: 'SEI-310001/000550/2026',
      chave_siga: 'SIGA-RJ-2026-CTR-00033',
      numero_nota_empenho: '2026NE00095',
      tipo_empenho: 'ORDINARIO',
      data_emissao: '2026-03-10',
      data_referencia_vigencia: '2026-03-10',
      programa_trabalho: '14.422.0125.2105',
      natureza_despesa: '3.3.90.32.01',
      fonte_recurso: '100',
      valor_empenhado_inicial: 348000.00,
      created_by: adminId,
    })
    .select('id')
    .single();

  // Empenho CTR 11 (Crítico)
  const { data: ne11A } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: ctr11.id,
      processo_sei: 'SEI-310001/000115/2025',
      chave_siga: 'SIGA-RJ-2025-CTR-00035',
      numero_nota_empenho: '2025NE00205',
      tipo_empenho: 'GLOBAL',
      data_emissao: '2025-11-05',
      data_referencia_vigencia: '2025-11-05',
      programa_trabalho: '14.422.0125.2100',
      natureza_despesa: '3.3.90.39.15',
      fonte_recurso: '100',
      valor_empenhado_inicial: 180000.00,
      created_by: adminId,
    })
    .select('id')
    .single();

  // Empenho CTR 12 (Atenção)
  const { data: ne12A } = await supabase
    .from('financeiro_empenhos')
    .insert({
      contrato_id: ctr12.id,
      processo_sei: 'SEI-310001/000410/2026',
      chave_siga: 'SIGA-RJ-2026-CTR-00038',
      numero_nota_empenho: '2026NE00010',
      tipo_empenho: 'GLOBAL',
      data_emissao: '2025-12-15',
      data_referencia_vigencia: '2025-12-15',
      programa_trabalho: '14.126.0125.2110',
      natureza_despesa: '3.3.90.39.08',
      fonte_recurso: '100',
      valor_empenhado_inicial: 240000.00,
      created_by: adminId,
    })
    .select('id')
    .single();

  console.log('✅ 16 Notas de Empenho emitidas com sucesso.');

  // -------------------------------------------------------------------------
  // 8. EVENTOS DE EMPENHO (REFORÇOS E ANULAÇÕES)
  // -------------------------------------------------------------------------
  console.log('\n8️⃣ Lançando Eventos Contábeis (Reforços e Anulações)...');

  // Reforço em 2025NE00015 (Vigilância)
  await supabase.from('financeiro_empenhos_eventos').insert({
    empenho_original_id: ne1A.id,
    processo_sei: 'SEI-310001/000150/2025',
    chave_siga: 'SIGA-RJ-2025-CTR-00001',
    tipo_evento: 'REFORCO',
    numero_ne_evento: '2025NE00210',
    data_evento: '2025-06-15',
    valor_evento: 60000.00,
    motivo: 'Reforço orçamentário para cobertura de escala operacional extraordinária no CIAM Baixada.',
    created_by: adminId,
  });

  // Anulação Parcial em 2026NE00052 (Reforma CIAM por supressão de escopo)
  await supabase.from('financeiro_empenhos_eventos').insert({
    empenho_original_id: ne8A.id,
    processo_sei: 'SEI-310001/000350/2026',
    chave_siga: 'SIGA-RJ-2026-CTR-00028',
    tipo_evento: 'ANULACAO_PARCIAL',
    numero_ne_evento: '2026NE00052-AN1',
    data_evento: '2026-05-12',
    valor_evento: 54400.00,
    motivo: 'Anulação parcial do empenho em decorrência do 1º Termo Aditivo de Supressão de 8%.',
    created_by: adminId,
  });

  console.log('✅ Eventos de Reforço e Anulação registrados e consolidados.');

  // -------------------------------------------------------------------------
  // 9. LIQUIDAÇÕES E NOTAS FISCAIS PAGAS (SIAFE-Rio / NL / OB)
  // -------------------------------------------------------------------------
  console.log('\n9️⃣ Registrando Notas Fiscais e Liquidações Contábeis...');

  const liquidacoesParaInserir = [
    // CTR 1 (Vigilância 2025)
    {
      empenho_id: ne1A.id,
      processo_sei: 'SEI-310001/000150/2025',
      numero_nota_fiscal: 'NF-10482',
      data_emissao_nota_fiscal: '2025-02-05',
      competencia_mes_ano: '01/2025',
      numero_nota_liquidacao: '2025NL00018',
      data_emissao_nl: '2025-02-10',
      valor_liquidado: 105000.00,
      data_pagamento_ob: '2025-02-15',
      created_by: adminId,
    },
    {
      empenho_id: ne1A.id,
      processo_sei: 'SEI-310001/000150/2025',
      numero_nota_fiscal: 'NF-10599',
      data_emissao_nota_fiscal: '2025-03-05',
      competencia_mes_ano: '02/2025',
      numero_nota_liquidacao: '2025NL00052',
      data_emissao_nl: '2025-03-10',
      valor_liquidado: 105000.00,
      data_pagamento_ob: '2025-03-18',
      created_by: adminId,
    },
    {
      empenho_id: ne1A.id,
      processo_sei: 'SEI-310001/000150/2025',
      numero_nota_fiscal: 'NF-10720',
      data_emissao_nota_fiscal: '2025-04-05',
      competencia_mes_ano: '03/2025',
      numero_nota_liquidacao: '2025NL00095',
      data_emissao_nl: '2025-04-10',
      valor_liquidado: 105000.00,
      data_pagamento_ob: '2025-04-16',
      created_by: adminId,
    },

    // CTR 1 (Vigilância 2026 - Novo Aditivo)
    {
      empenho_id: ne1B.id,
      processo_sei: 'SEI-310001/000150/2025-AD1',
      numero_nota_fiscal: 'NF-11802',
      data_emissao_nota_fiscal: '2026-02-05',
      competencia_mes_ano: '01/2026',
      numero_nota_liquidacao: '2026NL00012',
      data_emissao_nl: '2026-02-10',
      valor_liquidado: 100000.00,
      data_pagamento_ob: '2026-02-15',
      created_by: adminId,
    },
    {
      empenho_id: ne1B.id,
      processo_sei: 'SEI-310001/000150/2025-AD1',
      numero_nota_fiscal: 'NF-11940',
      data_emissao_nota_fiscal: '2026-03-05',
      competencia_mes_ano: '02/2026',
      numero_nota_liquidacao: '2026NL00048',
      data_emissao_nl: '2026-03-10',
      valor_liquidado: 100000.00,
      data_pagamento_ob: '2026-03-16',
      created_by: adminId,
    },

    // CTR 2 (Apoio Psicossocial)
    {
      empenho_id: ne2A.id,
      processo_sei: 'SEI-310001/000380/2025',
      numero_nota_fiscal: 'NF-4401',
      data_emissao_nota_fiscal: '2025-03-05',
      competencia_mes_ano: '02/2025',
      numero_nota_liquidacao: '2025NL00062',
      data_emissao_nl: '2025-03-10',
      valor_liquidado: 70000.00,
      data_pagamento_ob: '2025-03-15',
      created_by: adminId,
    },
    {
      empenho_id: ne2B.id,
      processo_sei: 'SEI-310001/000380/2025-AD1',
      numero_nota_fiscal: 'NF-4950',
      data_emissao_nota_fiscal: '2026-03-05',
      competencia_mes_ano: '02/2026',
      numero_nota_liquidacao: '2026NL00055',
      data_emissao_nl: '2026-03-10',
      valor_liquidado: 77916.66,
      data_pagamento_ob: '2026-03-15',
      created_by: adminId,
    },

    // CTR 3 (Limpeza)
    {
      empenho_id: ne3A.id,
      processo_sei: 'SEI-310001/000620/2025',
      numero_nota_fiscal: 'NF-8201',
      data_emissao_nota_fiscal: '2025-04-05',
      competencia_mes_ano: '03/2025',
      numero_nota_liquidacao: '2025NL00088',
      data_emissao_nl: '2025-04-10',
      valor_liquidado: 48930.00,
      data_pagamento_ob: '2025-04-15',
      created_by: adminId,
    },

    // CTR 4 (Telecom 190)
    {
      empenho_id: ne4A.id,
      processo_sei: 'SEI-310001/000780/2025',
      numero_nota_fiscal: 'NF-9921',
      data_emissao_nota_fiscal: '2025-05-05',
      competencia_mes_ano: '04/2025',
      numero_nota_liquidacao: '2025NL00120',
      data_emissao_nl: '2025-05-10',
      valor_liquidado: 20833.33,
      data_pagamento_ob: '2025-05-15',
      created_by: adminId,
    },

    // CTR 5 (Logística de Abrigamento)
    {
      empenho_id: ne5A.id,
      processo_sei: 'SEI-310001/000890/2025',
      numero_nota_fiscal: 'NF-3105',
      data_emissao_nota_fiscal: '2025-06-05',
      competencia_mes_ano: '05/2025',
      numero_nota_liquidacao: '2025NL00142',
      data_emissao_nl: '2025-06-10',
      valor_liquidado: 29166.66,
      data_pagamento_ob: '2025-06-15',
      created_by: adminId,
    },

    // CTR 6 (Veículos Descaracterizados)
    {
      empenho_id: ne6A.id,
      processo_sei: 'SEI-310001/000095/2026',
      numero_nota_fiscal: 'NF-7012',
      data_emissao_nota_fiscal: '2026-02-15',
      competencia_mes_ano: '01/2026',
      numero_nota_liquidacao: '2026NL00028',
      data_emissao_nl: '2026-02-20',
      valor_liquidado: 36000.00,
      data_pagamento_ob: '2026-02-28',
      created_by: adminId,
    },

    // CTR 9 (Art. 95 Refeições)
    {
      empenho_id: ne9A.id,
      processo_sei: 'SEI-310001/000490/2026',
      numero_nota_fiscal: 'NF-1520',
      data_emissao_nota_fiscal: '2026-03-15',
      competencia_mes_ano: '02/2026',
      numero_nota_liquidacao: '2026NL00060',
      data_emissao_nl: '2026-03-20',
      valor_liquidado: 44000.00,
      data_pagamento_ob: '2026-03-25',
      created_by: adminId,
    },

    // CTR 10 (Kits de Acolhimento via Ata)
    {
      empenho_id: ne10A.id,
      processo_sei: 'SEI-310001/000550/2026',
      numero_nota_fiscal: 'NF-9022',
      data_emissao_nota_fiscal: '2026-04-05',
      competencia_mes_ano: '03/2026',
      numero_nota_liquidacao: '2026NL00078',
      data_emissao_nl: '2026-04-10',
      valor_liquidado: 174000.00, // 50% entregue e atestado
      data_pagamento_ob: '2026-04-15',
      created_by: adminId,
    },

    // CTR 11 (Crítico)
    {
      empenho_id: ne11A.id,
      processo_sei: 'SEI-310001/000115/2025',
      numero_nota_fiscal: 'NF-6050',
      data_emissao_nota_fiscal: '2025-12-05',
      competencia_mes_ano: '11/2025',
      numero_nota_liquidacao: '2025NL00230',
      data_emissao_nl: '2025-12-10',
      valor_liquidado: 15000.00,
      data_pagamento_ob: '2025-12-15',
      created_by: adminId,
    },
  ];

  const { error: errLiq } = await supabase.from('financeiro_liquidacoes').insert(liquidacoesParaInserir);
  if (errLiq) throw new Error(`Falha Liquidações: ${errLiq.message}`);
  console.log(`✅ ${liquidacoesParaInserir.length} Notas Fiscais liquidadas e ordens bancárias registradas.`);

  // -------------------------------------------------------------------------
  // 10. CONSUMO DE ITENS DE ATA DE REGISTRO DE PREÇOS
  // -------------------------------------------------------------------------
  console.log('\n🔟 Registrando Baixa Automática de Cota em Atas de Registro de Preços...');

  await supabase.from('atas_consumo_empenhos').insert([
    {
      ata_item_id: itemKitAdulto.id,
      empenho_id: ne10A.id,
      quantidade_consumida: 1200, // Consumindo 1200 dos 3000 disponíveis da cota SEMPI
      created_by: adminId,
    },
    {
      ata_item_id: itemKitInfantil.id,
      empenho_id: ne10A.id,
      quantidade_consumida: 600, // Consumindo 600 dos 1500 disponíveis da cota SEMPI
      created_by: adminId,
    },
  ]);
  console.log('✅ Consumo de Ata registrado com sucesso.');

  console.log('\n🏛️ =========================================================================');
  console.log('🏛️ CARGA EXECUTIVA CONCLUÍDA COM 100% DE SUCESSO! 🎯');
  console.log('🏛️ O sistema SGC-SEMPI/RJ está pronto para demonstração de alto nível.');
  console.log('🏛️ =========================================================================\n');
}

seed().catch((err) => {
  console.error('❌ Erro inesperado na carga executiva:', err);
  process.exit(1);
});
