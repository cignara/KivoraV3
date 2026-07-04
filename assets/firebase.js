(function() {
  'use strict';
  const ns = window.kivoraFirebase = { ready: false };

  const CONFIG = {
    apiKey: "AIzaSyBXdDDJvdInfdhovdx_Jo3YN_dhY-RY8yo",
    authDomain: "kivora-learning.firebaseapp.com",
    projectId: "kivora-learning",
    storageBucket: "kivora-learning.firebasestorage.app",
    messagingSenderId: "145485791442",
    appId: "1:145485791442:web:d0a6f467aecc29101f6d0b",
    measurementId: "G-DZZ18Z4J87"
  };

  function isFileProtocol() { return window.location && window.location.protocol === 'file:'; }

  function getUid() { return ns.auth && ns.auth.currentUser && ns.auth.currentUser.uid; }

  function getSelectedRole() {
    return (window._kivoraLoginRole === 'teacher') ? 'teacher' : 'parent';
  }

  function redirectByRole(role) {
    var dest = (role === 'teacher') ? './teachers.html' : './parents.html';
    window.location.href = dest;
  }

  function saveUserProfile(user, role) {
    if (!ns.db || !user) return;
    var profile = {
      uid: user.uid,
      email: user.email || null,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      role: role || 'parent',
      lastLogin: Date.now()
    };
    ns.db.ref('users/' + user.uid + '/profile').set(profile).catch(function(e) {
      console.warn('[Kivora Firebase] saveUserProfile error:', e.message);
    });
    try { localStorage.setItem('kivora_user_role', profile.role); } catch(e) {}
  }

  // FIX: dbRef throws if uid is null, preventing writes to users/null/…
  function dbRef(path) {
    var uid = getUid();
    if (!uid) throw new Error('[Kivora Firebase] dbRef called without authenticated uid');
    return ns.db.ref('users/' + uid + '/' + path);
  }

  function init() {
    if (typeof firebase === 'undefined') {
      console.warn('[Kivora Firebase] SDK not loaded — localStorage fallback');
      return;
    }
    try {
      if (firebase.apps.length) return;
      firebase.initializeApp(CONFIG);
      ns.auth = firebase.auth();
      ns.db   = firebase.database();
      ns.ready = true;
      console.log('[Kivora Firebase] Ready');

      // FIX: persistent auth listener moved inside init() so ns.auth is defined
      ns.auth.onAuthStateChanged(function(user) {
        if (user) {
          ns._uid = user.uid;
          if (!user.isAnonymous) {
            try { localStorage.setItem('kivora_firebase_uid', user.uid); } catch(e) {}
          }
        } else {
          ns._uid = null;
        }
      });

      if (navigator.onLine !== false) syncFromCloud();
    } catch (e) {
      console.warn('[Kivora Firebase] Init error:', e.message);
    }
  }

  ns.onAuthChanged = function(cb) {
    if (!ns.auth) { cb(null); return function() {}; }
    return ns.auth.onAuthStateChanged(cb);
  };

  ns.signInAnonymously = function() {
    if (!ns.auth) return Promise.reject('Firebase not available');
    return ns.auth.signInAnonymously().catch(function(e) {
      if (e.code === 'auth/operation-not-allowed') {
        console.warn('[Kivora Firebase] Anonymous auth not enabled in Firebase Console → Authentication → Sign-in method');
      }
      throw e;
    });
  };

  ns.signInWithGoogle = function() {
    if (!ns.auth) return Promise.reject(new Error('Firebase not available'));
    if (isFileProtocol()) {
      return Promise.reject(new Error('Google sign-in requires a web server.'));
    }
    if (ns._googlePopupPending) {
      return Promise.reject({ code: 'auth/cancelled-popup-request', message: 'Already opening Google sign-in' });
    }
    ns._googlePopupPending = true;
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    var role = getSelectedRole();
    return ns.auth.signInWithPopup(provider).then(function(result) {
      ns._googlePopupPending = false;
      try { localStorage.setItem('kivora_firebase_uid', result.user.uid); } catch(e) {}
      saveUserProfile(result.user, role);
      _syncLocalToCloud(result.user.uid);
      setTimeout(function() { redirectByRole(role); }, 100);
      return result;
    }).catch(function(e) {
      ns._googlePopupPending = false;
      throw e;
    });
  };

  ns.signInWithEmail = function(email, password) {
    if (!ns.auth) return Promise.reject(new Error('Firebase not available — please try again'));
    var role = getSelectedRole();
    return ns.auth.signInWithEmailAndPassword(email, password).then(function(result) {
      try { localStorage.setItem('kivora_firebase_uid', result.user.uid); } catch(e) {}
      saveUserProfile(result.user, role);
      _syncLocalToCloud(result.user.uid);
      setTimeout(function() { redirectByRole(role); }, 100);
      return result;
    });
  };

  ns.createAccount = function(email, password) {
    if (!ns.auth) return Promise.reject(new Error('Firebase not available — please try again or use Google sign-in'));
    var role = getSelectedRole();
    return ns.auth.createUserWithEmailAndPassword(email, password).then(function(result) {
      try { localStorage.setItem('kivora_firebase_uid', result.user.uid); } catch(e) {}
      saveUserProfile(result.user, role);
      _syncLocalToCloud(result.user.uid);
      setTimeout(function() { redirectByRole(role); }, 100);
      return result;
    });
  };

  ns.signOut = function() {
    if (!ns.auth) return Promise.reject('Firebase not available');
    try { localStorage.removeItem('kivora_firebase_uid'); } catch(e) {}
    try { localStorage.removeItem('kivora_user_role'); } catch(e) {}
    return ns.auth.signOut();
  };

  ns.getUser = function() { return ns.auth && ns.auth.currentUser; };

  ns.saveChildProfile = function(child) {
    if (!ns.db || !getUid()) return Promise.resolve();
    return dbRef('children/' + child.id).set(child);
  };

  ns.loadChildren = function() {
    if (!ns.db || !getUid()) return Promise.resolve([]);
    return dbRef('children').once('value').then(function(snap) {
      var arr = [];
      snap.forEach(function(d) { arr.push(d.val()); });
      return arr;
    });
  };

  ns.saveProgress = function(childId, code, data) {
    if (!ns.db || !getUid()) return Promise.resolve();
    return dbRef('progress/' + childId + '/' + code).set({
      childId: childId, code: code,
      ts:    data.ts    || Date.now(),
      stars: data.stars || 1,
      xp:    data.xp    || 0,
      coins: data.coins || 0,
      name:  data.name  || code,
      world: data.world || '',
      icon:  data.icon  || '📚'
    });
  };

  // FIX: loadProgress now returns full record including name/world/icon
  ns.loadProgress = function(childId) {
    if (!ns.db || !getUid()) return Promise.resolve({});
    return dbRef('progress/' + childId).once('value').then(function(snap) {
      var obj = {};
      snap.forEach(function(d) {
        var v = d.val();
        obj[d.key] = {
          ts:    v.ts,
          stars: v.stars || 1,
          xp:    v.xp    || 0,
          coins: v.coins || 0,
          name:  v.name  || d.key,
          world: v.world || '',
          icon:  v.icon  || '📚'
        };
      });
      return obj;
    });
  };

  ns.saveScreenTimeSettings = function(childId, settings) {
    if (!ns.db || !getUid()) return Promise.resolve();
    return dbRef('settings/' + childId).set(settings);
  };

  ns.loadScreenTimeSettings = function(childId) {
    if (!ns.db || !getUid()) return Promise.resolve({});
    return dbRef('settings/' + childId).once('value').then(function(snap) {
      return snap.val() || {};
    });
  };

  // FIX: _syncLocalToCloud now writes all fields (xp, coins, name, world, icon)
  function _syncLocalToCloud(uid) {
    if (!ns.db) return;
    try {
      var kids = JSON.parse(localStorage.getItem('kivora_children') || '[]');
      kids.forEach(function(child) {
        ns.db.ref('users/' + uid + '/children/' + child.id).set(child).catch(function() {});
        try {
          var progressKey = 'kivora_progress_' + child.id;
          var prog = JSON.parse(localStorage.getItem(progressKey) || '{}');
          Object.keys(prog).forEach(function(code) {
            var p = prog[code];
            ns.db.ref('users/' + uid + '/progress/' + child.id + '/' + code).set({
              childId: child.id,
              code:   code,
              ts:     p.ts    || Date.now(),
              stars:  p.stars || 1,
              xp:     p.xp    || 0,
              coins:  p.coins || 0,
              name:   p.name  || code,
              world:  p.world || '',
              icon:   p.icon  || '📚'
            }).catch(function() {});
          });
        } catch(e) {}
      });
    } catch(e) { console.warn('[Kivora Firebase] syncLocalToCloud error:', e.message); }
  }

  // Merge cloud data into localStorage
  function _loadCloudIntoLocal() {
    ns.loadChildren().then(function(cloudKids) {
      if (!cloudKids.length) return;
      var local = JSON.parse(localStorage.getItem('kivora_children') || '[]');
      var merged = local.slice();
      cloudKids.forEach(function(c) {
        if (!merged.find(function(x) { return x.id === c.id; })) merged.push(c);
      });
      try { localStorage.setItem('kivora_children', JSON.stringify(merged)); } catch(e) {}
      cloudKids.forEach(function(c) {
        ns.loadProgress(c.id).then(function(cloudData) {
          if (!cloudData || !Object.keys(cloudData).length) return;
          var key = 'kivora_progress_' + c.id;
          var localProg = {};
          try { localProg = JSON.parse(localStorage.getItem(key) || '{}'); } catch(e) {}
          Object.keys(cloudData).forEach(function(code) {
            // Cloud wins — it has the full record
            localProg[code] = cloudData[code];
          });
          try { localStorage.setItem(key, JSON.stringify(localProg)); } catch(e) {}
        }).catch(function() {});
      });
    }).catch(function() {});
  }

  // FIX: syncFromCloud detects returning authenticated user and redirects to correct dashboard.
  // Only redirects when on index.html — doesn't interfere with other pages.
  function syncFromCloud() {
    if (!ns.auth) return;
    var handled = false;
    var unsub = ns.auth.onAuthStateChanged(function(user) {
      if (handled) return;
      if (!user) return; // wait for a real sign-in
      if (user.isAnonymous) return; // child session — stay on index.html
      handled = true;
      if (unsub) unsub();
      // Silently merge cloud data into localStorage
      _loadCloudIntoLocal();
      // Redirect returning authenticated parent/teacher away from index.html
      var path = window.location.pathname;
      var onIndex = path === '/' || path.endsWith('/index.html') || path.endsWith('/');
      if (onIndex) {
        var role = localStorage.getItem('kivora_user_role') || 'parent';
        redirectByRole(role);
      }
    });
  }

  ns.loadFromCloud = function() { _loadCloudIntoLocal(); };

  // Hook startLearning — deferred to DOMContentLoaded so app.js is guaranteed loaded
  document.addEventListener('DOMContentLoaded', function() {
    var origStart = window.startLearning;
    if (origStart && !window._fbStartHooked) {
      window._fbStartHooked = true;
      window.startLearning = function() {
        origStart.apply(this, arguments);
        try {
          var kids = JSON.parse(localStorage.getItem('kivora_children') || '[]');
          var active = kids[kids.length - 1];
          if (active) {
            ns.signInAnonymously().then(function() {
              ns.saveChildProfile(active);
            }).catch(function() {});
          }
        } catch(e) {}
      };
    }

    // FIX: kivoraLogout now always signs out of Firebase and clears auth state
    var origLogout = window.kivoraLogout;
    if (origLogout && !window._fbLogoutHooked) {
      window._fbLogoutHooked = true;
      window.kivoraLogout = function() {
        origLogout.apply(this, arguments);
        ns.signOut().catch(function() {});
      };
    }
  });

  // Lazy-hook progress save/load once activities.js defines them
  function hookProgress() {
    if (typeof saveProgress !== 'function') return false;
    if (window._fbProgressHooked) return true;
    window._fbProgressHooked = true;

    var origSave = saveProgress;
    saveProgress = function(code) {
      origSave(code);
      if (ns.ready) {
        try {
          var raw = localStorage.getItem('kivora_active_child');
          var childId = raw ? JSON.parse(raw) : null;
          if (childId) {
            var act = (window.ACTS || []).find(function(x) { return x.code === code; });
            ns.saveProgress(childId, code, {
              ts: Date.now(), stars: 1,
              xp:    act ? act.xp    : 0,
              coins: act ? act.coins : 0,
              name:  act ? act.title : code,
              world: act ? act.world : '',
              icon:  act ? act.icon  : '📚'
            });
          }
        } catch(e) {}
      }
    };

    var origLoad = loadProgress;
    loadProgress = function() {
      origLoad();
      if (!ns.ready) return;
      try {
        var raw = localStorage.getItem('kivora_active_child');
        var childId = raw ? JSON.parse(raw) : null;
        if (!childId) return;
        ns.loadProgress(childId).then(function(cloudData) {
          if (!cloudData || !Object.keys(cloudData).length) return;
          Object.keys(cloudData).forEach(function(code) {
            if (!window._kivoraCompleted.has(code)) {
              window._kivoraCompleted.add(code);
              var a = (window.ACTS || []).find(function(x) { return x.code === code; });
              if (a) { window.totalXP = (window.totalXP || 0) + a.xp; window.totalCoins = (window.totalCoins || 0) + a.coins; }
            }
          });
          var key = 'kivora_progress_' + childId;
          var merged = {};
          window._kivoraCompleted.forEach(function(c) {
            var a = (window.ACTS || []).find(function(x) { return x.code === c; });
            merged[c] = { ts: Date.now(), stars: 1, xp: a ? a.xp : 0, coins: a ? a.coins : 0,
                          name: a ? a.title : c, world: a ? a.world : '', icon: a ? a.icon : '📚' };
          });
          try { localStorage.setItem(key, JSON.stringify(merged)); } catch(e) {}
        }).catch(function() {});
      } catch(e) {}
    };
    return true;
  }

  // FIX: poll capped at 100 attempts (~30s) to avoid infinite loop on non-activity pages
  var _pollCount = 0;
  (function poll() {
    if (hookProgress()) return;
    if (++_pollCount > 100) return;
    setTimeout(poll, 300);
  })();

  init();
})();
