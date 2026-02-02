"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// Use APP_URL (server-side) or NEXT_PUBLIC_APP_URL as fallback
const APP_URL =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

export async function createSubscriptionCheckout(): Promise<{
  url?: string;
  error?: string;
}> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Get user and company
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { company: true },
    });

    if (!user) {
      return { error: "User not found" };
    }

    if (!user.company) {
      return {
        error: "Company not found. Please complete your profile first.",
      };
    }

    // Get the synced price ID from platform settings (no fallback - must sync first)
    const platformSettings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
      select: { stripeBuyerMonthlyPriceId: true },
    });

    const priceId = platformSettings?.stripeBuyerMonthlyPriceId;

    if (!priceId) {
      return {
        error:
          "Subscription pricing not configured. Admin must sync prices to Stripe first.",
      };
    }

    const stripe = getStripe();

    // Get or create Stripe customer
    let customerId = user.company.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.company.name,
        metadata: {
          companyId: user.company.id,
          userId: user.id,
        },
      });

      customerId = customer.id;

      // Save customer ID to company
      await prisma.company.update({
        where: { id: user.company.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Check for existing active subscription
    if (user.company.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(
        user.company.stripeSubscriptionId,
      );

      if (subscription.status === "active") {
        // Update our DB just in case
        await prisma.company.update({
          where: { id: user.company.id },
          data: { subscriptionStatus: "ACTIVE" },
        });
        return { error: "You already have an active subscription" };
      }
    }

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/dashboard/billing/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/dashboard/billing/subscribe`,
      metadata: {
        companyId: user.company.id,
        userId: user.id,
        type: "SUBSCRIPTION",
      },
      subscription_data: {
        metadata: {
          companyId: user.company.id,
          type: "SUBSCRIPTION",
        },
      },
    });

    return { url: session.url ?? undefined };
  } catch (error) {
    console.error("Error creating subscription checkout:", error);
    return { error: "Failed to create checkout session" };
  }
}
