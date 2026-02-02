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

// GET: Fetch pending companies with full details for verification
export async function getPendingCompaniesWithDetails() {
  try {
    await requireAdmin();

    const companies = await prisma.company.findMany({
      where: { status: "PENDING_VERIFICATION" },
      include: {
        users: {
          select: {
            id: true,
            clerkId: true,
            fullName: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        developers: {
          include: {
            skills: { include: { skill: true } },
            listings: {
              select: {
                id: true,
                status: true,
                hourlyRate: true,
                currency: true,
                workType: true,
                availableFrom: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal values
    const serialized = companies.map((company) => ({
      ...company,
      developers: company.developers.map((dev) => ({
        ...dev,
        internalRate: dev.internalRate ? Number(dev.internalRate) : null,
        listings: dev.listings.map((listing) => ({
          ...listing,
          hourlyRate: Number(listing.hourlyRate),
        })),
      })),
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Failed to fetch pending companies:", error);
    return { success: false, error: "Failed to fetch pending companies" };
  }
}

// GET: Fetch ALL companies with full details for admin management
export async function getAllCompaniesWithDetails() {
  try {
    await requireAdmin();

    const companies = await prisma.company.findMany({
      include: {
        users: {
          select: {
            id: true,
            clerkId: true,
            fullName: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        developers: {
          include: {
            skills: { include: { skill: true } },
            listings: {
              select: {
                id: true,
                status: true,
                hourlyRate: true,
                currency: true,
                workType: true,
                availableFrom: true,
                createdAt: true,
              },
            },
          },
        },
        _count: {
          select: {
            purchases: true,
            sales: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal values
    const serialized = companies.map((company) => ({
      ...company,
      developers: company.developers.map((dev) => ({
        ...dev,
        internalRate: dev.internalRate ? Number(dev.internalRate) : null,
        listings: dev.listings.map((listing) => ({
          ...listing,
          hourlyRate: Number(listing.hourlyRate),
        })),
      })),
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Failed to fetch companies:", error);
    return { success: false, error: "Failed to fetch companies" };
  }
}

// UPDATE: Suspend a listing (admin)
export async function suspendListing(listingId: string) {
  try {
    await requireAdmin();

    await prisma.listing.update({
      where: { id: listingId },
      data: { status: "EXPIRED" }, // Use EXPIRED as suspended state
    });

    revalidatePath("/dashboard/admin/companies");
    return { success: true };
  } catch (error) {
    console.error("Failed to suspend listing:", error);
    return { success: false, error: "Failed to suspend listing" };
  }
}

// UPDATE: Activate a listing (admin)
export async function activateListing(listingId: string) {
  try {
    await requireAdmin();

    await prisma.listing.update({
      where: { id: listingId },
      data: { status: "ACTIVE" },
    });

    revalidatePath("/dashboard/admin/companies");
    return { success: true };
  } catch (error) {
    console.error("Failed to activate listing:", error);
    return { success: false, error: "Failed to activate listing" };
  }
}

// REQUEST: Send notification to company asking for additional info
export async function requestAdditionalInfo(
  companyId: string,
  message: string,
) {
  try {
    await requireAdmin();

    // Get all users of the company (especially admins)
    const companyUsers = await prisma.user.findMany({
      where: { companyId },
      select: { id: true, role: true },
    });

    if (companyUsers.length === 0) {
      return { success: false, error: "No users found for this company" };
    }

    // Send notification to all company admins (or all users if no admin)
    const admins = companyUsers.filter((u) => u.role === "COMPANY_ADMIN");
    const targetUsers = admins.length > 0 ? admins : companyUsers;

    await Promise.all(
      targetUsers.map((user) =>
        prisma.notification.create({
          data: {
            userId: user.id,
            title: "Additional Information Required",
            message: message,
            link: "/dashboard/settings",
          },
        }),
      ),
    );

    return { success: true, notifiedCount: targetUsers.length };
  } catch (error) {
    console.error("Failed to send info request:", error);
    return { success: false, error: "Failed to send request" };
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
