-- ============================================================================
-- SGC-SEMPI / RJ: Criação do Usuário Administrador Inicial
-- Executar no Supabase SQL Editor (https://supabase.com/dashboard/project/wodxkxbdcbsfxzdpczuf/sql)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_email TEXT := 'admin@sempi.rj.gov.br';
    v_password TEXT := 'Admin@Sempi2026!';
BEGIN
    -- 1. Verifica se já existe no auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
        SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

        UPDATE auth.users
        SET 
            encrypted_password = crypt(v_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            raw_app_meta_data = '{"provider":"email","providers":["email"]}',
            raw_user_meta_data = '{"nome_completo":"Administrador SEMPI","id_funcional":"9999999-1","role":"ADMIN"}',
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
            '{"nome_completo":"Administrador SEMPI","id_funcional":"9999999-1","role":"ADMIN"}',
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
        cpf,
        setor,
        role,
        ativo
    ) VALUES (
        v_user_id,
        'Administrador Geral SEMPI',
        '9999999-1',
        '000.000.000-00',
        'Gabinete / Assessoria de Contratos',
        'ADMIN',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'ADMIN',
        ativo = true,
        nome_completo = 'Administrador Geral SEMPI',
        updated_at = NOW();

    -- Também garante para admin@sempi.com caso tenha sido criado via API
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@sempi.com') THEN
        INSERT INTO public.perfis_usuarios (
            id,
            nome_completo,
            id_funcional,
            cpf,
            setor,
            role,
            ativo
        ) VALUES (
            (SELECT id FROM auth.users WHERE email = 'admin@sempi.com'),
            'Administrador do Sistema SEMPI',
            '9999998-1',
            '111.111.111-11',
            'Gabinete / Assessoria de Contratos',
            'ADMIN',
            true
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'ADMIN',
            ativo = true;

        UPDATE auth.users
        SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
        WHERE email = 'admin@sempi.com';
    END IF;

END $$;
