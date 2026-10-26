'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth/get-user-profile';
import { alteracaoSchema } from '@/lib/validators/alteracao.schema';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/lib/types/database.types';

type AlteracaoInsert = Database['public']['Tables']['alteracoes_contratuais']['Insert'];
type AlteracaoUpdate = Database['public']['Tables']['alteracoes_contratuais']['Update'];

export type AlteracaoActionResponse = {
  success: boolean;
  message?: string;
  alteracaoId?: string;
  errors?: Record<string, string[]>;
};

/**
 * 1. Cadastro de Alteração Contratual (Aditivo ou Apostilamento)
 */
export async function createAlteracaoAction(
  formData: FormData
): Promise<AlteracaoActionResponse> {
  const supabase = await createClient();

  // 1. Verificação de Sessão e Permissão RBAC (Defesa em Profundidade)
  const { user, profile } = await getUserProfile();

  if (!user) {
    return {
      success: false,
      message: 'Não autenticado. Faça login para continuar.',
    };
  }

  if (!profile || !['ADMIN', 'GESTOR_CONTRATOS'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada. Apenas Administradores ou Gestores de Contratos podem registrar alterações contratuais.',
    };
  }

  // 2. Extração dos dados do formulário
  const rawData = {
    contrato_id: formData.get('contrato_id'),
    procedimento: formData.get('procedimento'),
    processo_sei: formData.get('processo_sei'),
    chave_siga_termo: formData.get('chave_siga_termo') || null,
    tipo: formData.get('tipo'),
    finalidade_apostilamento: formData.get('finalidade_apostilamento') || null,
    nova_razao_social: formData.get('nova_razao_social') || null,
    novo_cnpj: formData.get('novo_cnpj') || null,
    justificativa_resumo: formData.get('justificativa_resumo'),
    valor_diferenca: formData.get('valor_diferenca') || 0,
    data_assinatura: formData.get('data_assinatura') || null,
    vigencia_termo_inicio: formData.get('vigencia_termo_inicio') || null,
    vigencia_termo_fim: formData.get('vigencia_termo_fim') || null,
    publicacao_doerj_data: formData.get('publicacao_doerj_data') || null,
    publicacao_doerj_pagina: formData.get('publicacao_doerj_pagina') || null,
    publicacao_pncp_data: formData.get('publicacao_pncp_data') || null,
    observacoes: formData.get('observacoes') || null,
    em_elaboracao: formData.get('em_elaboracao') === 'true',
  };

  // 3. Validação com Zod
  const validation = alteracaoSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação dos campos obrigatórios.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;

  // 4. Verificação Jurídica do Art. 95 da Lei 14.133/2021
  const { data: rawContrato } = await supabase
    .from('contratos')
    .select('id, tipo_formalizacao, contratada_razao_social, contratada_cnpj')
    .eq('id', payload.contrato_id)
    .single();

  const contrato = rawContrato as {
    id: string;
    tipo_formalizacao: string;
    contratada_razao_social: string;
    contratada_cnpj: string;
  } | null;

  if (!contrato) {
    return {
      success: false,
      message: 'Contrato não encontrado.',
    };
  }

  if (
    contrato.tipo_formalizacao === 'NOTA_EMPENHO_FORCA_CONTRATO' &&
    payload.tipo !== 'APOSTILAMENTO'
  ) {
    return {
      success: false,
      message: 'Operação bloqueada: Contratações formalizadas exclusivamente por Nota de Empenho (Art. 95 da Lei 14.133/21) não admitem Termos Aditivos, permitindo apenas Apostilamentos.',
    };
  }

  // 5. Inserção no Supabase
  const hoje = new Date().toISOString().split('T')[0];
  const newRecord: AlteracaoInsert = {
    contrato_id: payload.contrato_id,
    procedimento: payload.procedimento,
    processo_sei: payload.processo_sei,
    chave_siga_termo: payload.chave_siga_termo || null,
    tipo: payload.tipo,
    justificativa_resumo: payload.justificativa_resumo,
    valor_diferenca: payload.valor_diferenca,
    data_assinatura: payload.data_assinatura || hoje,
    vigencia_termo_inicio: payload.vigencia_termo_inicio || null,
    vigencia_termo_fim: payload.vigencia_termo_fim || null,
    publicacao_doerj_data: payload.publicacao_doerj_data || null,
    publicacao_doerj_pagina: payload.publicacao_doerj_pagina || null,
    publicacao_pncp_data: payload.publicacao_pncp_data || null,
    observacoes: payload.observacoes || null,
    created_by: user.id,
  };

  const { data: rawNovaAlteracao, error: dbError } = await (
    supabase.from('alteracoes_contratuais') as unknown as {
      insert: (record: AlteracaoInsert) => {
        select: (cols: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { code?: string; message: string } | null }>;
        };
      };
    }
  )
    .insert(newRecord)
    .select('id')
    .single();

  if (dbError || !rawNovaAlteracao) {
    if (dbError && dbError.code === '23505') {
      return {
        success: false,
        message: 'Já existe uma alteração contratual cadastrada com este nome/procedimento para este contrato.',
      };
    }
    return {
      success: false,
      message: `Erro ao registrar alteração contratual: ${dbError?.message || 'Falha na inserção'}`,
    };
  }

  // 6. Se for Apostilamento para alteração de dados cadastrais/contratuais, atualiza o Contrato
  if (
    payload.tipo === 'APOSTILAMENTO' &&
    payload.finalidade_apostilamento === 'ALTERACAO_DADOS_CONTRATUAIS'
  ) {
    const updateContrato: Record<string, string> = {};
    if (payload.nova_razao_social) {
      updateContrato.contratada_razao_social = payload.nova_razao_social;
    }
    if (payload.novo_cnpj) {
      updateContrato.contratada_cnpj = payload.novo_cnpj;
    }
    if (Object.keys(updateContrato).length > 0) {
      await (supabase.from('contratos') as any)
        .update(updateContrato)
        .eq('id', payload.contrato_id);
    }
  }

  revalidatePath(`/contratos/${payload.contrato_id}`);
  revalidatePath('/contratos');
  revalidatePath('/');

  return {
    success: true,
    message: payload.em_elaboracao
      ? 'Minuta de alteração contratual salva em elaboração!'
      : 'Alteração contratual registrada e processada pelo banco com sucesso!',
    alteracaoId: rawNovaAlteracao.id,
  };
}

/**
 * 2. Atualização / Edição de Alteração Contratual Existente
 */
export async function updateAlteracaoAction(
  alteracaoId: string,
  formData: FormData
): Promise<AlteracaoActionResponse> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'GESTOR_CONTRATOS'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada. Apenas Administradores ou Gestores podem editar alterações contratuais.',
    };
  }

  const rawData = {
    contrato_id: formData.get('contrato_id'),
    procedimento: formData.get('procedimento'),
    processo_sei: formData.get('processo_sei'),
    chave_siga_termo: formData.get('chave_siga_termo') || null,
    tipo: formData.get('tipo'),
    finalidade_apostilamento: formData.get('finalidade_apostilamento') || null,
    nova_razao_social: formData.get('nova_razao_social') || null,
    novo_cnpj: formData.get('novo_cnpj') || null,
    justificativa_resumo: formData.get('justificativa_resumo'),
    valor_diferenca: formData.get('valor_diferenca') || 0,
    data_assinatura: formData.get('data_assinatura') || null,
    vigencia_termo_inicio: formData.get('vigencia_termo_inicio') || null,
    vigencia_termo_fim: formData.get('vigencia_termo_fim') || null,
    publicacao_doerj_data: formData.get('publicacao_doerj_data') || null,
    publicacao_doerj_pagina: formData.get('publicacao_doerj_pagina') || null,
    publicacao_pncp_data: formData.get('publicacao_pncp_data') || null,
    observacoes: formData.get('observacoes') || null,
    em_elaboracao: formData.get('em_elaboracao') === 'true',
  };

  const validation = alteracaoSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação dos campos.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;
  const hoje = new Date().toISOString().split('T')[0];

  const updateRecord: AlteracaoUpdate = {
    procedimento: payload.procedimento,
    processo_sei: payload.processo_sei,
    chave_siga_termo: payload.chave_siga_termo || null,
    tipo: payload.tipo,
    justificativa_resumo: payload.justificativa_resumo,
    valor_diferenca: payload.valor_diferenca,
    data_assinatura: payload.data_assinatura || hoje,
    vigencia_termo_inicio: payload.vigencia_termo_inicio || null,
    vigencia_termo_fim: payload.vigencia_termo_fim || null,
    publicacao_doerj_data: payload.publicacao_doerj_data || null,
    publicacao_doerj_pagina: payload.publicacao_doerj_pagina || null,
    publicacao_pncp_data: payload.publicacao_pncp_data || null,
    observacoes: payload.observacoes || null,
    updated_at: new Date().toISOString(),
  };

  const { error: dbError } = await (
    supabase.from('alteracoes_contratuais') as unknown as {
      update: (record: AlteracaoUpdate) => {
        eq: (col: string, val: string) => Promise<{ error: { code?: string; message: string } | null }>;
      };
    }
  )
    .update(updateRecord)
    .eq('id', alteracaoId);

  if (dbError) {
    return {
      success: false,
      message: `Erro ao atualizar alteração contratual: ${dbError.message}`,
    };
  }

  // Se for Apostilamento para alteração de dados cadastrais/contratuais, atualiza o Contrato
  if (
    payload.tipo === 'APOSTILAMENTO' &&
    payload.finalidade_apostilamento === 'ALTERACAO_DADOS_CONTRATUAIS'
  ) {
    const updateContrato: Record<string, string> = {};
    if (payload.nova_razao_social) {
      updateContrato.contratada_razao_social = payload.nova_razao_social;
    }
    if (payload.novo_cnpj) {
      updateContrato.contratada_cnpj = payload.novo_cnpj;
    }
    if (Object.keys(updateContrato).length > 0) {
      await (supabase.from('contratos') as any)
        .update(updateContrato)
        .eq('id', payload.contrato_id);
    }
  }

  revalidatePath(`/contratos/${payload.contrato_id}`);
  revalidatePath('/contratos');
  revalidatePath('/');

  return {
    success: true,
    message: 'Alteração contratual atualizada com sucesso!',
    alteracaoId,
  };
}

/**
 * 3. Exclusão de Alteração Contratual
 */
export async function deleteAlteracaoAction(
  alteracaoId: string,
  contratoId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'GESTOR_CONTRATOS'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada. Apenas Administradores ou Gestores de Contratos podem excluir alterações.',
    };
  }

  const { error } = await (
    supabase.from('alteracoes_contratuais') as unknown as {
      delete: () => {
        eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
      };
    }
  )
    .delete()
    .eq('id', alteracaoId);

  if (error) {
    return {
      success: false,
      message: `Erro ao excluir alteração contratual: ${error.message}`,
    };
  }

  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath('/contratos');
  revalidatePath('/');

  return {
    success: true,
    message: 'Alteração contratual excluída. O banco recalculou o valor e vigência do contrato automaticamente.',
  };
}
