/* BizFinPro — IndexedDB persistence + localStorage fallback + backup/restore */
(function (global) {
  'use strict';
  const DB_NAME = 'bizfinpro';
  const DB_VER = 2;
  const LS_PREFIX = 'bizfinpro:';

  let db = null;
  let memoryMode = false;
  let ownerId = null;   // current signed-in user — projects are stored/filtered against this
  const memDB = { projects: new Map(), settings: new Map(), meta: new Map(), users: new Map() };

  /* ---- localStorage backstop (used in memory mode; reliable in WebView/sandbox) ---- */
  function lsGet() { try { return global.localStorage; } catch (e) { return null; } }
  function lsLoad() {
    const ls = lsGet();
    if (!ls) return false;
    let loaded = false;
    ['projects', 'settings', 'meta', 'users'].forEach((name) => {
      const raw = ls.getItem(LS_PREFIX + name);
      if (!raw) return;
      try {
        const arr = JSON.parse(raw);
        const m = memDB[name] || (memDB[name] = new Map());
        arr.forEach((rec) => m.set(rec != null && rec.id != null ? rec.id : rec.key, rec));
        loaded = true;
      } catch (e) { /* ignore corrupt */ }
    });
    return loaded;
  }
  function lsSave(name) {
    const ls = lsGet();
    if (!ls) return;
    const d = memDB[name];
    try { ls.setItem(LS_PREFIX + name, JSON.stringify([...d.values()])); }
    catch (e) { try { ls.removeItem(LS_PREFIX + name); } catch (e2) {} }
  }

  function open() {
    return new Promise((resolve, reject) => {
      if (db) return resolve(db);
      let idb = null;
      try { idb = global.indexedDB; } catch (e) { idb = null; }
      if (!idb) { enableMemory(); return resolve(null); }
      let req;
      try { req = idb.open(DB_NAME, DB_VER); }
      catch (e) { enableMemory(); return resolve(null); }
      req.onupgradeneeded = (e) => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains('projects')) d.createObjectStore('projects', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('settings')) d.createObjectStore('settings', { keyPath: 'key' });
        if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', { keyPath: 'key' });
        if (!d.objectStoreNames.contains('users')) d.createObjectStore('users', { keyPath: 'id' });
      };
      req.onsuccess = () => {
        db = req.result;
        /* mirror into memory so reads are resilient, then persist to LS too */
        try {
          const sync = () => {
            ['projects', 'settings', 'users'].forEach((sn) => {
              const t = db.transaction(sn, 'readonly');
              const os = t.objectStore(sn);
              const all = os.getAll();
              t.oncomplete = () => {
                const m = memDB[sn];
                all.result.forEach((rec) => m.set(rec.id != null ? rec.id : rec.key, rec));
              };
            });
          };
          sync();
        } catch (e) {}
        resolve(db);
      };
      req.onerror = () => { enableMemory(); resolve(null); };
    });
  }
  function enableMemory() {
    if (memoryMode) return;
    memoryMode = true;
    lsLoad();
  }
  function memStore(name) { if (!memDB[name]) memDB[name] = new Map(); return memDB[name]; }
  function memOps(name) {
    const d = memStore(name);
    return {
      put(v) { d.set(v.id != null ? v.id : v.key, v); lsSave(name); return Promise.resolve(v); },
      get(k) { return Promise.resolve(d.get(k)); },
      getAll() { return Promise.resolve([...d.values()]); },
      delete(k) { d.delete(k); lsSave(name); return Promise.resolve(); },
      clear() { d.clear(); lsSave(name); return Promise.resolve(); }
    };
  }

  function tx(store, mode, fn) {
    return open().then((d) => new Promise((resolve, reject) => {
      if (!d || memoryMode) { // memory (localStorage-backed) fallback
        const os = memOps(store);
        try { resolve(fn(os)); } catch (e) { reject(e); }
        return;
      }
      try {
        const t = d.transaction(store, mode);
        const os = t.objectStore(store);
        let out;
        try { out = fn(os); } catch (e) { reject(e); return; }
        t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : undefined);
        t.onerror = () => { reject(t.error); };
        t.onabort = () => { reject(t.error || new Error('aborted')); };
      } catch (e) {
        // transaction failed to open — fall back to memory
        const os = memOps(store);
        resolve(fn(os));
      }
    }));
  }
  function reqP(r) {
    if (r && typeof r.then === 'function') return r;
    return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  }

  const Store = {
    get memoryMode() { return memoryMode; },
    isMemoryMode() { return memoryMode; },

    /* ---- ownership / session (single-device, multi-user) ---- */
    setOwner(id) { ownerId = id; },
    getOwner() { return ownerId; },
    _ownerOf(r) { return ownerId && (!r.ownerId || r.ownerId === ownerId); },

    async putProject(p) {
      p.updatedAt = Date.now();
      if (!p.ownerId) p.ownerId = ownerId;   // adopt legacy projects on first save
      await tx('projects', 'readwrite', (os) => os.put(p));
      return p;
    },
    async getProject(id) {
      const p = await tx('projects', 'readonly', (os) => os.get(id));
      return (p && Store._ownerOf(p)) ? p : undefined;
    },
    async listProjects() {
      const all = await tx('projects', 'readonly', (os) => os.getAll());
      const own = (all || []).filter((p) => Store._ownerOf(p));
      return own.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    },
    async deleteProject(id) {
      // raw read (ignores ownership) so we can enforce it here
      const p = await tx('projects', 'readonly', (os) => os.get(id));
      if (p && !Store._ownerOf(p)) return;
      return tx('projects', 'readwrite', (os) => os.delete(id));
    },

    /* ---- users (name + scrypt/SHA-256 password hash) ---- */
    users: {
      async all() { const u = await tx('users', 'readonly', (os) => os.getAll()); return (u || []).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); },
      async get(id) { return tx('users', 'readonly', (os) => os.get(id)); },
      async byName(name) {
        const u = await tx('users', 'readonly', (os) => os.getAll());
        return (u || []).find((x) => x.name.toLowerCase() === String(name).toLowerCase());
      },
      async put(u) { return tx('users', 'readwrite', (os) => os.put(u)); },
      async del(id) { return tx('users', 'readwrite', (os) => os.delete(id)); }
    },

    /* ---- session (last signed-in user id) — stored in meta so it survives reloads ---- */
    async getSession() {
      const k = await tx('meta', 'readonly', (os) => os.get('session'));
      return k ? k.value : null;
    },
    async putSession(id) { return tx('meta', 'readwrite', (os) => os.put({ key: 'session', value: id })); },
    async getSettings() {
      const s = await tx('settings', 'readonly', (os) => os.getAll());
      const out = {};
      (s || []).forEach((kv) => { out[kv.key] = kv.value; });
      return out;
    },
    async putSetting(key, value) {
      return tx('settings', 'readwrite', (os) => os.put({ key, value }));
    },
    async putSettings(map) {
      return tx('settings', 'readwrite', (os) => {
        Object.keys(map).forEach((k) => os.put({ key: k, value: map[k] }));
      });
    },
    async exportAll() {
      const all = await tx('projects', 'readonly', (os) => os.getAll());
      const projects = (all || []).filter((p) => Store._ownerOf(p));
      const settings = await tx('settings', 'readonly', (os) => os.getAll());
      return {
        app: 'BizFinPro', schema: 2, modelVersion: 'V1',
        exportedAt: new Date().toISOString(),
        settings: (settings || []).reduce((a, kv) => { a[kv.key] = kv.value; return a; }, {}),
        projects
      };
    },
    async importAll(json) {
      if (json && json.app === 'BizFinPro' && Array.isArray(json.projects)) {
        await tx('projects', 'readwrite', (os) => {
          (json.projects || []).forEach((p) => { p.ownerId = ownerId; os.put(p); });
        });
        if (json.settings) {
          await tx('settings', 'readwrite', (os) => { Object.keys(json.settings).forEach((k) => os.put({ key: k, value: json.settings[k] })); });
        }
        return true;
      }
      return false;
    },
    async importProject(p) {
      if (!p || !p.id) return false;
      p.ownerId = ownerId;
      await tx('projects', 'readwrite', (os) => os.put(p));
      return true;
    },
    async clearAll() {
      // only the current user's data — other accounts stay intact
      const all = await tx('projects', 'readonly', (os) => os.getAll());
      await tx('projects', 'readwrite', (os) => {
        (all || []).forEach((p) => { if (Store._ownerOf(p)) os.delete(p.id); });
      });
      await tx('settings', 'readwrite', (os) => os.clear());
    },
    async deleteUserData(userId) {
      const all = await tx('projects', 'readonly', (os) => os.getAll());
      await tx('projects', 'readwrite', (os) => {
        (all || []).forEach((p) => { if (p.ownerId === userId) os.delete(p.id); });
      });
    }
  };

  global.Store = Store;
})(typeof window !== 'undefined' ? window : globalThis);
