import express from 'express';
import Stripe from 'stripe';
import { config } from 'dotenv';

config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const router = express.Router();

// Pricing packages
const PRICING_PACKAGES = {
  starter: { price: 900, credits: 50, name: 'Starter Pack' },
  basic: { price: 2900, credits: 200, name: 'Basic Pack' },
  pro: { price: 9900, credits: 1000, name: 'Pro Pack' },
  enterprise: { price: 29900, credits: 5000, name: 'Enterprise Pack' }
};

/**
 * POST /v1/payments/create-checkout-session
 * Create Stripe checkout session
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { package: packageType, success_url, cancel_url } = req.body;

    const selectedPackage = PRICING_PACKAGES[packageType as keyof typeof PRICING_PACKAGES];

    if (!selectedPackage) {
      return res.status(400).json({
        error: 'invalid_package',
        message: 'Invalid package selected'
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: selectedPackage.name,
            description: `${selectedPackage.credits} credits for Yansu API`
          },
          unit_amount: selectedPackage.price
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: success_url || `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        package_type: packageType,
        credits: selectedPackage.credits
      }
    });

    res.json({
      session_id: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      error: 'internal_server_error',
      message: 'Failed to create checkout session'
    });
  }
});

/**
 * GET /v1/payments/packages
 * Get available packages
 */
router.get('/packages', (req, res) => {
  res.json({
    packages: Object.entries(PRICING_PACKAGES).map(([key, pkg]) => ({
      id: key,
      name: pkg.name,
      price: pkg.price / 100, // Convert to dollars
      price_cents: pkg.price,
      credits: pkg.credits,
      price_per_credit: (pkg.price / pkg.credits / 100).toFixed(4)
    }))
  });
});

/**
 * POST /v1/payments/webhook
 * Stripe webhook for payment confirmation
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret || ''
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { package_type, credits } = session.metadata || {};

    // TODO: Add credits to user's account
    console.log(`Payment successful! Adding ${credits} credits for package ${package_type}`);

    // You would typically:
    // 1. Find the user by customer email or other identifier
    // 2. Add credits to their account
    // 3. Record the transaction in your database
  }

  res.json({ received: true });
});

export default router;
