import { z } from 'zod';

export const ataRegistroPrecoSchema = z
  .object({
    numero_ata: z
      .string()
      .min(3, 'Informe o número da Ata de Registro de Preços (Ex: 004/2026)')
      .trim(),
    processo_sei: z
      .string()
      .min(5, 'Informe o processo SEI-RJ de registro de preços')
      .trim(),
    codigo_siga_arp: z.string().trim().optional().nullable(),
    papel_secretaria: z.enum(['GERENCIADOR', 'PARTICIPANTE', 'CARONA'], {
      required_error: 'Selecione a condição da SEMPI (Gerenciador, Participante ou Carona)',
    }),
    orgao_gerenciador: z
      .string()
      .min(3, 'Informe o órgão gerenciador da Ata')
      .trim()
      .default('Secretaria de Estado da Mulher e de Políticas Inclusivas - SEMPI'),
    objeto: z
      .string()
      .min(5, 'Descreva o objeto da Ata de Registro de Preços')
      .trim(),
    data_publicacao_pncp: z.string().optional().nullable(),
    data_vigencia_inicio: z.string().optional().nullable(),
    data_vigencia_fim: z.string().optional().nullable(),
    prorrogavel: z.boolean().default(true),
    observacoes: z.string().trim().optional().nullable(),
    status: z
      .enum(['VIGENTE', 'ENCERRADO', 'RESCINDIDO', 'SUSPENSO', 'EM_FORMALIZACAO'])
      .default('VIGENTE'),
  })
  .superRefine((data, ctx) => {
    // Se estiver em elaboração / minuta de ata, apenas dados básicos são obrigatórios
    if (data.status === 'EM_FORMALIZACAO') {
      return;
    }

    if (!data.data_publicacao_pncp || !/^\d{4}-\d{2}-\d{2}$/.test(data.data_publicacao_pncp)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe a data de publicação no PNCP (AAAA-MM-DD).',
        path: ['data_publicacao_pncp'],
      });
    }

    if (!data.data_vigencia_inicio || !/^\d{4}-\d{2}-\d{2}$/.test(data.data_vigencia_inicio)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe a data de início de vigência da Ata.',
        path: ['data_vigencia_inicio'],
      });
    }

    if (!data.data_vigencia_fim || !/^\d{4}-\d{2}-\d{2}$/.test(data.data_vigencia_fim)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe a data de término de vigência da Ata.',
        path: ['data_vigencia_fim'],
      });
    } else if (data.data_vigencia_inicio && new Date(data.data_vigencia_fim) < new Date(data.data_vigencia_inicio)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A data final de vigência não pode ser anterior à data de início.',
        path: ['data_vigencia_fim'],
      });
    }
  });

export const ataItemSchema = z.object({
  ata_id: z.string().uuid('ID da Ata de Registro de Preços inválido'),
  item_numero: z.coerce
    .number({ invalid_type_error: 'Número do item inválido' })
    .int('O número do item deve ser inteiro')
    .min(1, 'O número do item deve ser maior ou igual a 1'),
  codigo_item_siga: z
    .string()
    .min(2, 'Informe o código do item no Catálogo SIGA-RJ')
    .trim(),
  descricao: z
    .string()
    .min(5, 'Informe a especificação técnica do item')
    .trim(),
  fornecedor_cnpj: z
    .string()
    .min(14, 'CNPJ do fornecedor inválido')
    .transform((val) => val.replace(/\D/g, '')),
  fornecedor_razao_social: z
    .string()
    .min(3, 'Informe a razão social do fornecedor beneficiário da cota')
    .trim(),
  unidade_medida: z
    .string()
    .min(1, 'Informe a unidade de medida (Ex: UN, SERVICO, HORA, MES)')
    .trim()
    .toUpperCase(),
  valor_unitario: z.coerce
    .number({ invalid_type_error: 'Valor unitário inválido' })
    .min(0.0001, 'O valor unitário registrado deve ser maior que zero'),
  qtd_total_registrada: z.coerce
    .number({ invalid_type_error: 'Quantidade total inválida' })
    .min(0.01, 'A quantidade total registrada deve ser maior que zero'),
  qtd_cota_secretaria: z.coerce
    .number({ invalid_type_error: 'Quantidade da cota inválida' })
    .min(0.01, 'A cota reservada para a SEMPI deve ser maior que zero'),
}).refine(
  (data) => data.qtd_cota_secretaria <= data.qtd_total_registrada,
  {
    message: 'A cota da SEMPI não pode exceder a quantidade total registrada na Ata.',
    path: ['qtd_cota_secretaria'],
  }
);

export const consumoAtaSchema = z.object({
  ata_item_id: z.string().uuid('Item da ata inválido'),
  empenho_id: z.string().uuid('Nota de empenho inválida'),
  quantidade_consumida: z.coerce
    .number({ invalid_type_error: 'Quantidade consumida inválida' })
    .min(0.01, 'A quantidade consumida deve ser maior que zero'),
});
