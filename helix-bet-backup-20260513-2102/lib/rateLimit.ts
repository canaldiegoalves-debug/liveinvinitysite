// Simples Rate Limiter em memória para proteção básica
// Para produção em larga escala, recomenda-se Redis ou Upstash

const cache = new Map<string, { count: number, lastReset: number }>();

export function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000) {
  const now = Date.now();
  const userData = cache.get(ip) || { count: 0, lastReset: now };

  if (now - userData.lastReset > windowMs) {
    userData.count = 0;
    userData.lastReset = now;
  }

  userData.count++;
  cache.set(ip, userData);

  return userData.count <= limit;
}
