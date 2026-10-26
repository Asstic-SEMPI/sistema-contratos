'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth/get-user-profile';
import { empenhoSchema, eventoEmpenhoSchema, liquidacaoSchema } from '@/lib/validators/financeiro.schema';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/lib/types/database.types';

type EmpenhoInsert = Database['public']['Tables']['financeiro_empenhos']['Insert'];
type EventoInsert = Database['public']['Tables']['financeiro_empenhos_eventos']['Insert'];
type LiquidacaoInsert = Database['public']['Tables']['financeiro_liquidacoes']['Insert'];

export type FinanceiroActionResponse = {
  success: boolean;
  message?: string;
  registroId?: string;
  errors?: Record<string, string[]>;
};

/**
 * 1. Lançamento de Nota de Empenho (NE) Original
 */
export async function createEmpenhoAction(
  formData: FormData
): Promise<FinanceiroActionResponse> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'FINANCEIRO'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada. Apenas Administradores ou equipe do Financeiro podem lançar Notas de Empenho.',
    };
  }

  const rawData = {
    contrato_id: formData.get('contrato_id'),
    alteracao_id: formData.get('alteracao_id') || null,
    processo_sei: formData.get('processo_sei'),
    chave_siga: formData.get('chave_siga'),
    numero_nota_empenho: formData.get('numero_nota_empenho'),
    tipo_empenho: formData.get('tipo_empenho'),
    data_emissao: formData.get('data_emissao'),
    data_referencia_vigencia: formData.get('data_referencia_vigencia'),
    programa_trabalho: formData.get('programa_trabalho'),
    natureza_despesa: formData.get('natureza_despesa'),
    fonte_recurso: formData.get('fonte_recurso'),
    valor_empenhado_inicial: formData.get('valor_empenhado_inicial'),
  };

  const validation = empenhoSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação dos campos da Nota de Empenho.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;

  const newEmpenho: EmpenhoInsert = {
    contrato_id: payload.contrato_id,
    alteracao_id: payload.alteracao_id || null,
    processo_sei: payload.processo_sei,
    chave_siga: payload.chave_siga,
    numero_nota_empenho: payload.numero_nota_empenho,
    tipo_empenho: payload.tipo_empenho,
    data_emissao: payload.data_emissao,
    data_referencia_vigencia: payload.data_referencia_vigencia,
    programa_trabalho: payload.programa_trabalho,
    natureza_despesa: payload.natureza_despesa,
    fonte_recurso: payload.fonte_recurso,
    valor_empenhado_inicial: payload.valor_empenhado_inicial,
    created_by: user.id,
  };

  const { data: rawDataEmpenho, error: dbError } = await (
    supabase.from('financeiro_empenhos') as unknown as {
      insert: (record: EmpenhoInsert) => {
        select: (cols: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { code?: string; message: string } | null }>;
        };
      };
    }
  )
    .insert(newEmpenho)
    .select('id')
    .single();

  if (dbError || !rawDataEmpenho) {
    if (dbError && dbError.code === '23505') {
      return {
        success: false,
        message: 'Já existe um empenho cadastrado com este número de NE no SIAFE-Rio.',
      };
    }
    return {
      success: false,
      message: `Erro ao emitir empenho: ${dbError?.message || 'Falha na inserção'}`,
    };
  }

  revalidatePath(`/contratos/${payload.contrato_id}`);
  revalidatePath('/contratos');
  revalidatePath('/');

  return {
    success: true,
    message: 'Nota de Empenho registrada com sucesso! A trigger classificou a vigência automaticamente.',
    registroId: rawDataEmpenho.id,
  };
}

/**
 * 2. Lançamento de Evento Filho no SIAFE-Rio (Reforço ou Anulação)
 */
export async function createEventoEmpenhoAction(
  formData: FormData,
  contratoId: string
): Promise<FinanceiroActionResponse> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'FINANCEIRO'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada. Apenas Administradores ou Financeiro podem lançar eventos de empenho.',
    };
  }

  const rawData = {
    empenho_original_id: formData.get('empenho_original_id'),
    tipo_evento: formData.get('tipo_evento'),
    numero_ne_evento: formData.get('numero_ne_evento'),
    processo_sei: formData.get('processo_sei'),
    chave_siga: formData.get('chave_siga') || null,
    data_evento: formData.get('data_evento'),
    valor_evento: formData.get('valor_evento'),
    motivo: formData.get('motivo'),
  };

  const validation = eventoEmpenhoSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação do evento de empenho.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;

  const newEvento: EventoInsert = {
    empenho_original_id: payload.empenho_original_id,
    tipo_evento: payload.tipo_evento,
    numero_ne_evento: payload.numero_ne_evento,
    processo_sei: payload.processo_sei,
    chave_siga: payload.chave_siga || null,
    data_evento: payload.data_evento,
    valor_evento: payload.valor_evento,
    motivo: payload.motivo,
    created_by: user.id,
  };

  const { data: rawDataEvento, error: dbError } = await (
    supabase.from('financeiro_empenhos_eventos') as unknown as {
      insert: (record: EventoInsert) => {
        select: (cols: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { code?: string; message: string } | null }>;
        };
      };
    }
  )
    .insert(newEvento)
    .select('id')
    .single();

  if (dbError || !rawDataEvento) {
    if (dbError && dbError.code === '23514') {
      return {
        success: false,
        message: 'Operação rejeitada pela auditoria contábil: O valor total anulado não pode superar o saldo empenhado.',
      };
    }
    if (dbError && dbError.code === '23505') {
      return {
        success: false,
        message: 'Já existe um evento registrado com este número de NE no SIAFE-Rio.',
      };
    }
    return {
      success: false,
      message: `Erro ao registrar evento de empenho: ${dbError?.message || 'Falha na inserção'}`,
    };
  }

  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath('/contratos');
  revalidatePath('/');

  return {
    success: true,
    message: 'Evento SIAFE registrado! O saldo líquido da NE foi recalculado pela trigger do banco.',
    registroId: rawDataEvento.id,
  };
}

/**
 * 3. Lançamento de Liquidação (Nota Fiscal atestada e NL do SIAFE-Rio)
 */
export async function createLiquidacaoAction(
  formData: FormData,
  contratoId: string
): Promise<FinanceiroActionResponse> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  // Permitido para ADMIN, FINANCEIRO e FISCAL
  if (!profile || !['ADMIN', 'FINANCEIRO', 'FISCAL'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada para registrar liquidações.',
    };
  }

  const rawData = {
    empenho_id: formData.get('empenho_id'),
    processo_sei: formData.get('processo_sei'),
    numero_nota_fiscal: formData.get('numero_nota_fiscal'),
    data_emissao_nota_fiscal: formData.get('data_emissao_nota_fiscal'),
    competencia_mes_ano: formData.get('competencia_mes_ano'),
    numero_nota_liquidacao: formData.get('numero_nota_liquidacao'),
    data_emissao_nl: formData.get('data_emissao_nl'),
    valor_liquidado: formData.get('valor_liquidado'),
    data_pagamento_ob: formData.get('data_pagamento_ob') || null,
  };

  const validation = liquidacaoSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação da liquidação / nota fiscal.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;

  const newLiquidacao: LiquidacaoInsert = {
    empenho_id: payload.empenho_id,
    processo_sei: payload.processo_sei,
    numero_nota_fiscal: payload.numero_nota_fiscal,
    data_emissao_nota_fiscal: payload.data_emissao_nota_fiscal,
    competencia_mes_ano: payload.competencia_mes_ano,
    numero_nota_liquidacao: payload.numero_nota_liquidacao,
    data_emissao_nl: payload.data_emissao_nl,
    valor_liquidado: payload.valor_liquidado,
    data_pagamento_ob: payload.data_pagamento_ob || null,
    created_by: user.id,
  };

  const { data: rawDataLiq, error: dbError } = await (
    supabase.from('financeiro_liquidacoes') as unknown as {
      insert: (record: LiquidacaoInsert) => {
        select: (cols: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { code?: string; message: string } | null }>;
        };
      };
    }
  )
    .insert(newLiquidacao)
    .select('id')
    .single();

  if (dbError || !rawDataLiq) {
    if (dbError && dbError.code === '23505') {
      return {
        success: false,
        message: 'Já existe uma liquidação registrada com esta Nota de Liquidação (NL).',
      };
    }
    return {
      success: false,
      message: `Erro ao registrar liquidação: ${dbError?.message || 'Falha na inserção'}`,
    };
  }

  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath('/contratos');
  revalidatePath('/');

  return {
    success: true,
    message: 'Nota Fiscal atestada e Nota de Liquidação registradas com sucesso!',
    registroId: rawDataLiq.id,
  };
}

/**
 * 4. Edição de Nota de Empenho (NE) Original
 */
export async function updateEmpenhoAction(
  empenhoId: string,
  contratoId: string,
  formData: FormData
): Promise<FinanceiroActionResponse> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'FINANCEIRO'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada. Apenas Administradores ou Financeiro podem editar Notas de Empenho.',
    };
  }

  const rawData = {
    contrato_id: contratoId,
    alteracao_id: formData.get('alteracao_id') || null,
    processo_sei: formData.get('processo_sei'),
    chave_siga: formData.get('chave_siga'),
    numero_nota_empenho: formData.get('numero_nota_empenho'),
    tipo_empenho: formData.get('tipo_empenho'),
    data_emissao: formData.get('data_emissao'),
    data_referencia_vigencia: formData.get('data_referencia_vigencia'),
    programa_trabalho: formData.get('programa_trabalho'),
    natureza_despesa: formData.get('natureza_despesa'),
    fonte_recurso: formData.get('fonte_recurso'),
    valor_empenhado_inicial: formData.get('valor_empenhado_inicial'),
  };

  const validation = empenhoSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação dos campos da Nota de Empenho.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;

  const updateEmpenho = {
    alteracao_id: payload.alteracao_id || null,
    processo_sei: payload.processo_sei,
    chave_siga: payload.chave_siga,
    numero_nota_empenho: payload.numero_nota_empenho,
    tipo_empenho: payload.tipo_empenho,
    data_emissao: payload.data_emissao,
    data_referencia_vigencia: payload.data_referencia_vigencia,
    programa_trabalho: payload.programa_trabalho,
    natureza_despesa: payload.natureza_despesa,
    fonte_recurso: payload.fonte_recurso,
    valor_empenhado_inicial: payload.valor_empenhado_inicial,
    updated_at: new Date().toISOString(),
  };

  const { error: dbError } = await (
    supabase.from('financeiro_empenhos') as unknown as {
      update: (record: typeof updateEmpenho) => {
        eq: (col: string, val: string) => Promise<{ error: { code?: string; message: string } | null }>;
      };
    }
  )
    .update(updateEmpenho)
    .eq('id', empenhoId);

  if (dbError) {
    if (dbError.code === '23505') {
      return {
        success: false,
        message: 'Já existe outro empenho com este número de NE no SIAFE-Rio.',
      };
    }
    return {
      success: false,
      message: `Erro ao atualizar empenho: ${dbError.message}`,
    };
  }

  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath('/contratos');
  revalidatePath('/');

  return {
    success: true,
    message: 'Nota de Empenho atualizada com sucesso no SIAFE-Rio!',
    registroId: empenhoId,
  };
}

/**
 * 5. Edição de Evento Contábil SIAFE-Rio (Reforço / Anulação)
 */
export async function updateEventoEmpenhoAction(
  eventoId: string,
  contratoId: string,
  formData: FormData
): Promise<FinanceiroActionResponse> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'FINANCEIRO'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada. Apenas Administradores ou Financeiro podem editar eventos contábeis.',
    };
  }

  const rawData = {
    empenho_original_id: formData.get('empenho_original_id'),
    tipo_evento: formData.get('tipo_evento'),
    numero_ne_evento: formData.get('numero_ne_evento'),
    processo_sei: formData.get('processo_sei'),
    chave_siga: formData.get('chave_siga') || null,
    data_evento: formData.get('data_evento'),
    valor_evento: formData.get('valor_evento'),
    motivo: formData.get('motivo'),
  };

  const validation = eventoEmpenhoSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação do evento de empenho.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;

  const updateEvento = {
    tipo_evento: payload.tipo_evento,
    numero_ne_evento: payload.numero_ne_evento,
    processo_sei: payload.processo_sei,
    chave_siga: payload.chave_siga || null,
    data_evento: payload.data_evento,
    valor_evento: payload.valor_evento,
    motivo: payload.motivo,
  };

  const { error: dbError } = await (
    supabase.from('financeiro_empenhos_eventos') as unknown as {
      update: (record: typeof updateEvento) => {
        eq: (col: string, val: string) => Promise<{ error: { code?: string; message: string } | null }>;
      };
    }
  )
    .update(updateEvento)
    .eq('id', eventoId);

  if (dbError) {
    if (dbError.code === '23514') {
      return {
        success: false,
        message: 'Operação rejeitada pela auditoria contábil: O valor total anulado não pode superar o saldo empenhado.',
      };
    }
    return {
      success: false,
      message: `Erro ao atualizar evento de empenho: ${dbError.message}`,
    };
  }

  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath('/contratos');
  revalidatePath('/');

  return {
    success: true,
    message: 'Evento SIAFE atualizado com sucesso e recalculado na NE!',
    registroId: eventoId,
  };
}

/**
 * 6. Edição de Liquidação (Nota Fiscal / NL)
 */
export async function updateLiquidacaoAction(
  liquidacaoId: string,
  contratoId: string,
  formData: FormData
): Promise<FinanceiroActionResponse> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'FINANCEIRO', 'FISCAL'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada para editar liquidações.',
    };
  }

  const rawData = {
    empenho_id: formData.get('empenho_id'),
    processo_sei: formData.get('processo_sei'),
    numero_nota_fiscal: formData.get('numero_nota_fiscal'),
    data_emissao_nota_fiscal: formData.get('data_emissao_nota_fiscal'),
    competencia_mes_ano: formData.get('competencia_mes_ano'),
    numero_nota_liquidacao: formData.get('numero_nota_liquidacao'),
    data_emissao_nl: formData.get('data_emissao_nl'),
    valor_liquidado: formData.get('valor_liquidado'),
    data_pagamento_ob: formData.get('data_pagamento_ob') || null,
  };

  const validation = liquidacaoSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação da liquidação.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;

  const updateLiq = {
    processo_sei: payload.processo_sei,
    numero_nota_fiscal: payload.numero_nota_fiscal,
    data_emissao_nota_fiscal: payload.data_emissao_nota_fiscal,
    competencia_mes_ano: payload.competencia_mes_ano,
    numero_nota_liquidacao: payload.numero_nota_liquidacao,
    data_emissao_nl: payload.data_emissao_nl,
    valor_liquidado: payload.valor_liquidado,
    data_pagamento_ob: payload.data_pagamento_ob || null,
  };

  const { error: dbError } = await (
    supabase.from('financeiro_liquidacoes') as unknown as {
      update: (record: typeof updateLiq) => {
        eq: (col: string, val: string) => Promise<{ error: { code?: string; message: string } | null }>;
      };
    }
  )
    .update(updateLiq)
    .eq('id', liquidacaoId);

  if (dbError) {
    return {
      success: false,
      message: `Erro ao atualizar liquidação: ${dbError.message}`,
    };
  }

  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath('/contratos');
  revalidatePath('/');

  return {
    success: true,
    message: 'Nota Fiscal e Nota de Liquidação (NL) atualizadas com sucesso!',
    registroId: liquidacaoId,
  };
}

