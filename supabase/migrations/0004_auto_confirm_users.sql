-- ============================================================================
-- SGC-SEMPI / RJ: Desativação da Exigência de Confirmação de E-mail
-- Executar no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/wodxkxbdcbsfxzdpczuf/sql
-- ============================================================================

-- 1. Confirma imediatamente todos os usuários que foram criados e estão pendentes
UPDATE auth.users
SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. Cria trigger para confirmar automaticamente qualquer novo usuário cadastrado
-- Isso elimina o envio obrigatório de e-mail e o limite de 2 e-mails/hora do Supabase
CREATE OR REPLACE FUNCTION public.fn_auto_confirm_users()
RETURNS trigger AS $$
BEGIN
    NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_confirm_users ON auth.users;
CREATE TRIGGER trg_auto_confirm_users
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.fn_auto_confirm_users();

COMMENT ON FUNCTION public.fn_auto_confirm_users IS 'Confirmação automática de e-mail para usuários criados administrativamente no SGC-SEMPI';
