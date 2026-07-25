'use strict';
/* LiveCam Infinity — Guardião de licença (mundo ISOLADO, camada de segurança extra).
   Valida a chave no servidor via background service worker, guarda no dispositivo com 72h de tolerância offline,
   e só libera o painel (mundo MAIN) quando a licença estiver ativa. */
(function () {
  if (window.__livecamInfinityGate) return;
  if (window.location && window.location.hostname && window.location.hostname.indexOf('valoranegocios.com.br') !== -1) return;
  window.__livecamInfinityGate = true;

  var GRACE = 72 * 3600 * 1000; // 72h offline
  var VERSAO = '1.5.0';

  function stGet(cb) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['liveinfinitycam_lic'], function (r) { cb(r && r.liveinfinitycam_lic ? r.liveinfinitycam_lic : null); });
        return;
      }
    } catch (e) {}
    try { var v = localStorage.getItem('liveinfinitycam_lic'); cb(v ? JSON.parse(v) : null); } catch (e) { cb(null); }
  }

  function stSet(lic) {
    try { if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) chrome.storage.local.set({ liveinfinitycam_lic: lic }); } catch (e) {}
    try { localStorage.setItem('liveinfinitycam_lic', JSON.stringify(lic)); } catch (e) {}
  }

  function novoDevice() { return 'dv-lic-' + Math.random().toString(36).slice(2) + Date.now().toString(36); }

  function liberar(lic) {
    try {
      window.postMessage({ source: 'livecam-infinity-gate', licensed: true, version: VERSAO, email: (lic && lic.email) || '', key: (lic && lic.key) || '', exp: (lic && lic.exp) || 0 }, '*');
    } catch (e) {}
  }

  function valida(email, key, dev, cb) {
    try {
      chrome.runtime.sendMessage(
        { action: 'checkLicense', key: key, email: email, device: dev },
        function (resposta) {
          if (chrome.runtime.lastError || !resposta) {
            cb(false, 'offline', {});
            return;
          }
          cb(!!resposta.ok, resposta.reason || '', resposta.data || {});
        }
      );
    } catch (e) {
      cb(false, 'offline', {});
    }
  }

  function msg(r) {
    var m = {
      invalid: 'Chave inválida. Verifique e tente novamente.',
      blocked: 'Assinatura inativa ou cancelada.',
      devices: 'Limite de dispositivos atingido.',
      offline: 'Sem conexão com o servidor. Verifique sua internet.',
      bad_request: 'Digite sua chave de acesso.'
    };
    return m[r] || (r && r !== 'ok' ? 'Erro: ' + r : '');
  }

  var gateEl = null;
  function removeGate() { if (gateEl && gateEl.parentNode) gateEl.parentNode.removeChild(gateEl); gateEl = null; }

  function showGate(reason) {
    if (!document.body) { setTimeout(function () { showGate(reason); }, 700); return; }
    if (gateEl) return;

    /* ---- Fonte Google ---- */
    if (!document.getElementById('lic-font-link')) {
      var fl = document.createElement('link');
      fl.id = 'lic-font-link'; fl.rel = 'stylesheet';
      fl.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap';
      document.head.appendChild(fl);
    }

    gateEl = document.createElement('div');
    gateEl.id = 'livecam-inf-gate';
    gateEl.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(4,6,15,0.96);backdrop-filter:blur(16px);display:flex;align-items:center;justify-content:center;font-family:"Plus Jakarta Sans",system-ui,-apple-system,sans-serif;padding:16px;';

    gateEl.innerHTML =
      '<div style="width:380px;max-width:100%;background:#070a12;color:#fff;border:1px solid rgba(255,208,0,0.35);border-radius:24px;box-shadow:0 24px 80px rgba(0,0,0,0.95);padding:36px 30px;box-sizing:border-box;">' +
        '<div style="text-align:center;margin-bottom:28px;">' +
          '<div style="display:inline-flex;align-items:center;justify-content:center;width:68px;height:68px;border-radius:20px;background:#0d111d;border:1px solid rgba(255,208,0,0.4);box-shadow:0 0 28px rgba(255,208,0,0.2);margin-bottom:14px;">' +
            '<svg width="42" height="28" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg">' +
              '<path d="M14 18C14 18 7 7 14 5C21 3 25 13 28 18C31 23 36 33 43 31C50 29 50 18 43 18C36 18 31 13 28 18" stroke="url(#ga)" stroke-width="5.5" stroke-linecap="round"/>' +
              '<path d="M43 18C50 18 50 7 43 5C36 3 31 13 28 18C25 23 21 33 14 31C7 29 7 18 14 18" stroke="url(#gb)" stroke-width="5.5" stroke-linecap="round"/>' +
              '<defs>' +
                '<linearGradient id="ga" x1="0" y1="0" x2="56" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#ff1717"/><stop offset="100%" stop-color="#ffd000"/></linearGradient>' +
                '<linearGradient id="gb" x1="56" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#ffd000"/><stop offset="100%" stop-color="#ff1717"/></linearGradient>' +
              '</defs>' +
            '</svg>' +
          '</div>' +
          '<div style="font-size:26px;font-weight:900;letter-spacing:-.5px;">' +
            '<span style="color:#ff1717;">LIVECAM</span> <span style="color:#ffd000;">INFINITY</span>' +
          '</div>' +
          '<div style="color:#ffd000;font-size:11px;font-weight:700;margin-top:4px;opacity:0.8;">Câmera Virtual HD — Ative para continuar</div>' +
        '</div>' +
        '<div style="margin-bottom:22px;">' +
          '<label style="display:block;font-size:10px;font-weight:700;color:rgba(255,255,255,0.55);letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;">CHAVE DE ACESSO</label>' +
          '<input id="lic-gate-key" type="text" placeholder="LIVECAM-XXXX-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false" style="width:100%;box-sizing:border-box;background:#03050a;color:#ffd000;border:1px solid rgba(255,208,0,0.3);border-radius:12px;padding:13px 14px;font-size:13px;font-weight:700;outline:none;text-align:center;letter-spacing:1.5px;text-transform:uppercase;"/>' +
        '</div>' +
        '<button id="lic-gate-btn" style="width:100%;padding:15px;border:none;border-radius:12px;background:linear-gradient(135deg,#ff1717,#e10000);color:#fff;font-weight:900;font-size:15px;cursor:pointer;transition:all .2s;box-shadow:0 4px 24px rgba(255,23,23,0.45);">🔐 Liberar Câmera HD</button>' +
        '<div id="lic-gate-st" style="margin-top:12px;font-size:11px;color:#ff3355;min-height:18px;text-align:center;font-weight:600;">' + (reason ? msg(reason) : '') + '</div>' +
        '<div style="margin-top:20px;color:rgba(255,255,255,0.3);font-size:10px;text-align:center;line-height:1.6;">' +
          'Não tem a chave? Recupere pelo e-mail da compra em:<br>' +
          '<a href="https://api.valoranegocios.com.br/ativar-livecam" target="_blank" rel="noopener" style="color:#ffd000;font-weight:700;text-decoration:underline;">api.valoranegocios.com.br/ativar-livecam</a>' +
        '</div>' +
      '</div>';

    document.documentElement.appendChild(gateEl);

    var keyInp = document.getElementById('lic-gate-key');
    var btn    = document.getElementById('lic-gate-btn');
    var st     = document.getElementById('lic-gate-st');

    if (keyInp) keyInp.focus();

    function autenticar() {
      var key = (keyInp.value || '').trim().toUpperCase();
      if (!key) { st.style.color = '#ff3355'; st.textContent = 'Digite a chave de acesso.'; return; }
      btn.textContent = 'Verificando…'; btn.disabled = true;
      st.style.color = '#ffd000'; st.textContent = 'Validando chave no servidor…';
      var dev = novoDevice();
      valida('', key, dev, function (ok, reason, j) {
        if (ok) {
          stSet({ key: key, device: dev, email: (j && j.email) || '', lastOk: Date.now(), exp: Date.now() + 30 * 86400000, version: VERSAO });
          removeGate();
          liberar({ key: key, email: (j && j.email) || '', exp: Date.now() + 30 * 86400000 });
        } else {
          btn.textContent = '🔐 Liberar Câmera HD'; btn.disabled = false;
          st.style.color = '#ff3355'; st.textContent = msg(reason) || 'Chave inválida. Tente novamente.';
        }
      });
    }

    btn.onclick = autenticar;
    keyInp.onkeydown = function (e) { if (e.key === 'Enter') autenticar(); };
    setTimeout(function () { try { keyInp.focus(); } catch (e) {} }, 100);
  }

  function boot() {
    stGet(function (lic) {
      if (lic && lic.key) {
        if (lic.version !== VERSAO) { stSet(null); showGate(''); return; }
        var dev = lic.device || novoDevice(); lic.device = dev;
        valida(lic.email || '', lic.key, dev, function (ok, reason, j) {
          if (ok) {
            lic.lastOk = Date.now(); stSet(lic); liberar(lic);
          } else if (reason === 'offline' && lic.lastOk && (Date.now() - lic.lastOk < GRACE)) {
            liberar(lic);
          } else {
            showGate(reason);
          }
        });
      } else {
        showGate('');
      }
    });
  }
  boot();
})();
