var browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

function formatValue(key, value) {
  var tsFields = ['exp', 'iat', 'nbf', 'auth_time'];
  if (tsFields.indexOf(key) !== -1 && typeof value === 'number') {
    var date = new Date(value * 1000);
    return { text: date.toLocaleString('pt-BR') + ' (' + value + ')', cls: 'timestamp' };
  }
  if (typeof value === 'boolean') return { text: String(value), cls: 'boolean' };
  if (typeof value === 'number')  return { text: String(value), cls: 'number' };
  if (typeof value === 'object')  return { text: JSON.stringify(value, null, 2), cls: '' };
  return { text: String(value), cls: '' };
}

// ── Roles ─────────────────────────────────────────────────────

function isRolesContainer(value) {
  return value !== null && typeof value === 'object' && Array.isArray(value.roles);
}

// Extrai grupos de roles do payload: realm_access + resource_access (por client)
function extractRoleGroups(payload) {
  var groups = [];
  if (isRolesContainer(payload.realm_access)) {
    groups.push({ label: 'realm_access', roles: payload.realm_access.roles });
  }
  if (payload.resource_access !== null && typeof payload.resource_access === 'object') {
    Object.keys(payload.resource_access).forEach(function (client) {
      var entry = payload.resource_access[client];
      if (isRolesContainer(entry)) {
        groups.push({ label: 'resource_access · ' + client, roles: entry.roles });
      }
    });
  }
  return groups;
}

// Decompõe ROLE_<SISTEMA>_<MODULO>_<FUNCIONALIDADE...>
// Ex.: ROLE_SROP_BOLETIM_SIGILO_VISUALIZAR → sistema SROP, módulo BOLETIM,
// funcionalidade SIGILO_VISUALIZAR. Roles fora do padrão vão para "OUTRAS".
function parseRole(role) {
  var parts = role.split('_');
  if (parts[0] !== 'ROLE' || parts.length < 3 || parts.some(function (p) { return p === ''; })) {
    return null;
  }
  if (parts.length === 3) {
    return { system: parts[1], module: 'GERAL', func: parts[2] };
  }
  return { system: parts[1], module: parts[2], func: parts.slice(3).join('_') };
}

// Agrupa roles em sistema → módulo → [{role, text}]
function buildHierarchy(roles) {
  var systems = {};
  roles.slice().sort().forEach(function (role) {
    var parsed = parseRole(role);
    var system = parsed ? parsed.system : 'OUTRAS';
    var module = parsed ? parsed.module : '';
    var text   = parsed ? parsed.func : role;
    if (!systems[system]) systems[system] = {};
    if (!systems[system][module]) systems[system][module] = [];
    systems[system][module].push({ role: role, text: text });
  });
  return systems;
}

// Preenche o chip destacando o trecho que casa com o filtro
function setChipContent(chip, text, filter) {
  chip.textContent = '';
  if (!filter) {
    chip.textContent = text;
    return;
  }
  var lower = text.toLowerCase();
  var idx = lower.indexOf(filter);
  var pos = 0;
  while (idx !== -1) {
    if (idx > pos) chip.appendChild(document.createTextNode(text.slice(pos, idx)));
    var mark = document.createElement('span');
    mark.className = 'role-hl';
    mark.textContent = text.slice(idx, idx + filter.length);
    chip.appendChild(mark);
    pos = idx + filter.length;
    idx = lower.indexOf(filter, pos);
  }
  if (pos < text.length) chip.appendChild(document.createTextNode(text.slice(pos)));
}

function copyRole(chip, role) {
  var done = function () {
    chip.classList.add('copied');
    setTimeout(function () { chip.classList.remove('copied'); }, 1200);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(role).then(done).catch(function () {});
  }
}

function makeCount(value) {
  var count = document.createElement('span');
  count.className = 'roles-count';
  count.textContent = value;
  return count;
}

// Monta um grupo colapsável (fonte: realm_access / resource_access · client)
// e devolve as referências necessárias para o filtro
function renderGroup(group, container) {
  var systems = buildHierarchy(group.roles);

  var groupEl = document.createElement('div');
  groupEl.className = 'roles-group';

  var header = document.createElement('button');
  header.type = 'button';
  header.className = 'roles-group-header';

  var arrow = document.createElement('span');
  arrow.className = 'roles-arrow';
  arrow.textContent = '▶';

  var name = document.createElement('span');
  name.className = 'roles-group-name';
  name.textContent = group.label;

  var groupCount = makeCount(group.roles.length);

  header.appendChild(arrow);
  header.appendChild(name);
  header.appendChild(groupCount);
  header.addEventListener('click', function () {
    groupEl.classList.toggle('open');
  });

  var body = document.createElement('div');
  body.className = 'roles-group-body';

  var systemRefs = [];

  Object.keys(systems).sort().forEach(function (systemName) {
    var modules = systems[systemName];

    var systemEl = document.createElement('div');
    systemEl.className = 'tree-node tree-system';

    var systemTitle = document.createElement('div');
    systemTitle.className = 'tree-label';

    var systemLabel = document.createElement('span');
    systemLabel.textContent = systemName;

    var systemTotal = Object.keys(modules).reduce(function (sum, m) {
      return sum + modules[m].length;
    }, 0);
    var systemCount = makeCount(systemTotal);

    systemTitle.appendChild(systemLabel);
    systemTitle.appendChild(systemCount);
    systemEl.appendChild(systemTitle);

    var systemChildren = document.createElement('div');
    systemChildren.className = 'tree-children';
    systemEl.appendChild(systemChildren);

    var moduleRefs = [];

    Object.keys(modules).sort().forEach(function (moduleName) {
      var entries = modules[moduleName];
      var moduleCount = makeCount(entries.length);
      var moduleEl;
      var leafContainer;

      if (moduleName) {
        moduleEl = document.createElement('div');
        moduleEl.className = 'tree-node tree-module';

        var moduleTitle = document.createElement('div');
        moduleTitle.className = 'tree-label';

        var moduleLabel = document.createElement('span');
        moduleLabel.textContent = moduleName;

        moduleTitle.appendChild(moduleLabel);
        moduleTitle.appendChild(moduleCount);
        moduleEl.appendChild(moduleTitle);

        leafContainer = document.createElement('div');
        leafContainer.className = 'tree-children';
        moduleEl.appendChild(leafContainer);
      } else {
        // Roles sem módulo (bucket OUTRAS): folhas direto sob o sistema
        moduleEl = document.createElement('div');
        moduleEl.className = 'tree-module-flat';
        leafContainer = moduleEl;
      }

      var chipRefs = entries.map(function (entry) {
        var leaf = document.createElement('button');
        leaf.type = 'button';
        leaf.className = 'tree-leaf';
        leaf.title = entry.role + ' — clique para copiar';
        setChipContent(leaf, entry.text, '');
        leaf.addEventListener('click', function () { copyRole(leaf, entry.role); });
        leafContainer.appendChild(leaf);
        return { el: leaf, role: entry.role, text: entry.text };
      });

      systemChildren.appendChild(moduleEl);
      moduleRefs.push({ el: moduleEl, countEl: moduleCount, chips: chipRefs });
    });

    body.appendChild(systemEl);
    systemRefs.push({ el: systemEl, countEl: systemCount, modules: moduleRefs });
  });

  groupEl.appendChild(header);
  groupEl.appendChild(body);
  container.appendChild(groupEl);

  return { el: groupEl, countEl: groupCount, systems: systemRefs, total: group.roles.length };
}

function renderRoles(groups) {
  if (!groups.length) return;

  var section   = document.getElementById('roles-section');
  var container = document.getElementById('roles-groups');
  var totalEl   = document.getElementById('roles-total');
  var emptyEl   = document.getElementById('roles-empty');
  var searchEl  = document.getElementById('roles-search');

  var refs = groups.map(function (group) {
    return renderGroup(group, container);
  });

  var total = refs.reduce(function (sum, r) { return sum + r.total; }, 0);
  totalEl.textContent = total;
  section.style.display = 'block';

  searchEl.addEventListener('input', function () {
    var filter = searchEl.value.trim().toLowerCase();
    var totalVisible = 0;

    refs.forEach(function (group) {
      var groupVisible = 0;

      group.systems.forEach(function (system) {
        var systemVisible = 0;
        var systemTotal = 0;

        system.modules.forEach(function (module) {
          var moduleVisible = 0;
          module.chips.forEach(function (chip) {
            var match = !filter || chip.role.toLowerCase().indexOf(filter) !== -1;
            chip.el.style.display = match ? '' : 'none';
            if (match) {
              setChipContent(chip.el, chip.text, filter);
              moduleVisible++;
            }
          });
          module.countEl.textContent = filter
            ? moduleVisible + '/' + module.chips.length
            : module.chips.length;
          module.el.style.display = moduleVisible ? '' : 'none';
          systemVisible += moduleVisible;
          systemTotal   += module.chips.length;
        });

        system.countEl.textContent = filter
          ? systemVisible + '/' + systemTotal
          : systemTotal;
        system.el.style.display = systemVisible ? '' : 'none';
        groupVisible += systemVisible;
      });

      group.countEl.textContent = filter
        ? groupVisible + '/' + group.total
        : group.total;
      group.el.style.display = (groupVisible || !filter) ? '' : 'none';
      // Com filtro ativo, expande os grupos que têm resultado
      group.el.classList.toggle('filter-open', Boolean(filter) && groupVisible > 0);
      totalVisible += groupVisible;
    });

    totalEl.textContent = filter ? totalVisible + '/' + total : total;
    emptyEl.style.display = totalVisible ? 'none' : 'block';
  });
}

// ── Render principal ──────────────────────────────────────────

function renderPayload(raw) {
  var payload = JSON.parse(raw);
  var grid    = document.getElementById('fields-grid');

  var roleGroups = extractRoleGroups(payload);
  renderRoles(roleGroups);

  // Chaves já exibidas como chips de roles ficam fora do grid
  var skipKeys = [];
  if (isRolesContainer(payload.realm_access)) skipKeys.push('realm_access');
  if (roleGroups.some(function (g) { return g.label.indexOf('resource_access') === 0; })) {
    skipKeys.push('resource_access');
  }

  Object.keys(payload).forEach(function (key) {
    if (skipKeys.indexOf(key) !== -1) return;

    var value = payload[key];
    var fmt   = formatValue(key, value);

    var card = document.createElement('div');
    card.className = 'field-card';

    var keyEl = document.createElement('div');
    keyEl.className   = 'field-key';
    keyEl.textContent = key;

    var valEl = document.createElement('div');
    valEl.className   = 'field-value ' + fmt.cls;
    valEl.textContent = fmt.text;

    card.appendChild(keyEl);
    card.appendChild(valEl);
    grid.appendChild(card);
  });

  document.getElementById('raw-pre').textContent = raw;
  document.getElementById('content').style.display = 'block';
}

browserAPI.storage.local.get(['_jwt_decode_payload'], function (result) {
  document.getElementById('loading').style.display = 'none';

  // Mantém o payload no sessionStorage para sobreviver a F5 (o storage.local
  // é limpo logo após a leitura, por segurança)
  var raw = result._jwt_decode_payload || sessionStorage.getItem('_jwt_decode_payload');

  if (!raw) {
    var err = document.getElementById('error-msg');
    err.style.display = 'block';
    err.textContent = '❌ Nenhum payload encontrado. Abra esta página através da extensão.';
    return;
  }

  try {
    renderPayload(raw);
    sessionStorage.setItem('_jwt_decode_payload', raw);
    browserAPI.storage.local.remove('_jwt_decode_payload');
  } catch (e) {
    var errEl = document.getElementById('error-msg');
    errEl.style.display = 'block';
    errEl.textContent   = '❌ Erro ao processar payload: ' + e.message;
  }
});

document.getElementById('raw-toggle').addEventListener('click', function () {
  document.getElementById('raw-toggle').classList.toggle('open');
  document.getElementById('raw-pre').classList.toggle('open');
});
