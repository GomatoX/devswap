"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const createRatingSchema = z.object({
  requestId: z.string().uuid("Invalid request"),
  score: z.number().min(1, "Minimum score is 1").max(5, "Maximum score is 5"),
  comment: z.string().optional(),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;

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

// GET: Fetch rating for a request
export async function getRating(requestId: string) {
  try {
    const { company } = await getCurrentUserAndCompany();

    const request = await prisma.request.findFirst({
      where: {
        id: requestId,
        OR: [{ clientId: company.id }, { vendorId: company.id }],
      },
    });

    if (!request) return { success: false, error: "Request not found" };

    const rating = await prisma.rating.findUnique({
      where: { requestId },
      include: {
        fromCompany: { select: { id: true, name: true } },
        toCompany: { select: { id: true, name: true } },
      },
    });

    return {
      success: true,
      data: rating,
      role: request.vendorId === company.id ? "vendor" : "client",
    };
  } catch (error) {
    console.error("Failed to fetch rating:", error);
    return { success: false, error: "Failed to fetch rating" };
  }
}

// CREATE: Submit rating (only after completion)
export async function createRating(input: CreateRatingInput) {
  try {
    const validatedData = createRatingSchema.parse(input);
    const { company } = await getCurrentUserAndCompany();

    // Get request and verify it's completed
    const request = await prisma.request.findFirst({
      where: {
        id: validatedData.requestId,
        OR: [{ clientId: company.id }, { vendorId: company.id }],
        status: "COMPLETED",
      },
    });

    if (!request) {
      return { success: false, error: "Completed engagement not found" };
    }

    // Check if rating already exists
    const existing = await prisma.rating.findUnique({
      where: { requestId: validatedData.requestId },
    });

    if (existing) {
      return { success: false, error: "Rating already submitted" };
    }

    // Determine who's being rated
    const isClient = request.clientId === company.id;
    const fromCompanyId = company.id;
    const toCompanyId = isClient ? request.vendorId : request.clientId;

    const rating = await prisma.rating.create({
      data: {
        requestId: validatedData.requestId,
        fromCompanyId,
        toCompanyId,
        score: validatedData.score,
        comment: validatedData.comment,
      },
    });

    revalidatePath(`/dashboard/requests/${validatedData.requestId}`);
    revalidatePath("/dashboard/requests");
    return { success: true, data: rating };
  } catch (error) {
    console.error("Failed to create rating:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to submit rating" };
  }
}

// GET: Company average rating
export async function getCompanyRating(companyId: string) {
  try {
    const ratings = await prisma.rating.findMany({
      where: { toCompanyId: companyId },
      select: { score: true },
    });

    if (ratings.length === 0) {
      return { success: true, data: { average: null, count: 0 } };
    }

    const average =
      ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;

    return {
      success: true,
      data: {
        average: Math.round(average * 10) / 10,
        count: ratings.length,
      },
    };
  } catch (error) {
    console.error("Failed to get company rating:", error);
    return { success: false, error: "Failed to get rating" };
  }
}
