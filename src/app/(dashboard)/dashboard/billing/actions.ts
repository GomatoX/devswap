"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getStripe, getSyncedPriceIds } from "@/lib/stripe";

// Use APP_URL (server-side) or NEXT_PUBLIC_APP_URL as fallback
const APP_URL =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

// Get current user's company
async function getCurrentCompany() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { company: true },
  });

  if (!user?.company) throw new Error("No company found");
  return user.company;
}

// GET: Company billing info
export async function getBillingInfo() {
  try {
    const company = await getCurrentCompany();

    let subscription = null;
    if (company.stripeCustomerId) {
      const subs = await getStripe().subscriptions.list({
        customer: company.stripeCustomerId,
        status: "active",
        limit: 1,
      });
      const sub = subs.data[0] || null;
      subscription = sub
        ? {
            id: sub.id,
            status: sub.status,
            currentPeriodEnd: new Date(
              (sub as unknown as { current_period_end: number })
                .current_period_end * 1000,
            ),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          }
        : null;
    }

    return {
      success: true,
      data: {
        tier: company.subscriptionTier,
        stripeCustomerId: company.stripeCustomerId,
        subscriptionEndsAt: company.subscriptionEndsAt,
        subscription: subscription,
      },
    };
  } catch (error) {
    console.error("Failed to get billing info:", error);
    return { success: false, error: "Failed to get billing info" };
  }
}

// CREATE: Checkout session for tier upgrade
export async function createCheckoutSession(
  tier: "BUYER",
  interval: "monthly" | "yearly",
) {
  try {
    const company = await getCurrentCompany();

    // Get or create Stripe customer
    let customerId = company.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        metadata: { companyId: company.id },
        name: company.name,
      });
      customerId = customer.id;

      await prisma.company.update({
        where: { id: company.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Get synced price IDs from database (no env var fallback)
    const priceIds = await getSyncedPriceIds();
    const priceId = interval === "yearly" ? priceIds.yearly : priceIds.monthly;

    if (!priceId) {
      return {
        success: false,
        error:
          "Subscription pricing not configured. Admin must sync prices to Stripe first.",
      };
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${APP_URL}/dashboard/billing?canceled=true`,
      metadata: { companyId: company.id, tier },
    });

    return { success: true, data: { url: session.url } };
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return { success: false, error: "Failed to create checkout session" };
  }
}

// CREATE: Customer portal session for managing subscription
export async function createPortalSession() {
  try {
    const company = await getCurrentCompany();

    if (!company.stripeCustomerId) {
      return { success: false, error: "No billing account" };
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: `${APP_URL}/dashboard/billing`,
    });

    return { success: true, data: { url: session.url } };
  } catch (error) {
    console.error("Failed to create portal session:", error);
    return { success: false, error: "Failed to create portal session" };
  }
}

// Cancel subscription at period end
export async function cancelSubscription() {
  try {
    const company = await getCurrentCompany();

    if (!company.stripeCustomerId) {
      return { success: false, error: "No billing account" };
    }

    const subs = await getStripe().subscriptions.list({
      customer: company.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (!subs.data[0]) {
      return { success: false, error: "No active subscription" };
    }

    await getStripe().subscriptions.update(subs.data[0].id, {
      cancel_at_period_end: true,
    });

    revalidatePath("/dashboard/billing");
    return { success: true };
  } catch (error) {
    console.error("Failed to cancel subscription:", error);
    return { success: false, error: "Failed to cancel subscription" };
  }
}
