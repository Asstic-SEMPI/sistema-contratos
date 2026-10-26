-- ============================================================================
-- SGC-SEMPI / RJ: Criação do Usuário de Auditoria e Controle (CONSULTA_TCE)
-- Usuário com permissão para visualizar todas as telas, relatórios e auditorias,
-- mas estritamente impedido de realizar qualquer inserção, edição ou exclusão.
--
-- Credenciais:
-- E-mail: consulta.tce@sempi.com
-- Senha:  Consulta@Sempi2026!
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_email TEXT := 'consulta.tce@sempi.com';
    v_password TEXT := 'Consulta@Sempi2026!';
BEGIN
    -- 1. Verifica se já existe no auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
        SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

        UPDATE auth.users
        SET 
            encrypted_password = crypt(v_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            raw_app_meta_data = '{"provider":"email","providers":["email"]}',
            raw_user_meta_data = '{"nome_completo":"Auditor Tribunal de Contas (TCE-RJ / CGE-RJ)","id_funcional":"TCE-884920","role":"CONSULTA_TCE"}',
            updated_at = NOW()
        WHERE id = v_user_id;
    ELSE
        -- Cria o usuário no auth.users com confirmação de e-mail imediata
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"nome_completo":"Auditor Tribunal de Contas (TCE-RJ / CGE-RJ)","id_funcional":"TCE-884920","role":"CONSULTA_TCE"}',
            NOW(),
            NOW(),
            ''
        );
    END IF;

    -- 2. Insere ou atualiza o perfil em public.perfis_usuarios
    INSERT INTO public.perfis_usuarios (
        id,
        nome_completo,
        id_funcional,
        role,
        ativo,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        'Auditor Tribunal de Contas (TCE-RJ / CGE-RJ)',
        'TCE-884920',
        'CONSULTA_TCE',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        nome_completo = EXCLUDED.nome_completo,
        id_funcional = EXCLUDED.id_funcional,
        role = 'CONSULTA_TCE',
        ativo = true,
        updated_at = NOW();

    RAISE NOTICE 'Usuário CONSULTA_TCE (% / ID: %) criado/atualizado com sucesso!', v_email, v_user_id;
END $$;
