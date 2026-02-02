import Stripe from "stripe";
import { prisma } from "./prisma";

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

// Get synced Stripe price IDs from database
export async function getSyncedPriceIds(): Promise<{
  monthly: string | null;
  yearly: string | null;
}> {
  const settings = await prisma.platformSettings.findUnique({
    where: { id: "default" },
    select: {
      stripeBuyerMonthlyPriceId: true,
      stripeBuyerYearlyPriceId: true,
    },
  });

  return {
    monthly: settings?.stripeBuyerMonthlyPriceId || null,
    yearly: settings?.stripeBuyerYearlyPriceId || null,
  };
}

// Dynamic tier config with pricing from database
export type TierConfig = {
  FREE: {
    name: string;
    price: { monthly: number; yearly: number };
    features: string[];
  };
  BUYER: {
    name: string;
    price: { monthly: number; yearly: number };
    features: string[];
    priceIds: { monthly: string | null; yearly: string | null };
  };
};

// Get tier config with dynamic pricing (async)
export async function getTierConfig(): Promise<TierConfig> {
  // Dynamic import to avoid circular dependency
  const { getPlatformSettings } = await import("./platform-settings");
  const settings = await getPlatformSettings();
  const priceIds = await getSyncedPriceIds();

  return {
    FREE: {
      name: "Free",
      price: { monthly: 0, yearly: 0 },
      features: settings.freeFeatures,
    },
    BUYER: {
      name: "Buyer",
      price: {
        monthly: settings.buyerMonthlyPrice,
        yearly: settings.buyerYearlyPrice,
      },
      features: settings.buyerFeatures,
      priceIds: priceIds,
    },
  };
}

export type SubscriptionTier = "FREE" | "BUYER";
