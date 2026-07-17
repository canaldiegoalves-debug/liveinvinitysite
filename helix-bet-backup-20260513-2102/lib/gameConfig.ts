import { createClient } from '@/lib/supabase/client';

export type GameDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type DifficultyLevel = GameDifficulty;

export interface DifficultyParams {
  platformCount:   number;
  gapChance:       number;
  dangerMaxFactor: number;
  rotationSpeed:   number;
  multiplierStep:  number;
}

export interface GameSettings {
  difficulty: GameDifficulty;
  lastUpdated: string;
  affiliateCommission: number;
  customParams?: Record<string, any>;
}

const SETTINGS_ID = '00000000-0000-0000-0000-000000000000';

const DEFAULT_PARAMS: Record<GameDifficulty, DifficultyParams> = {
  EASY: {
    platformCount:   500,
    gapChance:       0.45,
    dangerMaxFactor: 0.10,
    rotationSpeed:   0.10,
    multiplierStep:  0.02,
  },
  MEDIUM: {
    platformCount:   500,
    gapChance:       0.30,
    dangerMaxFactor: 0.35,
    rotationSpeed:   0.15,
    multiplierStep:  0.05,
  },
  HARD: {
    platformCount:   500,
    gapChance:       0.15,
    dangerMaxFactor: 0.80,
    rotationSpeed:   0.25,
    multiplierStep:  0.15,
  }
};

const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'MEDIUM',
  lastUpdated: new Date().toISOString(),
  affiliateCommission: 30,
  customParams: { ...DEFAULT_PARAMS, global: { affiliateCommission: 30 } }
};

// Cache local para evitar muitas requisições
let settingsCache: GameSettings | null = null;

export async function getGameSettings(): Promise<GameSettings> {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  
  // Se tiver cache, retorna o cache para performance no jogo
  if (settingsCache && Math.random() > 0.1) return settingsCache;

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('game_settings')
      .select('*')
      .eq('id', SETTINGS_ID)
      .single();

    if (error || !data) {
      console.warn('Usando configurações padrão (Supabase error):', error);
      return DEFAULT_SETTINGS;
    }

    const settings: GameSettings = {
      difficulty: data.difficulty as GameDifficulty,
      lastUpdated: data.updated_at,
      customParams: data.custom_params,
      affiliateCommission: data.custom_params?.global?.affiliateCommission ?? 30
    };
    
    settingsCache = settings;
    return settings;
  } catch (err) {
    console.error('Erro ao buscar game settings:', err);
    return DEFAULT_SETTINGS;
  }
}

// Versão síncrona para o loop do jogo (usa cache)
export function getGameSettingsSync(): GameSettings {
  return settingsCache || DEFAULT_SETTINGS;
}

export async function saveGameSettings(settings: Partial<GameSettings>) {
  try {
    const supabase = createClient();
    
    const updateData: any = {};
    if (settings.difficulty) updateData.difficulty = settings.difficulty;
    if (settings.customParams) updateData.custom_params = settings.customParams;
    if (settings.affiliateCommission !== undefined) {
      if (!updateData.custom_params) updateData.custom_params = {};
      if (!updateData.custom_params.global) updateData.custom_params.global = {};
      updateData.custom_params.global.affiliateCommission = settings.affiliateCommission;
    }
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('game_settings')
      .update(updateData)
      .eq('id', SETTINGS_ID);

    if (error) throw error;

    // Limpa o cache para forçar recarregamento
    settingsCache = null;
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('game-settings-updated'));
    }
    
    return { success: true };
  } catch (err) {
    console.error('Erro ao salvar game settings:', err);
    return { success: false, error: err };
  }
}

export async function getDifficultyParams(difficulty: DifficultyLevel): Promise<DifficultyParams> {
  const settings = await getGameSettings();
  return settings.customParams?.[difficulty] || DEFAULT_PARAMS[difficulty];
}

