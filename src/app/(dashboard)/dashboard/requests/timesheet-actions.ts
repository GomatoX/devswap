"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { TimesheetStatus } from "@prisma/client";
import { endOfWeek } from "date-fns";

// Validation schemas
const createTimesheetSchema = z.object({
  requestId: z.string().uuid("Invalid request"),
  weekStart: z.string().transform((s) => {
    const date = new Date(s);
    // Normalize to Monday of that week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }),
  hours: z
    .number()
    .min(0.5, "Minimum 0.5 hours")
    .max(80, "Maximum 80 hours per week"),
  description: z.string().optional(),
});

export type CreateTimesheetInput = z.input<typeof createTimesheetSchema>;

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

// GET: Fetch timesheets for a request
export async function getTimesheets(requestId: string) {
  try {
    const { company } = await getCurrentUserAndCompany();

    // Verify access to request
    const request = await prisma.request.findFirst({
      where: {
        id: requestId,
        OR: [{ clientId: company.id }, { vendorId: company.id }],
      },
    });

    if (!request) return { success: false, error: "Request not found" };

    const timesheets = await prisma.timesheet.findMany({
      where: { requestId },
      orderBy: { weekStart: "desc" },
      include: { entries: true },
    });

    // Map to legacy format for backward compatibility
    const mappedTimesheets = timesheets.map((ts) => ({
      id: ts.id,
      requestId: ts.requestId,
      weekStart: ts.weekStart,
      hours: ts.totalHours, // Map totalHours to hours for backward compat
      description:
        ts.entries
          .map((e) => e.description)
          .filter(Boolean)
          .join("; ") || null,
      status: ts.status.toLowerCase(), // Convert enum to lowercase string
      createdAt: ts.createdAt,
    }));

    return {
      success: true,
      data: mappedTimesheets,
      role: request.vendorId === company.id ? "vendor" : "client",
    };
  } catch (error) {
    console.error("Failed to fetch timesheets:", error);
    return { success: false, error: "Failed to fetch timesheets" };
  }
}

// CREATE: Log timesheet (vendor only)
export async function createTimesheet(input: CreateTimesheetInput) {
  try {
    const validatedData = createTimesheetSchema.parse(input);
    const { company } = await getCurrentUserAndCompany();

    // Verify vendor access
    const request = await prisma.request.findFirst({
      where: {
        id: validatedData.requestId,
        vendorId: company.id,
        status: "ACCEPTED", // Can only log for active engagements
      },
      include: { contract: true },
    });

    if (!request) {
      return { success: false, error: "Active engagement not found" };
    }

    // Check if timesheet for this week already exists
    const existing = await prisma.timesheet.findFirst({
      where: {
        requestId: validatedData.requestId,
        weekStart: validatedData.weekStart,
      },
    });

    if (existing) {
      return {
        success: false,
        error: "Timesheet for this week already exists",
      };
    }

    const weekEnd = endOfWeek(validatedData.weekStart, { weekStartsOn: 1 });

    // Create timesheet first without entries
    const timesheet = await prisma.timesheet.create({
      data: {
        requestId: validatedData.requestId,
        contractId: request.contract?.id ?? null,
        weekStart: validatedData.weekStart,
        weekEnd: weekEnd,
        totalHours: validatedData.hours,
        status: TimesheetStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });

    // Create entry if description provided
    if (validatedData.description) {
      await prisma.timesheetEntry.create({
        data: {
          timesheetId: timesheet.id,
          date: validatedData.weekStart,
          hours: validatedData.hours,
          description: validatedData.description,
        },
      });
    }

    revalidatePath(`/dashboard/requests/${validatedData.requestId}`);
    return { success: true, data: timesheet };
  } catch (error) {
    console.error("Failed to create timesheet:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to create timesheet" };
  }
}

// UPDATE: Approve timesheet (client only)
export async function approveTimesheet(id: string) {
  try {
    const { company } = await getCurrentUserAndCompany();

    // Verify client access
    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      include: { request: true },
    });

    if (
      !timesheet ||
      !timesheet.request ||
      timesheet.request.clientId !== company.id
    ) {
      return { success: false, error: "Timesheet not found" };
    }

    if (timesheet.status !== TimesheetStatus.SUBMITTED) {
      return { success: false, error: "Timesheet already processed" };
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        status: TimesheetStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

    revalidatePath(`/dashboard/requests/${timesheet.requestId}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to approve timesheet:", error);
    return { success: false, error: "Failed to approve timesheet" };
  }
}

// UPDATE: Reject timesheet (client only)
export async function rejectTimesheet(id: string) {
  try {
    const { company } = await getCurrentUserAndCompany();

    const timesheet = await prisma.timesheet.findUnique({
      where: { id },
      include: { request: true },
    });

    if (
      !timesheet ||
      !timesheet.request ||
      timesheet.request.clientId !== company.id
    ) {
      return { success: false, error: "Timesheet not found" };
    }

    if (timesheet.status !== TimesheetStatus.SUBMITTED) {
      return { success: false, error: "Timesheet already processed" };
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        status: TimesheetStatus.REJECTED,
        rejectedAt: new Date(),
      },
    });

    revalidatePath(`/dashboard/requests/${timesheet.requestId}`);
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to reject timesheet:", error);
    return { success: false, error: "Failed to reject timesheet" };
  }
}

// GET: Summary of hours for a request
export async function getTimesheetSummary(requestId: string) {
  try {
    const { company } = await getCurrentUserAndCompany();

    const request = await prisma.request.findFirst({
      where: {
        id: requestId,
        OR: [{ clientId: company.id }, { vendorId: company.id }],
      },
    });

    if (!request) return { success: false, error: "Request not found" };

    const timesheets = await prisma.timesheet.findMany({
      where: { requestId },
    });

    const summary = {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    };

    for (const ts of timesheets) {
      const hours = parseFloat(ts.totalHours.toString());
      summary.total += hours;
      if (ts.status === TimesheetStatus.APPROVED) summary.approved += hours;
      if (ts.status === TimesheetStatus.SUBMITTED) summary.pending += hours;
      if (ts.status === TimesheetStatus.REJECTED) summary.rejected += hours;
    }

    return { success: true, data: summary };
  } catch (error) {
    console.error("Failed to get timesheet summary:", error);
    return { success: false, error: "Failed to get summary" };
  }
}
