'use strict';

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const Stripe = require('stripe');

admin.initializeApp();
const db = admin.database();

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

// Map of plan keys the client is allowed to request → Stripe Price IDs.
// Never let the client pass a raw Stripe price ID — always resolve through this map
// so a tampered client request can't check out an arbitrary price.
const PRICE_IDS = {
  explorer_monthly: process.env.STRIPE_PRICE_EXPLORER_MONTHLY || '',
  explorer_annual:  process.env.STRIPE_PRICE_EXPLORER_ANNUAL  || '',
  family_monthly:   process.env.STRIPE_PRICE_FAMILY_MONTHLY   || '',
  family_annual:    process.env.STRIPE_PRICE_FAMILY_ANNUAL    || '',
};

const SITE_URL = process.env.SITE_URL || 'https://cignara.github.io/KivoraV3';

function stripeClient() {
  return new Stripe(STRIPE_SECRET_KEY.value(), { apiVersion: '2024-06-20' });
}

/**
 * Callable: createCheckoutSession({ plan: 'explorer_monthly' })
 * Requires auth. Creates (or reuses) a Stripe Customer for this uid,
 * then a Checkout Session for the requested plan. Returns { url }.
 */
exports.createCheckoutSession = onCall(
  { secrets: [STRIPE_SECRET_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in required.');
    }
    const uid = request.auth.uid;
    const planKey = request.data && request.data.plan;
    const priceId = PRICE_IDS[planKey];
    if (!priceId) {
      throw new HttpsError('invalid-argument', 'Unknown plan: ' + planKey);
    }

    const stripe = stripeClient();

    // Reuse existing Stripe customer id if we've stored one, else create.
    const profileSnap = await db.ref('users/' + uid + '/profile').once('value');
    const profile = profileSnap.val() || {};
    let customerId = profile.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email || request.auth.token.email || undefined,
        metadata: { uid },
      });
      customerId = customer.id;
      await db.ref('users/' + uid + '/profile/stripeCustomerId').set(customerId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: uid,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { metadata: { uid, plan: planKey } },
      success_url: SITE_URL + '/parents.html?checkout=success',
      cancel_url: SITE_URL + '/pricing.html?checkout=cancelled',
    });

    return { url: session.url };
  }
);

/**
 * Callable: createPortalSession()
 * Requires auth + an existing Stripe customer. Returns { url } to Stripe's
 * hosted Billing Portal where the parent can update card, cancel, etc.
 */
exports.createPortalSession = onCall(
  { secrets: [STRIPE_SECRET_KEY] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign in required.');
    }
    const uid = request.auth.uid;
    const profileSnap = await db.ref('users/' + uid + '/profile').once('value');
    const customerId = (profileSnap.val() || {}).stripeCustomerId;
    if (!customerId) {
      throw new HttpsError('failed-precondition', 'No billing account found for this user.');
    }

    const stripe = stripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: SITE_URL + '/parents.html',
    });

    return { url: session.url };
  }
);

/**
 * HTTP webhook: stripeWebhook
 * Configure this URL in the Stripe Dashboard → Webhooks.
 * Verifies the signature, then writes entitlement state to
 * users/{uid}/subscription in Realtime Database.
 */
exports.stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    const stripe = stripeClient();
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        req.headers['stripe-signature'],
        STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (err) {
      logger.error('Webhook signature verification failed', err.message);
      res.status(400).send('Webhook Error: ' + err.message);
      return;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const uid = session.client_reference_id;
          if (uid && session.subscription) {
            await syncSubscriptionForUid(stripe, uid, session.subscription);
          }
          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const sub = event.data.object;
          const uid = sub.metadata && sub.metadata.uid;
          if (uid) {
            await writeSubscriptionState(uid, sub);
          }
          break;
        }
        default:
          break;
      }
      res.json({ received: true });
    } catch (err) {
      logger.error('Webhook handler error', err);
      res.status(500).send('Internal error');
    }
  }
);

async function syncSubscriptionForUid(stripe, uid, subscriptionId) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  await writeSubscriptionState(uid, sub);
}

async function writeSubscriptionState(uid, sub) {
  const active = sub.status === 'active' || sub.status === 'trialing';
  const priceId = sub.items && sub.items.data[0] && sub.items.data[0].price && sub.items.data[0].price.id;
  const plan = Object.keys(PRICE_IDS).find((k) => PRICE_IDS[k] === priceId) || sub.metadata.plan || null;

  await db.ref('users/' + uid + '/subscription').set({
    active,
    status: sub.status,
    plan,
    priceId: priceId || null,
    stripeSubscriptionId: sub.id,
    currentPeriodEnd: sub.current_period_end ? sub.current_period_end * 1000 : null,
    cancelAtPeriodEnd: !!sub.cancel_at_period_end,
    updatedAt: Date.now(),
  });
}
