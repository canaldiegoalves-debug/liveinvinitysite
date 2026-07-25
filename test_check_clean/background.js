// Live Infinity Cam v1.5.0 - Background Service Worker
const TTLF_URL = 'https://shop.tiktok.com/streamer/live/product/dashboard';
const API = 'https://api.valoranegocios.com.br';

function ehTikTok(url) {
  return typeof url === 'string' && url.indexOf('https://shop.tiktok.com') === 0;
}

chrome.action.onClicked.addListener((tab) => {
  try {
    if (tab && ehTikTok(tab.url)) {
      chrome.tabs.sendMessage(tab.id, { action: 'toggleCamUI' }, () => {
        if (chrome.runtime.lastError) {}
      });
      return;
    }
    chrome.tabs.query({ url: 'https://shop.tiktok.com/*' }, (tabs) => {
      if (tabs && tabs.length) {
        const t = tabs[0];
        chrome.tabs.update(t.id, { active: true });
        if (t.windowId != null) { chrome.windows.update(t.windowId, { focused: true }); }
        chrome.tabs.sendMessage(t.id, { action: 'toggleCamUI' }, () => {
          if (chrome.runtime.lastError) {}
        });
      } else {
        chrome.tabs.create({ url: TTLF_URL });
      }
    });
  } catch (e) {
    chrome.tabs.create({ url: TTLF_URL });
  }
});

// ===================================================
// Validação de licença — roda AQUI, fora do documento do TikTok,
// pra não sofrer a CSP da página (evita erro de connect-src no gate.js).
// ===================================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.action === 'checkLicense') {
    fetch(API + '/api/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: msg.key,
        email: msg.email,
        device: msg.device
      })
    })
      .then((r) => r.json())
      .then((j) => {
        sendResponse({ ok: !!j.ok, reason: j.reason || j.error || '', data: j || {} });
      })
      .catch(() => {
        sendResponse({ ok: false, reason: 'offline', data: {} });
      });

    return true; // mantém o canal aberto pra resposta assíncrona
  }

  if (msg && msg.tipo === 'PROXY_FETCH') {
    const { url, options } = msg;
    fetch(url, options || {})
      .then(async (r) => {
        const contentType = r.headers.get('content-type') || '';
        const body = contentType.includes('application/json')
          ? await r.json()
          : await r.text();
        sendResponse({ ok: r.ok, status: r.status, body });
      })
      .catch((err) => {
        sendResponse({ ok: false, erro: err.message });
      });
    return true;
  }
});
