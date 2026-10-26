import { z } from 'zod';

export const alteracaoSchema = z
  .object({
    contrato_id: z.string().uuid('ID do contrato inválido'),
    procedimento: z
      .string()
      .min(3, 'Informe o nome do procedimento (Ex: 1º Termo Aditivo, 1º Apostilamento)')
      .trim(),
    processo_sei: z
      .string()
      .min(5, 'Informe o processo SEI-RJ de alteração contratual')
      .trim(),
    chave_siga_termo: z.string().optional().nullable(),
    tipo: z.enum(['ADITIVO_PRAZO', 'ADITIVO_VALOR', 'ADITIVO_MISTO', 'APOSTILAMENTO'], {
      required_error: 'Selecione o tipo de alteração contratual',
    }),
    finalidade_apostilamento: z
      .enum(['REAJUSTE_PRECO', 'ALTERACAO_DADOS_CONTRATUAIS', 'OUTROS'])
      .optional()
      .nullable(),
    nova_razao_social: z.string().optional().nullable(),
    novo_cnpj: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? val.replace(/\D/g, '') : '')),
    justificativa_resumo: z
      .string()
      .min(5, 'Descreva a fundamentação da alteração contratual')
      .trim(),
    valor_diferenca: z.coerce.number().default(0),
    data_assinatura: z.string().optional().nullable(),
    vigencia_termo_inicio: z.string().optional().nullable(),
    vigencia_termo_fim: z.string().optional().nullable(),
    publicacao_doerj_data: z.string().optional().nullable(),
    publicacao_doerj_pagina: z.string().optional().nullable(),
    publicacao_pncp_data: z.string().optional().nullable(),
    observacoes: z.string().optional().nullable(),
    em_elaboracao: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    // Se estiver em elaboração / minuta, apenas os campos básicos (tipo, SEI, justificativa) são obrigatórios
    if (data.em_elaboracao) {
      return;
    }

    // Se NÃO estiver em elaboração, exige data de assinatura válida
    if (!data.data_assinatura || !/^\d{4}-\d{2}-\d{2}$/.test(data.data_assinatura)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe a data de assinatura do termo.',
        path: ['data_assinatura'],
      });
    }

    // Aditivos de prazo e mistos exigem datas de início e fim da nova vigência
    if (data.tipo === 'ADITIVO_PRAZO' || data.tipo === 'ADITIVO_MISTO') {
      if (!data.vigencia_termo_inicio || !/^\d{4}-\d{2}-\d{2}$/.test(data.vigencia_termo_inicio)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe a data de início da nova vigência do aditivo.',
          path: ['vigencia_termo_inicio'],
        });
      }
      if (!data.vigencia_termo_fim || !/^\d{4}-\d{2}-\d{2}$/.test(data.vigencia_termo_fim)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Informe a data final da nova vigência do aditivo.',
          path: ['vigencia_termo_fim'],
        });
      } else if (data.vigencia_termo_inicio && data.vigencia_termo_fim < data.vigencia_termo_inicio) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A data de término do termo aditivo deve ser igual ou posterior à data de início.',
          path: ['vigencia_termo_fim'],
        });
      }
    }

    // Aditivos de valor exigem variação financeira diferente de zero
    if (data.tipo === 'ADITIVO_VALOR') {
      if (data.valor_diferenca === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Aditivos de valor exigem acréscimo ou supressão financeira diferente de zero.',
          path: ['valor_diferenca'],
        });
      }
    }
  });

export type AlteracaoFormData = z.infer<typeof alteracaoSchema>;
