"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TimesheetStatus } from "@prisma/client";
import { startOfWeek, endOfWeek, addDays } from "date-fns";

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

// Get all timesheets for the company
export async function getTimesheets() {
  try {
    const company = await getCurrentCompany();

    const timesheets = await prisma.timesheet.findMany({
      where: {
        contract: {
          request: {
            OR: [{ vendorId: company.id }, { clientId: company.id }],
          },
        },
      },
      include: {
        contract: {
          include: {
            request: {
              include: {
                listing: { include: { developer: true } },
                client: true,
                vendor: true,
              },
            },
          },
        },
        entries: {
          orderBy: { date: "asc" },
        },
      },
      orderBy: { weekStart: "desc" },
    });

    // Serialize decimals - only include timesheets with contracts
    const serialized = timesheets
      .filter((ts) => ts.contract !== null)
      .map((ts) => ({
        ...ts,
        totalHours: Number(ts.totalHours),
        entries: ts.entries.map((e) => ({
          ...e,
          hours: Number(e.hours),
        })),
        contract: {
          ...ts.contract!,
          hourlyRate: Number(ts.contract!.hourlyRate),
        },
      }));

    return { success: true, data: serialized, companyId: company.id };
  } catch (error) {
    console.error("Failed to get timesheets:", error);
    return { success: false, error: "Failed to load timesheets" };
  }
}

// Get contracts for timesheet creation
export async function getActiveContracts() {
  try {
    const company = await getCurrentCompany();

    const contracts = await prisma.contract.findMany({
      where: {
        status: { in: ["ACTIVE", "ACCEPTED"] },
        request: {
          OR: [{ vendorId: company.id }, { clientId: company.id }],
        },
      },
      include: {
        request: {
          include: {
            listing: { include: { developer: true } },
            client: true,
            vendor: true,
          },
        },
      },
    });

    const serialized = contracts.map((c) => ({
      ...c,
      hourlyRate: Number(c.hourlyRate),
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Failed to get contracts:", error);
    return { success: false, error: "Failed to load contracts" };
  }
}

// Create a new timesheet
export async function createTimesheet(data: {
  contractId: string;
  weekStart: string;
  entries: Array<{ date: string; hours: number; description?: string }>;
}) {
  try {
    const company = await getCurrentCompany();

    // Verify contract belongs to company
    const contract = await prisma.contract.findFirst({
      where: {
        id: data.contractId,
        request: {
          OR: [{ vendorId: company.id }, { clientId: company.id }],
        },
      },
    });

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    const weekStartDate = new Date(data.weekStart);
    const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });

    const totalHours = data.entries.reduce((acc, e) => acc + e.hours, 0);

    const timesheet = await prisma.timesheet.create({
      data: {
        contractId: data.contractId,
        weekStart: weekStartDate,
        weekEnd: weekEndDate,
        totalHours,
        status: "DRAFT",
        entries: {
          create: data.entries.map((e) => ({
            date: new Date(e.date),
            hours: e.hours,
            description: e.description,
          })),
        },
      },
    });

    revalidatePath("/dashboard/timesheets");
    return { success: true, data: timesheet };
  } catch (error) {
    console.error("Failed to create timesheet:", error);
    return { success: false, error: "Failed to create timesheet" };
  }
}

// Submit timesheet for approval
export async function submitTimesheet(timesheetId: string) {
  try {
    const company = await getCurrentCompany();

    const timesheet = await prisma.timesheet.findFirst({
      where: {
        id: timesheetId,
        contract: {
          request: {
            OR: [{ vendorId: company.id }, { clientId: company.id }],
          },
        },
      },
    });

    if (!timesheet) {
      return { success: false, error: "Timesheet not found" };
    }

    await prisma.timesheet.update({
      where: { id: timesheetId },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    revalidatePath("/dashboard/timesheets");
    return { success: true };
  } catch (error) {
    console.error("Failed to submit timesheet:", error);
    return { success: false, error: "Failed to submit timesheet" };
  }
}

// Approve or reject timesheet
export async function updateTimesheetStatus(
  timesheetId: string,
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string,
) {
  try {
    const company = await getCurrentCompany();

    const timesheet = await prisma.timesheet.findFirst({
      where: {
        id: timesheetId,
        contract: {
          request: {
            OR: [{ vendorId: company.id }, { clientId: company.id }],
          },
        },
      },
    });

    if (!timesheet) {
      return { success: false, error: "Timesheet not found" };
    }

    const updateData: Record<string, unknown> = { status };

    if (status === "APPROVED") {
      updateData.approvedAt = new Date();
    } else if (status === "REJECTED") {
      updateData.rejectedAt = new Date();
      updateData.rejectionReason = rejectionReason;
    }

    await prisma.timesheet.update({
      where: { id: timesheetId },
      data: updateData,
    });

    revalidatePath("/dashboard/timesheets");
    return { success: true };
  } catch (error) {
    console.error("Failed to update timesheet:", error);
    return { success: false, error: "Failed to update timesheet" };
  }
}
