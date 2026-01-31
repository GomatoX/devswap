"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay } from "date-fns";

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

export async function getAnalyticsData() {
  try {
    const company = await getCurrentCompany();
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Get company's developers and listings
    const developers = await prisma.developer.findMany({
      where: { companyId: company.id },
      include: {
        listings: {
          include: {
            requests: true,
          },
        },
      },
    });

    // Aggregate stats
    const totalDevelopers = developers.length;
    const totalListings = developers.reduce(
      (acc, dev) => acc + dev.listings.length,
      0,
    );
    const activeListings = developers.reduce(
      (acc, dev) =>
        acc + dev.listings.filter((l) => l.status === "ACTIVE").length,
      0,
    );

    // Get all requests (both as buyer and vendor)
    const [requestsAsVendor, requestsAsBuyer] = await Promise.all([
      prisma.request.findMany({
        where: { vendorId: company.id },
        include: { listing: { include: { developer: true } } },
      }),
      prisma.request.findMany({
        where: { clientId: company.id },
        include: { listing: { include: { developer: true } } },
      }),
    ]);

    const totalRequests = requestsAsVendor.length + requestsAsBuyer.length;
    const acceptedRequests = [...requestsAsVendor, ...requestsAsBuyer].filter(
      (r) => r.status === "ACCEPTED" || r.status === "COMPLETED",
    ).length;

    const conversionRate =
      totalRequests > 0
        ? Math.round((acceptedRequests / totalRequests) * 100)
        : 0;

    // Calculate potential revenue from accepted deals
    const potentialRevenue = requestsAsVendor
      .filter((r) => r.status === "ACCEPTED" || r.status === "COMPLETED")
      .reduce((acc, r) => {
        const rate = Number(r.agreedRate || r.listing.hourlyRate || 0);
        const weeks = Math.ceil(
          (r.endDate.getTime() - r.startDate.getTime()) /
            (7 * 24 * 60 * 60 * 1000),
        );
        return acc + rate * 40 * weeks; // Assuming 40 hours/week
      }, 0);

    // Get contracts count
    const contracts = await prisma.contract.count({
      where: {
        request: {
          OR: [{ vendorId: company.id }, { clientId: company.id }],
        },
      },
    });

    // Get pending timesheets
    const pendingTimesheets = await prisma.timesheet.count({
      where: {
        status: "SUBMITTED",
        contract: {
          request: {
            OR: [{ vendorId: company.id }, { clientId: company.id }],
          },
        },
      },
    });

    // Get unpaid invoices
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ["SENT", "OVERDUE"] },
        contract: {
          request: {
            OR: [{ vendorId: company.id }, { clientId: company.id }],
          },
        },
      },
    });

    const unpaidAmount = unpaidInvoices.reduce(
      (acc, inv) => acc + Number(inv.amount),
      0,
    );

    // Request status breakdown
    const requestsByStatus = {
      pending: [...requestsAsVendor, ...requestsAsBuyer].filter(
        (r) => r.status === "PENDING",
      ).length,
      negotiating: [...requestsAsVendor, ...requestsAsBuyer].filter(
        (r) => r.status === "NEGOTIATING",
      ).length,
      accepted: [...requestsAsVendor, ...requestsAsBuyer].filter(
        (r) => r.status === "ACCEPTED",
      ).length,
      completed: [...requestsAsVendor, ...requestsAsBuyer].filter(
        (r) => r.status === "COMPLETED",
      ).length,
    };

    return {
      success: true,
      data: {
        overview: {
          totalDevelopers,
          totalListings,
          activeListings,
          totalRequests,
          conversionRate,
          potentialRevenue,
        },
        engagement: {
          contracts,
          pendingTimesheets,
          unpaidInvoices: unpaidInvoices.length,
          unpaidAmount,
        },
        requestsByStatus,
        companyTier: company.subscriptionTier,
      },
    };
  } catch (error) {
    console.error("Failed to get analytics:", error);
    return { success: false, error: "Failed to load analytics" };
  }
}
