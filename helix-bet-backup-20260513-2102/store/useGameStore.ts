import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getGameSettings, getDifficultyParams, DifficultyLevel, getGameSettingsSync } from '../lib/gameConfig';
import { useAuthStore } from './useAuthStore';

interface GameState {
  balance: number;
  currentBet: number;
  multiplier: number;
  score: number;
  isGameOver: boolean;
  isPlaying: boolean;
  isBetting: boolean;
  playerDifficulty: DifficultyLevel;
  _securityHash: string;
  _lastToken: string;

  // Ações
  startGame: () => void;
  cashOut: () => void;
  passLevel: (token: string) => void;
  setGameOver: (val: boolean) => void;
  resetGame: () => void;
  setCurrentBet: (val: number) => void;
  setPlayerDifficulty: (val: DifficultyLevel) => void;
  revalidateHash: () => void;
  deposit: (amount: number) => void;
  withdraw: (amount: number) => void;
}

const SECRET_SALT = "hx-99-bt-secure-k8p2"; 

const generateHash = (balance: number, multiplier: number, email: string) => {
  return Buffer.from(`${SECRET_SALT}-${email}-${balance.toFixed(2)}-${multiplier.toFixed(2)}`).toString('base64');
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      balance: 100, // Saldo inicial para teste na Vercel
      currentBet: 10,
      multiplier: 1.0,
      score: 0,
      isGameOver: false,
      isPlaying: false,
      isBetting: true,
      playerDifficulty: 'MEDIUM',
      _securityHash: '',
      _lastToken: '',

      revalidateHash: () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        set({ _securityHash: generateHash(get().balance, get().multiplier, user.email) });
      },

      deposit: (amount) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        const newBalance = get().balance + amount;
        set({ 
          balance: newBalance,
          _securityHash: generateHash(newBalance, get().multiplier, user.email)
        });
      },

      withdraw: (amount) => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        if (get().balance < amount) return;
        const newBalance = get().balance - amount;
        set({ 
          balance: newBalance,
          _securityHash: generateHash(newBalance, get().multiplier, user.email)
        });
      },

      setCurrentBet: (val) => {
        if (val < 1) val = 1;
        set({ currentBet: val });
      },

      setPlayerDifficulty: (val) => set({ playerDifficulty: val }),

      startGame: () => {
        const state = get();
        const user = useAuthStore.getState().user;
        if (!user) return;

        const newBalance = state.balance - state.currentBet;
        set({
          isPlaying: true,
          isBetting: false,
          isGameOver: false,
          score: 0,
          multiplier: 1.0,
          balance: newBalance,
          _lastToken: '',
          _securityHash: generateHash(newBalance, 1.0, user.email)
        });
      },

      passLevel: (token) => {
        const state = get();
        const user = useAuthStore.getState().user;
        if (!user || !state.isPlaying || state.isGameOver) return;

        if (token === state._lastToken) return;

        const settings = getGameSettingsSync();
        const diff = settings.customParams?.[state.playerDifficulty] || { multiplierStep: 0.05 };
        
        const newMultiplier = state.multiplier + diff.multiplierStep;
        
        set({
          multiplier: newMultiplier,
          score: state.score + 1,
          _lastToken: token,
          _securityHash: generateHash(state.balance, newMultiplier, user.email)
        });
      },


      cashOut: () => {
        const state = get();
        const user = useAuthStore.getState().user;
        if (!user || !state.isPlaying || state.isGameOver) return;

        const profit = state.currentBet * state.multiplier;
        const newBalance = state.balance + profit;

        set({
          isPlaying: false,
          isBetting: true,
          balance: newBalance,
          _securityHash: generateHash(newBalance, state.multiplier, user.email)
        });
      },

      setGameOver: (val) => set({ isGameOver: val, isPlaying: !val }),

      resetGame: () => {
        const user = useAuthStore.getState().user;
        if (!user) return;
        set({
          isPlaying: false,
          isGameOver: false,
          isBetting: true,
          score: 0,
          multiplier: 1.0,
          _lastToken: '',
          _securityHash: generateHash(get().balance, 1.0, user.email)
        });
      },
    }),
    { 
      name: 'helix-game-storage',
      storage: typeof window !== 'undefined' ? undefined : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }
    }
  )
);
