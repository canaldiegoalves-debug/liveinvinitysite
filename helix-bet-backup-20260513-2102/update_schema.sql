-- Adiciona as colunas ausentes na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_deposited numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_withdrawn numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_lost numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_bet numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS games_played integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS games_won integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS games_lost integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_influencer boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS affiliate_id text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS device_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS affiliate_percent numeric DEFAULT 30;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_affiliate_earnings numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_bonus_claimed timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bonus_balance numeric DEFAULT 0;

-- Função para gerar ID aleatório de 8 caracteres (A-Z, 0-9)
CREATE OR REPLACE FUNCTION generate_affiliate_id() RETURNS text AS $$
DECLARE
  chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}';
  result text := '';
  i integer := 0;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || chars[1 + floor(random() * 36)];
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Atualiza usuários existentes que não têm affiliate_id
UPDATE public.profiles SET affiliate_id = generate_affiliate_id() WHERE affiliate_id IS NULL;

-- Cria a tabela transactions caso não exista
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text,
    type text,
    amount numeric,
    detail text,
    created_at timestamp with time zone DEFAULT now()
);

-- Cria a tabela withdraw_requests caso não exista
CREATE TABLE IF NOT EXISTS public.withdraw_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text,
    name text,
    amount numeric,
    pix_key text,
    status text,
    created_at timestamp with time zone DEFAULT now()
);

-- Cria a tabela pix_deposits caso não exista
CREATE TABLE IF NOT EXISTS public.pix_deposits (
    txid text PRIMARY KEY,
    email text,
    amount numeric,
    status text,
    updated_at timestamp with time zone DEFAULT now()
);

-- Cria a tabela support_tickets caso não exista
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email text,
    user_name text,
    status text,
    last_activity timestamp with time zone DEFAULT now()
);

-- Cria a tabela support_messages caso não exista
CREATE TABLE IF NOT EXISTS public.support_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id uuid REFERENCES public.support_tickets(id),
    role text,
    text text,
    created_at timestamp with time zone DEFAULT now()
);

-- Força a recarga do cache do Supabase
NOTIFY pgrst, 'reload schema';
