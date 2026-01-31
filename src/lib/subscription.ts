"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@prisma/client";
import { getPlatformSettings } from "./platform-settings";

export type SubscriptionCheck = {
  isActive: boolean;
  status: SubscriptionStatus;
  tier: string;
  endsAt: Date | null;
  requiresPayment: boolean;
  // New fields for Beta/Founding Member
  isBetaMode: boolean;
  isFoundingMember: boolean;
  foundingDealsRemaining: number;
};

/**
 * Check if the current user's company has an active subscription
 * Returns subscription status details for conditional rendering
 *
 * Access is granted if ANY of these are true:
 * 1. Beta Mode is ON (everyone has access)
 * 2. Company is a Founding Member (lifetime free)
 * 3. Company has an active paid subscription
 */
export async function checkSubscription(): Promise<SubscriptionCheck> {
  const { userId } = await auth();

  // Get platform settings first
  const settings = await getPlatformSettings();

  if (!userId) {
    return {
      isActive: settings.betaMode, // In Beta mode, even anon gets some access
      status: "INACTIVE" as SubscriptionStatus,
      tier: "FREE",
      endsAt: null,
      requiresPayment: !settings.betaMode,
      isBetaMode: settings.betaMode,
      isFoundingMember: false,
      foundingDealsRemaining: 0,
    };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      company: {
        select: {
          subscriptionStatus: true,
          subscriptionTier: true,
          subscriptionEndsAt: true,
          isFoundingMember: true,
          foundingDealsRemaining: true,
        },
      },
    },
  });

  if (!user?.company) {
    return {
      isActive: settings.betaMode,
      status: "INACTIVE" as SubscriptionStatus,
      tier: "FREE",
      endsAt: null,
      requiresPayment: !settings.betaMode,
      isBetaMode: settings.betaMode,
      isFoundingMember: false,
      foundingDealsRemaining: 0,
    };
  }

  const {
    subscriptionStatus,
    subscriptionTier,
    subscriptionEndsAt,
    isFoundingMember,
    foundingDealsRemaining,
  } = user.company;

  // Check if subscription is active and not expired
  const isExpired =
    subscriptionEndsAt && new Date(subscriptionEndsAt) < new Date();
  const hasActiveSubscription = subscriptionStatus === "ACTIVE" && !isExpired;

  // Access is granted if:
  // 1. Beta mode is ON, OR
  // 2. Company is a Founding Member, OR
  // 3. Company has active paid subscription
  const isActive =
    settings.betaMode || isFoundingMember || hasActiveSubscription;

  return {
    isActive,
    status: subscriptionStatus,
    tier: subscriptionTier,
    endsAt: subscriptionEndsAt,
    requiresPayment: !isActive,
    isBetaMode: settings.betaMode,
    isFoundingMember,
    foundingDealsRemaining,
  };
}

/**
 * Get subscription status for display purposes
 */
export async function getSubscriptionDetails() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          subscriptionStatus: true,
          subscriptionTier: true,
          subscriptionEndsAt: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          isFoundingMember: true,
          foundingDealsRemaining: true,
        },
      },
    },
  });

  return user?.company ?? null;
}
