// 🎥 Live Infinity Cam v1.5.0 — Câmera Virtual HD Standalone com Retomada Automática Pós-F5 (IndexedDB Video Persistence)

(function () {
  'use strict';

  if (window.__liveInfinityCamInstalada) return;
  window.__liveInfinityCamInstalada = true;

  const VERSAO = '1.5.0';
  let videoEl = null;
  let playlist = [];
  let idxAtual = -1;
  let watchdog = null, ultimoTempo = -1;
  let wakeLock = null;
  let ativo = false;
  let modoLoop = 'single';

  // ---------- LICENCIAMENTO DO LIVE CAM (LIBERADO SEM CHAVE) ----------
  const API_SERVER = 'https://api.valoranegocios.com.br';
  let isLicenseVerified = true;

  async function verificarLicencaLiveCam() {
    isLicenseVerified = true;
    ocultarModalLicenca();
    return true;
  }

  function exibirModalLicenca(mensagemErro = '') {
    let modal = document.getElementById('livecam-license-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'livecam-license-modal';
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(4, 6, 15, 0.95); backdrop-filter: blur(14px);
        z-index: 2147483647; display: flex; align-items: center; justify-content: center;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      modal.innerHTML = `
        <div style="background: #070a12; border: 1px solid rgba(255,208,0,0.35); border-radius: 24px; width: 400px; max-width: 90vw; padding: 32px 28px; box-shadow: 0 24px 80px rgba(0,0,0,0.95); text-align: center; color: #fff; box-sizing: border-box;">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:18px;background:#0d111d;border:1px solid rgba(255,208,0,0.4);box-shadow:0 0 25px rgba(255,208,0,0.25);margin-bottom:14px;">
            <svg width="40" height="26" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 18C14 18 7 7 14 5C21 3 25 13 28 18C31 23 36 33 43 31C50 29 50 18 43 18C36 18 31 13 28 18" stroke="url(#ga_cam)" stroke-width="5.5" stroke-linecap="round"/>
              <path d="M43 18C50 18 50 7 43 5C36 3 31 13 28 18C25 23 21 33 14 31C7 29 7 18 14 18" stroke="url(#gb_cam)" stroke-width="5.5" stroke-linecap="round"/>
              <defs>
                <linearGradient id="ga_cam" x1="0" y1="0" x2="56" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#ff1717"/><stop offset="100%" stop-color="#ffd000"/></linearGradient>
                <linearGradient id="gb_cam" x1="56" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#ffd000"/><stop offset="100%" stop-color="#ff1717"/></linearGradient>
              </defs>
            </svg>
          </div>
          <h2 style="margin: 0 0 4px 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">
            <span style="color:#ff1717;">LIVECAM</span> <span style="color:#ffd000;">INFINITY</span>
          </h2>
          <p style="margin: 0 0 20px 0; font-size: 11px; font-weight: 700; color: #ffd000; opacity: 0.8;">Câmera Virtual HD — Ative para continuar</p>
          
          <div id="livecam-lic-error" style="background: rgba(225,29,72,0.15); border: 1px solid #ff3355; color: #ff3355; font-size: 12px; font-weight: 600; padding: 10px; border-radius: 10px; margin-bottom: 16px; display: none;"></div>
          
          <div style="margin-bottom: 20px; text-align: left;">
            <label style="display:block; font-size:10px; font-weight:700; color:rgba(255,255,255,0.6); letter-spacing:1px; margin-bottom:6px; text-transform:uppercase;">CHAVE DE ACESSO</label>
            <input type="text" id="livecam-lic-input" placeholder="LIVECAM-PREMIUM-XXXXX..." style="width: 100%; box-sizing: border-box; padding: 13px 10px; font-size: 12px; font-weight: 700; background: #03050a; border: 1px solid rgba(255,208,0,0.4); border-radius: 12px; color: #ffd000; text-align: center; outline: none; letter-spacing: 0.5px; text-transform: uppercase;">
          </div>
          
          <button id="livecam-lic-btn" style="width: 100%; padding: 14px; font-size: 14px; font-weight: 900; background: linear-gradient(135deg, #ff1717, #e10000); color: #fff; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 20px rgba(255,23,23,0.45); transition: all 0.2s;">🔐 Liberar Câmera HD</button>
          
          <div style="margin-top: 20px; font-size: 11px; color: rgba(255,255,255,0.4); line-height: 1.5;">
            Não tem a chave? Recupere pelo e-mail da compra em:<br>
            <a href="https://api.valoranegocios.com.br/ativar-livecam" target="_blank" style="color: #ffd000; text-decoration: underline; font-weight: 700;">api.valoranegocios.com.br/ativar-livecam</a>
          </div>
        </div>
      `;
      (document.body || document.documentElement).appendChild(modal);

      document.getElementById('livecam-lic-btn').onclick = async () => {
        const keyVal = document.getElementById('livecam-lic-input').value.trim();
        if (!keyVal) return;
        document.getElementById('livecam-lic-btn').innerText = '⏳ Validando...';
        await verificarLicencaLiveCam(keyVal);
        document.getElementById('livecam-lic-btn').innerText = '🔐 Liberar Câmera HD';
      };
    }

    const errBox = document.getElementById('livecam-lic-error');
    if (errBox) {
      if (mensagemErro) {
        errBox.textContent = mensagemErro;
        errBox.style.display = 'block';
      } else {
        errBox.style.display = 'none';
      }
    }
    modal.style.display = 'flex';
  }

  function ocultarModalLicenca() {
    const modal = document.getElementById('livecam-license-modal');
    if (modal) modal.style.display = 'none';
  }

  // Executa verificacao da licenca na inicializacao
  setTimeout(() => verificarLicencaLiveCam(), 800);

  const HANDLED_STREAMS = new Set();
  const NOSSAS_TRACKS = new WeakSet();

  const origGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  const origEnum = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);

  const FAKE_VIDEO_ID = 'live_infinity_cam_video_id_1080p_hd';
  const FAKE_AUDIO_ID = 'live_infinity_cam_audio_id_hd';
  const FAKE_GROUP_ID = 'live_infinity_cam_group_id';
  const FAKE_VIDEO_LABEL = 'Live Infinity HD Camera (1080p)';
  const FAKE_AUDIO_LABEL = 'Live Infinity HD Audio';

  // ---------- PERSISTÊNCIA DE VÍDEOS VIA INDEXEDDB PARA RETOMADA PÓS-F5 ----------
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('LiveCamDB', 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('videos')) {
          db.createObjectStore('videos', { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e);
    });
  }

  async function salvarVideoNoDB(id, blob, name) {
    try {
      const db = await openDB();
      const tx = db.transaction('videos', 'readwrite');
      const store = tx.objectStore('videos');
      const buffer = await blob.arrayBuffer();
      store.put({ id, buffer, type: blob.type, name });
    } catch (e) {}
  }

  async function carregarVideoDoDB(id) {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction('videos', 'readonly');
        const store = tx.objectStore('videos');
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result) {
            const blob = new Blob([req.result.buffer], { type: req.result.type });
            const url = URL.createObjectURL(blob);
            resolve({ url, name: req.result.name });
          } else resolve(null);
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) { return null; }
  }

  function salvarEstadoCam(rodando, idx) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ livecam_state: { rodando, idx, modoLoop } });
      }
    } catch (e) {}
    try { localStorage.setItem('livecam_state', JSON.stringify({ rodando, idx, modoLoop })); } catch (e) {}
  }

  // LISTENER DE COMANDO DO ÍCONE DA EXTENSÃO
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg && msg.action === 'toggleCamUI') {
        const hub = document.getElementById('lic-hub');
        const bolha = document.getElementById('lic-bolha');
        if (hub) {
          if (hub.style.display === 'none') {
            hub.style.display = 'block';
            if (bolha) bolha.style.display = 'none';
          } else {
            hub.style.display = 'none';
            if (bolha) bolha.style.display = 'flex';
          }
        }
      }
    });
  }

  // ---------- SISTEMA DE LICENÇAS ----------
  function getLicenca(cb) {
    function processar(lic) {
      if (lic && lic.version !== VERSAO) {
        lic = null;
        setLicenca(null);
      }
      cb(lic);
    }
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['liveinfinitycam_lic'], function (r) {
          processar(r && r.liveinfinitycam_lic ? r.liveinfinitycam_lic : null);
        });
        return;
      }
    } catch (e) {}
    try {
      const v = localStorage.getItem('liveinfinitycam_lic');
      processar(v ? JSON.parse(v) : null);
    } catch (e) { processar(null); }
  }

  function setLicenca(lic) {
    if (lic) lic.version = VERSAO;
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ liveinfinitycam_lic: lic });
      }
    } catch (e) {}
    try { localStorage.setItem('liveinfinitycam_lic', JSON.stringify(lic)); } catch (e) {}
  }

  function getDevice(lic) {
    if (lic && lic.device) return lic.device;
    return 'dv-lic-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function validarChave(email, key, device, cb) {
    const k = (key || '').trim().toUpperCase();
    const em = (email || '').trim().toLowerCase();
    cb(true, 'ok', false, { email: em || 'usuario@valora.com', exp: Date.now() + 365 * 86400000 });
  }

  // ---------- TELA DE LOGIN FLUTUANTE ----------
  function mostrarLoginGate(reason) {
    if (!document.body) { setTimeout(() => mostrarLoginGate(reason), 1000); return; }
    if (document.getElementById('lic-cam-gate')) return;

    if (!document.getElementById('lic-font-link')) {
      const fontLink = document.createElement('link');
      fontLink.id = 'lic-font-link';
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap';
      document.head.appendChild(fontLink);
    }

    const gate = document.createElement('div');
    gate.id = 'lic-cam-gate';
    gate.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      background: rgba(4, 6, 15, 0.94);
      backdrop-filter: blur(14px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      padding: 16px;
      user-select: none;
    `;

    gate.innerHTML = `
      <div style="width:360px;max-width:100%;background:#070a12;color:#fff;border:1px solid rgba(255,208,0,0.35);border-radius:24px;box-shadow:0 24px 80px rgba(0,0,0,0.95);padding:32px 28px;box-sizing:border-box;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:18px;background:#0d111d;border:1px solid rgba(255,208,0,0.4);box-shadow:0 0 25px rgba(255,208,0,0.25);margin-bottom:12px;">
            <svg width="40" height="26" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 18C14 18 7 7 14 5C21 3 25 13 28 18C31 23 36 33 43 31C50 29 50 18 43 18C36 18 31 13 28 18" stroke="url(#ga1)" stroke-width="5.5" stroke-linecap="round"/>
              <path d="M43 18C50 18 50 7 43 5C36 3 31 13 28 18C25 23 21 33 14 31C7 29 7 18 14 18" stroke="url(#gb1)" stroke-width="5.5" stroke-linecap="round"/>
              <defs>
                <linearGradient id="ga1" x1="0" y1="0" x2="56" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#ff1717"/><stop offset="100%" stop-color="#ffd000"/></linearGradient>
                <linearGradient id="gb1" x1="56" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#ffd000"/><stop offset="100%" stop-color="#ff1717"/></linearGradient>
              </defs>
            </svg>
          </div>
          <div style="font-size:24px;font-weight:900;letter-spacing:-.5px;">
            <span style="color:#ff1717;">LIVECAM</span> <span style="color:#ffd000;">INFINITY</span>
          </div>
          <div style="color:#ffd000;font-size:11px;font-weight:700;margin-top:4px;">Câmera Virtual HD & Player VidCam Clone</div>
        </div>

        <div style="margin-bottom:14px;">
          <label style="display:block;font-size:10px;font-weight:700;color:rgba(255,255,255,0.6);letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;">E-MAIL DO USUÁRIO</label>
          <input id="lic-gate-email" placeholder="usuario@email.com" autocomplete="off" spellcheck="false" style="width:100%;box-sizing:border-box;background:#03050a;color:#fff;border:1px solid rgba(255,208,0,0.2);border-radius:12px;padding:12px 14px;font-size:13px;outline:none;">
        </div>

        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:10px;font-weight:700;color:rgba(255,255,255,0.6);letter-spacing:1px;margin-bottom:6px;text-transform:uppercase;">CHAVE DE ACESSO</label>
          <input id="lic-gate-key" type="text" placeholder="Sua chave de acesso" autocomplete="off" spellcheck="false" style="width:100%;box-sizing:border-box;background:#03050a;color:#ffd000;border:1px solid rgba(255,208,0,0.3);border-radius:12px;padding:12px 14px;font-size:14px;font-weight:700;outline:none;text-align:center;letter-spacing:1.5px;">
        </div>

        <button id="lic-gate-btn" style="width:100%;padding:14px;border:none;border-radius:12px;background:linear-gradient(135deg,#ff1717,#e10000);color:#fff;font-weight:900;font-size:14px;cursor:pointer;transition:all .2s;box-shadow:0 4px 20px rgba(255,23,23,0.4);">🔐 Liberar Câmera HD v${VERSAO}</button>
        
        <div id="lic-gate-st" style="margin-top:12px;font-size:11px;color:#ff3355;min-height:16px;text-align:center;font-weight:600;"></div>

        <div style="margin-top:20px;color:rgba(255,255,255,0.35);font-size:10px;text-align:center;line-height:1.5;">
          Digite sua chave de licença para validar a Câmera HD nesta versão.
        </div>
      </div>
    `;

    document.body.appendChild(gate);
    const emailInput = document.getElementById('lic-gate-email');
    const keyInput = document.getElementById('lic-gate-key');
    if (emailInput) emailInput.focus();

    function autenticar() {
      const em = (emailInput.value || '').trim();
      const k = (keyInput.value || '').trim();
      const st = document.getElementById('lic-gate-st');
      if (!k) { st.textContent = 'Digite a chave de acesso.'; return; }
      st.style.color = '#ffd000';
      st.textContent = 'Verificando chave…';

      getLicenca(function (lic) {
        const dev = getDevice(lic);
        validarChave(em, k, dev, function (ok, reason, offline, data) {
          if (ok) {
            const now = Date.now();
            setLicenca({ key: k, device: dev, email: em || 'cliente@email.com', lastOk: now, exp: data.exp, version: VERSAO });
            if (gate && gate.parentNode) gate.parentNode.removeChild(gate);
            iniciarInterfaceGeral();
          } else {
            st.style.color = '#ff3355';
            st.textContent = 'Chave inválida. Digite a chave correta.';
          }
        });
      });
    }

    document.getElementById('lic-gate-btn').onclick = autenticar;
    keyInput.onkeydown = (e) => { if (e.key === 'Enter') autenticar(); };
    emailInput.onkeydown = (e) => { if (e.key === 'Enter') keyInput.focus(); };
  }

  // ---------- SOUNDBOARD FX SINTETIZADOR DE ÁUDIO ----------
  function playFxSound(type) {
    try {
      const volInput = document.getElementById('lic-fx-volume');
      const masterVol = (volInput ? (parseFloat(volInput.value) / 100) : 0.8);
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx({ latencyHint: 'playback' });

      if (type === 'ruido') {
        const bufferSize = ctx.sampleRate * 1.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.04;
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.3 * masterVol, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001 * masterVol, ctx.currentTime + 1.4);
        src.connect(g);
        g.connect(ctx.destination);
        src.start();
      } else if (type === 'respiracao') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.3);
        osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.7);
        g.gain.setValueAtTime(0.01 * masterVol, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.18 * masterVol, ctx.currentTime + 0.3);
        g.gain.exponentialRampToValueAtTime(0.001 * masterVol, ctx.currentTime + 0.7);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.7);
      } else if (type === 'micvar') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);
        g.gain.setValueAtTime(0.3 * masterVol, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001 * masterVol, ctx.currentTime + 0.15);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'clique') {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);
        g.gain.setValueAtTime(0.4 * masterVol, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001 * masterVol, ctx.currentTime + 0.04);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      }
    } catch (e) {}
  }

  // ---------- WEBCAM VIRTUAL ENGINE ----------
  function pedirId(c) {
    if (!c || typeof c !== 'object') return null;
    let d = c.deviceId;
    if (!d) return null;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) return d[0] || null;
    if (typeof d === 'object') {
      const v = d.exact !== undefined ? d.exact : d.ideal;
      return Array.isArray(v) ? v[0] : (v || null);
    }
    return null;
  }

  function trackAtual(kind) {
    if (!videoEl || !videoEl.__cvStream) return null;
    const list = kind === 'video' ? videoEl.__cvStream.getVideoTracks() : videoEl.__cvStream.getAudioTracks();
    return list[0] || null;
  }

  function novoClone(kind) {
    const t = trackAtual(kind);
    if (!t) return null;
    const c = t.clone();
    NOSSAS_TRACKS.add(c);
    return c;
  }

  navigator.mediaDevices.getUserMedia = async function (constraints) {
    if (!ativo) return origGUM(constraints);
    const s = new MediaStream();
    let usouFake = false;
    if (constraints && constraints.video) {
      const id = pedirId(constraints.video);
      const ct = (!id || id === FAKE_VIDEO_ID) ? novoClone('video') : null;
      if (ct) { s.addTrack(ct); usouFake = true; }
      else { try { (await origGUM({ video: constraints.video })).getVideoTracks().forEach(t => s.addTrack(t)); } catch (e) {} }
    }
    if (constraints && constraints.audio) {
      const id = pedirId(constraints.audio);
      const ct = (!id || id === FAKE_AUDIO_ID) ? novoClone('audio') : null;
      if (ct) { s.addTrack(ct); usouFake = true; }
      else {
        try { (await origGUM({ audio: constraints.audio })).getAudioTracks().forEach(t => s.addTrack(t)); } catch (e) {}
      }
    }
    if (usouFake) { HANDLED_STREAMS.add(s); statusUI('🔴 NO AR! Transmitindo Câmera HD'); }
    return s;
  };

  navigator.mediaDevices.enumerateDevices = async function () {
    const devices = await origEnum();
    if (!ativo) return devices;
    const mk = (id, kind, label) => ({
      deviceId: id, groupId: FAKE_GROUP_ID, kind, label,
      toJSON() { return { deviceId: id, groupId: FAKE_GROUP_ID, kind, label }; }
    });
    const extras = [mk(FAKE_VIDEO_ID, 'videoinput', FAKE_VIDEO_LABEL)];
    if (trackAtual('audio')) extras.push(mk(FAKE_AUDIO_ID, 'audioinput', FAKE_AUDIO_LABEL));
    return [...extras, ...devices];
  };

  function atualizarConsumidores() {
    for (const s of HANDLED_STREAMS) {
      for (const kind of ['video', 'audio']) {
        const olds = kind === 'video' ? s.getVideoTracks() : s.getAudioTracks();
        const mortas = olds.filter(t => NOSSAS_TRACKS.has(t) && t.readyState === 'ended');
        if (mortas.length) {
          mortas.forEach(t => s.removeTrack(t));
          const nt = novoClone(kind);
          if (nt) s.addTrack(nt);
        }
      }
    }
  }

  function recapturar() {
    try { videoEl.__cvStream = videoEl.captureStream(30); atualizarConsumidores(); } catch (e) {}
  }

  setInterval(() => {
    if (!ativo || !videoEl || !videoEl.__cvStream || videoEl.paused) return;
    const at = videoEl.__cvStream.getAudioTracks()[0];
    if (at && at.readyState === 'ended') { recapturar(); }
  }, 2000);

  // ---------- REPRODUÇÃO & PLAYLIST ----------
  async function addArquivos(files) {
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      statusUI('⏳ Carregando vídeo…');
      let url;
      try {
        const buf = await f.arrayBuffer();
        url = URL.createObjectURL(new Blob([buf], { type: f.type || 'video/mp4' }));
        await salvarVideoNoDB('vid_' + playlist.length, f, f.name);
      } catch (e) { url = URL.createObjectURL(f); }
      playlist.push({ url, nome: f.name });
    }
    renderPlaylist();
    if (idxAtual === -1 && playlist.length) tocar(0);
  }

  async function tocar(i) {
    if (!playlist[i]) return;
    idxAtual = i;

    if (videoEl) {
      videoEl.src = playlist[i].url;
      videoEl.style.display = 'block';
    }

    const placeholder = document.getElementById('lic-drop-placeholder');
    if (placeholder) placeholder.style.display = 'none';

    const btnChange = document.getElementById('lic-btn-change-video');
    if (btnChange) btnChange.style.display = 'block';

    const screenBox = document.getElementById('lic-screen-box');
    if (screenBox) screenBox.style.borderStyle = 'solid';

    videoEl.load();
    try {
      await videoEl.play();
    } catch (e) {
      videoEl.muted = true;
      try { await videoEl.play(); } catch (e2) { statusUI('❌ Erro ao tocar vídeo.'); return; }
    }
    videoEl.__cvStream = videoEl.captureStream(30);
    ativo = true;
    atualizarConsumidores();
    iniciarVigia();
    pedirWakeLock();
    try { navigator.mediaDevices.dispatchEvent(new Event('devicechange')); } catch (e) {}
    renderPlaylist();
    atualizarEstado();
    salvarEstadoCam(true, idxAtual);
    statusUI(`🔴 NO AR (${idxAtual + 1}/${playlist.length}): ${playlist[i].nome}`);
  }

  function proximoVideo() {
    if (!playlist.length) return;
    tocar((idxAtual + 1) % playlist.length);
  }

  function anteriorVideo() {
    if (!playlist.length) return;
    tocar((idxAtual - 1 + playlist.length) % playlist.length);
  }

  function ligar() {
    if (playlist.length) tocar(idxAtual >= 0 ? idxAtual : 0);
    else { statusUI('Selecione vídeos primeiro'); const inp = document.getElementById('lic-file-input'); if (inp) inp.click(); }
  }

  function desligar() {
    ativo = false;
    if (videoEl) {
      videoEl.pause();
      videoEl.removeAttribute('src');
      videoEl.load();
      videoEl.__cvStream = null;
      videoEl.style.display = 'none';
    }
    const placeholder = document.getElementById('lic-drop-placeholder');
    if (placeholder) placeholder.style.display = 'block';

    const btnChange = document.getElementById('lic-btn-change-video');
    if (btnChange) btnChange.style.display = 'none';

    const screenBox = document.getElementById('lic-screen-box');
    if (screenBox) screenBox.style.borderStyle = 'dashed';

    if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
    atualizarEstado();
    salvarEstadoCam(false, -1);
    statusUI('⚪ Câmera virtual desligada');
    renderPlaylist();
  }

  function iniciarVigia() {
    if (watchdog) return;
    watchdog = setInterval(() => {
      if (!ativo || !videoEl || !videoEl.src) return;
      if (videoEl.paused || videoEl.ended) return;
      if (videoEl.currentTime === ultimoTempo) { try { videoEl.play().catch(() => {}); } catch (e) {} }
      ultimoTempo = videoEl.currentTime;
    }, 3000);
  }

  async function pedirWakeLock() {
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
  }

  // ---------- SISTEMA DRAG & DROP ----------
  function aplicarDragLiveGo(el, handle, storageKey) {
    let sx = 0, sy = 0, ox = 0, oy = 0, moved = false, down = false;
    
    try {
      let p = localStorage.getItem(storageKey);
      if (p) {
        p = JSON.parse(p);
        let t = Math.max(0, Math.min(window.innerHeight - 60, p.t));
        let l = Math.max(0, Math.min(window.innerWidth - 60, p.l));
        el.style.top = t + 'px';
        el.style.left = l + 'px';
        el.style.right = 'auto';
      }
    } catch (e) {}

    handle.addEventListener('mousedown', function (ev) {
      if (ev.target.tagName === 'BUTTON' || ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT' || ev.target.tagName === 'TEXTAREA' || ev.target.closest('button')) return;
      down = true;
      moved = false;
      sx = ev.clientX;
      sy = ev.clientY;
      const r = el.getBoundingClientRect();
      ox = r.left;
      oy = r.top;
      ev.preventDefault();
    });

    document.addEventListener('mousemove', function (ev) {
      if (!down) return;
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) { moved = true; }
      if (moved) {
        el.style.left = Math.max(0, Math.min(window.innerWidth - 50, ox + dx)) + 'px';
        el.style.top = Math.max(0, Math.min(window.innerHeight - 50, oy + dy)) + 'px';
        el.style.right = 'auto';
      }
    });

    document.addEventListener('mouseup', function () {
      if (!down) return;
      down = false;
      if (moved) {
        try {
          const r = el.getBoundingClientRect();
          localStorage.setItem(storageKey, JSON.stringify({ t: Math.round(r.top), l: Math.round(r.left) }));
        } catch (e) {}
      }
    });
  }

  function criarUI() {
    if (document.getElementById('lic-hub')) return;

    getLicenca(function (lic) {
      if (!lic || !lic.key) {
        mostrarLoginGate('');
        return;
      }
      const dev = getDevice(lic);
      validarChave(lic.email, lic.key, dev, function (ok, reason) {
        if (!ok) {
          mostrarLoginGate(reason || 'invalid');
          return;
        }
        _renderizarUIReal();
      });
    });
  }

  function _renderizarUIReal() {
    if (document.getElementById('lic-hub')) return;

    const hub = document.createElement('div');
    hub.id = 'lic-hub';
    // Estilo da barra de rolagem personalizada do LiveCam
    if (!document.getElementById('lic-scroll-style')) {
      const st = document.createElement('style');
      st.id = 'lic-scroll-style';
      st.textContent = `
        #lic-body::-webkit-scrollbar { width: 5px; }
        #lic-body::-webkit-scrollbar-track { background: transparent; }
        #lic-body::-webkit-scrollbar-thumb { background: rgba(255, 208, 0, 0.35); border-radius: 4px; }
        #lic-body::-webkit-scrollbar-thumb:hover { background: #ffd000; }
      `;
      document.head.appendChild(st);
    }

    hub.style.cssText = `
      position: fixed;
      top: 64px;
      right: 370px;
      z-index: 2147483646;
      background: #070a12;
      color: #fff;
      border: 1px solid rgba(255, 208, 0, 0.35);
      border-radius: 20px;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      box-shadow: 0 20px 60px rgba(0,0,0,0.95);
      width: 340px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      user-select: none;
    `;

    hub.innerHTML = `
      <!-- HEADER VIDCAM STYLE -->
      <div id="lic-head" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#0d111d;cursor:move;border-bottom:1px solid rgba(255,208,0,0.2);flex:none;">
        <div style="display:flex;align-items:center;gap:8px;pointer-events:none;">
          <svg width="24" height="15" viewBox="0 0 56 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 18C14 18 7 7 14 5C21 3 25 13 28 18C31 23 36 33 43 31C50 29 50 18 43 18C36 18 31 13 28 18" stroke="url(#ga2)" stroke-width="5.5" stroke-linecap="round"/>
            <path d="M43 18C50 18 50 7 43 5C36 3 31 13 28 18C25 23 21 33 14 31C7 29 7 18 14 18" stroke="url(#gb2)" stroke-width="5.5" stroke-linecap="round"/>
            <defs>
              <linearGradient id="ga2" x1="0" y1="0" x2="56" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#ff1717"/><stop offset="100%" stop-color="#ffd000"/></linearGradient>
              <linearGradient id="gb2" x1="56" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#ffd000"/><stop offset="100%" stop-color="#ff1717"/></linearGradient>
            </defs>
          </svg>
          <div style="font-size:14px;font-weight:900;letter-spacing:-.3px;">
            <span style="color:#ff1717;">Live</span><span style="color:#ffd000;">Cam</span>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:6px;">
          <span id="lic-badge" style="font-size:10px;font-weight:800;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.1);display:inline-flex;align-items:center;gap:4px;">
            <span style="width:6px;height:6px;border-radius:50%;background:#888;" id="lic-badge-dot"></span> Inativa
          </span>
          <button id="lic-btn-cfg" title="Configurações & Licença" style="width:30px;height:30px;border-radius:10px;border:1px solid rgba(255,208,0,0.25);background:#141928;color:#ffd000;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;">⚙️</button>
          <button id="lic-btn-power" title="Ligar/Desligar Câmera Virtual" style="width:30px;height:30px;border-radius:10px;border:1px solid rgba(255,208,0,0.3);background:#141928;color:#ffd000;cursor:pointer;font-size:14px;font-weight:bold;display:flex;align-items:center;justify-content:center;">⏻</button>
          <button id="lic-btn-min" title="Esconder em Bolha Flutuante" style="width:30px;height:30px;border-radius:10px;border:1px solid rgba(255,23,23,0.3);background:#141928;color:#ff3355;cursor:pointer;font-size:15px;font-weight:bold;display:flex;align-items:center;justify-content:center;">−</button>
        </div>
      </div>

      <!-- BODY CONTAINING EXACT VIDCAM LAYOUT WITH SMART SCROLLBAR -->
      <div id="lic-body" style="padding:14px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;overflow-x:hidden;max-height:calc(85vh - 54px);scrollbar-width:thin;scrollbar-color:rgba(255,208,0,0.35) transparent;">
        <input type="file" id="lic-file-input" accept="video/mp4,video/webm" multiple style="display:none;">

        <!-- VISÃO PRINCIPAL DO PAINEL -->
        <div id="lic-main-view" style="display:flex;flex-direction:column;gap:12px;">

        <!-- 1. TELA DE VÍDEO / PRÉVIA DO VÍDEO (VIDEO PREVIEW CONTAINER - FLEX NONE IMMUTABLE HEIGHT) -->
        <div id="lic-screen-box" style="width:100%;height:185px;min-height:185px;flex:none;border:1.5px solid rgba(255,208,0,0.3);border-radius:14px;background:#000;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer;box-sizing:border-box;margin-bottom:2px;">
          <video id="lic-video-player" playsinline style="width:100%;height:100%;object-fit:contain;background:#000;display:none;z-index:2;border-radius:12px;"></video>
          <div id="lic-drop-placeholder" style="text-align:center;padding:16px;z-index:1;color:rgba(255,255,255,0.6);font-size:12.5px;font-weight:600;">
            <div style="font-size:28px;margin-bottom:6px;">🎥</div>
            Adicione um vídeo para começar
          </div>
        </div>

        <!-- 2. BARRA DE REPRODUÇÃO / SEEKBAR (0:00 ------ 0:00) -->
        <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:rgba(255,255,255,0.5);font-weight:600;padding:0 2px;">
          <span id="lic-time-cur">0:00</span>
          <input type="range" id="lic-seekbar" value="0" min="0" max="100" style="flex:1;accent-color:#ffd000;cursor:pointer;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;">
          <span id="lic-time-dur">0:00</span>
        </div>

        <!-- 3. BOTÃO PRINCIPAL 1: INICIAR (LARGE FULL WIDTH BUTTON) -->
        <button id="lic-btn-iniciar" style="width:100%;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,#ffd000,#ffaa00);color:#000;font-weight:900;font-size:14px;cursor:pointer;box-shadow:0 4px 16px rgba(255,208,0,0.25);transition:all .18s;">
          ▶ Iniciar
        </button>

        <!-- 4. BOTÃO PRINCIPAL 2: + ADICIONAR VÍDEO(S)... (DIRETAMENTE ABAIXO DO INICIAR) -->
        <button id="lic-btn-add-videos" style="width:100%;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,#ffd000,#ffaa00);color:#000;font-weight:900;font-size:13.5px;cursor:pointer;box-shadow:0 4px 16px rgba(255,208,0,0.2);transition:all .18s;">
          + Adicionar vídeo(s)...
        </button>

        <!-- LISTA DE VÍDEOS ADICIONADOS COM BOTÃO DE REMOVER ✕ -->
        <div id="lic-playlist-box" style="display:flex;flex-direction:column;gap:6px;margin-top:2px;">
          <div id="lic-playlist" style="max-height:120px;overflow-y:auto;display:flex;flex-direction:column;gap:5px;"></div>
        </div>

        <!-- 5. BOTÃO PRINCIPAL 3: REINICIAR VÍDEO DO INÍCIO -->
        <button id="lic-btn-restart" style="width:100%;padding:11px;border:1px solid rgba(255,208,0,0.25);border-radius:12px;background:#141928;color:#fff;font-weight:700;font-size:12.5px;cursor:pointer;transition:all .18s;display:flex;align-items:center;justify-content:center;gap:6px;">
          🔄 Reiniciar vídeo do início
        </button>

        <!-- 5. TRIO DE CONTROLES: « | 10s ∨ | » Avançar -->
        <div style="display:flex;align-items:center;gap:8px;">
          <button id="lic-btn-prev-step" style="padding:10px 14px;border:1px solid rgba(255,208,0,0.2);border-radius:10px;background:#141928;color:#fff;font-weight:800;font-size:14px;cursor:pointer;flex:none;">«</button>
          <select id="lic-select-step" style="flex:1;padding:10px;border:1px solid rgba(255,208,0,0.2);border-radius:10px;background:#141928;color:#ffd000;font-weight:800;font-size:12.5px;outline:none;cursor:pointer;text-align:center;">
            <option value="5">5s</option>
            <option value="10" selected>10s</option>
            <option value="15">15s</option>
            <option value="30">30s</option>
          </select>
          <button id="lic-btn-next-step" style="padding:10px 14px;border:1px solid rgba(255,208,0,0.2);border-radius:10px;background:#141928;color:#fff;font-weight:800;font-size:12.5px;cursor:pointer;flex:none;display:flex;align-items:center;gap:4px;">
            » Avançar
          </button>
        </div>

        <!-- VELOCIDADE DE REPRODUÇÃO DO VÍDEO -->
        <div style="display:flex;align-items:center;justify-content:space-between;background:#0d111d;border:1px solid rgba(255,208,0,0.2);border-radius:12px;padding:10px 14px;">
          <span style="font-size:12px;font-weight:800;color:#fff;display:flex;align-items:center;gap:6px;">⚡ Velocidade do Vídeo:</span>
          <select id="lic-select-speed" style="padding:6px 10px;border-radius:8px;border:1px solid rgba(255,208,0,0.3);background:#141928;color:#ffd000;font-size:11.5px;font-weight:800;outline:none;cursor:pointer;">
            <option value="0.5">0.5x (Lento)</option>
            <option value="0.75">0.75x</option>
            <option value="1.0" selected>1.0x (Normal)</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x (Rápido)</option>
            <option value="2.0">2.0x (Muito Rápido)</option>
          </select>
        </div>

        <!-- 6. CARD DE ÁUDIO NO PC (OUVIR ÁUDIO NO PC + TOGGLE OFF/ON) -->
        <div style="display:flex;align-items:center;justify-content:space-between;background:#0d111d;border:1px solid rgba(255,208,0,0.2);border-radius:12px;padding:12px 14px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:18px;">🔊</span>
            <div>
              <div style="font-size:12.5px;font-weight:800;color:#fff;">Ouvir áudio no PC</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:2px;">monitorar o som localmente</div>
            </div>
          </div>
          <button id="lic-btn-audio-toggle" style="padding:5px 12px;border-radius:999px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.6);font-size:10.5px;font-weight:900;cursor:pointer;">OFF</button>
        </div>

        <!-- MÓDULO VB-CABLE COMPLETO (5 CARDS LIVEFLOW COM IDENTIDADE LIVECAM & COLLAPSE) -->
        <div style="display:flex;flex-direction:column;gap:12px;">

          <!-- CARD 1: VB-CABLE -->
          <div class="lic-acc-card" style="background:#070a12;border:1px solid rgba(255,208,0,0.3);border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.6);">
            <!-- CABEÇALHO CLICÁVEL -->
            <div class="lic-acc-header" style="padding:14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;background:rgba(255,208,0,0.03);">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:16px;">🔊</span>
                <div>
                  <div style="font-size:13px;font-weight:900;color:#ffd000;">VB-Cable</div>
                  <div style="font-size:10px;color:rgba(255,255,255,0.5);">Roteamento de áudio para o Live Studio</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="display:flex;align-items:center;gap:5px;">
                  <div id="lic-vb-dot" style="width:8px;height:8px;border-radius:50%;background:#888;"></div>
                  <span id="lic-vb-txt" style="font-size:10px;font-weight:800;color:#888;">— configure abaixo</span>
                </div>
                <span class="lic-acc-arrow" style="font-size:12px;color:#ffd000;transition:transform .25s;font-weight:900;">▲</span>
              </div>
            </div>

            <!-- CORPO DO CARD -->
            <div class="lic-acc-body" style="padding:0 14px 14px 14px;display:flex;flex-direction:column;gap:10px;">
              <!-- PASSO 1 -->
              <div style="background:#03050a;border:1px solid rgba(255,208,0,0.15);border-radius:10px;padding:10px 12px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                  <div style="width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#ff1717,#ffd000);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:#000;">1</div>
                  <span style="font-size:11.5px;font-weight:800;color:#fff;">Instalar o VB-Cable</span>
                </div>
                <div style="font-size:10px;color:rgba(255,255,255,0.6);margin-bottom:8px;line-height:1.4;">Cabo de áudio virtual gratuito. Permite que o Chrome envie o áudio direto para o Live Studio.</div>
                <a href="https://vb-audio.com/Cable/" target="_blank" style="display:flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#ffd000,#ffaa00);color:#000;text-decoration:none;border-radius:8px;padding:8px;font-size:11px;font-weight:900;box-shadow:0 4px 14px rgba(255,208,0,0.25);">⬇️ Baixar VB-Cable grátis</a>
              </div>

              <!-- PASSO 2 -->
              <div style="background:#03050a;border:1px solid rgba(255,208,0,0.15);border-radius:10px;padding:10px 12px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                  <div style="width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#ff1717,#ffd000);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:#000;">2</div>
                  <span style="font-size:11.5px;font-weight:800;color:#fff;">Configurar o Windows</span>
                </div>
                <div style="font-size:10px;color:rgba(255,255,255,0.6);line-height:1.8;">
                  1. Botão direito no 🔊 da barra de tarefas<br>
                  2. <b style="color:#fff;">Sons → Reprodução</b><br>
                  3. Botão direito em <b style="color:#ffd000;">CABLE Input</b><br>
                  4. <b style="color:#ffd000;">Definir como dispositivo padrão</b>
                </div>
              </div>

              <!-- PASSO 3 -->
              <div style="background:#03050a;border:1px solid rgba(255,208,0,0.15);border-radius:10px;padding:10px 12px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                  <div style="width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#ff1717,#ffd000);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:#000;">3</div>
                  <span style="font-size:11.5px;font-weight:800;color:#fff;">Configurar o Live Studio</span>
                </div>
                <div style="font-size:10px;color:rgba(255,255,255,0.6);line-height:1.8;">
                  1. <b style="color:#fff;">TikTok Live Studio → Configurações → Áudio</b><br>
                  2. Microfone → <b style="color:#ffd000;">CABLE Output</b><br>
                  3. Salve e volte para a live
                </div>
              </div>

              <button id="lic-btn-test-audio" style="width:100%;padding:10px;border:1px solid rgba(255,208,0,0.4);border-radius:8px;background:#03050a;color:#ffd000;font-size:11px;font-weight:900;cursor:pointer;transition:all .2s;">🎵 Tocar som de teste</button>
              <div style="font-size:9.5px;color:rgba(255,255,255,0.4);text-align:center;">💡 Se ouviu o som no Live Studio, está tudo configurado!</div>
            </div>
          </div>

          <!-- CARD 2: ÁUDIO INFINITO -->
          <div class="lic-acc-card" style="background:#070a12;border:1px solid rgba(255,208,0,0.3);border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.6);">
            <div class="lic-acc-header" style="padding:14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;background:rgba(255,208,0,0.03);">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:16px;">🎵</span>
                <div>
                  <div style="font-size:13px;font-weight:900;color:#ffd000;">Áudio Infinito</div>
                  <div style="font-size:10px;color:rgba(255,255,255,0.5);">Trechos aleatórios em loop — nunca repete a sequência</div>
                </div>
              </div>
              <span class="lic-acc-arrow" style="font-size:12px;color:#ffd000;transition:transform .25s;font-weight:900;">▲</span>
            </div>

            <div class="lic-acc-body" style="padding:0 14px 14px 14px;display:flex;flex-direction:column;gap:10px;">
              <label for="lic-audio-file" style="display:block;background:#03050a;border:1px dashed rgba(255,208,0,0.4);border-radius:10px;padding:14px;text-align:center;font-size:11px;font-weight:800;color:#ffd000;cursor:pointer;">🎵 Clique para selecionar sua gravação</label>
              <input type="file" id="lic-audio-file" accept="audio/*" style="display:none;">

              <div style="position:relative;height:36px;background:#03050a;border:1px solid rgba(255,208,0,0.15);border-radius:8px;overflow:hidden;">
                <div id="lic-viz-track" style="display:flex;gap:2px;position:absolute;left:0;top:0;height:100%;align-items:center;padding:0 4px;width:100%;"></div>
                <div style="position:absolute;left:30%;top:0;bottom:0;width:2px;background:#ffd000;opacity:.9;"></div>
              </div>

              <div style="display:flex;justify-content:space-between;font-size:10px;color:rgba(255,255,255,0.5);font-weight:700;">
                <span id="lic-audio-cur">0:00</span>
                <span id="lic-audio-mont">0 trechos montados</span>
              </div>

              <div style="display:flex;align-items:center;gap:10px;">
                <button id="lic-audio-play-btn" style="width:40px;height:40px;border-radius:50%;border:none;background:linear-gradient(135deg,#ff1717,#ffd000);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(255,23,23,0.35);">
                  <svg id="lic-play-svg" viewBox="0 0 24 24" width="16" height="16" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </button>
                <input type="range" id="lic-audio-vol" min="0" max="1" step="0.01" value="1" style="flex:1;accent-color:#ffd000;cursor:pointer;">
              </div>

              <div style="display:flex;align-items:center;gap:8px;background:#03050a;border:1px solid rgba(255,208,0,0.15);border-radius:8px;padding:8px 10px;">
                <div id="lic-audio-dot" style="width:8px;height:8px;border-radius:50%;background:#888;"></div>
                <div>
                  <div id="lic-audio-now-txt" style="font-size:11px;font-weight:800;color:#fff;">Carregue um arquivo e dê play</div>
                  <div style="font-size:9.5px;color:rgba(255,255,255,0.4);">montagem infinita e aleatória</div>
                </div>
              </div>
            </div>
          </div>

          <!-- CARD 3: TRECHOS -->
          <div class="lic-acc-card" style="background:#070a12;border:1px solid rgba(255,208,0,0.3);border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.6);">
            <div class="lic-acc-header" style="padding:14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;background:rgba(255,208,0,0.03);">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:16px;">✂️</span>
                <div>
                  <div style="font-size:13px;font-weight:900;color:#ffd000;">Trechos</div>
                  <div style="font-size:10px;color:rgba(255,255,255,0.5);">Duração e pausa entre cada trecho</div>
                </div>
              </div>
              <span class="lic-acc-arrow" style="font-size:12px;color:#ffd000;transition:transform .25s;font-weight:900;">▲</span>
            </div>

            <div class="lic-acc-body" style="padding:0 14px 14px 14px;display:flex;flex-direction:column;gap:10px;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span style="font-size:10.5px;color:rgba(255,255,255,0.7);font-weight:700;">Duração mínima</span>
                <input type="range" id="lic-seg-min" min="1" max="20" step="1" value="4" style="width:100px;accent-color:#ffd000;">
                <span id="lic-seg-min-val" style="font-size:10.5px;color:#ffd000;font-weight:900;width:28px;text-align:right;">4s</span>
              </div>

              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span style="font-size:10.5px;color:rgba(255,255,255,0.7);font-weight:700;">Duração máxima</span>
                <input type="range" id="lic-seg-max" min="3" max="60" step="1" value="12" style="width:100px;accent-color:#ffd000;">
                <span id="lic-seg-max-val" style="font-size:10.5px;color:#ffd000;font-weight:900;width:28px;text-align:right;">12s</span>
              </div>

              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <span style="font-size:10.5px;color:rgba(255,255,255,0.7);font-weight:700;">Pausa entre trechos</span>
                <input type="range" id="lic-gap-max" min="0" max="5" step="0.5" value="1" style="width:100px;accent-color:#ffd000;">
                <span id="lic-gap-max-val" style="font-size:10.5px;color:#ffd000;font-weight:900;width:28px;text-align:right;">1s</span>
              </div>
            </div>
          </div>

          <!-- CARD 4: CAMADA AO VIVO (COM CHAVE MASTER ON/OFF) -->
          <div class="lic-acc-card" style="background:#070a12;border:1px solid rgba(255,208,0,0.3);border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.6);">
            <div class="lic-acc-header" style="padding:14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;background:rgba(255,208,0,0.03);">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:16px;">🌿</span>
                <div>
                  <div style="font-size:13px;font-weight:900;color:#ffd000;">Camada ao Vivo</div>
                  <div style="font-size:10px;color:rgba(255,255,255,0.5);">Simula presença humana com sons sintéticos</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;">
                <!-- CHAVE MASTER PARA LIGAR/DESLIGAR A CAMADA AO VIVO -->
                <div style="display:flex;align-items:center;gap:6px;" onclick="event.stopPropagation();">
                  <span id="lic-camada-master-lbl" style="font-size:10px;font-weight:900;color:#ffd000;">LIGADO</span>
                  <label style="position:relative;display:inline-block;width:38px;height:20px;">
                    <input type="checkbox" id="lic-tog-camada-master" checked style="opacity:0;width:0;height:0;">
                    <span id="lic-slider-camada-master" style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:#ffd000;transition:.3s;border-radius:20px;">
                      <span style="position:absolute;content:'';height:14px;width:14px;left:3px;bottom:3px;background-color:#000;transition:.3s;border-radius:50%;transform:translateX(18px);"></span>
                    </span>
                  </label>
                </div>
                <span class="lic-acc-arrow" style="font-size:12px;color:#ffd000;transition:transform .25s;font-weight:900;">▲</span>
              </div>
            </div>

            <div class="lic-acc-body" style="padding:0 14px 14px 14px;display:flex;flex-direction:column;gap:12px;">
              <!-- TOGGLES INDIVIDUAIS -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div style="background:#03050a;border:1px solid rgba(255,208,0,0.15);border-radius:10px;padding:8px 10px;">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
                    <span style="font-size:10.5px;font-weight:800;color:#fff;">Ruído de sala</span>
                    <input type="checkbox" id="lic-tog-room" checked style="accent-color:#ffd000;cursor:pointer;">
                  </div>
                  <div style="font-size:9px;color:rgba(255,255,255,0.4);">ativo</div>
                </div>

                <div style="background:#03050a;border:1px solid rgba(255,208,0,0.15);border-radius:10px;padding:8px 10px;">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
                    <span style="font-size:10.5px;font-weight:800;color:#fff;">Respirações</span>
                    <input type="checkbox" id="lic-tog-breath" checked style="accent-color:#ffd000;cursor:pointer;">
                  </div>
                  <div style="font-size:9px;color:rgba(255,255,255,0.4);">a cada 5–15s</div>
                </div>

                <div style="background:#03050a;border:1px solid rgba(255,208,0,0.15);border-radius:10px;padding:8px 10px;">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
                    <span style="font-size:10.5px;font-weight:800;color:#fff;">Variação de mic</span>
                    <input type="checkbox" id="lic-tog-mic" checked style="accent-color:#ffd000;cursor:pointer;">
                  </div>
                  <div style="font-size:9px;color:rgba(255,255,255,0.4);">oscilando</div>
                </div>

                <div style="background:#03050a;border:1px solid rgba(255,208,0,0.15);border-radius:10px;padding:8px 10px;">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
                    <span style="font-size:10.5px;font-weight:800;color:#fff;">Cliques</span>
                    <input type="checkbox" id="lic-tog-click" checked style="accent-color:#ffd000;cursor:pointer;">
                  </div>
                  <div style="font-size:9px;color:rgba(255,255,255,0.4);">aleatórios</div>
                </div>
              </div>

              <!-- SLIDER VOLUME DO AMBIENTE -->
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:#03050a;padding:8px 10px;border-radius:8px;border:1px solid rgba(255,208,0,0.15);">
                <span style="font-size:10.5px;color:rgba(255,255,255,0.7);font-weight:700;">Volume do ambiente</span>
                <input type="range" id="lic-amb-vol" min="0" max="60" step="1" value="15" style="width:90px;accent-color:#ffd000;cursor:pointer;">
                <span id="lic-amb-vol-val" style="font-size:10.5px;color:#ffd000;font-weight:900;width:30px;text-align:right;">15%</span>
              </div>
            </div>
          </div>

          <!-- CARD 5: HISTÓRICOS -->
          <div class="lic-acc-card" style="background:#070a12;border:1px solid rgba(255,208,0,0.3);border-radius:14px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.6);">
            <div class="lic-acc-header" style="padding:14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;background:rgba(255,208,0,0.03);">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:16px;">📋</span>
                <div>
                  <div style="font-size:13px;font-weight:900;color:#ffd000;">Históricos de Transmissão</div>
                  <div style="font-size:10px;color:rgba(255,255,255,0.5);">Trechos e camadas em tempo real</div>
                </div>
              </div>
              <span class="lic-acc-arrow" style="font-size:12px;color:#ffd000;transition:transform .25s;font-weight:900;">▲</span>
            </div>

            <div class="lic-acc-body" style="padding:0 14px 14px 14px;display:flex;flex-direction:column;gap:10px;">
              <div style="font-size:10.5px;font-weight:800;color:rgba(255,255,255,0.6);text-transform:uppercase;">Histórico de Trechos:</div>
              <div id="lic-hist-trechos" style="background:#03050a;border:1px solid rgba(255,208,0,0.15);border-radius:8px;padding:8px 10px;font-family:monospace;font-size:10px;color:#ffd000;height:45px;overflow-y:auto;">- Nenhum trecho ainda</div>

              <div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">
                <span style="font-size:10.5px;font-weight:800;color:rgba(255,255,255,0.6);text-transform:uppercase;">Histórico de Camadas:</span>
                <button id="lic-hist-camadas-clear" style="padding:3px 8px;border-radius:6px;border:1px solid rgba(255,208,0,0.3);background:#141928;color:#ffd000;font-size:10px;font-weight:800;cursor:pointer;">Limpar</button>
              </div>
              <div id="lic-hist-camadas" style="background:#03050a;border:1px solid rgba(255,208,0,0.15);border-radius:8px;padding:8px 10px;font-family:monospace;font-size:10px;color:#ffd000;height:45px;overflow-y:auto;">- Nenhum evento ainda</div>
            </div>
          </div>

        </div>



        <!-- PLAYLIST DE VÍDEOS (LISTA DISCRETA SE HOUVER MAIS DE UM) -->
        <div id="lic-playlist-box" style="display:none;margin-top:-4px;">
          <div id="lic-playlist" style="max-height:80px;overflow-y:auto;display:flex;flex-direction:column;gap:4px;"></div>
        </div>

        <!-- 8. FOOTER STATUS TEXT -->
        <div id="lic-status-log" style="font-size:11px;color:rgba(255,255,255,0.45);text-align:center;padding:4px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          Nenhum vídeo carregado.
        </div>
        </div>

        <!-- VISÃO DE CONFIGURAÇÕES VIDCAM CLONE -->
        <div id="lic-settings-view" style="display:none;flex-direction:column;gap:12px;padding:2px 0;">
          <div style="display:flex;align-items:center;gap:10px;">
            <button id="lic-cfg-back" style="width:30px;height:30px;border-radius:10px;border:1px solid rgba(255,208,0,0.3);background:#141928;color:#ffd000;font-size:14px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;">←</button>
            <div style="font-size:15px;font-weight:900;color:#fff;display:flex;align-items:center;gap:6px;">
              ⚙️ Configurações
            </div>
          </div>

          <!-- CARD DE LICENÇA -->
          <div style="background:#0d111d;border:1px solid rgba(255,208,0,0.25);border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:6px;">
            <div style="font-size:12px;font-weight:800;color:rgba(255,255,255,0.8);">
              Status: <span id="lic-cfg-status" style="color:#ffd000;font-weight:900;">● Ativa</span>
            </div>
            <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;">E-mail de compra:</div>
            <div id="lic-cfg-email" style="font-size:12px;font-weight:800;color:#fff;word-break:break-all;">cliente@email.com</div>
            
            <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;">Chave:</div>
            <div id="lic-cfg-key" style="font-size:12px;font-weight:900;color:#ffd000;letter-spacing:.5px;word-break:break-all;">LIVEINF-ACTIVE</div>
            
            <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;">
              Vence em: <span id="lic-cfg-exp" style="color:#ffd000;font-weight:800;">22/08/2026</span>
            </div>
            <div style="font-size:10px;color:rgba(255,208,0,0.7);margin-top:4px;">Renova automaticamente enquanto a assinatura estiver ativa.</div>
          </div>

          <!-- SINCRONIZAR ÁUDIO AUTOMÁTICO -->
          <div style="background:#0d111d;border:1px solid rgba(255,208,0,0.2);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="font-size:12px;font-weight:800;color:#fff;">Sincronizar áudio no automático</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:2px;">só ligue se a voz descolar com o tempo</div>
            </div>
            <input type="checkbox" id="lic-cfg-sync-auto" checked style="width:18px;height:18px;accent-color:#ffd000;cursor:pointer;">
          </div>

          <!-- SINCRONIZAR A CADA N SEGUNDOS -->
          <div style="background:#0d111d;border:1px solid rgba(255,208,0,0.2);border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="font-size:12px;font-weight:800;color:#fff;">Sincronizar a cada</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:2px;">digite os segundos (ex.: 10, 30, 60)</div>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
              <input type="number" id="lic-cfg-sync-sec" value="60" min="5" style="width:50px;padding:5px;border-radius:8px;border:1px solid rgba(255,208,0,0.3);background:#141928;color:#ffd000;font-weight:900;font-size:13px;text-align:center;outline:none;">
              <span style="font-size:11px;color:rgba(255,255,255,0.6);">seg</span>
            </div>
          </div>

          <!-- BOTÃO FORÇAR SINCRONIZAÇÃO AGORA -->
          <button id="lic-cfg-btn-force-sync" style="width:100%;padding:12px;border:none;border-radius:12px;background:linear-gradient(135deg,#ffd000,#ffaa00);color:#000;font-weight:900;font-size:13px;cursor:pointer;box-shadow:0 4px 16px rgba(255,208,0,0.25);display:flex;align-items:center;justify-content:center;gap:6px;">
            🔄 Forçar sincronização agora
          </button>

          <div style="font-size:10px;color:rgba(255,255,255,0.35);text-align:center;margin-top:4px;">
            LiveCam Infinity · v1.4.0
          </div>
        </div>
      </div>
    `;

    document.documentElement.appendChild(hub);

    // BOLHA FLUTUANTE DA CÂMERA (ISOLADA)
    const bolha = document.createElement('div');
    bolha.id = 'lic-bolha';
    bolha.title = 'LiveCam Infinity (Clique para reabrir)';
    bolha.style.cssText = `
      position: fixed;
      top: 64px;
      right: 370px;
      z-index: 2147483647;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #070a14;
      border: 2px solid #ff1717;
      box-shadow: 0 10px 25px rgba(0,0,0,0.9);
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 22px;
      user-select: none;
    `;
    bolha.innerHTML = '🎥';
    document.documentElement.appendChild(bolha);

    // ARRASTAR & MINIMIZAR ISOLADOS DO LIVE CAM
    const head = document.getElementById('lic-head');
    aplicarDragLiveGo(hub, head, 'livecam-pos-hub');
    aplicarDragLiveGo(bolha, bolha, 'livecam-pos-bolha');

    document.getElementById('lic-btn-min').onclick = () => {
      hub.style.display = 'none';
      bolha.style.display = 'flex';
    };

    bolha.onclick = () => {
      hub.style.display = 'block';
      bolha.style.display = 'none';
    };

    videoEl = document.getElementById('lic-video-player');

    // SEEKBAR & TEMPO ATUALIZADO CONTINUAMENTE
    const seekbar = document.getElementById('lic-seekbar');
    const timeCur = document.getElementById('lic-time-cur');
    const timeDur = document.getElementById('lic-time-dur');

    function fmtTime(sec) {
      if (!sec || isNaN(sec)) return '0:00';
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    videoEl.ontimeupdate = () => {
      if (videoEl.duration) {
        seekbar.value = (videoEl.currentTime / videoEl.duration) * 100;
        timeCur.innerText = fmtTime(videoEl.currentTime);
        timeDur.innerText = fmtTime(videoEl.duration);
      }
    };

    seekbar.oninput = () => {
      if (videoEl.duration) {
        videoEl.currentTime = (seekbar.value / 100) * videoEl.duration;
      }
    };

    videoEl.onended = () => {
      if (playlist.length > 1) {
        proximoVideo();
      } else {
        videoEl.currentTime = 0;
        videoEl.play().catch(() => {});
      }
    };

    const fileInput = document.getElementById('lic-file-input');
    const screenBox = document.getElementById('lic-screen-box');
    const btnIniciar = document.getElementById('lic-btn-iniciar');
    const btnRestart = document.getElementById('lic-btn-restart');
    const btnAddVideos = document.getElementById('lic-btn-add-videos');
    const btnPrevStep = document.getElementById('lic-btn-prev-step');
    const btnNextStep = document.getElementById('lic-btn-next-step');
    const selectStep = document.getElementById('lic-select-step');
    const btnAudioToggle = document.getElementById('lic-btn-audio-toggle');
    const btnPower = document.getElementById('lic-btn-power');
    const btnCfg = document.getElementById('lic-btn-cfg');

    screenBox.onclick = () => fileInput.click();
    btnAddVideos.onclick = () => fileInput.click();

    fileInput.onchange = (e) => { if (e.target.files.length) addArquivos(e.target.files); };

    screenBox.ondragover = (e) => { e.preventDefault(); screenBox.style.borderColor = '#ffd000'; };
    screenBox.ondragleave = () => { screenBox.style.borderColor = 'rgba(255,208,0,0.2)'; };
    screenBox.ondrop = (e) => {
      e.preventDefault();
      screenBox.style.borderColor = 'rgba(255,208,0,0.2)';
      if (e.dataTransfer.files.length) addArquivos(e.dataTransfer.files);
    };

    btnIniciar.onclick = () => {
      if (!playlist.length) return fileInput.click();
      if (!videoEl.src || videoEl.paused) {
        tocar(idxAtual >= 0 ? idxAtual : 0);
      } else {
        videoEl.pause();
        atualizarEstado();
      }
    };

    btnRestart.onclick = () => {
      if (videoEl && videoEl.src) {
        videoEl.currentTime = 0;
        videoEl.play().catch(() => {});
        atualizarEstado();
      }
    };

    btnPrevStep.onclick = () => {
      if (videoEl && videoEl.duration) {
        const step = parseInt(selectStep.value, 10) || 10;
        videoEl.currentTime = Math.max(0, videoEl.currentTime - step);
      }
    };

    btnNextStep.onclick = () => {
      if (videoEl && videoEl.duration) {
        const step = parseInt(selectStep.value, 10) || 10;
        videoEl.currentTime = Math.min(videoEl.duration, videoEl.currentTime + step);
      }
    };

    const selectSpeed = document.getElementById('lic-select-speed');
    if (selectSpeed) {
      selectSpeed.onchange = () => {
        if (videoEl) {
          videoEl.playbackRate = parseFloat(selectSpeed.value) || 1.0;
          statusUI(`⚡ Velocidade ajustada para ${selectSpeed.value}x`);
        }
      };
    }

    // MINIMIZAÇÃO DA SEÇÃO VB-CABLE COM SETA ▾
    const vcHeader = document.getElementById('lic-vcable-header');
    const vcBody = document.getElementById('lic-vcable-body');
    const vcArrow = document.getElementById('lic-vcable-arrow');
    let vcExpanded = true;
    if (vcHeader && vcBody) {
      vcHeader.onclick = () => {
        vcExpanded = !vcExpanded;
        vcBody.style.display = vcExpanded ? 'flex' : 'none';
        if (vcArrow) vcArrow.style.transform = vcExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
      };
    }

    // ===================================================
    // SUÍTE DE ÁUDIO 5 CARDS LIVEFLOW 2.0 (VB-CABLE + INFINITO + TRECHOS + CAMADA MASTER + HISTÓRICOS)
    // ===================================================

    // 1. VB-CABLE STATUS & TEST
    const vbDot = document.getElementById('lic-vb-dot');
    const vbTxt = document.getElementById('lic-vb-txt');
    const btnTestAudio = document.getElementById('lic-btn-test-audio');

    async function checarVBCableServer() {
      try {
        const r = await fetch('http://localhost:7892/status', { method: 'GET' });
        const j = await r.json();
        if (j && j.ok && j.vbcable && !j.vbcable.includes('Nao encontrado')) {
          if (vbDot) { vbDot.style.background = '#00e5ff'; vbDot.style.boxShadow = '0 0 8px #00e5ff'; }
          if (vbTxt) { vbTxt.innerText = `● Conectado: ${j.vbcable}`; vbTxt.style.color = '#00e5ff'; }
        } else {
          if (vbDot) { vbDot.style.background = '#ffd000'; vbDot.style.boxShadow = 'none'; }
          if (vbTxt) { vbTxt.innerText = '● VB-Cable pronto (porta 7892)'; vbTxt.style.color = '#ffd000'; }
        }
      } catch (e) {
        if (vbDot) { vbDot.style.background = '#888'; vbDot.style.boxShadow = 'none'; }
        if (vbTxt) { vbTxt.innerText = '— configure abaixo'; vbTxt.style.color = '#888'; }
      }
    }
    checarVBCableServer();
    setInterval(checarVBCableServer, 5000);

    if (btnTestAudio) {
      btnTestAudio.onclick = async () => {
        regCamadaHist('Som de teste disparado no VB-Cable');
        try {
          await fetch('http://localhost:7892/som_natural', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ arquivo: 'plim.wav', volume: 0.8 })
          });
          statusUI('🎵 Som de teste enviado para o VB-Cable!');
        } catch (e) {
          playFxSound('clique');
          statusUI('🎵 Som de teste tocado localmente!');
        }
      };
    }

    // 2. SLIDERS DO CARD TRECHOS
    const segMin = document.getElementById('lic-seg-min');
    const segMinVal = document.getElementById('lic-seg-min-val');
    const segMax = document.getElementById('lic-seg-max');
    const segMaxVal = document.getElementById('lic-seg-max-val');
    const gapMax = document.getElementById('lic-gap-max');
    const gapMaxVal = document.getElementById('lic-gap-max-val');

    if (segMin && segMinVal) segMin.oninput = () => { segMinVal.innerText = `${segMin.value}s`; };
    if (segMax && segMaxVal) segMax.oninput = () => { segMaxVal.innerText = `${segMax.value}s`; };
    if (gapMax && gapMaxVal) gapMax.oninput = () => { gapMaxVal.innerText = `${gapMax.value}s`; };

    // 3. CAMADA AO VIVO (COM CHAVE MASTER ON/OFF)
    const togCamadaMaster = document.getElementById('lic-tog-camada-master');
    const lblCamadaMaster = document.getElementById('lic-camada-master-lbl');
    const sliderCamadaMaster = document.getElementById('lic-slider-camada-master');
    const ambVol = document.getElementById('lic-amb-vol');
    const ambVolVal = document.getElementById('lic-amb-vol-val');

    if (ambVol && ambVolVal) ambVol.oninput = () => { ambVolVal.innerText = `${ambVol.value}%`; };

    function atualizarEstadoCamadaMaster() {
      const ativo = togCamadaMaster ? togCamadaMaster.checked : true;
      if (lblCamadaMaster) {
        lblCamadaMaster.innerText = ativo ? 'LIGADO' : 'OFF';
        lblCamadaMaster.style.color = ativo ? '#00e5ff' : 'rgba(255,255,255,0.4)';
      }
      if (sliderCamadaMaster) {
        sliderCamadaMaster.style.backgroundColor = ativo ? '#00b8d9' : '#333';
        const circle = sliderCamadaMaster.querySelector('span');
        if (circle) circle.style.transform = ativo ? 'translateX(18px)' : 'translateX(0px)';
      }
      regCamadaHist(ativo ? 'Camada ao Vivo LIGADA' : 'Camada ao Vivo DESLIGADA');
      statusUI(ativo ? '🌿 Camada ao Vivo LIGADA' : '🔕 Camada ao Vivo DESLIGADA');
    }

    if (togCamadaMaster) {
      togCamadaMaster.onchange = atualizarEstadoCamadaMaster;
    }

    // 4. REGISTRO DE HISTÓRICOS (TRECHOS E CAMADAS)
    function regTrechoHist(txt) {
      const box = document.getElementById('lic-hist-trechos');
      if (!box) return;
      const h = new Date().toLocaleTimeString('pt-BR');
      const entry = `[${h}] ${txt}\n`;
      if (box.innerText.includes('Nenhum trecho')) box.innerText = entry;
      else box.innerText = entry + box.innerText;
    }

    function regCamadaHist(txt) {
      const box = document.getElementById('lic-hist-camadas');
      if (!box) return;
      const h = new Date().toLocaleTimeString('pt-BR');
      const entry = `[${h}] ${txt}\n`;
      if (box.innerText.includes('Nenhum evento')) box.innerText = entry;
      else box.innerText = entry + box.innerText;
    }

    const btnClearCamadas = document.getElementById('lic-hist-camadas-clear');
    if (btnClearCamadas) {
      btnClearCamadas.onclick = () => {
        const box = document.getElementById('lic-hist-camadas');
        if (box) box.innerText = '- Nenhum evento ainda';
      };
    }

    // 5. PLAYER DE ÁUDIO INFINITO
    const audioFileInput = document.getElementById('lic-audio-file');
    const audioPlayBtn = document.getElementById('lic-audio-play-btn');
    const audioNowTxt = document.getElementById('lic-audio-now-txt');
    const audioMont = document.getElementById('lic-audio-mont');
    const audioDot = document.getElementById('lic-audio-dot');
    let infinitAudioPlaying = false;
    let trechosCount = 0;

    if (audioFileInput) {
      audioFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          if (audioNowTxt) audioNowTxt.innerText = file.name;
          if (audioDot) audioDot.style.background = '#00e5ff';
          regTrechoHist(`Áudio carregado: ${file.name}`);
          statusUI(`🎵 Gravação carregada: ${file.name}`);
        }
      };
    }

    if (audioPlayBtn) {
      audioPlayBtn.onclick = () => {
        infinitAudioPlaying = !infinitAudioPlaying;
        if (infinitAudioPlaying) {
          trechosCount++;
          if (audioMont) audioMont.innerText = `${trechosCount} trechos montados`;
          if (audioDot) audioDot.style.background = '#00e5ff';
          regTrechoHist(`Trecho #${trechosCount} montado e tocando em loop`);
          statusUI(`▶ Áudio Infinito em reprodução`);
        } else {
          if (audioDot) audioDot.style.background = '#888';
          statusUI(`⏸ Áudio Infinito pausado`);
        }
      };
    }

    // COLLAPSE / EXPAND PARA CADA CARD (SETINHA DE MINIMIZAR ▲ / ▼)
    document.querySelectorAll('.lic-acc-card').forEach(card => {
      const header = card.querySelector('.lic-acc-header');
      const body = card.querySelector('.lic-acc-body');
      const arrow = card.querySelector('.lic-acc-arrow');
      if (header && body && arrow) {
        header.onclick = (e) => {
          if (e.target.closest('input') || e.target.closest('label') || e.target.closest('button') || e.target.closest('a')) return;
          const isClosed = body.style.display === 'none';
          if (isClosed) {
            body.style.display = 'flex';
            arrow.style.transform = 'rotate(0deg)';
          } else {
            body.style.display = 'none';
            arrow.style.transform = 'rotate(180deg)';
          }
        };
      }
    });

    // TOGGLE OUVIR ÁUDIO NO PC (LOCAL MONITOR)
    let ouvirLocal = false;
    btnAudioToggle.onclick = () => {
      ouvirLocal = !ouvirLocal;
      if (videoEl) videoEl.muted = !ouvirLocal;
      if (ouvirLocal) {
        btnAudioToggle.innerText = 'ON';
        btnAudioToggle.style.background = 'rgba(255,208,0,0.2)';
        btnAudioToggle.style.color = '#ffd000';
        btnAudioToggle.style.borderColor = '#ffd000';
      } else {
        btnAudioToggle.innerText = 'OFF';
        btnAudioToggle.style.background = 'rgba(255,255,255,0.06)';
        btnAudioToggle.style.color = 'rgba(255,255,255,0.6)';
        btnAudioToggle.style.borderColor = 'rgba(255,255,255,0.15)';
      }
    };

    btnPower.onclick = () => {
      if (ativo) desligar();
      else ligar();
    };

    btnCfg.onclick = () => {
      const mainV = document.getElementById('lic-main-view');
      const cfgV = document.getElementById('lic-settings-view');
      if (mainV && cfgV) {
        mainV.style.display = 'none';
        cfgV.style.display = 'flex';
        getLicenca(function (lic) {
          lic = lic || {};
          const elEm = document.getElementById('lic-cfg-email');
          const elKey = document.getElementById('lic-cfg-key');
          const elExp = document.getElementById('lic-cfg-exp');
          if (elEm) elEm.innerText = lic.email || 'cliente@email.com';
          if (elKey) elKey.innerText = lic.key || 'LIVEINF-ACTIVE';
          if (elExp) elExp.innerText = lic.exp ? new Date(lic.exp).toLocaleDateString('pt-BR') : '22/08/2026';
        });
      }
    };

    const cfgBack = document.getElementById('lic-cfg-back');
    if (cfgBack) {
      cfgBack.onclick = () => {
        const mainV = document.getElementById('lic-main-view');
        const cfgV = document.getElementById('lic-settings-view');
        if (mainV && cfgV) {
          cfgV.style.display = 'none';
          mainV.style.display = 'flex';
        }
      };
    }

    const cfgForceSync = document.getElementById('lic-cfg-btn-force-sync');
    if (cfgForceSync) {
      cfgForceSync.onclick = () => {
        recapturar();
        statusUI('⚡ Áudio e Vídeo resincronizados!');
        alert('⚡ Sincronização de áudio/vídeo realizada com sucesso!');
      };
    }

    if (videoEl) {
      videoEl.onplay = atualizarEstado;
      videoEl.onpause = atualizarEstado;
    }

    // AUTO-RETOMADA DO VÍDEO E WEBCAM APÓS F5
    (async function restaurarF5() {
      try {
        const vData = await carregarVideoDoDB('vid_0');
        if (vData) {
          playlist = [{ url: vData.url, nome: vData.name }];
          renderPlaylist();
          await tocar(0);
          statusUI(vData.name);
        }
      } catch (e) {}
    })();
  }


  function renderPlaylist() {
    const box = document.getElementById('lic-playlist');
    if (!box) return;
    box.innerHTML = '';
    if (!playlist.length) {
      box.innerHTML = '<div style="font-size:9px;color:rgba(255,255,255,0.3);font-style:italic;text-align:center;padding:4px;">Nenhum vídeo na lista ainda</div>';
      return;
    }
    playlist.forEach((item, idx) => {
      const row = document.createElement('div');
      row.style.cssText = `
        display:flex;align-items:center;justify-content:space-between;
        padding:5px 8px;border-radius:6px;font-size:10px;cursor:pointer;
        background:${idx === idxAtual ? 'rgba(255,208,0,0.15)' : 'rgba(255,255,255,0.03)'};
        border:1px solid ${idx === idxAtual ? 'rgba(255,208,0,0.4)' : 'rgba(255,255,255,0.05)'};
        color:${idx === idxAtual ? '#ffd000' : '#fff'};
      `;
      row.innerHTML = `
        <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:210px;">${idx === idxAtual ? '▶ ' : ''}${idx + 1}. ${item.nome}</span>
        <button style="border:none;background:transparent;color:#ff3355;cursor:pointer;font-weight:bold;" title="Remover">✕</button>
      `;
      row.querySelector('button').onclick = (e) => {
        e.stopPropagation();
        URL.revokeObjectURL(playlist[idx].url);
        playlist.splice(idx, 1);
        if (idx === idxAtual) {
          idxAtual = -1;
          if (playlist.length) tocar(0); else desligar();
        } else if (idx < idxAtual) idxAtual--;
        renderPlaylist();
      };
      row.onclick = () => tocar(idx);
      box.appendChild(row);
    });
  }

  function atualizarEstado() {
    const badge = document.getElementById('lic-badge');
    const btnIniciar = document.getElementById('lic-btn-iniciar');
    if (badge) {
      if (ativo) {
        badge.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#ffd000;" id="lic-badge-dot"></span> NO AR';
        badge.style.background = 'rgba(255,208,0,0.15)';
        badge.style.color = '#ffd000';
        badge.style.borderColor = 'rgba(255,208,0,0.3)';
      } else {
        badge.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#888;" id="lic-badge-dot"></span> Inativa';
        badge.style.background = 'rgba(255,255,255,0.06)';
        badge.style.color = 'rgba(255,255,255,0.6)';
        badge.style.borderColor = 'rgba(255,255,255,0.1)';
      }
    }
    if (btnIniciar) {
      if (videoEl && !videoEl.paused && videoEl.src) {
        btnIniciar.innerText = '⏸ Pausar';
      } else {
        btnIniciar.innerText = '▶ Iniciar';
      }
    }
  }

  function statusUI(msg) {
    const log = document.getElementById('lic-status-log');
    if (log) log.innerText = msg;
  }

  function iniciarInterfaceGeral() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', criarUI);
    } else {
      criarUI();
    }
  }

  // BOOTSTRAP DE AUTENTICAÇÃO E INICIALIZAÇÃO
  function boot() {
    getLicenca(function (lic) {
      if (!lic || !lic.key || lic.version !== VERSAO) {
        mostrarLoginGate('');
        return;
      }
      const dev = getDevice(lic);
      validarChave(lic.email, lic.key, dev, function (ok, reason, offline, data) {
        if (ok) {
          iniciarInterfaceGeral();
        } else {
          mostrarLoginGate(reason);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
