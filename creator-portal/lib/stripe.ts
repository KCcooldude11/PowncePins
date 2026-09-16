import Stripe from "stripe";

export async function fetchStripePayoutsForCreator(creatorId: string) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return [];
  }

  const stripe = new Stripe(secretKey);

  try {
    const payouts = await stripe.payouts.list({ limit: 20 });
    return payouts.data.filter((payout) => payout.metadata?.creatorId === creatorId);
  } catch {
    return [];
  }
}
