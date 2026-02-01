"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCompanySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  registrationCode: z.string().min(1, "Registration code is required"),
  vatCode: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  description: z.string().min(10, "Description must be at least 10 characters"),
  logoUrl: z.string().optional(),
  country: z.string().optional(),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

// Get current user's company
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

// GET: Fetch company profile
export async function getCompanyProfile() {
  try {
    const company = await getCurrentCompany();
    return { success: true, data: company };
  } catch (error) {
    console.error("Failed to get company:", error);
    return { success: false, error: "Failed to get company" };
  }
}

// CHECK: Is company profile complete?
export async function isCompanyProfileComplete(): Promise<boolean> {
  try {
    const company = await getCurrentCompany();
    return !!(
      company.name &&
      company.registrationCode &&
      company.description &&
      company.description.length >= 10
    );
  } catch {
    return false;
  }
}

// UPDATE: Update company profile
export async function updateCompanyProfile(input: UpdateCompanyInput) {
  try {
    const company = await getCurrentCompany();

    const parsed = updateCompanySchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid input",
      };
    }

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        name: parsed.data.name,
        registrationCode: parsed.data.registrationCode,
        vatCode: parsed.data.vatCode || null,
        website: parsed.data.website || null,
        description: parsed.data.description,
        logoUrl: parsed.data.logoUrl || null,
        country: parsed.data.country || null,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/bench");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update company:", error);
    return { success: false, error: "Failed to update company" };
  }
}
