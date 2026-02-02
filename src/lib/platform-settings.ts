"use server";

import { prisma } from "@/lib/prisma";

export type PlatformSettings = {
  betaMode: boolean;
  foundingMemberLimit: number;
  foundingMemberFee: number;
  foundingMemberDeals: number;
  // Currency
  currency: "USD" | "EUR";
  // Tier pricing
  buyerMonthlyPrice: number;
  buyerYearlyPrice: number;
  // Tier features
  freeFeatures: string[];
  buyerFeatures: string[];
  // Matchmaking
  matchmakingFee: number;
  matchmakingDescription: string;
  matchmakingDetails: string;
  matchmakingFeatures: string[];
};

const DEFAULT_SETTINGS: PlatformSettings = {
  betaMode: true,
  foundingMemberLimit: 50,
  foundingMemberFee: 250,
  foundingMemberDeals: 3,
  currency: "EUR",
  buyerMonthlyPrice: 99,
  buyerYearlyPrice: 990,
  freeFeatures: [
    "Browse marketplace",
    "Unlimited developers",
    "Create listings",
    "Basic support",
  ],
  buyerFeatures: [
    "Everything in Free",
    "Contact developers directly",
    "Initiate deals & requests",
    "Basic analytics",
    "Email support",
  ],
  matchmakingFee: 500,
  matchmakingDescription: "Success fee on completed long-term contracts",
  matchmakingDetails:
    "This fee is only charged when a contract is successfully completed (engagement lasting 4+ weeks). It covers contract management, dispute resolution, timesheet verification, and our replacement guarantee.",
  matchmakingFeatures: [
    "Charged only on success",
    "Contract management",
    "Automated invoicing",
    "Legal protection",
    "Replacement guarantee",
  ],
};

/**
 * Get platform settings from database, or create default if not exists
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    let settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      // Create default settings if not exist
      settings = await prisma.platformSettings.create({
        data: {
          id: "default",
          ...DEFAULT_SETTINGS,
        },
      });
    }

    return {
      betaMode: settings.betaMode,
      foundingMemberLimit: settings.foundingMemberLimit,
      foundingMemberFee: settings.foundingMemberFee,
      foundingMemberDeals: settings.foundingMemberDeals,
      currency: settings.currency as "USD" | "EUR",
      buyerMonthlyPrice: settings.buyerMonthlyPrice,
      buyerYearlyPrice: settings.buyerYearlyPrice,
      freeFeatures: settings.freeFeatures,
      buyerFeatures: settings.buyerFeatures,
      matchmakingFee: settings.matchmakingFee,
      matchmakingDescription: settings.matchmakingDescription,
      matchmakingDetails: settings.matchmakingDetails,
      matchmakingFeatures: settings.matchmakingFeatures,
    };
  } catch (error) {
    console.error("Failed to get platform settings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update platform settings (Admin only)
 */
export async function updatePlatformSettings(
  updates: Partial<PlatformSettings>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.platformSettings.upsert({
      where: { id: "default" },
      update: updates,
      create: {
        id: "default",
        ...DEFAULT_SETTINGS,
        ...updates,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update platform settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}

/**
 * Get founding member stats
 */
export async function getFoundingMemberStats(): Promise<{
  count: number;
  limit: number;
  slotsRemaining: number;
}> {
  try {
    const [settings, count] = await Promise.all([
      getPlatformSettings(),
      prisma.company.count({
        where: { isFoundingMember: true },
      }),
    ]);

    return {
      count,
      limit: settings.foundingMemberLimit,
      slotsRemaining: Math.max(0, settings.foundingMemberLimit - count),
    };
  } catch (error) {
    console.error("Failed to get founding member stats:", error);
    return { count: 0, limit: 50, slotsRemaining: 50 };
  }
}

/**
 * Attempt to grant founding member status to a company
 * Only succeeds if there are slots available
 */
export async function grantFoundingMemberStatus(
  companyId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const stats = await getFoundingMemberStats();
    const settings = await getPlatformSettings();

    if (stats.slotsRemaining <= 0) {
      return { success: false, error: "No founding member slots remaining" };
    }

    await prisma.company.update({
      where: { id: companyId },
      data: {
        isFoundingMember: true,
        foundingDealsRemaining: settings.foundingMemberDeals,
        subscriptionStatus: "ACTIVE", // Founding members get active status
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to grant founding member status:", error);
    return { success: false, error: "Failed to grant founding member status" };
  }
}
