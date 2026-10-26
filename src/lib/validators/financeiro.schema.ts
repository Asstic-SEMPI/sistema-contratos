import { z } from 'zod';

export const empenhoSchema = z.object({
  contrato_id: z.string().uuid('ID do contrato inválido'),
  alteracao_id: z.string().uuid().optional().nullable(),
  processo_sei: z
    .string()
    .min(5, 'Informe o processo SEI-RJ de emissão do empenho')
    .trim(),
  chave_siga: z
    .string()
    .min(3, 'Informe a Chave SIGA de execução')
    .trim(),
  numero_nota_empenho: z
    .string()
    .min(5, 'Informe o número da Nota de Empenho SIAFE-Rio (Ex: 2026NE00145)')
    .trim()
    .toUpperCase(),
  tipo_empenho: z.enum(['ORDINARIO', 'ESTIMATIVO', 'GLOBAL'], {
    required_error: 'Selecione a modalidade do empenho',
  }),
  data_emissao: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de emissão da NE inválida (AAAA-MM-DD)'),
  data_referencia_vigencia: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de referência temporal inválida (AAAA-MM-DD)'),
  programa_trabalho: z
    .string()
    .min(3, 'Informe o Programa de Trabalho')
    .trim(),
  natureza_despesa: z
    .string()
    .min(3, 'Informe a Natureza da Despesa (Ex: 3.3.90.39)')
    .trim(),
  fonte_recurso: z
    .string()
    .min(2, 'Informe a Fonte de Recursos (Ex: 100, 122)')
    .trim(),
  valor_empenhado_inicial: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .min(0.01, 'O valor empenhado inicial deve ser maior que zero'),
});

export const eventoEmpenhoSchema = z.object({
  empenho_original_id: z.string().uuid('ID do empenho original inválido'),
  tipo_evento: z.enum(['REFORCO', 'ANULACAO_PARCIAL', 'ANULACAO_TOTAL', 'CANCELAMENTO_RP'], {
    required_error: 'Selecione o tipo do evento SIAFE',
  }),
  numero_ne_evento: z
    .string()
    .min(5, 'Informe o número da NE do evento no SIAFE-Rio (Ex: 2026NE00289)')
    .trim()
    .toUpperCase(),
  processo_sei: z
    .string()
    .min(5, 'Informe o processo SEI-RJ do evento')
    .trim(),
  chave_siga: z.string().optional().nullable(),
  data_evento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data do evento inválida (AAAA-MM-DD)'),
  valor_evento: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .min(0.01, 'O valor do evento deve ser maior que zero'),
  motivo: z
    .string()
    .min(5, 'Descreva a motivação contábil do reforço ou anulação')
    .trim(),
});

export const liquidacaoSchema = z.object({
  empenho_id: z.string().uuid('ID do empenho inválido'),
  processo_sei: z
    .string()
    .min(5, 'Informe o processo SEI-RJ de liquidação')
    .trim(),
  numero_nota_fiscal: z
    .string()
    .min(2, 'Informe o número da Nota Fiscal / Fatura atestada')
    .trim(),
  data_emissao_nota_fiscal: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de emissão da NF inválida (AAAA-MM-DD)'),
  competencia_mes_ano: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{4}$/, 'Competência inválida. Use o formato MM/AAAA (Ex: 03/2026)'),
  numero_nota_liquidacao: z
    .string()
    .min(5, 'Informe o número da NL no SIAFE-Rio (Ex: 2026NL00122)')
    .trim()
    .toUpperCase(),
  data_emissao_nl: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de emissão da NL inválida (AAAA-MM-DD)'),
  valor_liquidado: z.coerce
    .number({ invalid_type_error: 'Valor inválido' })
    .min(0.01, 'O valor liquidado deve ser maior que zero'),
  data_pagamento_ob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data da Ordem Bancária inválida (AAAA-MM-DD)')
    .optional()
    .nullable(),
});

export type EmpenhoFormData = z.infer<typeof empenhoSchema>;
export type EventoEmpenhoFormData = z.infer<typeof eventoEmpenhoSchema>;
export type LiquidacaoFormData = z.infer<typeof liquidacaoSchema>;
