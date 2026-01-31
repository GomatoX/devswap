import Stripe from "stripe";

// Only initialize Stripe if the key is present and valid
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { typescript: true })
  : null;

// Helper to check if Stripe is available
export function getStripe(): Stripe {
  if (!stripe) {
    throw new Error("Stripe not configured - please set STRIPE_SECRET_KEY");
  }
  return stripe;
}

// Subscription tier price IDs (set these in your .env)
export const PRICE_IDS = {
  BUYER_MONTHLY: process.env.STRIPE_PRICE_BUYER_MONTHLY || "",
  BUYER_YEARLY: process.env.STRIPE_PRICE_BUYER_YEARLY || "",
  VENDOR_MONTHLY: process.env.STRIPE_PRICE_VENDOR_MONTHLY || "",
  VENDOR_YEARLY: process.env.STRIPE_PRICE_VENDOR_YEARLY || "",
};

// Tier configuration - Updated with engagement tools
export const TIER_CONFIG = {
  FREE: {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    features: [
      "Browse marketplace",
      "Unlimited developers",
      "1 active listing",
      "Basic support",
    ],
    limits: {
      activeListings: 1,
      canContact: false,
      analytics: false,
      contracts: false,
      timesheets: false,
      invoicing: false,
    },
  },
  BUYER: {
    name: "Buyer",
    price: { monthly: 99, yearly: 990 },
    features: [
      "Everything in Free",
      "Contact developers directly",
      "Initiate deals & requests",
      "Basic analytics",
      "Email support",
    ],
    limits: {
      activeListings: 3,
      canContact: true,
      analytics: "basic",
      contracts: false,
      timesheets: false,
      invoicing: false,
    },
    priceIds: {
      monthly: PRICE_IDS.BUYER_MONTHLY,
      yearly: PRICE_IDS.BUYER_YEARLY,
    },
  },
  VENDOR: {
    name: "Vendor",
    price: { monthly: 199, yearly: 1990 },
    features: [
      "Everything in Buyer",
      "Unlimited active listings",
      "Featured listings",
      "Full analytics dashboard",
      "Contracts management",
      "Timesheets & invoicing",
      "Priority support",
    ],
    limits: {
      activeListings: Infinity,
      canContact: true,
      analytics: "full",
      contracts: true,
      timesheets: true,
      invoicing: true,
    },
    priceIds: {
      monthly: PRICE_IDS.VENDOR_MONTHLY,
      yearly: PRICE_IDS.VENDOR_YEARLY,
    },
  },
};

export type SubscriptionTier = keyof typeof TIER_CONFIG;

// Helper to check feature access
export function canAccessFeature(
  tier: SubscriptionTier,
  feature: keyof typeof TIER_CONFIG.VENDOR.limits,
): boolean {
  const config = TIER_CONFIG[tier];
  if (!config.limits) return false;
  const value = config.limits[feature];
  return (
    value === true ||
    value === "full" ||
    value === "basic" ||
    (typeof value === "number" && value > 0)
  );
}

// Helper to check if tier has full access to a feature
export function hasFullAccess(
  tier: SubscriptionTier,
  feature: keyof typeof TIER_CONFIG.VENDOR.limits,
): boolean {
  const config = TIER_CONFIG[tier];
  if (!config.limits) return false;
  const value = config.limits[feature];
  return value === true || value === "full" || value === Infinity;
}
