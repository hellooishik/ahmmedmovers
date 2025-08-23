const { StatusCodes } = require('http-status-codes');
const Trip = require('../models/Trip');

// Setup stripe or dummy
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn("⚠️ Stripe disabled: no STRIPE_SECRET_KEY provided");
  stripe = {
    checkout: {
      sessions: {
        create: async () => ({
          id: "sess_dummy_123",
          url: "https://example.com/dummy-checkout"
        })
      }
    }
  };
}

const createCheckout = async (req, res) => {
  try {
    const { tripId, amountGBP } = req.body;
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(StatusCodes.NOT_FOUND).json({ message: 'Trip not found' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'gbp',
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: { name: `Shipment ${trip.code}` },
          unit_amount: Math.round(Number(amountGBP) * 100),
        },
        quantity: 1,
      }],
      success_url: `${process.env.PUBLIC_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_URL}/payment-cancelled`,
    });

    trip.payment = { status: 'pending', amountGBP, stripeSessionId: session.id };
    await trip.save();
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
  }
};

const webhook = async (req, res) => {
  const event = req.body;
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const trip = await Trip.findOne({ 'payment.stripeSessionId': session.id });
      if (trip) {
        trip.payment.status = 'paid';
        trip.payment.stripePaymentIntentId = session.payment_intent;
        await trip.save();
      }
    }
    res.json({ received: true });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: err.message });
  }
};

module.exports = { createCheckout, webhook };
