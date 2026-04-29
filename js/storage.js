const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

export function getStorage(keys) {
  return new Promise((resolve) => {
    browserAPI.storage.local.get(keys, resolve);
  });
}

export function setStorage(data) {
  return new Promise((resolve) => {
    browserAPI.storage.local.set(data, resolve);
  });
}

export async function loadSavedCredentials() {
  return getStorage(['username', 'password', 'remember_password', 'client_id', 'token_url', 'last_token_data']);
}

export async function saveCredentials(username, clientId, tokenUrl, rememberPassword, password) {
  return setStorage({
    username,
    client_id: clientId,
    token_url: tokenUrl,
    remember_password: rememberPassword,
    password: rememberPassword ? password : ''
  });
}

export async function saveTokenData(accessToken, expiresIn, tokenType, obtainedAt, expiresAt) {
  return setStorage({
    last_token_data: {
      accessToken,
      expiresIn,
      tokenType,
      obtainedAt,
      expiresAt
    }
  });
}

export async function saveJwtPayload(payload) {
  return new Promise((resolve) => {
    browserAPI.storage.local.set(
      { _jwt_decode_payload: JSON.stringify(payload, null, 2) },
      resolve
    );
  });
}
