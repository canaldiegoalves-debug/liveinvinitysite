'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { getGameSettings, getDifficultyParams, DifficultyLevel, getGameSettingsSync } from '../lib/gameConfig';
import { useAuthStore } from '../store/useAuthStore';

// Função para gerar textura de bola de futebol realista
const createSoccerTexture = () => {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Fundo branco
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 512);

  // Desenhar hexágonos pretos (estilo clássico)
  ctx.fillStyle = '#111111';
  const size = 60;
  for (let y = 0; y < 600; y += size * 1.5) {
    for (let x = 0; x < 600; x += size * 1.7) {
      const offsetX = (Math.floor(y / (size * 1.5)) % 2) * (size * 0.85);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        ctx.lineTo(x + offsetX + size * 0.5 * Math.cos(angle), y + size * 0.5 * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

const SOUNDS = {
  COIN:  'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  LOSER: 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3', // Som de erro mais nítido e garantido
};

let lastCoinTime = 0;

const playSound = (type: 'COIN' | 'LOSER') => {
  console.log(`Tentando tocar som: ${type}`);
  const url = SOUNDS[type];
  if (!url) return;

  if (type === 'COIN') {
    const now = Date.now();
    if (now - lastCoinTime < 250) return;
    lastCoinTime = now;
  }

  if (typeof window === 'undefined') return;
  const audio = new Audio(url);
  audio.volume = type === 'LOSER' ? 0.6 : 0.2;
  audio.play().catch(err => console.error("Erro ao tocar som:", err));
};

// Configurações de Geometria (Valores de Ouro)
const WEDGE_COUNT    = 8;
const PLATFORM_GAP   = 3.5;
const PLATFORM_Y0    = 0;
const PLATFORM_R_OUT = 2.8;
const PLATFORM_R_IN  = 0.6;
const PLATFORM_H     = 0.2;
const BALL_RADIUS    = 0.32;
const BALL_Z         = 1.8;

type WedgeType = 'safe' | 'danger' | 'empty';

function generatePlatforms(difficulty: DifficultyLevel, settings: any): WedgeType[][] {
  const params = settings.customParams?.[difficulty] || {
    platformCount: 500,
    gapChance: 0.25,
    dangerMaxFactor: 0.20
  };
  const count = params.platformCount;
  
  return Array.from({ length: count }, (_, i) => {
    const level: WedgeType[] = Array(WEDGE_COUNT).fill('safe') as WedgeType[];
    const gapIdx = Math.floor(Math.random() * WEDGE_COUNT);
    level[gapIdx] = 'empty';

    if (i > 0) {
      const dangerCount = Math.max(1, Math.floor(WEDGE_COUNT * params.dangerMaxFactor));
      for (let d = 0; d < dangerCount; d++) {
        const dIdx = (gapIdx + 2 + d) % WEDGE_COUNT;
        if (level[dIdx] === 'safe') level[dIdx] = 'danger';
      }
    }
    return level;
  });
}

function Ball({ towerRotY, platforms, ballYRef, onGameOver, onScore, isPlaying, difficulty, multiplier }: any) {
  const { user } = useAuthStore();
  const { playerDifficulty } = useGameStore();
  const isDemoHard = user?.is_demo && playerDifficulty === 'HARD';

  const meshRef   = useRef<THREE.Mesh>(null);
  const texture   = React.useMemo(() => createSoccerTexture(), []);
  const velY      = useRef(0);
  const posY      = useRef(PLATFORM_Y0 + 2);
  const lastLevel = useRef(-1);

  useEffect(() => {
    velY.current = 0;
    posY.current = PLATFORM_Y0 + 2;
    lastLevel.current = -1;
  }, [isPlaying]);

  useFrame((_state, delta) => {
    if (!isPlaying) return;

    const settings = getGameSettingsSync();
    const params = settings.customParams?.[difficulty] || { rotationSpeed: 0.1 };

    const dt = Math.min(delta, 0.05);
    // Demo no modo difícil sofre menos gravidade para parecer mais controlável/lento
    const baseGrav = difficulty === 'HARD' ? -38 : -22;
    const baseBounce = difficulty === 'HARD' ? 12 : 10;
    
    const GRAVITY = isDemoHard ? -25 : baseGrav; 
    const BOUNCE  = isDemoHard ? 10 : baseBounce;

    velY.current += GRAVITY * dt;
    const curY = posY.current;
    const nxtY = curY + velY.current * dt;

    let bounced = false;
    for (let i = 0; i < platforms.length; i++) {
      const platY = PLATFORM_Y0 - i * PLATFORM_GAP;
      if (velY.current < 0 && curY >= platY && nxtY <= platY) {
        const rot       = towerRotY.current || 0;
        const ballAngle = ((Math.atan2(0, BALL_Z) - rot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const segment   = Math.floor(ballAngle / (Math.PI * 2) * WEDGE_COUNT + 1e-9) % WEDGE_COUNT;
        const wedge     = platforms[i][segment];

        if (wedge === 'danger') {
          playSound('LOSER');
          onGameOver();
          return;
        }
        if (wedge === 'empty') {
          if (lastLevel.current !== i) {
            lastLevel.current = i;
            playSound('COIN');
            onScore(Buffer.from(`hit-${i}-${Date.now()}`).toString('base64'));
          }
          continue;
        }
        posY.current = platY + BALL_RADIUS;
        velY.current = BOUNCE;
        bounced = true;
        break;
      }
    }

    if (!bounced) posY.current += velY.current * dt;
    ballYRef.current = posY.current;
    if (meshRef.current) meshRef.current.position.y = posY.current;

    if (posY.current < -2000) onGameOver();
  });

  return (
    <mesh ref={meshRef} position={[0, PLATFORM_Y0 + 2, BALL_Z]} castShadow>
      <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
      <meshStandardMaterial 
        map={texture}
        color="#ffffff"
        metalness={0.2} 
        roughness={0.4} 
      />
      <pointLight intensity={1.5} distance={5} color="#ffffff" />
    </mesh>
  );
}

function SceneController({ platforms, ballYRef, onGameOver, onScore, isPlaying, difficulty, multiplier }: any) {
  const { user } = useAuthStore();
  const { playerDifficulty } = useGameStore();
  const isDemoHard = user?.is_demo && playerDifficulty === 'HARD';

  const towerRef = useRef<THREE.Group>(null);
  const rotY     = useRef(0);

  useEffect(() => {
    const handleMove = (e: any) => {
      if (!isPlaying) return;
      const settings = getGameSettingsSync();
      const params = settings.customParams?.[difficulty] || { rotationSpeed: 0.1 };

      // Contas demo no modo difícil rodam o pilar mais lentamente para facilitar a visão
      let speed = params.rotationSpeed / 15;
      if (isDemoHard) {
        speed = speed * 0.6; // 40% mais lento
      }

      const movement = e.movementX || (e.touches?.[0]?.clientX - (window as any)._lastX) || 0;
      rotY.current -= movement * speed;  
      if (e.touches) (window as any)._lastX = e.touches[0].clientX;
    };
    const handleStart = (e: any) => { if (e.touches) (window as any)._lastX = e.touches[0].clientX; };
    
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchstart', handleStart);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchstart', handleStart);
    };
  }, [isPlaying]);

  useFrame((state) => {
    if (towerRef.current) towerRef.current.rotation.y = rotY.current;
    const by = ballYRef.current;
    state.camera.position.y += (by + 4 - state.camera.position.y) * 0.1;
    state.camera.lookAt(0, by - 1, 0);
  });

  return (
    <>
      <mesh position={[0, -20, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 2000, 32]} />
        <meshStandardMaterial color="#111" metalness={1} roughness={0.2} />
      </mesh>
      <group ref={towerRef}>
        {platforms.map((level: any, i: number) => (
          <group key={i} position={[0, PLATFORM_Y0 - i * PLATFORM_GAP, 0]}>
            {level.map((type: any, s: number) => {
              if (type === 'empty') return null;
              const step = (Math.PI * 2) / WEDGE_COUNT;
              const isDanger = type === 'danger';
              
              const getPlatformColor = () => {
                if (isDanger) return '#ff1100'; // Vermelho (Cartão)
                
                // Lógica de cores por país (Copa 2026)
                if (i < 10) {
                  // BRASIL: Verde e Amarelo
                  return multiplier >= 5 ? '#ffd700' : '#009b3a';
                } else if (i < 20) {
                  // EUA: Azul e Vermelho
                  return multiplier >= 5 ? '#ff3b30' : '#002776';
                } else if (i < 30) {
                  // MÉXICO/CANADÁ: Verde Escuro e Vermelho
                  return multiplier >= 5 ? '#ff3b30' : '#006847';
                } else {
                  // PADRÃO CASINO
                  if (multiplier >= 10) return '#ffd700'; 
                  if (multiplier >= 5)  return '#ff6600'; 
                  if (multiplier >= 2)  return '#7c3aed'; 
                  return '#1a1a2e';
                }
              };

              const getEmissiveIntensity = () => {
                if (isDanger) return 0.8;
                if (multiplier >= 10) return 1.5;
                if (multiplier >= 5)  return 1.0;
                if (multiplier >= 2)  return 0.6;
                return 0.2;
              };

              return (
                <mesh key={s} receiveShadow castShadow>
                  <cylinderGeometry args={[PLATFORM_R_OUT, PLATFORM_R_OUT, PLATFORM_H, 32, 1, false, s * step, step * 0.9]} />
                  <meshStandardMaterial 
                    color={getPlatformColor()} 
                    emissive={getPlatformColor()}
                    emissiveIntensity={getEmissiveIntensity()}
                    metalness={0.8}
                    roughness={0.1}
                  />
                </mesh>
              );
            })}
          </group>
        ))}
      </group>
      <Ball 
        towerRotY={rotY} 
        platforms={platforms} 
        ballYRef={ballYRef} 
        onGameOver={onGameOver} 
        onScore={onScore} 
        isPlaying={isPlaying} 
        difficulty={difficulty}
        multiplier={multiplier}
      />
    </>
  );
}

export default function HelixGame() {
  const { isGameOver, setGameOver, passLevel, isPlaying, multiplier } = useGameStore();
  const [platforms, setPlatforms] = useState<WedgeType[][]>([]);
  const ballYRef = useRef(0);
  const [fov, setFov] = useState(50);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const [currentDiff, setCurrentDiff] = useState<DifficultyLevel>('MEDIUM');

  useEffect(() => {
    const audio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3');
    audio.loop = true;
    audio.volume = 0.07;
    bgmRef.current = audio;

    const enableAudio = () => {
      if (bgmRef.current && bgmRef.current.paused) {
        bgmRef.current.play().catch(() => {});
        window.removeEventListener('click', enableAudio);
        window.removeEventListener('touchstart', enableAudio);
        window.removeEventListener('mousedown', enableAudio);
      }
    };

    window.addEventListener('click', enableAudio);
    window.addEventListener('touchstart', enableAudio);
    window.addEventListener('mousedown', enableAudio);

    return () => {
      if (bgmRef.current) bgmRef.current.pause();
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('touchstart', enableAudio);
      window.removeEventListener('mousedown', enableAudio);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 500) setFov(75);
      else if (width < 1000) setFov(60);
      else setFov(45);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const updateSettings = async () => {
      const settings = await getGameSettings();
      setCurrentDiff(settings.difficulty);
      setPlatforms(generatePlatforms(settings.difficulty, settings));
    };

    updateSettings();
    window.addEventListener('game-settings-updated', updateSettings);
    return () => window.removeEventListener('game-settings-updated', updateSettings);
  }, [isGameOver]);


  return (
    <div className="game-container" style={{ position: 'fixed', inset: 0, touchAction: 'none' }}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 8, 15]} fov={fov} />
        <Environment preset="city" />
        <Environment preset="city" />
        <ambientLight intensity={0.6} />
        <Suspense fallback={null}>
          <SceneController 
            platforms={platforms} 
            ballYRef={ballYRef} 
            onGameOver={() => setGameOver(true)} 
            onScore={(t: string) => passLevel(t)} 
            isPlaying={isPlaying}
            difficulty={currentDiff}
            multiplier={multiplier}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
