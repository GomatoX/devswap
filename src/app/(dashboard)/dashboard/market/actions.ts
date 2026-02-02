"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schemas
const createListingSchema = z.object({
  developerId: z.string().uuid("Invalid developer"),
  availableFrom: z.string().transform((s) => new Date(s)),
  availableTo: z
    .string()
    .optional()
    .transform((s) => (s ? new Date(s) : null)),
  workType: z.enum(["Full-time", "Part-time", "Contract", "Flexible"]),
  timezone: z.string().default("Europe/Vilnius"),
  hourlyRate: z.number().min(1, "Hourly rate must be at least 1"),
  currency: z.string().default("EUR"),
  minDuration: z.number().min(1, "Minimum duration must be at least 1 week"),
  status: z.enum(["DRAFT", "ACTIVE"]).default("DRAFT"),
});

const updateListingSchema = createListingSchema
  .partial()
  .omit({ developerId: true });

export type CreateListingInput = z.input<typeof createListingSchema>;
export type UpdateListingInput = z.input<typeof updateListingSchema>;

// Helper to get current user's company
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

// GET: Fetch all listings for current company
export async function getListings() {
  try {
    const company = await getCurrentCompany();

    const listings = await prisma.listing.findMany({
      where: {
        developer: { companyId: company.id },
      },
      include: {
        developer: {
          include: {
            skills: { include: { skill: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal to number for client components
    const serializedListings = listings.map((listing) => ({
      ...listing,
      hourlyRate: Number(listing.hourlyRate),
    }));

    return { success: true, data: serializedListings };
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    return { success: false, error: "Failed to fetch listings" };
  }
}

// GET: Fetch marketplace listings (all active listings from other companies)
export async function getMarketplaceListings(filters?: {
  skills?: string[];
  minRate?: number;
  maxRate?: number;
  workType?: string;
  search?: string;
}) {
  try {
    const company = await getCurrentCompany();

    const whereClause: Record<string, unknown> = {
      status: "ACTIVE",
      developer: {
        company: {
          // Only show listings from verified (ACTIVE) companies
          status: "ACTIVE",
        },
      },
    };

    // Apply filters
    if (filters?.workType) {
      whereClause.workType = filters.workType;
    }

    if (filters?.minRate || filters?.maxRate) {
      whereClause.hourlyRate = {};
      if (filters.minRate)
        (whereClause.hourlyRate as Record<string, unknown>).gte =
          filters.minRate;
      if (filters.maxRate)
        (whereClause.hourlyRate as Record<string, unknown>).lte =
          filters.maxRate;
    }

    if (filters?.skills && filters.skills.length > 0) {
      whereClause.developer = {
        ...(whereClause.developer as object),
        skills: {
          some: {
            skill: {
              name: { in: filters.skills },
            },
          },
        },
      };
    }

    const listings = await prisma.listing.findMany({
      where: whereClause,
      include: {
        developer: {
          include: {
            skills: { include: { skill: true } },
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter by search if provided
    let filteredListings = listings;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredListings = listings.filter(
        (l) =>
          l.developer.pseudonym.toLowerCase().includes(searchLower) ||
          l.developer.title.toLowerCase().includes(searchLower) ||
          l.developer.skills.some((s) =>
            s.skill.name.toLowerCase().includes(searchLower),
          ),
      );
    }

    // Serialize Decimal to number for client components
    const serializedListings = filteredListings.map((listing) => ({
      ...listing,
      hourlyRate: Number(listing.hourlyRate),
    }));

    return {
      success: true,
      data: serializedListings,
      currentCompanyId: company.id,
    };
  } catch (error) {
    console.error("Failed to fetch marketplace listings:", error);
    return { success: false, error: "Failed to fetch listings" };
  }
}

// CREATE: Add new listing
export async function createListing(input: CreateListingInput) {
  try {
    const validatedData = createListingSchema.parse(input);
    const company = await getCurrentCompany();

    // Verify developer ownership
    const developer = await prisma.developer.findFirst({
      where: { id: validatedData.developerId, companyId: company.id },
    });
    if (!developer) return { success: false, error: "Developer not found" };

    const listing = await prisma.listing.create({
      data: {
        developerId: validatedData.developerId,
        availableFrom: validatedData.availableFrom,
        availableTo: validatedData.availableTo,
        workType: validatedData.workType,
        timezone: validatedData.timezone,
        hourlyRate: validatedData.hourlyRate,
        currency: validatedData.currency,
        minDuration: validatedData.minDuration,
        status: validatedData.status,
      },
    });

    revalidatePath("/dashboard/bench");
    revalidatePath("/dashboard/market");
    return { success: true, data: listing };
  } catch (error) {
    console.error("Failed to create listing:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to create listing" };
  }
}

// UPDATE: Edit listing
export async function updateListing(id: string, input: UpdateListingInput) {
  try {
    const validatedData = updateListingSchema.parse(input);
    const company = await getCurrentCompany();

    // Verify ownership
    const existing = await prisma.listing.findFirst({
      where: { id, developer: { companyId: company.id } },
    });
    if (!existing) return { success: false, error: "Listing not found" };

    const listing = await prisma.listing.update({
      where: { id },
      data: validatedData,
    });

    revalidatePath("/dashboard/bench");
    revalidatePath("/dashboard/market");
    return { success: true, data: listing };
  } catch (error) {
    console.error("Failed to update listing:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to update listing" };
  }
}

// DELETE: Remove listing
export async function deleteListing(id: string) {
  try {
    const company = await getCurrentCompany();

    // Verify ownership
    const existing = await prisma.listing.findFirst({
      where: { id, developer: { companyId: company.id } },
    });
    if (!existing) return { success: false, error: "Listing not found" };

    await prisma.listing.delete({
      where: { id },
    });

    revalidatePath("/dashboard/bench");
    revalidatePath("/dashboard/market");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete listing:", error);
    return { success: false, error: "Failed to delete listing" };
  }
}

// PUBLISH: Toggle listing status
export async function toggleListingStatus(id: string) {
  try {
    const company = await getCurrentCompany();

    const existing = await prisma.listing.findFirst({
      where: { id, developer: { companyId: company.id } },
    });
    if (!existing) return { success: false, error: "Listing not found" };

    const newStatus = existing.status === "ACTIVE" ? "DRAFT" : "ACTIVE";

    const listing = await prisma.listing.update({
      where: { id },
      data: { status: newStatus },
    });

    revalidatePath("/dashboard/bench");
    revalidatePath("/dashboard/market");
    return { success: true, data: listing };
  } catch (error) {
    console.error("Failed to toggle listing status:", error);
    return { success: false, error: "Failed to update listing" };
  }
}
