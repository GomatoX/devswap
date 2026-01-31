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
    return { success: true, data: { settings, foundingStats } };
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
