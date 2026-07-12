/**
 * ============================================================
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  This software is the exclusive intellectual property of
 *  DivineDemonGaming Inc. Unauthorized copying, distribution,
 *  modification, or use of this software, in whole or in part,
 *  is strictly prohibited without written permission from
 *  DivineDemonGaming Inc.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 * ============================================================
 */
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireCreator } = require('../middleware/auth');
const { auditLog } = require('../middleware/security');
const { notifyUser } = require('../services/socket');
const { paginate, paginatedResponse } = require('../utils/pagination');
const prisma = new PrismaClient();

const PLATFORM_FEE = parseFloat(process.env.PLATFORM_FEE_RATE) || 0.15;

// Stripe instance (lazy init)
let stripe = null;
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

// ── CREATOR SETUP ─────────────────────────────
router.get('/creator/profile', authenticate, async (req, res) => {
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId: req.user.id },
    include: { subscriptionTiers: { orderBy: { sortOrder: 'asc' } } }
  });
  if (!profile) return res.status(404).json({ error: 'Creator profile not found' });
  res.json(profile);
});

router.post('/creator/become', authenticate, auditLog('BECOME_CREATOR'), async (req, res) => {
  const { tagline, goalAmount, goalDescription } = req.body;

  const existing = await prisma.creatorProfile.findUnique({ where: { userId: req.user.id } });
  if (existing) return res.status(409).json({ error: 'Already a creator' });

  const [_, profile] = await prisma.$transaction([
    prisma.user.update({
      where: { id: req.user.id },
      data: { isCreator: true, accountType: 'CREATOR' }
    }),
    prisma.creatorProfile.create({
      data: { userId: req.user.id, tagline, goalAmount, goalDescription }
    })
  ]);

  res.status(201).json({ message: 'Creator account activated!', profile });
});

router.patch('/creator/profile', authenticate, requireCreator, async (req, res) => {
  const { tagline, thankYouMessage, goalAmount, goalDescription, goalCurrent } = req.body;
  const profile = await prisma.creatorProfile.update({
    where: { userId: req.user.id },
    data: { tagline, thankYouMessage, goalAmount, goalDescription, goalCurrent }
  });
  res.json(profile);
});

// ── STRIPE CONNECT ONBOARDING ─────────────────
router.post('/creator/stripe/connect', authenticate, requireCreator, async (req, res) => {
  const s = getStripe();
  if (!s) return res.status(503).json({ error: 'Payment processing temporarily unavailable' });

  let profile = await prisma.creatorProfile.findUnique({ where: { userId: req.user.id } });

  if (!profile.stripeAccountId) {
    const account = await s.accounts.create({
      type: 'express',
      email: req.user.email,
      capabilities: { transfers: { requested: true }, card_payments: { requested: true } },
      metadata: { ventureUserId: req.user.id, username: req.user.username }
    });
    profile = await prisma.creatorProfile.update({
      where: { userId: req.user.id },
      data: { stripeAccountId: account.id }
    });
  }

  const link = await s.accountLinks.create({
    account: profile.stripeAccountId,
    refresh_url: `${process.env.FRONTEND_URL}/creator/stripe/refresh`,
    return_url: `${process.env.FRONTEND_URL}/creator/stripe/complete`,
    type: 'account_onboarding'
  });

  res.json({ url: link.url });
});

router.post('/creator/stripe/verify', authenticate, requireCreator, async (req, res) => {
  const s = getStripe();
  const profile = await prisma.creatorProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile.stripeAccountId || !s) return res.json({ onboarded: false });

  const account = await s.accounts.retrieve(profile.stripeAccountId);
  const onboarded = account.details_submitted && account.charges_enabled;

  if (onboarded) {
    await prisma.creatorProfile.update({
      where: { userId: req.user.id },
      data: { stripeOnboarded: true, isMonetized: true }
    });
  }

  res.json({ onboarded, chargesEnabled: account.charges_enabled });
});

// ── SUBSCRIPTION TIERS ────────────────────────
router.post('/creator/tiers', authenticate, requireCreator, async (req, res) => {
  const { name, description, price, interval = 'month', color, perks = [] } = req.body;

  if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });
  if (price < 1) return res.status(400).json({ error: 'Minimum price is $1.00' });
  if (price > 999) return res.status(400).json({ error: 'Maximum price is $999.00' });

  const profile = await prisma.creatorProfile.findUnique({ where: { userId: req.user.id } });

  let stripePriceId = null;
  const s = getStripe();
  if (s && profile.stripeAccountId && profile.stripeOnboarded) {
    const product = await s.products.create({
      name: `${req.user.displayName} - ${name}`,
      metadata: { tierId: 'pending', creatorId: req.user.id }
    }, { stripeAccount: profile.stripeAccountId });

    const stripePrice = await s.prices.create({
      product: product.id,
      unit_amount: Math.round(price * 100),
      currency: 'usd',
      recurring: { interval }
    }, { stripeAccount: profile.stripeAccountId });

    stripePriceId = stripePrice.id;
  }

  const tierCount = await prisma.subscriptionTier.count({ where: { creatorId: profile.id } });

  const tier = await prisma.subscriptionTier.create({
    data: { creatorId: profile.id, name, description, price, interval, color: color || '#7C3AED', perks, stripePriceId, sortOrder: tierCount }
  });

  res.status(201).json(tier);
});

router.get('/:creatorId/tiers', async (req, res) => {
  const creator = await prisma.user.findUnique({ where: { id: req.params.creatorId } });
  if (!creator) return res.status(404).json({ error: 'Creator not found' });

  const profile = await prisma.creatorProfile.findUnique({ where: { userId: creator.id } });
  if (!profile) return res.status(404).json({ error: 'Not a creator' });

  const tiers = await prisma.subscriptionTier.findMany({
    where: { creatorId: profile.id, isActive: true },
    orderBy: { price: 'asc' }
  });

  res.json(tiers);
});

// ── SUBSCRIBE ─────────────────────────────────
router.post('/subscribe', authenticate, auditLog('SUBSCRIBE'), async (req, res) => {
  const { creatorId, tierId, paymentMethodId } = req.body;
  if (!creatorId || !tierId) return res.status(400).json({ error: 'Creator and tier required' });
  if (creatorId === req.user.id) return res.status(400).json({ error: "Can't subscribe to yourself" });

  const tier = await prisma.subscriptionTier.findFirst({
    where: { id: tierId, isActive: true },
    include: { creatorProfile: true }
  });
  if (!tier) return res.status(404).json({ error: 'Subscription tier not found' });

  const s = getStripe();
  if (!s) return res.status(503).json({ error: 'Payments unavailable' });

  // Platform fee: platform keeps 15%, creator gets 85%
  const platformFee = Math.round(tier.price * 100 * PLATFORM_FEE);

  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: tier.stripePriceId, quantity: 1 }],
    subscription_data: {
      application_fee_percent: PLATFORM_FEE * 100,
      metadata: {
        subscriberId: req.user.id,
        creatorId,
        tierId,
        ventureSubscription: 'true'
      },
      transfer_data: { destination: tier.creatorProfile.stripeAccountId }
    },
    success_url: `${process.env.FRONTEND_URL}/subscribe/success?session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/creator/${creatorId}`,
    customer_email: req.user.email,
    metadata: { subscriberId: req.user.id, creatorId, tierId }
  });

  res.json({ checkoutUrl: session.url, sessionId: session.id });
});

// ── CANCEL SUBSCRIPTION ───────────────────────
router.post('/subscribe/:subId/cancel', authenticate, async (req, res) => {
  const sub = await prisma.subscription.findUnique({ where: { id: req.params.subId } });
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });
  if (sub.subscriberId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  const s = getStripe();
  if (s && sub.stripeSubId) {
    await s.subscriptions.update(sub.stripeSubId, { cancel_at_period_end: true });
  }

  await prisma.subscription.update({
    where: { id: sub.id }, data: { cancelAtPeriodEnd: true }
  });

  res.json({ message: 'Subscription will cancel at end of billing period' });
});

// ── TIPS ──────────────────────────────────────
router.post('/tip', authenticate, auditLog('TIP'), async (req, res) => {
  const { receiverId, amount, message, isAnonymous = false } = req.body;

  if (!receiverId || !amount) return res.status(400).json({ error: 'Receiver and amount required' });
  if (amount < 1) return res.status(400).json({ error: 'Minimum tip is $1.00' });
  if (amount > 500) return res.status(400).json({ error: 'Maximum tip is $500.00' });
  if (receiverId === req.user.id) return res.status(400).json({ error: "Can't tip yourself" });
  if (message && message.length > 200) return res.status(400).json({ error: 'Message too long' });

  const platformFee = amount * PLATFORM_FEE;
  const netAmount = amount - platformFee;

  const tip = await prisma.tip.create({
    data: {
      senderId: req.user.id, receiverId, amount,
      platformFee, netAmount,
      message, isAnonymous, status: 'completed'
    }
  });

  await prisma.creatorProfile.updateMany({
    where: { userId: receiverId },
    data: {
      totalEarned: { increment: netAmount },
      pendingPayout: { increment: netAmount }
    }
  });

  await prisma.notification.create({
    data: {
      userId: receiverId, type: 'tip',
      title: `You received a $${amount} tip!`,
      body: isAnonymous
        ? `Someone tipped you $${amount}${message ? `: "${message}"` : ''}`
        : `${req.user.displayName} tipped you $${amount}${message ? `: "${message}"` : ''}`,
      data: JSON.stringify({ tipId: tip.id, amount })
    }
  });

  notifyUser(receiverId, 'tip:received', {
    amount, message, from: isAnonymous ? 'Anonymous' : req.user.displayName
  });

  res.status(201).json({ tip, message: 'Tip sent!' });
});

// ── CREATOR EARNINGS DASHBOARD ────────────────
router.get('/creator/earnings', authenticate, requireCreator, async (req, res) => {
  const { period = '30d' } = req.query;
  const days = period === '7d' ? 7 : period === '90d' ? 90 : period === 'all' ? 3650 : 30;
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);

  const profile = await prisma.creatorProfile.findUnique({
    where: { userId: req.user.id }
  });

  const [tipsReceived, subscriptions, transactions] = await Promise.all([
    prisma.tip.aggregate({
      where: { receiverId: req.user.id, createdAt: { gte: since } },
      _sum: { netAmount: true, amount: true },
      _count: true
    }),
    prisma.subscription.count({
      where: { creatorId: req.user.id, status: 'active' }
    }),
    prisma.transaction.findMany({
      where: { creatorId: profile.id, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
  ]);

  const subRevenue = await prisma.subscription.aggregate({
    where: { creatorId: req.user.id, status: 'active' },
    _sum: { amount: true }
  });

  res.json({
    summary: {
      totalEarned: profile.totalEarned,
      pendingPayout: profile.pendingPayout,
      totalPaidOut: profile.totalPaidOut,
      activeSubscribers: subscriptions,
      monthlyRecurring: (subRevenue._sum.amount || 0) * (1 - PLATFORM_FEE),
      platformFeeRate: PLATFORM_FEE
    },
    period: {
      tips: tipsReceived._sum.netAmount || 0,
      tipCount: tipsReceived._count,
      gross: tipsReceived._sum.amount || 0
    },
    transactions
  });
});

// ── PAYOUT REQUEST ────────────────────────────
router.post('/creator/payout', authenticate, requireCreator, auditLog('PAYOUT_REQUEST'), async (req, res) => {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId: req.user.id } });

  if (profile.pendingPayout < 25) {
    return res.status(400).json({ error: 'Minimum payout is $25.00' });
  }
  if (!profile.stripeOnboarded) {
    return res.status(400).json({ error: 'Complete Stripe setup before requesting payout' });
  }

  const s = getStripe();
  let stripePayoutId = null;

  if (s && profile.stripeAccountId) {
    const payout = await s.payouts.create({
      amount: Math.round(profile.pendingPayout * 100),
      currency: 'usd',
      statement_descriptor: 'VENTURE PAYOUT'
    }, { stripeAccount: profile.stripeAccountId });
    stripePayoutId = payout.id;
  }

  const payout = await prisma.payout.create({
    data: {
      creatorId: profile.id,
      amount: profile.pendingPayout,
      method: 'stripe',
      status: stripePayoutId ? 'processing' : 'pending',
      stripePayoutId
    }
  });

  await prisma.creatorProfile.update({
    where: { id: profile.id },
    data: {
      pendingPayout: 0,
      totalPaidOut: { increment: profile.pendingPayout }
    }
  });

  res.json({ payout, message: 'Payout initiated! Funds arrive within 2-3 business days.' });
});

// ── MY SUBSCRIPTIONS ──────────────────────────
router.get('/my/subscriptions', authenticate, async (req, res) => {
  const subs = await prisma.subscription.findMany({
    where: { subscriberId: req.user.id, status: 'active' },
    include: {
      creator: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
      tier: true
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(subs);
});

module.exports = router;
