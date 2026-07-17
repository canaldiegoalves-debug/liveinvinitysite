export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server';
  
  const navigator_info = window.navigator;
  const screen_info = window.screen;
  
  let uid = navigator_info.mimeTypes.length.toString();
  uid += navigator_info.userAgent.replace(/\D+/g, '');
  uid += navigator_info.plugins.length.toString();
  uid += screen_info.height || '';
  uid += screen_info.width || '';
  uid += screen_info.pixelDepth || '';
  
  // Hash simples para encurtar
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    const char = uid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `DEV-${Math.abs(hash).toString(16).toUpperCase()}`;
}
