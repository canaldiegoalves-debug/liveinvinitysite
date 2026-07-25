// bg-fetch.js — Proxy de Fetch para contornar CSP do TikTok
function bgFetch(url, options) {
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(
          { tipo: 'PROXY_FETCH', url, options },
          (resposta) => resolve(resposta || { ok: false, erro: 'Sem resposta do background' })
        );
      } else {
        // Fallback local se rodar fora da extensão
        fetch(url, options)
          .then(async (r) => {
            const contentType = r.headers.get('content-type') || '';
            const body = contentType.includes('application/json') ? await r.json() : await r.text();
            resolve({ ok: r.ok, status: r.status, body });
          })
          .catch((err) => resolve({ ok: false, erro: err.message }));
      }
    } catch (e) {
      resolve({ ok: false, erro: e.message });
    }
  });
}
