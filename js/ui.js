export class UI {
  constructor() {
    this.statusDot = document.getElementById('status-dot');
    this.btnFetch = document.getElementById('btn-fetch');
    this.errorBox = document.getElementById('error-box');
    this.tokenSection = document.getElementById('token-section');
    this.tokenValueEl = document.getElementById('token-value');
    this.tokenBadge = document.getElementById('token-badge');
    this.tokenTypeEl = document.getElementById('token-type');
    this.tokenExpiresEl = document.getElementById('token-expires');
    this.tokenTimeEl = document.getElementById('token-time');
    this.progressBar = document.getElementById('progress-bar');
    this.timerRemaining = document.getElementById('timer-remaining');
    this.configToggle = document.getElementById('config-toggle');
    this.configSection = document.getElementById('config-section');
    this.togglePass = document.getElementById('toggle-pass');

    this.tokenData = null;
  }

  bindConfigToggle(handler) {
    this.configToggle.addEventListener('click', handler);
  }

  bindPasswordToggle(handler) {
    this.togglePass.addEventListener('click', handler);
  }

  bindFetchClick(handler) {
    this.btnFetch.addEventListener('click', handler);
  }

  bindPasswordEnter(handler) {
    document.getElementById('password').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handler();
    });
  }

  bindCopy(handler) {
    document.getElementById('btn-copy').addEventListener('click', handler);
  }

  bindDecode(handler) {
    document.getElementById('btn-decode').addEventListener('click', handler);
  }

  setCredentials(fields) {
    if (fields.username) document.getElementById('username').value = fields.username;
    if (fields.client_id) document.getElementById('client-id').value = fields.client_id;
    if (fields.token_url) document.getElementById('token-url').value = fields.token_url;
    if (fields.password) document.getElementById('password').value = fields.password;
    if (fields.remember_password !== undefined) {
      document.getElementById('remember-password').checked = fields.remember_password;
    }
  }

  getCredentials() {
    return {
      username: document.getElementById('username').value.trim(),
      password: document.getElementById('password').value,
      clientId: document.getElementById('client-id').value.trim(),
      tokenUrl: document.getElementById('token-url').value.trim(),
      rememberPassword: document.getElementById('remember-password').checked
    };
  }

  setFetching(state) {
    if (state) {
      this.btnFetch.disabled = true;
      this.btnFetch.textContent = '⏳ OBTENDO TOKEN...';
    } else {
      this.btnFetch.disabled = false;
      this.btnFetch.textContent = '⚡ OBTER ACCESS TOKEN';
    }
  }

  setStatus(state) {
    this.statusDot.className = 'status-dot' + (state !== 'idle' ? ' ' + state : '');
  }

  showError(msg) {
    this.errorBox.textContent = msg;
    this.errorBox.classList.add('visible');
    this.tokenSection.classList.remove('visible');
  }

  hideError() {
    this.errorBox.classList.remove('visible');
  }

  displayToken(token, expiresIn, type, obtainedAt) {
    this.tokenData = token;
    this.tokenValueEl.textContent = token;
    this.tokenTypeEl.textContent = type;
    this.tokenExpiresEl.textContent = expiresIn + 's';
    this.tokenTimeEl.textContent = new Date(obtainedAt).toLocaleTimeString('pt-BR');
    this.tokenSection.classList.add('visible');
    this.tokenBadge.textContent = 'ATIVO';
    this.tokenBadge.className = 'badge success';
  }

  updateTimerDisplay(remaining, pct) {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    this.timerRemaining.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
    this.timerRemaining.style.color = remaining < 60 ? 'var(--warning)' : 'var(--success)';
    this.progressBar.style.width = pct + '%';
    this.progressBar.className = 'progress-bar' + (pct < 20 ? ' warning' : '');
  }

  onTokenExpired() {
    this.timerRemaining.textContent = 'EXPIRADO';
    this.timerRemaining.style.color = 'var(--danger)';
    this.progressBar.style.width = '0%';
    this.tokenBadge.textContent = 'EXPIRADO';
    this.tokenBadge.className = 'badge expired';
    this.setStatus('error');
  }

  getToken() {
    return this.tokenData;
  }

  togglePasswordVisibility() {
    const passInput = document.getElementById('password');
    if (passInput.type === 'password') {
      passInput.type = 'text';
      this.togglePass.textContent = '🙈';
    } else {
      passInput.type = 'password';
      this.togglePass.textContent = '👁';
    }
  }

  toggleConfig() {
    this.configToggle.classList.toggle('open');
    this.configSection.classList.toggle('open');
  }

  async copyToken() {
    if (!this.tokenData) return;
    const btn = document.getElementById('btn-copy');

    const onSuccess = () => {
      btn.textContent = '✅ COPIADO!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = '📋 COPIAR TOKEN';
        btn.classList.remove('copied');
      }, 2000);
    };

    const fallbackCopy = () => {
      const ta = document.createElement('textarea');
      ta.value = this.tokenData;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        document.execCommand('copy');
        onSuccess();
      } catch (e) {
        this.showError('Falha ao copiar: ' + e.message);
      }
      document.body.removeChild(ta);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(this.tokenData).then(onSuccess).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  }
}
