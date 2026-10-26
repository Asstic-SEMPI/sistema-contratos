'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/lib/auth/get-user-profile';
import { fiscalSchema, swapFiscalSchema } from '@/lib/validators/fiscal.schema';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/lib/types/database.types';

type FiscalInsert = Database['public']['Tables']['contrato_fiscais']['Insert'];

export type FiscalActionResponse = {
  success: boolean;
  message?: string;
  fiscalId?: string;
  errors?: Record<string, string[]>;
};

export async function designarFiscalAction(
  formData: FormData
): Promise<FiscalActionResponse> {
  const supabase = await createClient();

  // 1. Verificação de Sessão e Permissão RBAC
  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'GESTOR_CONTRATOS'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada. Apenas Administradores ou Gestores podem designar fiscais.',
    };
  }

  // 2. Extração dos dados
  const rawData = {
    contrato_id: formData.get('contrato_id'),
    nome: formData.get('nome'),
    id_funcional: formData.get('id_funcional'),
    funcao: formData.get('funcao'),
    portaria_designacao: formData.get('portaria_designacao'),
    data_publicacao_doerj: formData.get('data_publicacao_doerj'),
    data_inicio: formData.get('data_inicio'),
    data_fim: formData.get('data_fim') || null,
    usuario_id: formData.get('usuario_id') || null,
  };

  // 3. Validação com Zod
  const validation = fiscalSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação dos dados do fiscal.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;

  // 4. Procura se existe perfil no sistema com este id_funcional para auto-link
  let vinculadoUsuarioId = payload.usuario_id || null;
  if (!vinculadoUsuarioId) {
    const { data: usuarioExistente } = await supabase
      .from('perfis_usuarios')
      .select('id')
      .eq('id_funcional', payload.id_funcional)
      .single();

    if (usuarioExistente) {
      vinculadoUsuarioId = (usuarioExistente as { id: string }).id;
    }
  }

  // 5. Inserção na tabela contrato_fiscais
  const newFiscal: FiscalInsert = {
    contrato_id: payload.contrato_id,
    nome: payload.nome,
    id_funcional: payload.id_funcional,
    funcao: payload.funcao,
    portaria_designacao: payload.portaria_designacao,
    data_publicacao_doerj: payload.data_publicacao_doerj,
    data_inicio: payload.data_inicio,
    data_fim: payload.data_fim || null,
    usuario_id: vinculadoUsuarioId,
    ativo: true,
    created_by: user.id,
  };

  const { data: rawDataFiscal, error: dbError } = await (
    supabase.from('contrato_fiscais') as unknown as {
      insert: (record: FiscalInsert) => {
        select: (cols: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
        };
      };
    }
  )
    .insert(newFiscal)
    .select('id')
    .single();

  if (dbError || !rawDataFiscal) {
    return {
      success: false,
      message: `Erro ao designar fiscal: ${dbError?.message || 'Falha na inserção'}`,
    };
  }

  revalidatePath(`/contratos/${payload.contrato_id}`);
  revalidatePath('/fiscais');
  revalidatePath('/');

  return {
    success: true,
    message: 'Servidor formalmente designado para a comissão de fiscalização!',
    fiscalId: rawDataFiscal.id,
  };
}

/**
 * Swap Atômico de Fiscal (Substituição com encerramento formal do anterior)
 */
export async function swapFiscalAction(
  formData: FormData
): Promise<FiscalActionResponse> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'GESTOR_CONTRATOS'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada para realizar substituição de fiscais.',
    };
  }

  const rawData = {
    contrato_id: formData.get('contrato_id'),
    fiscal_anterior_id: formData.get('fiscal_anterior_id'),
    nome_novo: formData.get('nome_novo'),
    id_funcional_novo: formData.get('id_funcional_novo'),
    funcao: formData.get('funcao'),
    nova_portaria: formData.get('nova_portaria'),
    data_publicacao_doerj: formData.get('data_publicacao_doerj'),
    data_substituicao: formData.get('data_substituicao'),
    motivo_substituicao: formData.get('motivo_substituicao') || null,
  };

  const validation = swapFiscalSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Dados inválidos para a substituição de fiscal.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;

  // 1. Desativa o fiscal anterior
  const { error: errDesativar } = await (
    supabase.from('contrato_fiscais') as unknown as {
      update: (record: { ativo: boolean; data_fim: string; data_substituicao: string }) => {
        eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
      };
    }
  )
    .update({
      ativo: false,
      data_fim: payload.data_substituicao,
      data_substituicao: payload.data_substituicao,
    })
    .eq('id', payload.fiscal_anterior_id);

  if (errDesativar) {
    return {
      success: false,
      message: `Erro ao desativar fiscal anterior: ${errDesativar.message}`,
    };
  }

  // 2. Busca se o novo fiscal tem conta no sistema para auto-vínculo
  let usuarioIdNovo: string | null = null;
  const { data: usuarioExistente } = await supabase
    .from('perfis_usuarios')
    .select('id')
    .eq('id_funcional', payload.id_funcional_novo)
    .single();

  if (usuarioExistente) {
    usuarioIdNovo = (usuarioExistente as { id: string }).id;
  }

  // 3. Cadastra o novo fiscal ativo
  const novoFiscalRecord: FiscalInsert = {
    contrato_id: payload.contrato_id,
    nome: payload.nome_novo,
    id_funcional: payload.id_funcional_novo,
    funcao: payload.funcao,
    portaria_designacao: payload.nova_portaria,
    data_publicacao_doerj: payload.data_publicacao_doerj,
    data_inicio: payload.data_substituicao,
    usuario_id: usuarioIdNovo,
    ativo: true,
    created_by: user.id,
  };

  const { data: rawNovoFiscal, error: errNovo } = await (
    supabase.from('contrato_fiscais') as unknown as {
      insert: (record: FiscalInsert) => {
        select: (cols: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
        };
      };
    }
  )
    .insert(novoFiscalRecord)
    .select('id')
    .single();

  if (errNovo || !rawNovoFiscal) {
    return {
      success: false,
      message: `Erro ao cadastrar novo fiscal no swap: ${errNovo?.message || 'Falha na inserção'}`,
    };
  }

  revalidatePath(`/contratos/${payload.contrato_id}`);
  revalidatePath('/fiscais');
  revalidatePath('/');

  return {
    success: true,
    message: 'Substituição (Swap Atômico) realizada com sucesso e registrada na trilha de auditoria!',
    fiscalId: rawNovoFiscal.id,
  };
}

export async function desativarFiscalAction(
  fiscalId: string,
  contratoId: string
): Promise<{ success: boolean; message: string }> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'GESTOR_CONTRATOS'].includes(profile.role)) {
    return { success: false, message: 'Permissão negada.' };
  }

  const hoje = new Date().toISOString().split('T')[0];

  const { error } = await (
    supabase.from('contrato_fiscais') as unknown as {
      update: (record: { ativo: boolean; data_fim: string }) => {
        eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
      };
    }
  )
    .update({ ativo: false, data_fim: hoje })
    .eq('id', fiscalId);

  if (error) {
    return { success: false, message: `Erro ao desativar: ${error.message}` };
  }

  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath('/fiscais');
  revalidatePath('/');

  return { success: true, message: 'Fiscal desativado da comissão.' };
}

/**
 * 4. Edição de Designação de Fiscal / Membro da Comissão
 */
export async function updateFiscalAction(
  fiscalId: string,
  contratoId: string,
  formData: FormData
): Promise<FiscalActionResponse> {
  const supabase = await createClient();

  const { user, profile } = await getUserProfile();

  if (!user) {
    return { success: false, message: 'Não autenticado.' };
  }

  if (!profile || !['ADMIN', 'GESTOR_CONTRATOS'].includes(profile.role)) {
    return {
      success: false,
      message: 'Permissão negada. Apenas Administradores ou Gestores podem editar fiscais.',
    };
  }

  const rawData = {
    contrato_id: contratoId,
    nome: formData.get('nome'),
    id_funcional: formData.get('id_funcional'),
    funcao: formData.get('funcao'),
    portaria_designacao: formData.get('portaria_designacao'),
    data_publicacao_doerj: formData.get('data_publicacao_doerj'),
    data_inicio: formData.get('data_inicio'),
    data_fim: formData.get('data_fim') || null,
    usuario_id: formData.get('usuario_id') || null,
  };

  const validation = fiscalSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      message: 'Erro de validação dos dados do fiscal.',
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const payload = validation.data;
  const rawAtivo = formData.get('ativo');
  const hasAtivoField = rawAtivo !== null && rawAtivo !== undefined;
  const isAtivo = rawAtivo === 'true' || rawAtivo === 'on' || rawAtivo === '1';

  const updateRecord: Record<string, any> = {
    nome: payload.nome,
    id_funcional: payload.id_funcional,
    funcao: payload.funcao,
    portaria_designacao: payload.portaria_designacao,
    data_publicacao_doerj: payload.data_publicacao_doerj,
    data_inicio: payload.data_inicio,
    data_fim: payload.data_fim || null,
    updated_at: new Date().toISOString(),
  };

  if (hasAtivoField) {
    updateRecord.ativo = isAtivo;
    // Se foi reativado e não informou data fim, limpa a data fim
    if (isAtivo && !payload.data_fim) {
      updateRecord.data_fim = null;
    }
  }

  const { error: dbError } = await (
    supabase.from('contrato_fiscais') as unknown as {
      update: (record: typeof updateRecord) => {
        eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
      };
    }
  )
    .update(updateRecord)
    .eq('id', fiscalId);

  if (dbError) {
    return {
      success: false,
      message: `Erro ao atualizar fiscal: ${dbError.message}`,
    };
  }

  revalidatePath(`/contratos/${contratoId}`);
  revalidatePath('/fiscais');
  revalidatePath('/');

  return {
    success: true,
    message: 'Dados do fiscal atualizados com sucesso e registrados na auditoria!',
    fiscalId,
  };
}

