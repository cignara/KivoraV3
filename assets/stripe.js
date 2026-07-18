// Kivora Stripe billing — thin client over Firebase Cloud Functions.
// Works on any page that has already initialized the Firebase compat SDK
// (via assets/firebase.js OR a page's own inline init, e.g. parents.html) —
// it reads firebase.auth().currentUser directly rather than depending on
// the window.kivoraFirebase namespace, so it doesn't care which one ran.
(function() {
  'use strict';
  var ns = window.kivoraStripe = {};

  function functions() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return null;
    return firebase.functions();
  }

  function currentUser() {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return null;
    try { return firebase.auth().currentUser; } catch(e) { return null; }
  }

  function requireLogin(planKey) {
    try { sessionStorage.setItem('kivora_pending_checkout', planKey || ''); } catch(e) {}
    window.location.href = './index.html?auth=register';
  }

  // Redirects the browser to Stripe Checkout for the given plan key
  // ('explorer_monthly' | 'explorer_annual' | 'family_monthly' | 'family_annual').
  ns.checkout = function(planKey) {
    var user = currentUser();
    var hasLocalUid = false;
    try { hasLocalUid = !!localStorage.getItem('kivora_firebase_uid'); } catch(e) {}
    if ((!user || user.isAnonymous) && !hasLocalUid) { requireLogin(planKey); return; }

    var fns = functions();
    if (!fns) { alert('Billing is temporarily unavailable. Please try again shortly.'); return; }

    var btn = event && event.target;
    if (btn) { btn.textContent = 'Redirecting…'; btn.style.pointerEvents = 'none'; }

    fns.httpsCallable('createCheckoutSession')({ plan: planKey })
      .then(function(res) { if (res.data && res.data.url) window.location.href = res.data.url; })
      .catch(function(err) {
        console.error('[Kivora Stripe] checkout error:', err);
        alert('Could not start checkout: ' + (err.message || 'unknown error'));
        if (btn) { btn.textContent = 'Start Free Trial →'; btn.style.pointerEvents = ''; }
      });
  };

  // Opens Stripe's hosted Billing Portal so a parent can update card / cancel.
  ns.openBillingPortal = function() {
    var fns = functions();
    if (!fns) { alert('Billing is temporarily unavailable. Please try again shortly.'); return; }
    fns.httpsCallable('createPortalSession')()
      .then(function(res) { if (res.data && res.data.url) window.location.href = res.data.url; })
      .catch(function(err) {
        console.error('[Kivora Stripe] portal error:', err);
        alert('Could not open billing portal: ' + (err.message || 'unknown error'));
      });
  };

  // Resumes a checkout that was deferred because the user had to log in first.
  document.addEventListener('DOMContentLoaded', function() {
    var pending;
    try { pending = sessionStorage.getItem('kivora_pending_checkout'); } catch(e) {}
    if (!pending) return;
    var hasLocalUid = false;
    try { hasLocalUid = !!localStorage.getItem('kivora_firebase_uid'); } catch(e) {}
    if (hasLocalUid) {
      try { sessionStorage.removeItem('kivora_pending_checkout'); } catch(e) {}
      setTimeout(function() { ns.checkout(pending); }, 800);
    }
  });
})();
