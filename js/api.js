export async function fetchToken(tokenUrl, clientId, username, password) {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    username,
    password
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.error || ('HTTP ' + response.status));
  }

  if (!data.access_token) {
    throw new Error('Resposta inválida: access_token ausente.');
  }

  const obtainedAt = Date.now();
  const expiresIn = data.expires_in || 300;
  const expiresAtMs = obtainedAt + expiresIn * 1000;

  return {
    accessToken: data.access_token,
    expiresIn,
    tokenType: data.token_type || 'Bearer',
    obtainedAt,
    expiresAt: expiresAtMs
  };
}
