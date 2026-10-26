import { z } from 'zod';

export const fiscalSchema = z.object({
  contrato_id: z.string().uuid('ID do contrato inválido'),
  nome: z.string().min(3, 'Informe o nome completo do servidor').trim(),
  id_funcional: z
    .string()
    .min(5, 'Informe o ID Funcional do servidor no padrão RJ (Ex: 4321987-1)')
    .trim(),
  funcao: z.enum(['GESTOR', 'FISCAL_TECNICO', 'FISCAL_ADMINISTRATIVO', 'SUPLENTE'], {
    required_error: 'Selecione a função na comissão',
  }),
  portaria_designacao: z
    .string()
    .min(3, 'Informe o número da Portaria (Ex: Portaria SEMPI nº 012/2026)')
    .trim(),
  data_publicacao_doerj: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de publicação no DOERJ inválida (AAAA-MM-DD)'),
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início inválida (AAAA-MM-DD)'),
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de término inválida (AAAA-MM-DD)')
    .optional()
    .nullable(),
  usuario_id: z.string().uuid().optional().nullable(),
});

export const swapFiscalSchema = z.object({
  contrato_id: z.string().uuid('ID do contrato inválido'),
  fiscal_anterior_id: z.string().uuid('ID do fiscal a ser substituído inválido'),
  nome_novo: z.string().min(3, 'Informe o nome do novo fiscal').trim(),
  id_funcional_novo: z.string().min(5, 'Informe o ID Funcional do novo fiscal').trim(),
  funcao: z.enum(['GESTOR', 'FISCAL_TECNICO', 'FISCAL_ADMINISTRATIVO', 'SUPLENTE']),
  nova_portaria: z.string().min(3, 'Informe o número da nova Portaria no DOERJ').trim(),
  data_publicacao_doerj: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data DOERJ inválida'),
  data_substituicao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de substituição inválida'),
  motivo_substituicao: z.string().optional().nullable(),
});

export type FiscalFormData = z.infer<typeof fiscalSchema>;
export type SwapFiscalFormData = z.infer<typeof swapFiscalSchema>;
