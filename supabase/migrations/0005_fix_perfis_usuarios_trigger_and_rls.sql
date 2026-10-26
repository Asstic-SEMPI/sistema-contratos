-- ============================================================================
-- SGC-SEMPI / RJ: Ajuste Definitivo de RLS e Auto-Criação de Perfis de Usuários
-- Executar no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/wodxkxbdcbsfxzdpczuf/sql
-- ============================================================================

-- 1. Políticas RLS Robustas em public.perfis_usuarios
ALTER TABLE public.perfis_usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de perfis para usuários autenticados ativos" ON public.perfis_usuarios;
CREATE POLICY "Leitura de perfis para usuários autenticados ativos" ON public.perfis_usuarios
    FOR SELECT 
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Apenas ADMIN gerencia perfis" ON public.perfis_usuarios;
DROP POLICY IF EXISTS "ADMIN gerencia todos os perfis" ON public.perfis_usuarios;
CREATE POLICY "ADMIN gerencia todos os perfis" ON public.perfis_usuarios
    FOR ALL 
    USING (public.fn_get_my_role() = 'ADMIN')
    WITH CHECK (public.fn_get_my_role() = 'ADMIN');

DROP POLICY IF EXISTS "Usuário grava seu próprio perfil" ON public.perfis_usuarios;
CREATE POLICY "Usuário grava seu próprio perfil" ON public.perfis_usuarios
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuário atualiza seu próprio perfil" ON public.perfis_usuarios;
CREATE POLICY "Usuário atualiza seu próprio perfil" ON public.perfis_usuarios
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 2. Trigger SECURITY DEFINER na criação de usuários em auth.users
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.perfis_usuarios (
        id,
        nome_completo,
        id_funcional,
        cpf,
        setor,
        role,
        ativo
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'id_funcional', 'SEM_ID'),
        COALESCE(NEW.raw_user_meta_data->>'cpf', '000.000.000-00'),
        COALESCE(NEW.raw_user_meta_data->>'setor', 'SEMPI'),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'FISCAL'::public.user_role),
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        nome_completo = COALESCE(EXCLUDED.nome_completo, perfis_usuarios.nome_completo),
        id_funcional = COALESCE(EXCLUDED.id_funcional, perfis_usuarios.id_funcional),
        cpf = COALESCE(EXCLUDED.cpf, perfis_usuarios.cpf),
        setor = COALESCE(EXCLUDED.setor, perfis_usuarios.setor),
        role = COALESCE(EXCLUDED.role, perfis_usuarios.role),
        ativo = true;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.fn_handle_new_user();

-- 3. Função de sincronização manual ou automática via RPC
CREATE OR REPLACE FUNCTION public.fn_sync_missing_perfis()
RETURNS void AS $$
BEGIN
    INSERT INTO public.perfis_usuarios (
        id,
        nome_completo,
        id_funcional,
        cpf,
        setor,
        role,
        ativo
    )
    SELECT 
        u.id,
        COALESCE(u.raw_user_meta_data->>'nome_completo', split_part(u.email, '@', 1)),
        COALESCE(u.raw_user_meta_data->>'id_funcional', 'SEM_ID'),
        COALESCE(u.raw_user_meta_data->>'cpf', '000.000.000-00'),
        COALESCE(u.raw_user_meta_data->>'setor', 'SEMPI'),
        COALESCE((u.raw_user_meta_data->>'role')::public.user_role, 'FISCAL'::public.user_role),
        true
    FROM auth.users u
    LEFT JOIN public.perfis_usuarios p ON p.id = u.id
    WHERE p.id IS NULL
    ON CONFLICT (id) DO UPDATE SET
        nome_completo = EXCLUDED.nome_completo,
        id_funcional = EXCLUDED.id_funcional,
        cpf = EXCLUDED.cpf,
        setor = EXCLUDED.setor,
        role = EXCLUDED.role,
        ativo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.fn_sync_missing_perfis() TO authenticated, service_role, anon;

-- 4. Executa a sincronização IMEDIATAMENTE para trazer usuárias/usuários pendentes
SELECT public.fn_sync_missing_perfis();
