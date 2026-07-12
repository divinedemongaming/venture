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
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const prisma = new PrismaClient();

const stripeWebhook = async (req, res) => {
  const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
  if (!stripe) return res.status(200).json({ received: true });

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn('Stripe webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const PLATFORM_FEE = parseFloat(process.env.PLATFORM_FEE_RATE) || 0.15;

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const { subscriberId, creatorId, tierId } = sub.metadata;
      if (subscriberId && creatorId && tierId) {
        await prisma.subscription.upsert({
          where: { stripeSubId: sub.id },
          create: {
            subscriberId, creatorId, tierId, stripeSubId: sub.id,
            status: sub.status, amount: sub.items.data[0].price.unit_amount / 100,
            interval: sub.items.data[0].price.recurring.interval,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000)
          },
          update: {
            status: sub.status, cancelAtPeriodEnd: sub.cancel_at_period_end,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000)
          }
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await prisma.subscription.updateMany({
        where: { stripeSubId: sub.id }, data: { status: 'cancelled' }
      });
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      if (subId) {
        const sub = await prisma.subscription.findUnique({ where: { stripeSubId: subId } });
        if (sub) {
          const net = sub.amount * (1 - PLATFORM_FEE);
          const profile = await prisma.creatorProfile.findUnique({ where: { userId: sub.creatorId } });
          if (profile) {
            await prisma.creatorProfile.update({
              where: { id: profile.id },
              data: { totalEarned: { increment: net }, pendingPayout: { increment: net } }
            });
            await prisma.transaction.create({
              data: { creatorId: profile.id, type: 'subscription', amount: sub.amount, platformFee: sub.amount * PLATFORM_FEE, netAmount: net, description: `Subscription payment` }
            });
          }
        }
      }
      break;
    }

    default:
      logger.info(`Unhandled Stripe event: ${event.type}`);
  }

  res.json({ received: true });
};

module.exports = { stripeWebhook };
