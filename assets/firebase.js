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

  function init() {
    if (typeof firebase === 'undefined') {
      console.warn('[Kivora Firebase] SDK not loaded — localStorage fallback');
      return;
    }
    try {
      if (firebase.apps.length) return;
      firebase.initializeApp(CONFIG);
      ns.auth = firebase.auth();
      ns.db  = firebase.database();
      ns.ready = true;
      console.log('[Kivora Firebase] Ready');
      if (navigator.onLine !== false) syncFromCloud();
    } catch (e) {
      console.warn('[Kivora Firebase] Init error:', e.message);
    }
  }

  function getUid() { return ns.auth && ns.auth.currentUser && ns.auth.currentUser.uid; }

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
      return Promise.reject(new Error('Google sign-in requires a web server. Serve via http:// (e.g. "npx serve" or "npm run build" then upload to GitHub Pages).'));
    }
    // If a popup is already in flight, cancel it first to avoid the duplicate-popup error
    if (ns._googlePopupPending) {
      return Promise.reject({ code: 'auth/cancelled-popup-request', message: 'Already opening Google sign-in' });
    }
    ns._googlePopupPending = true;
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return ns.auth.signInWithPopup(provider).then(function(result) {
      ns._googlePopupPending = false;
      try { localStorage.setItem('kivora_firebase_uid', result.user.uid); } catch(e) {}
      _syncLocalToCloud(result.user.uid);
      if (typeof openPage === 'function') { setTimeout(function() { openPage('parent-dashboard'); }, 50); }
      return result;
    }).catch(function(e) {
      ns._googlePopupPending = false;
      throw e;
    });
  };

  ns.signInWithEmail = function(email, password) {
    if (!ns.auth) return Promise.reject(new Error('Firebase not available — please try again'));
    return ns.auth.signInWithEmailAndPassword(email, password).then(function(result) {
      try { localStorage.setItem('kivora_firebase_uid', result.user.uid); } catch(e) {}
      // Push any locally accumulated progress to the cloud account
      _syncLocalToCloud(result.user.uid);
      if (typeof openPage === 'function') { setTimeout(function() { openPage('parent-dashboard'); }, 50); }
      return result;
    });
  };

  ns.createAccount = function(email, password) {
    if (!ns.auth) return Promise.reject(new Error('Firebase not available — please try again or use Google sign-in'));
    return ns.auth.createUserWithEmailAndPassword(email, password).then(function(result) {
      try { localStorage.setItem('kivora_firebase_uid', result.user.uid); } catch(e) {}
      // Push any locally saved children + progress to the new account
      _syncLocalToCloud(result.user.uid);
      if (typeof openPage === 'function') { setTimeout(function() { openPage('parent-dashboard'); }, 50); }
      return result;
    });
  };

  ns.signOut = function() {
    if (!ns.auth) return Promise.reject('Firebase not available');
    return ns.auth.signOut();
  };

  ns.onAuthChanged = function(cb) {
    if (!ns.auth) { cb(null); return function() {}; }
    return ns.auth.onAuthStateChanged(cb);
  };

  function dbRef(path) {
    return ns.db.ref('users/' + getUid() + '/' + path);
  }

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
      childId: childId, code: code, ts: data.ts || Date.now(), stars: data.stars || 1,
      xp: data.xp || 0, coins: data.coins || 0
    });
  };

  ns.loadProgress = function(childId) {
    if (!ns.db || !getUid()) return Promise.resolve({});
    return dbRef('progress/' + childId).once('value').then(function(snap) {
      var obj = {};
      snap.forEach(function(d) {
        var v = d.val();
        obj[d.key] = { ts: v.ts, stars: v.stars || 1, xp: v.xp || 0, coins: v.coins || 0 };
      });
      return obj;
    });
  };

  ns.getUser = function() { return ns.auth && ns.auth.currentUser; };

  // Listen for auth state → sync to localStorage
  ns.onAuthChanged(function(user) {
    if (user) {
      ns._uid = user.uid;
      if (!user.isAnonymous) {
        try { localStorage.setItem('kivora_firebase_uid', user.uid); } catch(e) {}
      }
    } else {
      ns._uid = null;
    }
  });

  // Push all local children and their progress up to Firebase for this uid
  function _syncLocalToCloud(uid) {
    if (!ns.db) return;
    try {
      var kids = JSON.parse(localStorage.getItem('kivora_children') || '[]');
      kids.forEach(function(child) {
        ns.db.ref('users/' + uid + '/children/' + child.id).set(child);
        try {
          var progressKey = 'kivora_progress_' + child.id;
          var prog = JSON.parse(localStorage.getItem(progressKey) || '{}');
          Object.keys(prog).forEach(function(code) {
            ns.db.ref('users/' + uid + '/progress/' + child.id + '/' + code).set({
              childId: child.id, code: code, ts: prog[code].ts || Date.now(), stars: prog[code].stars || 1
            });
          });
        } catch(e) {}
      });
    } catch(e) { console.warn('[Kivora Firebase] syncLocalToCloud error:', e.message); }
  }

  // Merge cloud data into localStorage on first load
  function syncFromCloud() {
    if (!ns.auth) return;
    var unsub = ns.onAuthChanged(function(user) {
      if (unsub) unsub();
      if (!user) return;
      ns.loadChildren().then(function(cloudKids) {
        if (!cloudKids.length) return;
        var local = JSON.parse(localStorage.getItem('kivora_children') || '[]');
        var merged = local.slice();
        cloudKids.forEach(function(c) {
          if (!merged.find(function(x) { return x.id === c.id; })) merged.push(c);
        });
        localStorage.setItem('kivora_children', JSON.stringify(merged));
        if (typeof showParentDashboard === 'function') showParentDashboard();
      });
      ns.loadProgress('all').then(function() {
        // Progress is loaded per-child in activities.js
      });
    });
  }

  // Hook into existing auth functions
  var origStart = window.startLearning;
  if (origStart) {
    window.startLearning = function() {
      origStart();
      var kids = JSON.parse(localStorage.getItem('kivora_children') || '[]');
      var active = kids[kids.length - 1];
      if (active) {
        ns.signInAnonymously().then(function() {
          ns.saveChildProfile(active);
        }).catch(function() {});
      }
    };
  }

  var origLogout = window.kivoraLogout;
  if (origLogout) {
    window.kivoraLogout = function() {
      origLogout();
      ns.signOut().catch(function() {});
    };
  }

  // Lazy-hook progress functions once activities.js loads
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
            ns.saveProgress(childId, code, { ts: Date.now(), stars: 1, xp: act ? act.xp : 0, coins: act ? act.coins : 0 });
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
          // Save merged progress back to localStorage with xp/coins fields
          var key = 'kivora_progress_' + childId;
          var merged = {};
          window._kivoraCompleted.forEach(function(c) {
            var a = (window.ACTS || []).find(function(x) { return x.code === c; });
            merged[c] = { ts: Date.now(), stars: 1, xp: a ? a.xp : 0, coins: a ? a.coins : 0 };
          });
          try { localStorage.setItem(key, JSON.stringify(merged)); } catch(e) {}
        });
      } catch(e) {}
    };
    return true;
  }

  // Poll until activities.js defines these functions
  (function poll() {
    if (hookProgress()) return;
    setTimeout(poll, 300);
  })();

  init();
})();
