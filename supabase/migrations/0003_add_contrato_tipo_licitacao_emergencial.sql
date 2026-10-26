-- ============================================================================
-- SGC-SEMPI / RJ: Adição de 3 Colunas de Informação em Contratos
-- Executar no Supabase SQL Editor (https://supabase.com/dashboard/project/wodxkxbdcbsfxzdpczuf/sql)
-- ============================================================================

-- 1. ENUMS E TIPOS PERSONALIZADOS
DO $$ BEGIN
    CREATE TYPE public.tipo_contrato AS ENUM ('CONTINUO', 'ESCOPO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.tipo_licitacao AS ENUM (
        'PREGAO_ELETRONICO',
        'DISPENSA_LICITACAO',
        'INEXIGIBILIDADE',
        'CONCORRENCIA'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. ADIÇÃO DAS NOVAS COLUNAS NA TABELA public.contratos
ALTER TABLE public.contratos
ADD COLUMN IF NOT EXISTS tipo_contrato public.tipo_contrato NOT NULL DEFAULT 'CONTINUO',
ADD COLUMN IF NOT EXISTS tipo_licitacao public.tipo_licitacao NOT NULL DEFAULT 'PREGAO_ELETRONICO',
ADD COLUMN IF NOT EXISTS emergencial BOOLEAN NOT NULL DEFAULT false;

-- 3. COMENTÁRIOS EXPLICATIVOS PARA AUDITORIA (CGE / TCE-RJ)
COMMENT ON COLUMN public.contratos.tipo_contrato IS 'Classificação da execução contratual: Contínuo ou Escopo (Lei nº 14.133/2021)';
COMMENT ON COLUMN public.contratos.tipo_licitacao IS 'Modalidade ou hipótese de contratação: Pregão Eletrônico, Dispensa de Licitação, Inexigibilidade ou Concorrência';
COMMENT ON COLUMN public.contratos.emergencial IS 'Indica se a contratação possui caráter emergencial (Não/Sim - Art. 75, VIII da Lei nº 14.133/2021)';
