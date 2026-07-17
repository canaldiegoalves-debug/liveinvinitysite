import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '../lib/supabase/client';
import { registerUser } from '../lib/statsManager';
import { getDeviceFingerprint } from '../lib/fingerprint';

const getSupabase = () => createClient();

export interface User {
  email: string;
  name: string;
  cpf?: string;
  createdAt: string;
  is_demo?: boolean;
  transactions?: any[];
  affiliate_id?: string;
  server_seed?: string;
  client_seed?: string;
  xp?: number;
  level?: number;
  cashback_balance?: number;
    balance?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  authMode: 'login' | 'register';

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string, cpf: string) => Promise<{ success: boolean; error?: string }>;
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
        
        try {
          // Busca o perfil via API Segura (Bypass RLS)
          const response = await fetch('/api/user/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userKey, password: true })
          });

          const result = await response.json();

          if (!response.ok || !result.profile) {
            return { success: false, error: result.error || 'Usuário não encontrado.' };
          }

          const profile = result.profile;

          // Verifica a senha usando o hash retornado pela API segura
          if (profile.password_hash && profile.password_hash !== hashPassword(password)) {
            return { success: false, error: 'Senha incorreta.' };
          }

          set({
            isAuthenticated: true,
            user: { 
              email: profile.email, 
              name: profile.full_name || 'Usuário', 
              createdAt: profile.created_at,
              is_demo: profile.is_demo,
              affiliate_id: profile.affiliate_id,
              xp: profile.xp,
              level: profile.level,
              cashback_balance: profile.cashback_balance,
              balance: profile.balance
            },
          });

          return { success: true };
        } catch (err) {
          return { success: false, error: 'Erro ao conectar ao servidor.' };
        }
      },

      register: async (email, password, name, cpf) => {
        const userKey = email.toLowerCase().trim();

        // 1. Verifica se já existe via API
        const checkRes = await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userKey })
        });
        
        if (checkRes.ok) {
          return { success: false, error: 'E-mail já cadastrado.' };
        }

        const deviceId = getDeviceFingerprint();

        // 3. Verifica indicação salva no sessionStorage
        const referredBy = typeof window !== 'undefined' ? sessionStorage.getItem('helix_ref') : null;

        // 3. Cria o perfil no Supabase
        const { data: newProfile, error: createError } = await getSupabase()
          .from('profiles')
          .insert({
            email: userKey,
            full_name: name.trim(),
            cpf: cpf.replace(/\D/g, ''),
            password: hashPassword(password),
            balance: 0,
            is_demo: false,
            affiliate_id: generateAffiliateId(),
            referred_by: referredBy ? referredBy.toUpperCase() : null,
            device_id: deviceId
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
            cpf: newProfile.cpf,
            createdAt: newProfile.created_at,
            affiliate_id: newProfile.affiliate_id,
            server_seed: newProfile.server_seed,
            client_seed: newProfile.client_seed,
            xp: newProfile.xp,
            level: newProfile.level,
            cashback_balance: newProfile.cashback_balance
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

        const { success } = await fetch('/api/user/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: current.email.toLowerCase(), 
            action: 'update', 
            updates 
          })
        }).then(res => res.json());

        if (success) {
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

