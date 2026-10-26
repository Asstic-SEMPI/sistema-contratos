-- ============================================================================
-- SISTEMA DE GESTÃO DE CONTRATOS E ATAS (SGC-SEMPI / RJ)
-- Script Consolidado para Supabase (PostgreSQL 15+)
-- ============================================================================

-- Extensão necessária para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS E TIPOS PERSONALIZADOS
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('ADMIN', 'GESTOR_CONTRATOS', 'FINANCEIRO', 'FISCAL', 'CONSULTA_TCE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.tipo_instrumento AS ENUM ('CONTRATO_FORMAL', 'NOTA_EMPENHO_FORCA_CONTRATO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.tipo_alteracao AS ENUM ('ADITIVO_PRAZO', 'ADITIVO_VALOR', 'ADITIVO_MISTO', 'APOSTILAMENTO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.papel_ata AS ENUM ('GERENCIADOR', 'PARTICIPANTE', 'CARONA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.funcao_fiscal AS ENUM ('GESTOR', 'FISCAL_TECNICO', 'FISCAL_ADMINISTRATIVO', 'SUPLENTE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.status_instrumento AS ENUM ('VIGENTE', 'ENCERRADO', 'RESCINDIDO', 'SUSPENSO', 'EM_FORMALIZACAO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE public.tipo_evento_empenho AS ENUM ('REFORCO', 'ANULACAO_PARCIAL', 'ANULACAO_TOTAL', 'CANCELAMENTO_RP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 2. TABELAS CORE DO SISTEMA
-- ============================================================================

-- 2.1. PERFIS DE USUÁRIOS (RBAC vinculado ao Supabase Auth)
CREATE TABLE public.perfis_usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo TEXT NOT NULL,
    id_funcional VARCHAR(20) UNIQUE NOT NULL, -- Padrão RJ (Ex: 4321987-1)
    cpf VARCHAR(14) UNIQUE NOT NULL,
    setor VARCHAR(50) NOT NULL,
    role public.user_role NOT NULL DEFAULT 'FISCAL',
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2. ATAS DE REGISTRO DE PREÇOS (ARP - Gerenciadas e Participantes)
CREATE TABLE public.atas_registro_preco (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_ata VARCHAR(30) NOT NULL, -- Ex: 004/2026
    processo_sei VARCHAR(35) NOT NULL, -- Ex: SEI-XXXX/000123/2026
    codigo_siga_arp VARCHAR(50),
    papel_secretaria public.papel_ata NOT NULL,
    orgao_gerenciador VARCHAR(150) NOT NULL DEFAULT 'Secretaria de Estado da Mulher e de Políticas Inclusivas - SEMPI',
    objeto TEXT NOT NULL,
    data_publicacao_pncp DATE NOT NULL,
    data_vigencia_inicio DATE NOT NULL,
    data_vigencia_fim DATE NOT NULL,
    prorrogavel BOOLEAN NOT NULL DEFAULT true, -- Lei 14.133 permite +1 ano
    status public.status_instrumento NOT NULL DEFAULT 'VIGENTE',
    observacoes TEXT,
    created_by UUID REFERENCES public.perfis_usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_ata_vigencia CHECK (data_vigencia_fim >= data_vigencia_inicio),
    CONSTRAINT uq_numero_ata_orgao UNIQUE (numero_ata, orgao_gerenciador)
);

-- 2.3. ITENS DA ATA DE REGISTRO DE PREÇOS (Catálogo SIGA-RJ)
CREATE TABLE public.atas_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ata_id UUID NOT NULL REFERENCES public.atas_registro_preco(id) ON DELETE CASCADE,
    item_numero INTEGER NOT NULL,
    codigo_item_siga VARCHAR(30) NOT NULL,
    descricao TEXT NOT NULL,
    fornecedor_cnpj VARCHAR(18) NOT NULL,
    fornecedor_razao_social TEXT NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    valor_unitario NUMERIC(15,4) NOT NULL CHECK (valor_unitario > 0),
    qtd_total_registrada NUMERIC(15,2) NOT NULL CHECK (qtd_total_registrada > 0),
    qtd_cota_secretaria NUMERIC(15,2) NOT NULL CHECK (qtd_cota_secretaria > 0),
    qtd_empenhada_secretaria NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (qtd_empenhada_secretaria >= 0),
    saldo_disponivel NUMERIC(15,2) GENERATED ALWAYS AS (qtd_cota_secretaria - qtd_empenhada_secretaria) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ata_item_numero UNIQUE (ata_id, item_numero),
    CONSTRAINT chk_cota_menor_igual_total CHECK (qtd_cota_secretaria <= qtd_total_registrada),
    CONSTRAINT chk_empenho_nao_excede_cota CHECK (qtd_empenhada_secretaria <= qtd_cota_secretaria)
);

-- 2.4. CONTRATOS E INSTRUMENTOS SUBSTITUTIVOS (Art. 95 Lei 14.133)
CREATE TABLE public.contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ata_origem_id UUID REFERENCES public.atas_registro_preco(id) ON DELETE RESTRICT,
    tipo_formalizacao public.tipo_instrumento NOT NULL DEFAULT 'CONTRATO_FORMAL',
    numero_contrato VARCHAR(30) UNIQUE, -- Obrigatório para CONTRATO_FORMAL; Opcional para Empenho Direto
    processo_sei VARCHAR(35) NOT NULL,
    chave_siga_contrato VARCHAR(50) UNIQUE NOT NULL,
    contratada_cnpj VARCHAR(18) NOT NULL,
    contratada_razao_social TEXT NOT NULL,
    objeto TEXT NOT NULL,
    valor_inicial NUMERIC(15,2) NOT NULL CHECK (valor_inicial >= 0),
    valor_atualizado NUMERIC(15,2) NOT NULL CHECK (valor_atualizado >= 0),
    data_publicacao_pncp DATE NOT NULL,
    data_vigencia_inicio_original DATE NOT NULL,
    data_vigencia_fim_original DATE NOT NULL,
    data_vigencia_fim_atual DATE NOT NULL,
    observacoes TEXT,
    status public.status_instrumento NOT NULL DEFAULT 'VIGENTE',
    created_by UUID REFERENCES public.perfis_usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_contrato_vigencia CHECK (data_vigencia_fim_original >= data_vigencia_inicio_original),
    CONSTRAINT chk_numero_contrato_obrigatorio CHECK (
        (tipo_formalizacao = 'CONTRATO_FORMAL' AND numero_contrato IS NOT NULL)
        OR (tipo_formalizacao = 'NOTA_EMPENHO_FORCA_CONTRATO')
    )
);

-- 2.5. ALTERAÇÕES CONTRATUAIS (Termos Aditivos e Apostilamentos)
CREATE TABLE public.alteracoes_contratuais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
    procedimento VARCHAR(40) NOT NULL, -- Ex: 1º Termo Aditivo, 1º Apostilamento
    processo_sei VARCHAR(35) NOT NULL,
    chave_siga_termo VARCHAR(50),
    tipo public.tipo_alteracao NOT NULL,
    justificativa_resumo TEXT NOT NULL,
    valor_diferenca NUMERIC(15,2) NOT NULL DEFAULT 0, -- Positivo (acréscimo/reajuste) ou Negativo (supressão)
    data_assinatura DATE NOT NULL,
    vigencia_termo_inicio DATE, -- Obrigatório apenas para ADITIVO_PRAZO e ADITIVO_MISTO
    vigencia_termo_fim DATE,
    publicacao_doerj_data DATE,
    publicacao_doerj_pagina VARCHAR(20),
    publicacao_pncp_data DATE,
    observacoes TEXT,
    created_by UUID REFERENCES public.perfis_usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_contrato_procedimento UNIQUE (contrato_id, procedimento),
    CONSTRAINT chk_vigencia_obrigatoria_prazo CHECK (
        (tipo IN ('ADITIVO_PRAZO', 'ADITIVO_MISTO') AND vigencia_termo_inicio IS NOT NULL AND vigencia_termo_fim IS NOT NULL AND vigencia_termo_fim >= vigencia_termo_inicio)
        OR (tipo IN ('ADITIVO_VALOR', 'APOSTILAMENTO'))
    )
);

-- 2.6. FINANCEIRO: NOTAS DE EMPENHO (SIAFE-Rio + Chave SIGA)
CREATE TABLE public.financeiro_empenhos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
    alteracao_id UUID REFERENCES public.alteracoes_contratuais(id) ON DELETE SET NULL,
    processo_sei VARCHAR(35) NOT NULL,
    chave_siga VARCHAR(50) NOT NULL,
    numero_nota_empenho VARCHAR(30) UNIQUE NOT NULL, -- Ex: 2026NE00145
    tipo_empenho VARCHAR(20) NOT NULL DEFAULT 'ORDINARIO' CHECK (tipo_empenho IN ('ORDINARIO', 'ESTIMATIVO', 'GLOBAL')),
    data_emissao DATE NOT NULL,
    data_referencia_vigencia DATE NOT NULL DEFAULT CURRENT_DATE, -- Data base para cruzamento automático de vigência
    programa_trabalho VARCHAR(40) NOT NULL,
    natureza_despesa VARCHAR(20) NOT NULL,
    fonte_recurso VARCHAR(20) NOT NULL,
    valor_empenhado_inicial NUMERIC(15,2) NOT NULL CHECK (valor_empenhado_inicial > 0),
    valor_reforcado NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (valor_reforcado >= 0),
    valor_anulado NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (valor_anulado >= 0),
    saldo_empenho_liquido NUMERIC(15,2) GENERATED ALWAYS AS (
        valor_empenhado_inicial + valor_reforcado - valor_anulado
    ) STORED,
    vinculo_automatico_detectado VARCHAR(50), -- Preenchido via Trigger ('CONTRATO_INICIAL', nome do Aditivo ou Alerta)
    created_by UUID REFERENCES public.perfis_usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_anulacao_limite CHECK (valor_anulado <= (valor_empenhado_inicial + valor_reforcado))
);

-- 2.7. FINANCEIRO: EVENTOS DE EMPENHO (Reforços e Anulações no SIAFE-Rio)
CREATE TABLE public.financeiro_empenhos_eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empenho_original_id UUID NOT NULL REFERENCES public.financeiro_empenhos(id) ON DELETE CASCADE,
    tipo_evento public.tipo_evento_empenho NOT NULL,
    numero_ne_evento VARCHAR(30) UNIQUE NOT NULL, -- NE gerada no SIAFE para o reforço/anulação (Ex: 2026NE00312)
    processo_sei VARCHAR(35) NOT NULL,
    chave_siga VARCHAR(50),
    data_evento DATE NOT NULL,
    valor_evento NUMERIC(15,2) NOT NULL CHECK (valor_evento > 0),
    motivo TEXT NOT NULL,
    created_by UUID REFERENCES public.perfis_usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8. FINANCEIRO: LIQUIDAÇÕES (Notas Fiscais e NL SIAFE-Rio)
CREATE TABLE public.financeiro_liquidacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empenho_id UUID NOT NULL REFERENCES public.financeiro_empenhos(id) ON DELETE CASCADE,
    processo_sei VARCHAR(35) NOT NULL,
    numero_nota_fiscal VARCHAR(50) NOT NULL,
    data_emissao_nota_fiscal DATE NOT NULL,
    competencia_mes_ano VARCHAR(7) NOT NULL, -- Ex: '10/2026'
    numero_nota_liquidacao VARCHAR(30) UNIQUE NOT NULL, -- Ex: 2026NL00145
    data_emissao_nl DATE NOT NULL,
    valor_liquidado NUMERIC(15,2) NOT NULL CHECK (valor_liquidado > 0),
    data_pagamento_ob DATE,
    created_by UUID REFERENCES public.perfis_usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.9. CONSUMO DE ATAS POR EMPENHO (Baixa automática de saldo por item)
CREATE TABLE public.atas_consumo_empenhos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ata_item_id UUID NOT NULL REFERENCES public.atas_itens(id) ON DELETE RESTRICT,
    empenho_id UUID NOT NULL REFERENCES public.financeiro_empenhos(id) ON DELETE CASCADE,
    quantidade_consumida NUMERIC(15,2) NOT NULL CHECK (quantidade_consumida > 0),
    created_by UUID REFERENCES public.perfis_usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_item_por_empenho UNIQUE (ata_item_id, empenho_id)
);

-- 2.10. COMISSÃO DE FISCALIZAÇÃO E GESTÃO DE CONTRATOS
CREATE TABLE public.contrato_fiscais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.perfis_usuarios(id) ON DELETE SET NULL, -- Permite vincular login quando o fiscal tiver conta
    nome VARCHAR(120) NOT NULL,
    id_funcional VARCHAR(20) NOT NULL,
    funcao public.funcao_fiscal NOT NULL,
    portaria_designacao VARCHAR(50) NOT NULL,
    data_publicacao_doerj DATE NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    ativo BOOLEAN NOT NULL DEFAULT true,
    data_substituicao DATE,
    created_by UUID REFERENCES public.perfis_usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.11. TRILHA DE AUDITORIA IMUTÁVEL (Audit Logs)
CREATE TABLE public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tabela_afetada VARCHAR(60) NOT NULL,
    registro_id UUID NOT NULL,
    acao VARCHAR(10) NOT NULL CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE')),
    usuario_id UUID REFERENCES public.perfis_usuarios(id) ON DELETE SET NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    campos_alterados TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. ÍNDICES DE PERFORMANCE PARA BUSCAS RÁPIDAS (SEI, SIGA, VIGÊNCIAS)
-- ============================================================================
CREATE INDEX idx_contratos_sei ON public.contratos(processo_sei);
CREATE INDEX idx_contratos_siga ON public.contratos(chave_siga_contrato);
CREATE INDEX idx_contratos_vigencia ON public.contratos(data_vigencia_fim_atual);
CREATE INDEX idx_empenhos_contrato ON public.financeiro_empenhos(contrato_id);
CREATE INDEX idx_empenhos_siga ON public.financeiro_empenhos(chave_siga);
CREATE INDEX idx_atas_sei ON public.atas_registro_preco(processo_sei);
CREATE INDEX idx_fiscais_contrato_ativo ON public.contrato_fiscais(contrato_id, ativo);
CREATE INDEX idx_fiscais_usuario ON public.contrato_fiscais(usuario_id);
CREATE INDEX idx_audit_tabela_registro ON public.audit_logs(tabela_afetada, registro_id);
CREATE INDEX idx_audit_created_at ON public.audit_logs(created_at DESC);

-- ============================================================================
-- 4. TRIGGERS DE REGRAS DE NEGÓCIO E AUTOMAÇÃO
-- ============================================================================

-- 4.1. Atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_updated_perfis BEFORE UPDATE ON public.perfis_usuarios FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_atas BEFORE UPDATE ON public.atas_registro_preco FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_atas_itens BEFORE UPDATE ON public.atas_itens FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_contratos BEFORE UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_alteracoes BEFORE UPDATE ON public.alteracoes_contratuais FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_empenhos BEFORE UPDATE ON public.financeiro_empenhos FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_updated_fiscais BEFORE UPDATE ON public.contrato_fiscais FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 4.2. Bloqueia Termo Aditivo em contratações feitas apenas por Nota de Empenho (Art. 95 Lei 14.133)
CREATE OR REPLACE FUNCTION public.fn_validar_aditivo_apenas_contrato_formal()
RETURNS TRIGGER AS $$
DECLARE
    v_tipo public.tipo_instrumento;
BEGIN
    SELECT tipo_formalizacao INTO v_tipo FROM public.contratos WHERE id = NEW.contrato_id;
    
    IF v_tipo = 'NOTA_EMPENHO_FORCA_CONTRATO' AND NEW.tipo <> 'APOSTILAMENTO' THEN
        RAISE EXCEPTION 'Operação bloqueada: Contratações formalizadas exclusivamente por Nota de Empenho (Art. 95 da Lei 14.133/21) não admitem Termos Aditivos.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_aditivo_instrumento
BEFORE INSERT OR UPDATE ON public.alteracoes_contratuais
FOR EACH ROW EXECUTE FUNCTION public.fn_validar_aditivo_apenas_contrato_formal();

-- 4.3. Recalcula Valor Atualizado e Vigência Atual do Contrato após Aditivos/Apostilamentos
CREATE OR REPLACE FUNCTION public.fn_atualizar_contrato_pos_aditivo()
RETURNS TRIGGER AS $$
DECLARE
    v_contrato_id UUID := COALESCE(NEW.contrato_id, OLD.contrato_id);
    v_soma_diferencas NUMERIC(15,2);
    v_maior_data_fim DATE;
BEGIN
    SELECT COALESCE(SUM(valor_diferenca), 0) INTO v_soma_diferencas
    FROM public.alteracoes_contratuais
    WHERE contrato_id = v_contrato_id;

    SELECT MAX(vigencia_termo_fim) INTO v_maior_data_fim
    FROM public.alteracoes_contratuais
    WHERE contrato_id = v_contrato_id
      AND tipo IN ('ADITIVO_PRAZO', 'ADITIVO_MISTO');

    UPDATE public.contratos
    SET 
        valor_atualizado = valor_inicial + v_soma_diferencas,
        data_vigencia_fim_atual = COALESCE(v_maior_data_fim, data_vigencia_fim_original),
        updated_at = NOW()
    WHERE id = v_contrato_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_contrato_aditivos
AFTER INSERT OR UPDATE OR DELETE ON public.alteracoes_contratuais
FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_contrato_pos_aditivo();

-- 4.4. Cruza automaticamente Empenho/Chave SIGA com a Janela de Vigência (Contrato Inicial vs. Aditivos)
CREATE OR REPLACE FUNCTION public.fn_classificar_empenho_por_vigencia()
RETURNS TRIGGER AS $$
DECLARE
    v_contrato RECORD;
    v_aditivo RECORD;
BEGIN
    SELECT * INTO v_contrato FROM public.contratos WHERE id = NEW.contrato_id;

    -- Se o usuário já informou manualmente o alteracao_id, respeita e preenche o nome do procedimento
    IF NEW.alteracao_id IS NOT NULL THEN
        SELECT id, procedimento INTO v_aditivo 
        FROM public.alteracoes_contratuais 
        WHERE id = NEW.alteracao_id AND contrato_id = NEW.contrato_id;
        
        IF FOUND THEN
            NEW.vinculo_automatico_detectado := v_aditivo.procedimento;
            RETURN NEW;
        END IF;
    END IF;

    -- Busca automática pela data_referencia_vigencia nas janelas de Aditivos de Prazo/Misto
    SELECT id, procedimento INTO v_aditivo
    FROM public.alteracoes_contratuais
    WHERE contrato_id = NEW.contrato_id
      AND tipo IN ('ADITIVO_PRAZO', 'ADITIVO_MISTO')
      AND NEW.data_referencia_vigencia >= vigencia_termo_inicio
      AND NEW.data_referencia_vigencia <= vigencia_termo_fim
    ORDER BY vigencia_termo_inicio DESC
    LIMIT 1;

    IF FOUND THEN
        NEW.alteracao_id := v_aditivo.id;
        NEW.vinculo_automatico_detectado := v_aditivo.procedimento;
    ELSIF NEW.data_referencia_vigencia >= v_contrato.data_vigencia_inicio_original 
      AND NEW.data_referencia_vigencia <= v_contrato.data_vigencia_fim_original THEN
        NEW.alteracao_id := NULL;
        NEW.vinculo_automatico_detectado := 'CONTRATO_INICIAL';
    ELSE
        NEW.alteracao_id := NULL;
        NEW.vinculo_automatico_detectado := 'ALERTA_FORA_DE_VIGENCIA';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_classifica_empenho
BEFORE INSERT OR UPDATE ON public.financeiro_empenhos
FOR EACH ROW EXECUTE FUNCTION public.fn_classificar_empenho_por_vigencia();

-- 4.5. Recalcula Reforços e Anulações na Nota de Empenho Original
CREATE OR REPLACE FUNCTION public.fn_atualizar_saldo_empenho_eventos()
RETURNS TRIGGER AS $$
DECLARE
    v_empenho_id UUID := COALESCE(NEW.empenho_original_id, OLD.empenho_original_id);
    v_total_reforco NUMERIC(15,2);
    v_total_anulado NUMERIC(15,2);
BEGIN
    SELECT COALESCE(SUM(valor_evento), 0) INTO v_total_reforco
    FROM public.financeiro_empenhos_eventos
    WHERE empenho_original_id = v_empenho_id AND tipo_evento = 'REFORCO';

    SELECT COALESCE(SUM(valor_evento), 0) INTO v_total_anulado
    FROM public.financeiro_empenhos_eventos
    WHERE empenho_original_id = v_empenho_id 
      AND tipo_evento IN ('ANULACAO_PARCIAL', 'ANULACAO_TOTAL', 'CANCELAMENTO_RP');

    UPDATE public.financeiro_empenhos
    SET 
        valor_reforcado = v_total_reforco,
        valor_anulado = v_total_anulado,
        updated_at = NOW()
    WHERE id = v_empenho_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_eventos_empenho
AFTER INSERT OR UPDATE OR DELETE ON public.financeiro_empenhos_eventos
FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_saldo_empenho_eventos();

-- 4.6. Abate Automático de Saldo de Ata de Registro de Preços
CREATE OR REPLACE FUNCTION public.fn_atualizar_consumo_ata()
RETURNS TRIGGER AS $$
DECLARE
    v_ata_item_id UUID := COALESCE(NEW.ata_item_id, OLD.ata_item_id);
    v_total_consumido NUMERIC(15,2);
BEGIN
    SELECT COALESCE(SUM(quantidade_consumida), 0) INTO v_total_consumido
    FROM public.atas_consumo_empenhos
    WHERE ata_item_id = v_ata_item_id;

    UPDATE public.atas_itens
    SET 
        qtd_empenhada_secretaria = v_total_consumido,
        updated_at = NOW()
    WHERE id = v_ata_item_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_consumo_ata
AFTER INSERT OR UPDATE OR DELETE ON public.atas_consumo_empenhos
FOR EACH ROW EXECUTE FUNCTION public.fn_atualizar_consumo_ata();

-- ============================================================================
-- 5. MOTOR DE AUDITORIA AUTOMÁTICA (DIFF JSONB)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_changed_fields TEXT[] := ARRAY[]::TEXT[];
    v_key TEXT;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        FOR v_key IN SELECT jsonb_object_keys(v_new_data) LOOP
            IF v_key <> 'updated_at' AND (v_old_data->v_key IS DISTINCT FROM v_new_data->v_key) THEN
                v_changed_fields := array_append(v_changed_fields, v_key);
            END IF;
        END LOOP;
        -- Se nada mudou além de updated_at, evita poluir o log
        IF array_length(v_changed_fields, 1) IS NULL THEN
            RETURN NEW;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
    END IF;

    INSERT INTO public.audit_logs (
        tabela_afetada, registro_id, acao, usuario_id, dados_antigos, dados_novos, campos_alterados
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        auth.uid(),
        v_old_data,
        v_new_data,
        v_changed_fields
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplica Auditoria em todas as tabelas de negócio
CREATE TRIGGER audit_perfis AFTER INSERT OR UPDATE OR DELETE ON public.perfis_usuarios FOR EACH ROW EXECUTE FUNCTION public.fn_process_audit_log();
CREATE TRIGGER audit_atas AFTER INSERT OR UPDATE OR DELETE ON public.atas_registro_preco FOR EACH ROW EXECUTE FUNCTION public.fn_process_audit_log();
CREATE TRIGGER audit_atas_itens AFTER INSERT OR UPDATE OR DELETE ON public.atas_itens FOR EACH ROW EXECUTE FUNCTION public.fn_process_audit_log();
CREATE TRIGGER audit_contratos AFTER INSERT OR UPDATE OR DELETE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.fn_process_audit_log();
CREATE TRIGGER audit_alteracoes AFTER INSERT OR UPDATE OR DELETE ON public.alteracoes_contratuais FOR EACH ROW EXECUTE FUNCTION public.fn_process_audit_log();
CREATE TRIGGER audit_empenhos AFTER INSERT OR UPDATE OR DELETE ON public.financeiro_empenhos FOR EACH ROW EXECUTE FUNCTION public.fn_process_audit_log();
CREATE TRIGGER audit_empenhos_eventos AFTER INSERT OR UPDATE OR DELETE ON public.financeiro_empenhos_eventos FOR EACH ROW EXECUTE FUNCTION public.fn_process_audit_log();
CREATE TRIGGER audit_liquidacoes AFTER INSERT OR UPDATE OR DELETE ON public.financeiro_liquidacoes FOR EACH ROW EXECUTE FUNCTION public.fn_process_audit_log();
CREATE TRIGGER audit_atas_consumo AFTER INSERT OR UPDATE OR DELETE ON public.atas_consumo_empenhos FOR EACH ROW EXECUTE FUNCTION public.fn_process_audit_log();
CREATE TRIGGER audit_fiscais AFTER INSERT OR UPDATE OR DELETE ON public.contrato_fiscais FOR EACH ROW EXECUTE FUNCTION public.fn_process_audit_log();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) E FUNÇÕES DE AUTORIZAÇÃO
-- ============================================================================

-- Funções Helper com SECURITY DEFINER (Evitam recursão de RLS ao checar o perfil do usuário logado)
CREATE OR REPLACE FUNCTION public.fn_get_my_role()
RETURNS public.user_role AS $$
    SELECT role FROM public.perfis_usuarios WHERE id = auth.uid() AND ativo = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.fn_is_fiscal_do_contrato(p_contrato_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.contrato_fiscais cf
        LEFT JOIN public.perfis_usuarios pu ON pu.id = auth.uid()
        WHERE cf.contrato_id = p_contrato_id
          AND cf.ativo = true
          AND (cf.usuario_id = auth.uid() OR cf.id_funcional = pu.id_funcional)
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Habilita RLS em todas as tabelas
ALTER TABLE public.perfis_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atas_registro_preco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atas_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alteracoes_contratuais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_empenhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_empenhos_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_liquidacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atas_consumo_empenhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 6.1. Políticas: perfis_usuarios
CREATE POLICY "Leitura de perfis para usuários autenticados ativos" ON public.perfis_usuarios
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas ADMIN gerencia perfis" ON public.perfis_usuarios
    FOR ALL USING (public.fn_get_my_role() = 'ADMIN');

-- 6.2. Políticas: atas_registro_preco e atas_itens
CREATE POLICY "Leitura de Atas para todos os perfis internos" ON public.atas_registro_preco
    FOR SELECT USING (public.fn_get_my_role() IS NOT NULL);

CREATE POLICY "Gestão de Atas para ADMIN e GESTOR_CONTRATOS" ON public.atas_registro_preco
    FOR ALL USING (public.fn_get_my_role() IN ('ADMIN', 'GESTOR_CONTRATOS'));

CREATE POLICY "Leitura de Itens de Ata para todos os perfis internos" ON public.atas_itens
    FOR SELECT USING (public.fn_get_my_role() IS NOT NULL);

CREATE POLICY "Gestão de Itens de Ata para ADMIN e GESTOR_CONTRATOS" ON public.atas_itens
    FOR ALL USING (public.fn_get_my_role() IN ('ADMIN', 'GESTOR_CONTRATOS'));

-- 6.3. Políticas: contratos e alteracoes_contratuais
CREATE POLICY "Leitura de Contratos (Geral ou Fiscal designado)" ON public.contratos
    FOR SELECT USING (
        public.fn_get_my_role() IN ('ADMIN', 'GESTOR_CONTRATOS', 'FINANCEIRO', 'CONSULTA_TCE')
        OR (public.fn_get_my_role() = 'FISCAL' AND public.fn_is_fiscal_do_contrato(id))
    );

CREATE POLICY "Gestão de Contratos para ADMIN e GESTOR_CONTRATOS" ON public.contratos
    FOR ALL USING (public.fn_get_my_role() IN ('ADMIN', 'GESTOR_CONTRATOS'));

CREATE POLICY "Leitura de Alterações Contratuais" ON public.alteracoes_contratuais
    FOR SELECT USING (
        public.fn_get_my_role() IN ('ADMIN', 'GESTOR_CONTRATOS', 'FINANCEIRO', 'CONSULTA_TCE')
        OR (public.fn_get_my_role() = 'FISCAL' AND public.fn_is_fiscal_do_contrato(contrato_id))
    );

CREATE POLICY "Gestão de Alterações para ADMIN e GESTOR_CONTRATOS" ON public.alteracoes_contratuais
    FOR ALL USING (public.fn_get_my_role() IN ('ADMIN', 'GESTOR_CONTRATOS'));

-- 6.4. Políticas: Módulo Financeiro (Empenhos, Eventos, Liquidações e Consumo de Ata)
CREATE POLICY "Leitura Financeira (Geral ou Fiscal do contrato)" ON public.financeiro_empenhos
    FOR SELECT USING (
        public.fn_get_my_role() IN ('ADMIN', 'GESTOR_CONTRATOS', 'FINANCEIRO', 'CONSULTA_TCE')
        OR (public.fn_get_my_role() = 'FISCAL' AND public.fn_is_fiscal_do_contrato(contrato_id))
    );

CREATE POLICY "Escrita Financeira para ADMIN e FINANCEIRO" ON public.financeiro_empenhos
    FOR ALL USING (public.fn_get_my_role() IN ('ADMIN', 'FINANCEIRO'));

CREATE POLICY "Leitura Eventos de Empenho" ON public.financeiro_empenhos_eventos
    FOR SELECT USING (public.fn_get_my_role() IS NOT NULL);

CREATE POLICY "Escrita Eventos de Empenho para ADMIN e FINANCEIRO" ON public.financeiro_empenhos_eventos
    FOR ALL USING (public.fn_get_my_role() IN ('ADMIN', 'FINANCEIRO'));

CREATE POLICY "Leitura Liquidações" ON public.financeiro_liquidacoes
    FOR SELECT USING (public.fn_get_my_role() IS NOT NULL);

CREATE POLICY "Escrita Liquidações para ADMIN, FINANCEIRO e FISCAL" ON public.financeiro_liquidacoes
    FOR ALL USING (public.fn_get_my_role() IN ('ADMIN', 'FINANCEIRO', 'FISCAL'));

CREATE POLICY "Leitura Consumo de Ata" ON public.atas_consumo_empenhos
    FOR SELECT USING (public.fn_get_my_role() IS NOT NULL);

CREATE POLICY "Escrita Consumo de Ata para ADMIN, GESTOR e FINANCEIRO" ON public.atas_consumo_empenhos
    FOR ALL USING (public.fn_get_my_role() IN ('ADMIN', 'GESTOR_CONTRATOS', 'FINANCEIRO'));

-- 6.5. Políticas: contrato_fiscais
CREATE POLICY "Leitura de Fiscais para todos os perfis internos" ON public.contrato_fiscais
    FOR SELECT USING (public.fn_get_my_role() IS NOT NULL);

CREATE POLICY "Designação de Fiscais para ADMIN e GESTOR_CONTRATOS" ON public.contrato_fiscais
    FOR ALL USING (public.fn_get_my_role() IN ('ADMIN', 'GESTOR_CONTRATOS'));

-- 6.6. Políticas: audit_logs (Estritamente Imutável - Apenas SELECT para Admin e Controle)
CREATE POLICY "Leitura exclusiva da Auditoria para ADMIN e CONSULTA_TCE" ON public.audit_logs
    FOR SELECT USING (public.fn_get_my_role() IN ('ADMIN', 'CONSULTA_TCE'));