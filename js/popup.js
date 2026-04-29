import { UI } from './ui.js';
import { Timer } from './timer.js';
import { fetchToken as apiFetchToken } from './api.js';
import { loadSavedCredentials, saveCredentials, saveTokenData, saveJwtPayload } from './storage.js';

const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

const ui = new UI();
const timer = new Timer(
  (remaining, pct) => ui.updateTimerDisplay(remaining, pct),
  () => ui.onTokenExpired()
);

ui.bindConfigToggle(() => ui.toggleConfig());
ui.bindPasswordToggle(() => ui.togglePasswordVisibility());
ui.bindFetchClick(handleFetch);
ui.bindPasswordEnter(handleFetch);
ui.bindCopy(() => ui.copyToken());
ui.bindDecode(handleDecode);

(async function init() {
  const saved = await loadSavedCredentials();
  ui.setCredentials({
    username: saved.username,
    client_id: saved.client_id,
    token_url: saved.token_url,
    password: saved.password,
    remember_password: saved.remember_password
  });

  if (saved.last_token_data) {
    const t = saved.last_token_data;
    if (t.expiresAt > Date.now()) {
      ui.displayToken(t.accessToken, t.expiresIn, t.tokenType, t.obtainedAt);
      timer.start(t.expiresAt, t.expiresIn);
      ui.setStatus('active');
    }
  }
})();

async function handleFetch() {
  const creds = ui.getCredentials();

  if (!creds.username || !creds.password) {
    ui.showError('Preencha usuário e senha.');
    return;
  }

  await saveCredentials(creds.username, creds.clientId, creds.tokenUrl, creds.rememberPassword, creds.password);

  ui.setStatus('loading');
  ui.setFetching(true);
  ui.hideError();
  timer.clear();

  try {
    const result = await apiFetchToken(creds.tokenUrl, creds.clientId, creds.username, creds.password);

    await saveTokenData(result.accessToken, result.expiresIn, result.tokenType, result.obtainedAt, result.expiresAt);

    ui.displayToken(result.accessToken, result.expiresIn, result.tokenType, result.obtainedAt);
    timer.start(result.expiresAt, result.expiresIn);
    ui.setStatus('active');
  } catch (err) {
    ui.showError('❌ ' + err.message);
    ui.setStatus('error');
  } finally {
    ui.setFetching(false);
  }
}

function handleDecode() {
  const token = ui.getToken();
  if (!token) return;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Não é um JWT');
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    saveJwtPayload(payload).then(() => {
      browserAPI.tabs.create({ url: browserAPI.runtime.getURL('decode.html') });
    });
  } catch (e) {
    ui.showError('Não foi possível decodificar: ' + e.message);
  }
}
