# KeyToken Manager

Extensão para Chrome/Firefox que obtém e gerencia Access Tokens do Keycloak (OpenID Connect).

## Pré-requisitos

- Navegador baseado em Chromium (Chrome, Edge, Brave) **ou** Firefox
- Git instalado (para clonar o repositório)

## Instalação

### 1. Obtenha o código

```bash
git clone https://github.com/CarlosHxH/KeyToken-Manager.git
```

Ou faça o download manual: [GitHub → Download ZIP](https://github.com/CarlosHxH/KeyToken-Manager) e extraia o arquivo.

### 2. Carregue a extensão no navegador

#### No Chrome / Edge / Brave

1. Acesse `chrome://extensions/`
2. Ative o **Modo do desenvolvedor** no canto superior direito
3. Clique em **Carregar sem compactação** (Load unpacked)
4. Selecione a pasta raiz do projeto (`KeyToken-Manager/`)

#### No Firefox

1. Acesse `about:debugging#/runtime/this-firefox`
2. Clique em **Carregar Complemento Temporário**
3. Selecione o arquivo `manifest.json` dentro da pasta do projeto

### 3. Pronto! 🎉

A extensão estará disponível na barra de extensões do navegador. Clique no ícone 🔐 para abrir o popup e configurar suas credenciais.

## Atualização

Após alterar o código, vá em `chrome://extensions/` (ou `about:debugging`) e clique em **Recarregar** na extensão.

## 🚀 Distribuição com auto-update (sem Chrome Web Store)

A cada `git push` na `main`, o workflow [`.github/workflows/release.yml`](.github/workflows/release.yml) empacota a extensão com [`scripts/pack_crx.py`](scripts/pack_crx.py) e publica no GitHub Pages:

| Arquivo | URL |
|---|---|
| 📦 Pacote assinado | `https://carloshxh.github.io/KeyToken-Manager/keytoken-manager.crx` |
| 🔄 Manifesto de update | `https://carloshxh.github.io/KeyToken-Manager/updates.xml` |
| 🗜️ ZIP (carregar sem compactação) | `https://carloshxh.github.io/KeyToken-Manager/keytoken-manager.zip` |

O `manifest.json` aponta `update_url` para o `updates.xml`; o Chrome consulta essa URL periodicamente (~5 h) e instala a nova versão sozinho.

> ⚠️ O Chrome só atualiza se a `version` do `manifest.json` **aumentar**. Faça o bump da versão em todo release.

### Configuração inicial (uma vez)

1. **Gere a chave privada** — ela define o ID fixo da extensão. Guarde-a em local seguro e **nunca** a commite (já está no `.gitignore`). Se a chave mudar, o ID muda e os usuários deixam de receber updates.
   ```bash
   openssl genrsa -out keytoken.pem 2048
   ```
2. **Cadastre o secret** em *Settings → Secrets and variables → Actions → New repository secret*:
   `CRX_PRIVATE_KEY` = conteúdo completo de `keytoken.pem` (incluindo as linhas `-----BEGIN/END-----`).
3. **Ative o Pages** em *Settings → Pages → Source*: **GitHub Actions**.
4. Faça um push na `main` (ou rode o workflow manualmente em *Actions → Release CRX → Run workflow*). O ID da extensão aparece no resumo do job e em `index.html` no Pages.

Para empacotar localmente:
```bash
python scripts/pack_crx.py --key keytoken.pem --out dist \
  --crx-url https://carloshxh.github.io/KeyToken-Manager/keytoken-manager.crx
```


### Instalação nos computadores dos usuários

No Windows e no macOS, o Chrome **bloqueia** `.crx` de fora da Web Store instalados manualmente. A forma suportada é via **política corporativa** (`ExtensionInstallForcelist`), que instala e mantém a extensão atualizada. Exemplo `.reg` para Windows (troque `<ID>` pelo ID da extensão):

```reg
Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\ExtensionInstallForcelist]
"1"="<ID>;https://carloshxh.github.io/KeyToken-Manager/updates.xml"
```

- No Edge, use a chave `HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Microsoft\Edge\ExtensionInstallForcelist`.
- Em escala, distribua a mesma política por GPO/Intune. No Windows, o Chrome só aceita extensões de fora da loja por política em máquinas gerenciadas (ingressadas em domínio ou registradas no Chrome Enterprise).
- Confira em `chrome://policy` e force a checagem em `chrome://extensions` → **Atualizar**.
- 🦊 Firefox: o `update_url` é ignorado. Lá a extensão precisa ser assinada pela AMO (mesmo que não listada).

## Estrutura do projeto

```
KeyToken-Manager/
├── .github/workflows/
│   └── release.yml     ← empacota .crx + updates.xml e publica no Pages
├── scripts/
│   └── pack_crx.py     ← empacotador CRX3 (stdlib + openssl)
├── manifest.json
├── popup.html          ← entry point do popup
├── styles.css
├── decode.html         ← página de decodificação JWT
├── decode.js           ← script clássico (sem imports)
├── js/
│   ├── popup.js        ← módulo principal (ESM)
│   ├── ui.js           ← manipulação do DOM
│   ├── api.js          ← requisição HTTP ao Keycloak
│   ├── timer.js        ← contagem regressiva do token
│   └── storage.js      ← persistência local (chrome.storage)
├── icon16.png
├── icon48.png
└── icon128.png
```

## Compatibilidade

- ✅ Chrome, Edge, Brave (Manifest V3)
- ✅ Firefox (via shim `browser` / `chrome` API)

## 🧪 Troubleshooting

### Extensão não aparece

* Verifique se o `manifest.json` está correto
* Veja erros no console (`F12` → aba *Console*)

### Erro ao carregar

* Confirme se selecionou a pasta raiz correta
