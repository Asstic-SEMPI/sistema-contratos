import { z } from 'zod';

export const contratoSchema = z
  .object({
    tipo_formalizacao: z.enum(['CONTRATO_FORMAL', 'NOTA_EMPENHO_FORCA_CONTRATO'], {
      required_error: 'Selecione o tipo de formalização',
    }),
    tipo_contrato: z
      .enum(['CONTINUO', 'ESCOPO'], {
        invalid_type_error: 'Tipo de contrato inválido',
      })
      .default('CONTINUO'),
    tipo_licitacao: z
      .enum(['PREGAO_ELETRONICO', 'DISPENSA_LICITACAO', 'INEXIGIBILIDADE', 'CONCORRENCIA'], {
        invalid_type_error: 'Tipo de licitação inválido',
      })
      .default('PREGAO_ELETRONICO'),
    emergencial: z
      .preprocess((val) => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') {
          return val === 'true' || val === 'on' || val === 'SIM' || val === 'sim' || val === '1';
        }
        return false;
      }, z.boolean())
      .default(false),
    numero_contrato: z.string().optional().nullable(),
    processo_sei: z
      .string()
      .min(5, 'Informe o número do processo SEI-RJ')
      .trim(),
    chave_siga_contrato: z.string().trim().optional().nullable(),
    contratada_cnpj: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? val.replace(/\D/g, '') : '')),
    contratada_razao_social: z.string().trim().optional().nullable(),
    objeto: z
      .string()
      .min(5, 'Descreva o objeto da contratação com pelo menos 5 caracteres')
      .trim(),
    valor_inicial: z.coerce
      .number({ invalid_type_error: 'Valor inválido' })
      .min(0, 'O valor inicial deve ser maior ou igual a zero')
      .default(0),
    data_publicacao_pncp: z.string().optional().nullable(),
    data_vigencia_inicio_original: z.string().optional().nullable(),
    data_vigencia_fim_original: z.string().optional().nullable(),
    ata_origem_id: z.string().uuid().optional().nullable(),
    observacoes: z.string().optional().nullable(),
    status: z
      .enum(['VIGENTE', 'ENCERRADO', 'RESCINDIDO', 'SUSPENSO', 'EM_FORMALIZACAO'])
      .default('VIGENTE'),
  })
  .superRefine((data, ctx) => {
    const isElaboracao = data.status === 'EM_FORMALIZACAO';

    // Se estiver "Em Elaboração", apenas os campos básicos (tipo, SEI, objeto) são obrigatórios
    if (isElaboracao) {
      return;
    }

    // Validações estritas quando o contrato NÃO está "Em Elaboração" (Vigente, Suspenso, etc.):
    if (!data.chave_siga_contrato || data.chave_siga_contrato.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe a Chave SIGA do instrumento.',
        path: ['chave_siga_contrato'],
      });
    }

    if (!data.contratada_cnpj || data.contratada_cnpj.length !== 14) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CNPJ da contratada inválido (deve conter 14 dígitos).',
        path: ['contratada_cnpj'],
      });
    }

    if (!data.contratada_razao_social || data.contratada_razao_social.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe a Razão Social da Contratada.',
        path: ['contratada_razao_social'],
      });
    }

    if (!data.valor_inicial || data.valor_inicial <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O valor inicial do contrato deve ser maior que zero.',
        path: ['valor_inicial'],
      });
    }

    if (!data.data_publicacao_pncp || !/^\d{4}-\d{2}-\d{2}$/.test(data.data_publicacao_pncp)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe a data de publicação no PNCP (AAAA-MM-DD).',
        path: ['data_publicacao_pncp'],
      });
    }

    if (!data.data_vigencia_inicio_original || !/^\d{4}-\d{2}-\d{2}$/.test(data.data_vigencia_inicio_original)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe a data de início de vigência.',
        path: ['data_vigencia_inicio_original'],
      });
    }

    if (!data.data_vigencia_fim_original || !/^\d{4}-\d{2}-\d{2}$/.test(data.data_vigencia_fim_original)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe a data de término de vigência.',
        path: ['data_vigencia_fim_original'],
      });
    } else if (data.data_vigencia_inicio_original && data.data_vigencia_fim_original < data.data_vigencia_inicio_original) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A data final de vigência deve ser posterior ou igual à data de início.',
        path: ['data_vigencia_fim_original'],
      });
    }

    // Regra do Art. 95 da Lei 14.133: CONTRATO_FORMAL vigente exige numero_contrato
    if (data.tipo_formalizacao === 'CONTRATO_FORMAL') {
      if (!data.numero_contrato || data.numero_contrato.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'O número do contrato é obrigatório para instrumentos do tipo Contrato Formal.',
          path: ['numero_contrato'],
        });
      }
    }
  });

export type ContratoFormData = z.infer<typeof contratoSchema>;
