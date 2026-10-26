'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth/get-user-profile';
import { ataRegistroPrecoSchema, ataItemSchema, consumoAtaSchema } from '@/lib/validators/ata.schema';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/lib/types/database.types';

type AtaInsert = Database['public']['Tables']['atas_registro_preco']['Insert'];
type AtaUpdate = Database['public']['Tables']['atas_registro_preco']['Update'];
type ItemInsert = Database['public']['Tables']['atas_itens']['Insert'];
type ItemUpdate = Database['public']['Tables']['atas_itens']['Update'];
type ConsumoInsert = Database['public']['Tables']['atas_consumo_empenhos']['Insert'];

export type AtaActionResponse = {
  success: boolean;
  message?: string;
  registroId?: string;
  errors?: Record<string, string[]>;
};

/**
 * 1. Cadastro de Ata de Registro de Preços (ARP)
 */
export async function createAtaAction(
  formData: FormData
): Promise<AtaActionResponse> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'GESTOR_CONTRATOS'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada. Apenas Administradores ou Gestores de Contratos podem registrar Atas de Registro de Preços.',
    };
  }

  const rawData = {
    numero_ata: formData.get('numero_ata'),
    processo_sei: formData.get('processo_sei'),
    codigo_siga_arp: formData.get('codigo_siga_arp') || null,
    papel_secretaria: formData.get('papel_secretaria'),
    orgao_gerenciador: formData.get('orgao_gerenciador') || 'Secretaria de Estado da Mulher e de Políticas Inclusivas - SEMPI',
    objeto: formData.get('objeto'),
    data_publicacao_pncp: formData.get('data_publicacao_pncp') || null,
    data_vigencia_inicio: formData.get('data_vigencia_inicio') || null,
    data_vigencia_fim: formData.get('data_vigencia_fim') || null,
    prorrogavel: formData.get('prorrogavel') === 'true',
    observacoes: formData.get('observacoes') || null,
    status: formData.get('status') || 'VIGENTE',
  };

  const validation = ataRegistroPrecoSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação dos campos da Ata de Registro de Preços.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;
  const isElaboracao = payload.status === 'EM_FORMALIZACAO';
  const hoje = new Date().toISOString().split('T')[0];

  const newAta: AtaInsert = {
    numero_ata: payload.numero_ata,
    processo_sei: payload.processo_sei,
    codigo_siga_arp: payload.codigo_siga_arp || null,
    papel_secretaria: payload.papel_secretaria,
    orgao_gerenciador: payload.orgao_gerenciador,
    objeto: payload.objeto,
    data_publicacao_pncp: payload.data_publicacao_pncp || hoje,
    data_vigencia_inicio: payload.data_vigencia_inicio || hoje,
    data_vigencia_fim: payload.data_vigencia_fim || hoje,
    prorrogavel: payload.prorrogavel,
    observacoes: payload.observacoes || null,
    status: payload.status,
    created_by: user.id,
  };

  const { data: rawDataAta, error: dbError } = await (
    supabase.from('atas_registro_preco') as unknown as {
      insert: (record: AtaInsert) => {
        select: (cols: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { code?: string; message: string } | null }>;
        };
      };
    }
  )
    .insert(newAta)
    .select('id')
    .single();

  if (dbError || !rawDataAta) {
    if (dbError && dbError.code === '23505') {
      return {
        success: false,
        message: 'Já existe uma Ata cadastrada com este número para este órgão gerenciador.',
      };
    }
    return {
      success: false,
      message: `Erro ao cadastrar Ata: ${dbError?.message || 'Falha na inserção'}`,
    };
  }

  revalidatePath('/atas');
  revalidatePath('/');

  return {
    success: true,
    message: isElaboracao
      ? 'Ata de Registro de Preços cadastrada em elaboração!'
      : 'Ata de Registro de Preços cadastrada com sucesso!',
    registroId: rawDataAta.id,
  };
}

/**
 * 2. Atualização / Edição de Ata de Registro de Preços Existente
 */
export async function updateAtaAction(
  ataId: string,
  formData: FormData
): Promise<AtaActionResponse> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'GESTOR_CONTRATOS'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada. Apenas Administradores ou Gestores podem editar Atas de Registro de Preços.',
    };
  }

  const rawData = {
    numero_ata: formData.get('numero_ata'),
    processo_sei: formData.get('processo_sei'),
    codigo_siga_arp: formData.get('codigo_siga_arp') || null,
    papel_secretaria: formData.get('papel_secretaria'),
    orgao_gerenciador: formData.get('orgao_gerenciador') || 'Secretaria de Estado da Mulher e de Políticas Inclusivas - SEMPI',
    objeto: formData.get('objeto'),
    data_publicacao_pncp: formData.get('data_publicacao_pncp') || null,
    data_vigencia_inicio: formData.get('data_vigencia_inicio') || null,
    data_vigencia_fim: formData.get('data_vigencia_fim') || null,
    prorrogavel: formData.get('prorrogavel') === 'true',
    observacoes: formData.get('observacoes') || null,
    status: formData.get('status') || 'VIGENTE',
  };

  const validation = ataRegistroPrecoSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação dos campos da Ata.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;
  const hoje = new Date().toISOString().split('T')[0];

  const updateRecord: AtaUpdate = {
    numero_ata: payload.numero_ata,
    processo_sei: payload.processo_sei,
    codigo_siga_arp: payload.codigo_siga_arp || null,
    papel_secretaria: payload.papel_secretaria,
    orgao_gerenciador: payload.orgao_gerenciador,
    objeto: payload.objeto,
    data_publicacao_pncp: payload.data_publicacao_pncp || hoje,
    data_vigencia_inicio: payload.data_vigencia_inicio || hoje,
    data_vigencia_fim: payload.data_vigencia_fim || hoje,
    prorrogavel: payload.prorrogavel,
    observacoes: payload.observacoes || null,
    status: payload.status,
    updated_at: new Date().toISOString(),
  };

  const { error: dbError } = await (
    supabase.from('atas_registro_preco') as unknown as {
      update: (record: AtaUpdate) => {
        eq: (col: string, val: string) => Promise<{ error: { code?: string; message: string } | null }>;
      };
    }
  )
    .update(updateRecord)
    .eq('id', ataId);

  if (dbError) {
    if (dbError.code === '23505') {
      return {
        success: false,
        message: 'Já existe outra Ata cadastrada com este número para este órgão gerenciador.',
      };
    }
    return {
      success: false,
      message: `Erro ao atualizar Ata: ${dbError.message}`,
    };
  }

  revalidatePath(`/atas/${ataId}`);
  revalidatePath('/atas');
  revalidatePath('/');

  return {
    success: true,
    message: 'Ata de Registro de Preços atualizada com sucesso!',
    registroId: ataId,
  };
}

/**
 * 3. Cadastro de Item na Ata de Registro de Preços (Catálogo SIGA)
 */
export async function createAtaItemAction(
  formData: FormData
): Promise<AtaActionResponse> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'GESTOR_CONTRATOS'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada. Apenas Administradores ou Gestores podem adicionar itens na Ata.',
    };
  }

  const rawData = {
    ata_id: formData.get('ata_id'),
    item_numero: formData.get('item_numero'),
    codigo_item_siga: formData.get('codigo_item_siga'),
    descricao: formData.get('descricao'),
    fornecedor_cnpj: formData.get('fornecedor_cnpj'),
    fornecedor_razao_social: formData.get('fornecedor_razao_social'),
    unidade_medida: formData.get('unidade_medida'),
    valor_unitario: formData.get('valor_unitario'),
    qtd_total_registrada: formData.get('qtd_total_registrada'),
    qtd_cota_secretaria: formData.get('qtd_cota_secretaria'),
  };

  const validation = ataItemSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação dos dados do item da Ata.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;

  const newItem: ItemInsert = {
    ata_id: payload.ata_id,
    item_numero: payload.item_numero,
    codigo_item_siga: payload.codigo_item_siga,
    descricao: payload.descricao,
    fornecedor_cnpj: payload.fornecedor_cnpj,
    fornecedor_razao_social: payload.fornecedor_razao_social,
    unidade_medida: payload.unidade_medida,
    valor_unitario: payload.valor_unitario,
    qtd_total_registrada: payload.qtd_total_registrada,
    qtd_cota_secretaria: payload.qtd_cota_secretaria,
  };

  const { data: rawDataItem, error: dbError } = await (
    supabase.from('atas_itens') as unknown as {
      insert: (record: ItemInsert) => {
        select: (cols: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { code?: string; message: string } | null }>;
        };
      };
    }
  )
    .insert(newItem)
    .select('id')
    .single();

  if (dbError || !rawDataItem) {
    if (dbError && dbError.code === '23505') {
      return {
        success: false,
        message: 'Já existe um item cadastrado com este número nesta Ata.',
      };
    }
    return {
      success: false,
      message: `Erro ao adicionar item: ${dbError?.message || 'Falha na inserção'}`,
    };
  }

  revalidatePath(`/atas/${payload.ata_id}`);
  revalidatePath('/atas');

  return {
    success: true,
    message: 'Item registrado no catálogo da Ata com cota e saldo gerado automaticamente!',
    registroId: rawDataItem.id,
  };
}

/**
 * 4. Edição de Item da Ata de Registro de Preços
 */
export async function updateAtaItemAction(
  itemId: string,
  ataId: string,
  formData: FormData
): Promise<AtaActionResponse> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'GESTOR_CONTRATOS'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada. Apenas Administradores ou Gestores podem editar itens da Ata.',
    };
  }

  const rawData = {
    ata_id: ataId,
    item_numero: formData.get('item_numero'),
    codigo_item_siga: formData.get('codigo_item_siga'),
    descricao: formData.get('descricao'),
    fornecedor_cnpj: formData.get('fornecedor_cnpj'),
    fornecedor_razao_social: formData.get('fornecedor_razao_social'),
    unidade_medida: formData.get('unidade_medida'),
    valor_unitario: formData.get('valor_unitario'),
    qtd_total_registrada: formData.get('qtd_total_registrada'),
    qtd_cota_secretaria: formData.get('qtd_cota_secretaria'),
  };

  const validation = ataItemSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação dos dados do item.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;

  const updateItem: ItemUpdate = {
    item_numero: payload.item_numero,
    codigo_item_siga: payload.codigo_item_siga,
    descricao: payload.descricao,
    fornecedor_cnpj: payload.fornecedor_cnpj,
    fornecedor_razao_social: payload.fornecedor_razao_social,
    unidade_medida: payload.unidade_medida,
    valor_unitario: payload.valor_unitario,
    qtd_total_registrada: payload.qtd_total_registrada,
    qtd_cota_secretaria: payload.qtd_cota_secretaria,
    updated_at: new Date().toISOString(),
  };

  const { error: dbError } = await (
    supabase.from('atas_itens') as unknown as {
      update: (record: ItemUpdate) => {
        eq: (col: string, val: string) => Promise<{ error: { code?: string; message: string } | null }>;
      };
    }
  )
    .update(updateItem)
    .eq('id', itemId);

  if (dbError) {
    if (dbError.code === '23514') {
      return {
        success: false,
        message: 'A cota da secretaria não pode ser inferior à quantidade já empenhada.',
      };
    }
    return {
      success: false,
      message: `Erro ao atualizar item: ${dbError.message}`,
    };
  }

  revalidatePath(`/atas/${ataId}`);
  revalidatePath('/atas');

  return {
    success: true,
    message: 'Item da Ata atualizado com sucesso!',
    registroId: itemId,
  };
}

/**
 * 5. Baixa / Abate de Cota por Nota de Empenho
 */
export async function registrarConsumoAtaAction(
  formData: FormData,
  ataId: string
): Promise<AtaActionResponse> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'GESTOR_CONTRATOS', 'FINANCEIRO'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada. Apenas Administradores, Gestores ou Financeiro podem registrar consumo de Atas.',
    };
  }

  const rawData = {
    ata_item_id: formData.get('ata_item_id'),
    empenho_id: formData.get('empenho_id'),
    quantidade_consumida: formData.get('quantidade_consumida'),
  };

  const validation = consumoAtaSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação do consumo da Ata.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;

  const newConsumo: ConsumoInsert = {
    ata_item_id: payload.ata_item_id,
    empenho_id: payload.empenho_id,
    quantidade_consumida: payload.quantidade_consumida,
    created_by: user.id,
  };

  const { data: rawDataConsumo, error: dbError } = await (
    supabase.from('atas_consumo_empenhos') as unknown as {
      insert: (record: ConsumoInsert) => {
        select: (cols: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { code?: string; message: string } | null }>;
        };
      };
    }
  )
    .insert(newConsumo)
    .select('id')
    .single();

  if (dbError || !rawDataConsumo) {
    if (dbError && dbError.code === '23514') {
      return {
        success: false,
        message: 'Operação bloqueada pela auditoria contábil: O consumo solicitado ultrapassa a cota autorizada para a SEMPI neste item (Estouro de Cota).',
      };
    }
    if (dbError && dbError.code === '23505') {
      return {
        success: false,
        message: 'Esta Nota de Empenho já possui consumo registrado para este mesmo item da Ata.',
      };
    }
    return {
      success: false,
      message: `Erro ao registrar consumo da cota: ${dbError?.message || 'Falha na inserção'}`,
    };
  }

  revalidatePath(`/atas/${ataId}`);
  revalidatePath('/atas');
  revalidatePath('/contratos');

  return {
    success: true,
    message: 'Cota abatida com sucesso! O saldo disponível do item foi recalculado pela trigger do banco.',
    registroId: rawDataConsumo.id,
  };
}
