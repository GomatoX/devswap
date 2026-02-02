"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { CompanyStatus } from "@prisma/client";

// GET: Fetch all companies for admin review
export async function getCompanies(status?: CompanyStatus) {
  try {
    await requireAdmin();

    const companies = await prisma.company.findMany({
      where: status ? { status } : undefined,
      include: {
        users: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        _count: {
          select: {
            developers: true,
            purchases: true,
            sales: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: companies };
  } catch (error) {
    console.error("Failed to fetch companies:", error);
    return { success: false, error: "Failed to fetch companies" };
  }
}

// UPDATE: Verify company
export async function verifyCompany(companyId: string) {
  try {
    await requireAdmin();

    const company = await prisma.company.update({
      where: { id: companyId },
      data: { status: "ACTIVE" },
    });

    revalidatePath("/dashboard/admin");
    return { success: true, data: company };
  } catch (error) {
    console.error("Failed to verify company:", error);
    return { success: false, error: "Failed to verify company" };
  }
}

// UPDATE: Suspend company
export async function suspendCompany(companyId: string) {
  try {
    await requireAdmin();

    const company = await prisma.company.update({
      where: { id: companyId },
      data: { status: "SUSPENDED" },
    });

    revalidatePath("/dashboard/admin");
    return { success: true, data: company };
  } catch (error) {
    console.error("Failed to suspend company:", error);
    return { success: false, error: "Failed to suspend company" };
  }
}

// GET: Platform statistics
export async function getPlatformStats() {
  try {
    await requireAdmin();

    const [
      totalCompanies,
      pendingCompanies,
      totalDevelopers,
      activeListings,
      totalRequests,
      completedRequests,
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { status: "PENDING_VERIFICATION" } }),
      prisma.developer.count(),
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.request.count(),
      prisma.request.count({ where: { status: "COMPLETED" } }),
    ]);

    return {
      success: true,
      data: {
        totalCompanies,
        pendingCompanies,
        totalDevelopers,
        activeListings,
        totalRequests,
        completedRequests,
      },
    };
  } catch (error) {
    console.error("Failed to get platform stats:", error);
    return { success: false, error: "Failed to get statistics" };
  }
}

// ========== PLATFORM SETTINGS ==========

import {
  getPlatformSettings as getPlatformSettingsLib,
  updatePlatformSettings as updatePlatformSettingsLib,
  getFoundingMemberStats as getFoundingMemberStatsLib,
  grantFoundingMemberStatus as grantFoundingMemberStatusLib,
  type PlatformSettings,
} from "@/lib/platform-settings";

// GET: Platform settings with founding member stats
export async function getPlatformSettingsWithStats() {
  try {
    await requireAdmin();
    const [settings, foundingStats] = await Promise.all([
      getPlatformSettingsLib(),
      getFoundingMemberStatsLib(),
    ]);
    return {
      success: true,
      data: { settings, foundingStats },
    };
  } catch (error) {
    console.error("Failed to get platform settings:", error);
    return { success: false, error: "Failed to get settings" };
  }
}

// UPDATE: Platform settings
export async function updatePlatformSettingsAction(
  updates: Partial<PlatformSettings>,
) {
  try {
    await requireAdmin();
    const result = await updatePlatformSettingsLib(updates);
    revalidatePath("/dashboard/admin");
    return result;
  } catch (error) {
    console.error("Failed to update platform settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}

// GRANT: Founding member status to company
export async function grantFoundingMemberAction(companyId: string) {
  try {
    await requireAdmin();
    const result = await grantFoundingMemberStatusLib(companyId);
    revalidatePath("/dashboard/admin");
    return result;
  } catch (error) {
    console.error("Failed to grant founding member status:", error);
    return { success: false, error: "Failed to grant founding member status" };
  }
}

// SYNC: Create Stripe prices from platform settings
export async function syncPricesToStripeAction(): Promise<{
  success: boolean;
  error?: string;
  monthlyPriceId?: string;
  yearlyPriceId?: string;
}> {
  try {
    await requireAdmin();

    const { getStripe } = await import("@/lib/stripe");
    const stripe = getStripe();

    // Get current platform settings
    const settings = await getPlatformSettingsLib();

    // Get existing price IDs from database
    const existingSettings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
      select: {
        stripeBuyerMonthlyPriceId: true,
        stripeBuyerYearlyPriceId: true,
      },
    });

    // Create a product if it doesn't exist (we'll reuse it)
    let productId: string;
    const products = await stripe.products.list({ limit: 1, active: true });
    const existingProduct = products.data.find(
      (p) => p.name === "DevSwap Buyer Subscription",
    );

    if (existingProduct) {
      productId = existingProduct.id;
    } else {
      const product = await stripe.products.create({
        name: "DevSwap Buyer Subscription",
        description: "Full access to DevSwap platform features",
      });
      productId = product.id;
    }

    // Create new monthly price
    const monthlyPrice = await stripe.prices.create({
      product: productId,
      unit_amount: settings.buyerMonthlyPrice * 100, // Convert to cents
      currency: settings.currency.toLowerCase(),
      recurring: { interval: "month" },
      metadata: { type: "buyer_monthly" },
    });

    // Create new yearly price
    const yearlyPrice = await stripe.prices.create({
      product: productId,
      unit_amount: settings.buyerYearlyPrice * 100, // Convert to cents
      currency: settings.currency.toLowerCase(),
      recurring: { interval: "year" },
      metadata: { type: "buyer_yearly" },
    });

    // Archive old prices if they exist
    if (existingSettings?.stripeBuyerMonthlyPriceId) {
      try {
        await stripe.prices.update(existingSettings.stripeBuyerMonthlyPriceId, {
          active: false,
        });
      } catch (e) {
        console.warn("Could not archive old monthly price:", e);
      }
    }

    if (existingSettings?.stripeBuyerYearlyPriceId) {
      try {
        await stripe.prices.update(existingSettings.stripeBuyerYearlyPriceId, {
          active: false,
        });
      } catch (e) {
        console.warn("Could not archive old yearly price:", e);
      }
    }

    // Store new price IDs in database
    await prisma.platformSettings.update({
      where: { id: "default" },
      data: {
        stripeBuyerMonthlyPriceId: monthlyPrice.id,
        stripeBuyerYearlyPriceId: yearlyPrice.id,
        stripePricesLastSynced: new Date(),
      },
    });

    revalidatePath("/dashboard/admin");

    return {
      success: true,
      monthlyPriceId: monthlyPrice.id,
      yearlyPriceId: yearlyPrice.id,
    };
  } catch (error) {
    console.error("Failed to sync prices to Stripe:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to sync prices to Stripe",
    };
  }
}
