"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ContractStatus } from "@prisma/client";

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

// Get all contracts for the company
export async function getContracts() {
  try {
    const company = await getCurrentCompany();

    const contracts = await prisma.contract.findMany({
      where: {
        request: {
          OR: [{ vendorId: company.id }, { clientId: company.id }],
        },
      },
      include: {
        request: {
          include: {
            listing: {
              include: {
                developer: true,
              },
            },
            client: true,
            vendor: true,
          },
        },
        timesheets: {
          where: { status: "SUBMITTED" },
        },
        invoices: {
          where: { status: { in: ["SENT", "OVERDUE"] } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize decimals
    const serialized = contracts.map((c) => ({
      ...c,
      hourlyRate: Number(c.hourlyRate),
      request: {
        ...c.request,
        agreedRate: c.request.agreedRate ? Number(c.request.agreedRate) : null,
        listing: {
          ...c.request.listing,
          hourlyRate: Number(c.request.listing.hourlyRate),
        },
      },
    }));

    return { success: true, data: serialized, companyId: company.id };
  } catch (error) {
    console.error("Failed to get contracts:", error);
    return { success: false, error: "Failed to load contracts" };
  }
}

// Create a new contract from a request
export async function createContract(data: {
  requestId: string;
  title: string;
  terms: string;
  hourlyRate: number;
  startDate: string;
  endDate?: string;
}) {
  try {
    const company = await getCurrentCompany();

    // Verify the request belongs to this company
    const request = await prisma.request.findFirst({
      where: {
        id: data.requestId,
        OR: [{ vendorId: company.id }, { clientId: company.id }],
      },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    const contract = await prisma.contract.create({
      data: {
        requestId: data.requestId,
        title: data.title,
        terms: data.terms,
        hourlyRate: data.hourlyRate,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: "DRAFT",
      },
    });

    revalidatePath("/dashboard/contracts");
    return { success: true, data: contract };
  } catch (error) {
    console.error("Failed to create contract:", error);
    return { success: false, error: "Failed to create contract" };
  }
}

// Update contract status
export async function updateContractStatus(
  contractId: string,
  status: ContractStatus,
) {
  try {
    const company = await getCurrentCompany();

    // Verify contract belongs to company
    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        request: {
          OR: [{ vendorId: company.id }, { clientId: company.id }],
        },
      },
    });

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    const updateData: Record<string, unknown> = { status };

    if (status === "SENT") {
      updateData.sentAt = new Date();
    } else if (status === "ACCEPTED") {
      updateData.acceptedAt = new Date();
    }

    await prisma.contract.update({
      where: { id: contractId },
      data: updateData,
    });

    revalidatePath("/dashboard/contracts");
    return { success: true };
  } catch (error) {
    console.error("Failed to update contract:", error);
    return { success: false, error: "Failed to update contract" };
  }
}

// Agree to contract terms ("I Agree" signing)
export async function agreeToContract(contractId: string) {
  try {
    const company = await getCurrentCompany();

    // Get contract with request to determine role
    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        status: "DRAFT",
        request: {
          OR: [{ vendorId: company.id }, { clientId: company.id }],
        },
      },
      include: {
        request: {
          select: { vendorId: true, clientId: true },
        },
      },
    });

    if (!contract) {
      return { success: false, error: "Contract not found or already active" };
    }

    const isVendor = contract.request.vendorId === company.id;
    const isClient = contract.request.clientId === company.id;

    // Check if already agreed
    if (isVendor && contract.vendorAgreedAt) {
      return {
        success: false,
        error: "You have already agreed to this contract",
      };
    }
    if (isClient && contract.clientAgreedAt) {
      return {
        success: false,
        error: "You have already agreed to this contract",
      };
    }

    // Update the appropriate timestamp
    const updateData: Record<string, unknown> = {};
    if (isVendor) {
      updateData.vendorAgreedAt = new Date();
    }
    if (isClient) {
      updateData.clientAgreedAt = new Date();
    }

    // Check if this agreement completes the contract (both agreed)
    const vendorAgreed = isVendor ? true : !!contract.vendorAgreedAt;
    const clientAgreed = isClient ? true : !!contract.clientAgreedAt;

    if (vendorAgreed && clientAgreed) {
      updateData.status = "ACTIVE";
    }

    await prisma.contract.update({
      where: { id: contractId },
      data: updateData,
    });

    revalidatePath("/dashboard/contracts");
    return {
      success: true,
      fullyAgreed: vendorAgreed && clientAgreed,
    };
  } catch (error) {
    console.error("Failed to agree to contract:", error);
    return { success: false, error: "Failed to agree to contract" };
  }
}

// Update contract (edit terms before ACTIVE)
export async function updateContract(
  contractId: string,
  data: {
    title?: string;
    terms?: string;
    hourlyRate?: number;
    startDate?: string;
    endDate?: string | null;
  },
) {
  try {
    const company = await getCurrentCompany();

    // Only allow editing DRAFT or SENT contracts
    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        status: { in: ["DRAFT", "SENT"] },
        request: {
          OR: [{ vendorId: company.id }, { clientId: company.id }],
        },
      },
    });

    if (!contract) {
      return {
        success: false,
        error: "Contract not found or cannot be edited (already active)",
      };
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.terms !== undefined) updateData.terms = data.terms;
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
    if (data.startDate !== undefined)
      updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }

    // If editing, clear any prior agreements (they need to re-agree)
    if (Object.keys(updateData).length > 0) {
      updateData.vendorAgreedAt = null;
      updateData.clientAgreedAt = null;
    }

    await prisma.contract.update({
      where: { id: contractId },
      data: updateData,
    });

    revalidatePath("/dashboard/contracts");
    return { success: true };
  } catch (error) {
    console.error("Failed to update contract:", error);
    return { success: false, error: "Failed to update contract" };
  }
}

// Get available requests that don't have contracts yet
export async function getRequestsWithoutContracts() {
  try {
    const company = await getCurrentCompany();

    const requests = await prisma.request.findMany({
      where: {
        OR: [{ vendorId: company.id }, { clientId: company.id }],
        contract: null,
        status: { in: ["ACCEPTED", "NEGOTIATING"] },
      },
      include: {
        listing: {
          include: { developer: true },
        },
        client: true,
        vendor: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize decimals
    const serialized = requests.map((r) => ({
      ...r,
      agreedRate: r.agreedRate ? Number(r.agreedRate) : null,
      listing: {
        ...r.listing,
        hourlyRate: Number(r.listing.hourlyRate),
      },
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("Failed to get requests:", error);
    return { success: false, error: "Failed to load requests" };
  }
}
