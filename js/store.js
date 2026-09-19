/* BizFinPro — IndexedDB persistence + localStorage fallback + backup/restore */
(function (global) {
  'use strict';
  const DB_NAME = 'bizfinpro';
  const DB_VER = 1;
  const LS_PREFIX = 'bizfinpro:';

  let db = null;
  let memoryMode = false;
  const memDB = { projects: new Map(), settings: new Map(), meta: new Map() };

  /* ---- localStorage backstop (used in memory mode; reliable in WebView/sandbox) ---- */
  function lsGet() { try { return global.localStorage; } catch (e) { return null; } }
  function lsLoad() {
    const ls = lsGet();
    if (!ls) return false;
    let loaded = false;
    ['projects', 'settings', 'meta'].forEach((name) => {
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
      };
      req.onsuccess = () => {
        db = req.result;
        /* mirror into memory so reads are resilient, then persist to LS too */
        try {
          const sync = () => {
            ['projects', 'settings'].forEach((sn) => {
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
    async putProject(p) {
      p.updatedAt = Date.now();
      await tx('projects', 'readwrite', (os) => os.put(p));
      return p;
    },
    async getProject(id) { return tx('projects', 'readonly', (os) => reqP(os.get(id))); },
    async listProjects() {
      const all = await tx('projects', 'readonly', (os) => os.getAll());
      return (all || []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    },
    async deleteProject(id) { return tx('projects', 'readwrite', (os) => os.delete(id)); },
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
      const projects = await tx('projects', 'readonly', (os) => os.getAll());
      const settings = await tx('settings', 'readonly', (os) => os.getAll());
      return {
        app: 'BizFinPro', schema: 1, modelVersion: 'V1',
        exportedAt: new Date().toISOString(),
        settings: (settings || []).reduce((a, kv) => { a[kv.key] = kv.value; return a; }, {}),
        projects: projects || []
      };
    },
    async importAll(json) {
      if (json && json.app === 'BizFinPro' && Array.isArray(json.projects)) {
        await tx('projects', 'readwrite', (os) => { (json.projects || []).forEach((p) => os.put(p)); });
        if (json.settings) {
          await tx('settings', 'readwrite', (os) => { Object.keys(json.settings).forEach((k) => os.put({ key: k, value: json.settings[k] })); });
        }
        return true;
      }
      return false;
    },
    async importProject(p) {
      if (!p || !p.id) return false;
      await tx('projects', 'readwrite', (os) => os.put(p));
      return true;
    },
    async clearAll() {
      await tx('projects', 'readwrite', (os) => os.clear());
      await tx('settings', 'readwrite', (os) => os.clear());
    }
  };

  global.Store = Store;
})(typeof window !== 'undefined' ? window : globalThis);
