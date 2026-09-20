/* BizFinPro — lightweight local authentication (offline, per-device)
 * Sha256(password + salt), pure JS — works with IndexedDB AND file:// (no WebCrypto required).
 * NOTE: this is a device-local login screen, NOT a server account. Data is not encrypted at rest
 * (per user request); password hashing just avoids storing the plaintext password.
 */
(function (global) {
  'use strict';

  /* ---- SHA-256 (pure JS, sync) ---- */
  var SHA256 = (function () {
    var K = new Uint32Array([
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ]);
    var rotR = function (x, n) { return (x >>> n) | (x << (32 - n)); };
    function sha256Bytes(bytes) {
      var H = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
      var l = bytes.length;
      var withOne = new Uint8Array(l + 1);
      withOne.set(bytes); withOne[l] = 0x80;
      var len = withOne.length;
      var padLen = ((len + 8 + 63) >> 6) << 6;
      var data = new Uint8Array(padLen);
      data.set(withOne);
      var dv = new DataView(data.buffer);
      dv.setUint32(padLen - 8, (l >>> 29) & 0xFFFFFFFF);
      dv.setUint32(padLen - 4, (l << 3) & 0xFFFFFFFF);
      var w = new Uint32Array(64);
      for (var i = 0; i < padLen; i += 64) {
        for (var t = 0; t < 16; t++) w[t] = (data[i + t*4] << 24) | (data[i + t*4 + 1] << 16) | (data[i + t*4 + 2] << 8) | data[i + t*4 + 3];
        for (t = 16; t < 64; t++) {
          var s0 = rotR(w[t-15],7) ^ rotR(w[t-15],18) ^ (w[t-15] >>> 3);
          var s1 = rotR(w[t-2],17) ^ rotR(w[t-2],19) ^ (w[t-2] >>> 10);
          w[t] = (w[t-16] + s0 + w[t-7] + s1) | 0;
        }
        var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
        for (t = 0; t < 64; t++) {
          var S1 = rotR(e,6) ^ rotR(e,11) ^ rotR(e,25);
          var ch = (e & f) ^ (~e & g);
          var temp1 = (h + S1 + ch + K[t] + w[t]) | 0;
          var S0 = rotR(a,2) ^ rotR(a,13) ^ rotR(a,22);
          var maj = (a & b) ^ (a & c) ^ (b & c);
          var temp2 = (S0 + maj) | 0;
          h=g; g=f; f=e; e=(d+temp1)|0; d=c; c=b; b=a; a=(temp1+temp2)|0;
        }
        H[0]=(H[0]+a)|0; H[1]=(H[1]+b)|0; H[2]=(H[2]+c)|0; H[3]=(H[3]+d)|0;
        H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;
      }
      var out = [];
      for (var j = 0; j < 8; j++) out.push((H[j] >>> 24 & 255).toString(16).padStart(2,'0'), (H[j] >>> 16 & 255).toString(16).padStart(2,'0'), (H[j] >>> 8 & 255).toString(16).padStart(2,'0'), (H[j] & 255).toString(16).padStart(2,'0'));
      return out.join('');
    }
    return { str: function (s) { var e = new TextEncoder(); return sha256Bytes(e.encode(s)); }, rand: function (n) { n = n || 16; var a = new Uint8Array(n); if (global.crypto && crypto.getRandomValues) crypto.getRandomValues(a); else for (var i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256); var s = ''; for (i = 0; i < n; i++) s += a[i].toString(16).padStart(2, '0'); return s; }, hash: function (pw, salt) { return sha256Bytes(new TextEncoder().encode(salt + pw)); } };
  })();

  const salt = () => SHA256.rand(16);
  const uid = (() => { let c = 0; return () => 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); })();

  function verify(user, password) { return !!user && user.pwHash === SHA256.hash(password, user.salt || ''); }

  const Store = global.Store;

  const Auth = {
    sha256: SHA256,
    uid,
    hashPassword: (password, s) => SHA256.hash(password, s || ''),
    verify,

    /* --- create an account (offline) --- */
    async register(name, password) {
      if (!name || !String(name).trim()) throw new Error(I18N.t('auth.err_name'));
      if (!password || String(password).length < 4) throw new Error(I18N.t('auth.err_short'));
      const existing = await Store.users.byName(name);
      if (existing) throw new Error(I18N.t('auth.err_exists'));
      const s = salt();
      const user = {
        id: uid(),
        name: String(name).trim(),
        salt: s,
        pwHash: SHA256.hash(password, s),
        createdAt: Date.now()
      };
      await Store.users.put(user);
      return user;
    },

    async login(name, password) {
      const user = await Store.users.byName(name);
      if (!user || !verify(user, password)) throw new Error(I18N.t('auth.err_login'));
      await Store.putSession(user.id);
      Store.setOwner(user.id);
      return user;
    },

    async resume(id) {
      if (!id) return null;
      const user = await Store.users.get(id);
      if (!user) return null;
      Store.setOwner(user.id);
      return user;
    },

    async changePassword(user, current, next) {
      if (!verify(user, current)) throw new Error(I18N.t('auth.err_pw'));
      if (!next || String(next).length < 4) throw new Error(I18N.t('auth.err_short'));
      const s = salt();
      user.salt = s;
      user.pwHash = SHA256.hash(next, s);
      await Store.users.put(user);
      return user;
    },

    async removeAccount(userId) {
      await Store.deleteUserData(userId);
      await Store.users.del(userId);
    },

    async logout() {
      Store.setOwner(null);
      await Store.putSession('');
    }
  };

  global.Auth = Auth;
  global.SHA256 = SHA256;
})(typeof window !== 'undefined' ? window : globalThis);
