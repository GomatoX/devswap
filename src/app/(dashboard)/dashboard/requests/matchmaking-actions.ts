"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getPlatformSettings } from "@/lib/platform-settings";

// Helper to get current user and company
async function getCurrentUserAndCompany() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { company: true },
  });

  if (!user?.company) throw new Error("No company found");
  return { user, company: user.company };
}

/**
 * Create a Stripe checkout session for the matchmaking fee
 * Called when buyer wants to finalize a deal after vendor has sent an offer
 */
export async function createMatchmakingCheckout(requestId: string) {
  try {
    const { company } = await getCurrentUserAndCompany();

    // Get the request and validate
    const request = await prisma.request.findFirst({
      where: {
        id: requestId,
        clientId: company.id,
        status: "OFFER_SENT",
      },
      include: {
        listing: {
          include: {
            developer: true,
          },
        },
        vendor: true,
      },
    });

    if (!request) {
      return {
        success: false,
        error: "Request not found or not in OFFER_SENT status",
      };
    }

    // Get platform settings for pricing
    const settings = await getPlatformSettings();

    // Check if founding member gets discounted rate
    let matchmakingFee = settings.matchmakingFee;
    if (company.isFoundingMember && company.foundingDealsRemaining > 0) {
      matchmakingFee = settings.foundingMemberFee;
    }

    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create Stripe checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "DevSwap Matchmaking Fee",
              description: `Finalize engagement with ${request.listing.developer.pseudonym}`,
            },
            unit_amount: matchmakingFee * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "MATCHMAKING_FEE",
        requestId: request.id,
        companyId: company.id,
        vendorId: request.vendorId,
        listingId: request.listingId,
      },
      success_url: `${baseUrl}/dashboard/requests/${requestId}?success=1`,
      cancel_url: `${baseUrl}/dashboard/requests/${requestId}?canceled=1`,
    });

    return { success: true, data: { url: session.url } };
  } catch (error) {
    console.error("Failed to create matchmaking checkout:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create checkout",
    };
  }
}
