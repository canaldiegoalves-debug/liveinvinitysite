'use strict';
const API_URL = 'https://api.valoranegocios.com.br';
const PRODUTO = 'livecam';

async function getDeviceId() {
  try {
    const data = await chrome.storage.local.get('device_id');
    if (data && data.device_id) return data.device_id;
    const novoId = 'dv-cam-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    await chrome.storage.local.set({ device_id: novoId });
    return novoId;
  } catch (e) {
    return 'dv-cam-fallback-' + Date.now();
  }
}

async function checarStatus() {
  const { logado, token } = await chrome.storage.local.get(['logado', 'token']);
  const loginSec = document.getElementById('loginSection');
  const loggedSec = document.getElementById('loggedSection');

  if (logado && token) {
    if (loginSec) loginSec.style.display = 'none';
    if (loggedSec) loggedSec.style.display = 'block';
  } else {
    if (loginSec) loginSec.style.display = 'block';
    if (loggedSec) loggedSec.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checarStatus();

  const btnEntrar = document.getElementById('btnEntrar');
  const btnSair = document.getElementById('btnSair');
  const chaveInput = document.getElementById('chaveInput');
  const msg = document.getElementById('msg');

  if (btnEntrar) {
    btnEntrar.addEventListener('click', async () => {
      const chave = (chaveInput.value || '').trim().toUpperCase();
      if (!chave) {
        msg.style.color = '#ff3355';
        msg.textContent = 'Digite a chave de acesso.';
        return;
      }

      msg.style.color = '#ffd000';
      msg.textContent = 'Validando no servidor...';
      btnEntrar.disabled = true;

      try {
        const device_id = await getDeviceId();
        const resp = await fetch(`${API_URL}/api/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: chave, chave: chave, produto: PRODUTO, device_id: device_id, device: device_id })
        });

        const data = await resp.json().catch(() => ({}));

        if (resp.ok && (data.ok || data.valid || data.status === 'active')) {
          await chrome.storage.local.set({
            token: data.token || 'jwt_active_token',
            logado: true,
            chave: chave,
            email: data.email || ''
          });
          msg.style.color = '#00e676';
          msg.textContent = '✅ Câmera HD Liberada!';
          setTimeout(checarStatus, 500);
        } else {
          msg.style.color = '#ff3355';
          msg.textContent = data.error || data.erro || 'Chave inválida. Tente novamente.';
          btnEntrar.disabled = false;
        }
      } catch (e) {
        msg.style.color = '#ff3355';
        msg.textContent = 'Erro de conexão com o servidor.';
        btnEntrar.disabled = false;
      }
    });
  }

  if (btnSair) {
    btnSair.addEventListener('click', async () => {
      await chrome.storage.local.remove(['logado', 'token', 'chave']);
      checarStatus();
    });
  }
});
