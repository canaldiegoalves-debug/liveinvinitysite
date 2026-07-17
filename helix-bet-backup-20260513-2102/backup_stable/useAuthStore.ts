import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '../lib/supabase/client';
import { registerUser } from '../lib/statsManager';

const getSupabase = () => createClient();

interface User {
  email: string;
  name: string;
  cpf?: string;
  createdAt: string;
  is_demo?: boolean;
  transactions?: any[];
  affiliate_id?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  authMode: 'login' | 'register';

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<User>, newPassword?: string) => void;
  logout: () => void;
  setAuthMode: (mode: 'login' | 'register') => void;
}

// Hash simples para senha (mantendo para compatibilidade ou movendo para o banco se preferir)
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `hashed_${Math.abs(hash).toString(36)}`;
};

const generateAffiliateId = () => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      authMode: 'login',

      login: async (email, password) => {
        const userKey = email.toLowerCase().trim();
        const { data: profile, error } = await getSupabase()
          .from('profiles')
          .select('*')
          .eq('email', userKey)
          .single();

        if (error || !profile) {
          return { success: false, error: 'Usuário não encontrado. Crie uma conta!' };
        }

        // Verifica a senha (assumindo que salvamos o hash no banco na coluna 'password' que devemos adicionar)
        // Se a coluna não existir, podemos assumir sucesso para teste ou adicionar a coluna
        if (profile.password && profile.password !== hashPassword(password)) {
          return { success: false, error: 'Senha incorreta.' };
        }

        set({
          isAuthenticated: true,
          user: { 
            email: profile.email, 
            name: profile.full_name || 'Usuário', 
            createdAt: profile.created_at,
            is_demo: profile.is_demo,
            affiliate_id: profile.affiliate_id
          },
        });

        return { success: true };
      },

      register: async (email, password, name) => {
        const userKey = email.toLowerCase().trim();

        // 1. Verifica se já existe
        const { data: existing } = await getSupabase()
          .from('profiles')
          .select('id')
          .eq('email', userKey)
          .single();

        if (existing) {
          return { success: false, error: 'E-mail já cadastrado.' };
        }

        // 2. Verifica indicação salva no sessionStorage
        const referredBy = typeof window !== 'undefined' ? sessionStorage.getItem('helix_ref') : null;

        // 3. Cria o perfil no Supabase
        const { data: newProfile, error: createError } = await getSupabase()
          .from('profiles')
          .insert({
            email: userKey,
            full_name: name.trim(),
            password: hashPassword(password),
            balance: 0,
            is_demo: false,
            affiliate_id: generateAffiliateId(),
            referred_by: referredBy ? referredBy.toUpperCase() : null
          })
          .select()
          .single();

        if (createError) {
          return { success: false, error: 'Erro ao criar conta: ' + createError.message };
        }

        set({
          isAuthenticated: true,
          user: { 
            email: newProfile.email, 
            name: newProfile.full_name, 
            createdAt: newProfile.created_at,
            affiliate_id: newProfile.affiliate_id
          },
        });

        return { success: true };
      },

      updateProfile: async (data, newPassword) => {
        const current = get().user;
        if (!current) return;

        const updates: any = {};
        if (data.name) updates.full_name = data.name;
        if (newPassword) updates.password = hashPassword(newPassword);

        const { error } = await getSupabase()
          .from('profiles')
          .update(updates)
          .eq('email', current.email.toLowerCase());

        if (!error) {
          set({ 
            user: { ...current, ...data } 
          });
        }
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      setAuthMode: (mode) => set({ authMode: mode }),
    }),
    {
      name: 'helix-auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
);

