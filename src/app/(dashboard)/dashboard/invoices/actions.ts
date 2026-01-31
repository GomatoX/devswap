"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@prisma/client";
import { addDays } from "date-fns";

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

// Generate invoice number
async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      number: { startsWith: `INV-${year}` },
    },
  });
  return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
}

// Get all invoices
export async function getInvoices() {
  try {
    const company = await getCurrentCompany();

    const invoices = await prisma.invoice.findMany({
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
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize
    const serialized = invoices.map((inv) => ({
      ...inv,
      amount: Number(inv.amount),
      contract: {
        ...inv.contract,
        hourlyRate: Number(inv.contract.hourlyRate),
      },
    }));

    return { success: true, data: serialized, companyId: company.id };
  } catch (error) {
    console.error("Failed to get invoices:", error);
    return { success: false, error: "Failed to load invoices" };
  }
}

// Get contracts with approved timesheets that can be invoiced
export async function getInvoiceableContracts() {
  try {
    const company = await getCurrentCompany();

    const contracts = await prisma.contract.findMany({
      where: {
        status: { in: ["ACTIVE", "ACCEPTED"] },
        request: {
          vendorId: company.id, // Only vendor can create invoices
        },
        timesheets: {
          some: { status: "APPROVED" },
        },
      },
      include: {
        request: {
          include: {
            listing: { include: { developer: true } },
            client: true,
          },
        },
        timesheets: {
          where: { status: "APPROVED" },
          orderBy: { weekStart: "asc" },
        },
      },
    });

    const serialized = contracts.map((c) => ({
      ...c,
      hourlyRate: Number(c.hourlyRate),
      timesheets: c.timesheets.map((ts) => ({
        ...ts,
        totalHours: Number(ts.totalHours),
      })),
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Failed to get invoiceable contracts:", error);
    return { success: false, error: "Failed to load contracts" };
  }
}

// Create invoice from approved timesheets
export async function createInvoice(data: {
  contractId: string;
  timesheetIds: string[];
  dueInDays?: number;
}) {
  try {
    const company = await getCurrentCompany();

    // Verify contract belongs to vendor
    const contract = await prisma.contract.findFirst({
      where: {
        id: data.contractId,
        request: { vendorId: company.id },
      },
    });

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    // Get approved timesheets
    const timesheets = await prisma.timesheet.findMany({
      where: {
        id: { in: data.timesheetIds },
        contractId: data.contractId,
        status: "APPROVED",
      },
      orderBy: { weekStart: "asc" },
    });

    if (timesheets.length === 0) {
      return { success: false, error: "No approved timesheets found" };
    }

    const totalHours = timesheets.reduce(
      (acc, ts) => acc + Number(ts.totalHours),
      0,
    );
    const amount = totalHours * Number(contract.hourlyRate);

    const periodStart = timesheets[0].weekStart;
    const periodEnd = timesheets[timesheets.length - 1].weekEnd;

    const invoice = await prisma.invoice.create({
      data: {
        contractId: data.contractId,
        number: await generateInvoiceNumber(),
        amount,
        periodStart,
        periodEnd,
        dueDate: addDays(new Date(), data.dueInDays || 30),
        status: "DRAFT",
        lineItems: timesheets.map((ts) => ({
          timesheetId: ts.id,
          weekStart: ts.weekStart,
          hours: Number(ts.totalHours),
          rate: Number(contract.hourlyRate),
          subtotal: Number(ts.totalHours) * Number(contract.hourlyRate),
        })),
      },
    });

    revalidatePath("/dashboard/invoices");
    return { success: true, data: invoice };
  } catch (error) {
    console.error("Failed to create invoice:", error);
    return { success: false, error: "Failed to create invoice" };
  }
}

// Update invoice status
export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
) {
  try {
    const company = await getCurrentCompany();

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        contract: {
          request: {
            OR: [{ vendorId: company.id }, { clientId: company.id }],
          },
        },
      },
    });

    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }

    const updateData: Record<string, unknown> = { status };

    if (status === "SENT") {
      updateData.sentAt = new Date();
    } else if (status === "PAID") {
      updateData.paidAt = new Date();
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    });

    revalidatePath("/dashboard/invoices");
    return { success: true };
  } catch (error) {
    console.error("Failed to update invoice:", error);
    return { success: false, error: "Failed to update invoice" };
  }
}
