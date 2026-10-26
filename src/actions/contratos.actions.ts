'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth/get-user-profile';
import { contratoSchema } from '@/lib/validators/contrato.schema';
import { revalidatePath } from 'next/cache';
import type { Database, StatusInstrumento } from '@/lib/types/database.types';

type ContratoInsert = Database['public']['Tables']['contratos']['Insert'];
type ContratoUpdate = Database['public']['Tables']['contratos']['Update'];

export type ContratoActionResponse = {
  success: boolean;
  message?: string;
  contratoId?: string;
  errors?: Record<string, string[]>;
};

/**
 * 1. Cadastro de Novo Contrato ou Nota de Empenho Substitutiva (Art. 95)
 */
export async function createContratoAction(
  formData: FormData
): Promise<ContratoActionResponse> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return {
      success: false,
      message: 'Não autenticado.',
    };
  }

  if (!profile || !['ADMIN', 'GESTOR_CONTRATOS'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada. Apenas Administradores ou Gestores de Contratos podem cadastrar instrumentos.',
    };
  }

  const rawData = {
    tipo_formalizacao: formData.get('tipo_formalizacao'),
    tipo_contrato: formData.get('tipo_contrato') || 'CONTINUO',
    tipo_licitacao: formData.get('tipo_licitacao') || 'PREGAO_ELETRONICO',
    emergencial:
      formData.get('emergencial') === 'true' ||
      formData.get('emergencial') === 'on' ||
      formData.get('emergencial') === 'SIM' ||
      formData.get('emergencial') === 'sim' ||
      formData.get('emergencial') === '1',
    numero_contrato: formData.get('numero_contrato') || null,
    processo_sei: formData.get('processo_sei'),
    chave_siga_contrato: formData.get('chave_siga_contrato') || null,
    contratada_cnpj: formData.get('contratada_cnpj') || null,
    contratada_razao_social: formData.get('contratada_razao_social') || null,
    objeto: formData.get('objeto'),
    valor_inicial: formData.get('valor_inicial') || 0,
    data_publicacao_pncp: formData.get('data_publicacao_pncp') || null,
    data_vigencia_inicio_original: formData.get('data_vigencia_inicio_original') || null,
    data_vigencia_fim_original: formData.get('data_vigencia_fim_original') || null,
    ata_origem_id: formData.get('ata_origem_id') || null,
    observacoes: formData.get('observacoes') || null,
    status: formData.get('status') || 'VIGENTE',
  };

  const validation = contratoSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação dos campos obrigatórios.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;
  const isElaboracao = payload.status === 'EM_FORMALIZACAO';
  const hoje = new Date().toISOString().split('T')[0];

  const newRecord: ContratoInsert = {
    tipo_formalizacao: payload.tipo_formalizacao,
    tipo_contrato: payload.tipo_contrato,
    tipo_licitacao: payload.tipo_licitacao,
    emergencial: payload.emergencial,
    numero_contrato:
      payload.numero_contrato ||
      (isElaboracao && payload.tipo_formalizacao === 'CONTRATO_FORMAL' ? 'EM_ELABORACAO' : null),
    processo_sei: payload.processo_sei,
    chave_siga_contrato:
      payload.chave_siga_contrato ||
      (isElaboracao ? `SIGA-DRAFT-${Math.floor(Math.random() * 900000 + 100000)}` : ''),
    contratada_cnpj:
      payload.contratada_cnpj || (isElaboracao ? '00000000000000' : ''),
    contratada_razao_social:
      payload.contratada_razao_social ||
      (isElaboracao ? 'EM ELABORAÇÃO / FASE DE COTAÇÃO' : ''),
    objeto: payload.objeto,
    valor_inicial: payload.valor_inicial,
    valor_atualizado: payload.valor_inicial,
    data_publicacao_pncp: payload.data_publicacao_pncp || hoje,
    data_vigencia_inicio_original: payload.data_vigencia_inicio_original || hoje,
    data_vigencia_fim_original: payload.data_vigencia_fim_original || hoje,
    data_vigencia_fim_atual: payload.data_vigencia_fim_original || hoje,
    ata_origem_id: payload.ata_origem_id || null,
    observacoes: payload.observacoes || null,
    status: payload.status,
    created_by: user.id,
  };

  let { data: rawNovoContrato, error: dbError } = await (
    supabase.from('contratos') as unknown as {
      insert: (record: ContratoInsert) => {
        select: (cols: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { code?: string; message: string } | null }>;
        };
      };
    }
  )
    .insert(newRecord)
    .select('id')
    .single();

  // Caso as novas colunas ainda não tenham sido migradas no Supabase SQL Editor
  if (
    dbError &&
    (dbError.message.includes('tipo_contrato') ||
      dbError.message.includes('tipo_licitacao') ||
      dbError.message.includes('emergencial'))
  ) {
    const { tipo_contrato, tipo_licitacao, emergencial, ...fallbackRecord } = newRecord;
    const retry = await (
      supabase.from('contratos') as unknown as {
        insert: (record: any) => {
          select: (cols: string) => {
            single: () => Promise<{ data: { id: string } | null; error: { code?: string; message: string } | null }>;
          };
        };
      }
    )
      .insert(fallbackRecord)
      .select('id')
      .single();

    rawNovoContrato = retry.data;
    dbError = retry.error;
  }

  const novoContrato = rawNovoContrato;

  if (dbError || !novoContrato) {
    if (dbError && dbError.code === '23505') {
      if (dbError.message.includes('numero_contrato')) {
        return {
          success: false,
          message: 'Já existe um contrato cadastrado com este número.',
        };
      }
      if (dbError.message.includes('chave_siga_contrato')) {
        return {
          success: false,
          message: 'Já existe um contrato cadastrado com esta Chave SIGA.',
        };
      }
    }
    return {
      success: false,
      message: `Erro ao cadastrar contrato no banco de dados: ${dbError?.message || 'Falha na inserção'}`,
    };
  }

  revalidatePath('/contratos');
  revalidatePath('/');

  return {
    success: true,
    message: isElaboracao
      ? 'Instrumento cadastrado em elaboração com dados iniciais salvos!'
      : 'Instrumento contratual cadastrado com sucesso!',
    contratoId: novoContrato.id,
  };
}

/**
 * 2. Atualização / Edição Completa de Contrato Existente
 */
export async function updateContratoAction(
  contratoId: string,
  formData: FormData
): Promise<ContratoActionResponse> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'GESTOR_CONTRATOS'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada. Apenas Administradores ou Gestores podem editar contratos.',
    };
  }

  const rawData = {
    tipo_formalizacao: formData.get('tipo_formalizacao'),
    tipo_contrato: formData.get('tipo_contrato') || 'CONTINUO',
    tipo_licitacao: formData.get('tipo_licitacao') || 'PREGAO_ELETRONICO',
    emergencial:
      formData.get('emergencial') === 'true' ||
      formData.get('emergencial') === 'on' ||
      formData.get('emergencial') === 'SIM' ||
      formData.get('emergencial') === 'sim' ||
      formData.get('emergencial') === '1',
    numero_contrato: formData.get('numero_contrato') || null,
    processo_sei: formData.get('processo_sei'),
    chave_siga_contrato: formData.get('chave_siga_contrato') || null,
    contratada_cnpj: formData.get('contratada_cnpj') || null,
    contratada_razao_social: formData.get('contratada_razao_social') || null,
    objeto: formData.get('objeto'),
    valor_inicial: formData.get('valor_inicial') || 0,
    data_publicacao_pncp: formData.get('data_publicacao_pncp') || null,
    data_vigencia_inicio_original: formData.get('data_vigencia_inicio_original') || null,
    data_vigencia_fim_original: formData.get('data_vigencia_fim_original') || null,
    ata_origem_id: formData.get('ata_origem_id') || null,
    observacoes: formData.get('observacoes') || null,
    status: formData.get('status') || 'VIGENTE',
  };

  const validation = contratoSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação dos campos do contrato.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;
  const isElaboracao = payload.status === 'EM_FORMALIZACAO';
  const hoje = new Date().toISOString().split('T')[0];

  const updateRecord: ContratoUpdate = {
    tipo_formalizacao: payload.tipo_formalizacao,
    tipo_contrato: payload.tipo_contrato,
    tipo_licitacao: payload.tipo_licitacao,
    emergencial: payload.emergencial,
    numero_contrato: payload.numero_contrato || null,
    processo_sei: payload.processo_sei,
    chave_siga_contrato:
      payload.chave_siga_contrato ||
      (isElaboracao ? `SIGA-DRAFT-${Math.floor(Math.random() * 900000 + 100000)}` : ''),
    contratada_cnpj:
      payload.contratada_cnpj || (isElaboracao ? '00000000000000' : ''),
    contratada_razao_social:
      payload.contratada_razao_social ||
      (isElaboracao ? 'EM ELABORAÇÃO / FASE DE COTAÇÃO' : ''),
    objeto: payload.objeto,
    valor_inicial: payload.valor_inicial,
    data_publicacao_pncp: payload.data_publicacao_pncp || hoje,
    data_vigencia_inicio_original: payload.data_vigencia_inicio_original || hoje,
    data_vigencia_fim_original: payload.data_vigencia_fim_original || hoje,
    ata_origem_id: payload.ata_origem_id || null,
    observacoes: payload.observacoes || null,
    status: payload.status,
    updated_at: new Date().toISOString(),
  };

  let { error: dbError } = await (
    supabase.from('contratos') as unknown as {
      update: (record: ContratoUpdate) => {
        eq: (col: string, val: string) => Promise<{ error: { code?: string; message: string } | null }>;
      };
    }
  )
    .update(updateRecord)
    .eq('id', contratoId);

  // Caso as novas colunas ainda não tenham sido migradas no Supabase SQL Editor
  if (
    dbError &&
    (dbError.message.includes('tipo_contrato') ||
      dbError.message.includes('tipo_licitacao') ||
      dbError.message.includes('emergencial'))
  ) {
    const { tipo_contrato, tipo_licitacao, emergencial, ...fallbackRecord } = updateRecord;
    const retry = await (
      supabase.from('contratos') as unknown as {
        update: (record: any) => {
          eq: (col: string, val: string) => Promise<{ error: { code?: string; message: string } | null }>;
        };
      }
    )
      .update(fallbackRecord)
      .eq('id', contratoId);

    dbError = retry.error;
  }

  if (dbError) {
    if (dbError.code === '23505') {
      return {
        success: false,
        message: 'Conflito de unicidade: Número de contrato ou Chave SIGA já em uso por outro instrumento.',
      };
    }
    return {
      success: false,
      message: `Erro ao atualizar contrato: ${dbError.message}`,
    };
  }

  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath('/contratos');
  revalidatePath('/');

  return {
    success: true,
    message: 'Contrato atualizado com sucesso! Alterações registradas na auditoria forense.',
    contratoId,
  };
}

/**
 * 3. Atualização rápida de Status
 */
export async function updateContratoStatusAction(
  contratoId: string,
  novoStatus: StatusInstrumento
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'GESTOR_CONTRATOS'].includes(profile.role)) {
    return { success: false, message: 'Permissão negada para alterar status de contrato.' };
  }

  const { error } = await (
    supabase.from('contratos') as unknown as {
      update: (record: { status: StatusInstrumento; updated_at: string }) => {
        eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
      };
    }
  )
    .update({ status: novoStatus, updated_at: new Date().toISOString() })
    .eq('id', contratoId);

  if (error) {
    return { success: false, message: `Erro ao atualizar status: ${error.message}` };
  }

  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath('/contratos');
  revalidatePath('/');

  return { success: true, message: 'Status contratual atualizado com sucesso.' };
}
