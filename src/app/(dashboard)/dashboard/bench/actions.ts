"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schemas
const createDeveloperSchema = z.object({
  realName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email().optional().or(z.literal("")),
  pseudonym: z.string().min(2, "Pseudonym must be at least 2 characters"),
  title: z.string().min(2, "Title is required"),
  level: z.enum(["Junior", "Mid", "Senior", "Lead", "Principal"]),
  bio: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  cvUrl: z.string().url().optional().or(z.literal("")),
  internalRate: z.number().optional(),
  country: z.string().optional(),
  languages: z.array(z.string()).optional(),
  skills: z
    .array(
      z.object({
        name: z.string(),
        years: z.number().min(0).max(30),
        isPrimary: z.boolean().default(false),
      }),
    )
    .optional(),
});

const updateDeveloperSchema = createDeveloperSchema.partial();

export type CreateDeveloperInput = z.infer<typeof createDeveloperSchema>;
export type UpdateDeveloperInput = z.infer<typeof updateDeveloperSchema>;

// Helper to get current user's company (auto-creates if missing)
async function getCurrentCompany() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { company: true },
  });

  // If user doesn't exist, create them with a company
  if (!user) {
    const clerkUser = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    }).then((res) => res.json());

    const email =
      clerkUser.email_addresses?.[0]?.email_address || `${userId}@temp.devswap`;
    const fullName =
      `${clerkUser.first_name || ""} ${clerkUser.last_name || ""}`.trim() ||
      "User";
    const slug = `company-${userId.slice(-8)}`;

    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        fullName,
        company: {
          create: {
            name: `${fullName}'s Company`,
            slug,
            registrationCode: `TEMP-${userId.slice(-8).toUpperCase()}`,
          },
        },
      },
      include: { company: true },
    });
  }

  // If user exists but has no company, create one
  if (!user.company) {
    const slug = `company-${userId.slice(-8)}`;
    const company = await prisma.company.create({
      data: {
        name: `${user.fullName || "User"}'s Company`,
        slug,
        registrationCode: `TEMP-${userId.slice(-8).toUpperCase()}`,
        users: { connect: { id: user.id } },
      },
    });
    return company;
  }

  return user.company;
}

// GET: Fetch all developers for current company
export async function getDevelopers() {
  try {
    const company = await getCurrentCompany();

    const developers = await prisma.developer.findMany({
      where: { companyId: company.id },
      include: {
        skills: {
          include: { skill: true },
        },
        listings: {
          where: { status: "ACTIVE" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Serialize Decimal to number for client components
    const serializedDevelopers = developers.map((dev) => ({
      ...dev,
      listings: dev.listings.map((listing) => ({
        ...listing,
        hourlyRate: Number(listing.hourlyRate),
      })),
    }));

    return { success: true, data: serializedDevelopers };
  } catch (error) {
    console.error("Failed to fetch developers:", error);
    return { success: false, error: "Failed to fetch developers" };
  }
}

// GET: Fetch single developer
export async function getDeveloper(id: string) {
  try {
    const company = await getCurrentCompany();

    const developer = await prisma.developer.findFirst({
      where: { id, companyId: company.id },
      include: {
        skills: {
          include: { skill: true },
        },
        listings: true,
      },
    });

    if (!developer) return { success: false, error: "Developer not found" };
    return { success: true, data: developer };
  } catch (error) {
    console.error("Failed to fetch developer:", error);
    return { success: false, error: "Failed to fetch developer" };
  }
}

// CREATE: Add new developer
export async function createDeveloper(input: CreateDeveloperInput) {
  try {
    const validatedData = createDeveloperSchema.parse(input);
    const company = await getCurrentCompany();

    const developer = await prisma.developer.create({
      data: {
        companyId: company.id,
        realName: validatedData.realName,
        email: validatedData.email || null,
        pseudonym: validatedData.pseudonym,
        title: validatedData.title,
        level: validatedData.level,
        bio: validatedData.bio || null,
        photoUrl: validatedData.photoUrl || null,
        cvUrl: validatedData.cvUrl || null,
        internalRate: validatedData.internalRate || null,
        country: validatedData.country || null,
        languages: validatedData.languages || [],
      },
    });

    // Add skills if provided
    if (validatedData.skills && validatedData.skills.length > 0) {
      for (const skillData of validatedData.skills) {
        // Find or create skill
        let skill = await prisma.skill.findUnique({
          where: { name: skillData.name },
        });

        if (!skill) {
          skill = await prisma.skill.create({
            data: { name: skillData.name },
          });
        }

        // Link skill to developer
        await prisma.developerSkill.create({
          data: {
            developerId: developer.id,
            skillId: skill.id,
            years: skillData.years,
            isPrimary: skillData.isPrimary,
          },
        });
      }
    }

    revalidatePath("/dashboard/bench");
    return { success: true, data: developer };
  } catch (error) {
    console.error("Failed to create developer:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to create developer" };
  }
}

// UPDATE: Edit developer
export async function updateDeveloper(id: string, input: UpdateDeveloperInput) {
  try {
    const validatedData = updateDeveloperSchema.parse(input);
    const company = await getCurrentCompany();

    // Verify ownership
    const existing = await prisma.developer.findFirst({
      where: { id, companyId: company.id },
    });
    if (!existing) return { success: false, error: "Developer not found" };

    const developer = await prisma.developer.update({
      where: { id },
      data: {
        realName: validatedData.realName,
        email: validatedData.email || null,
        pseudonym: validatedData.pseudonym,
        title: validatedData.title,
        level: validatedData.level,
        bio: validatedData.bio || null,
        photoUrl: validatedData.photoUrl || null,
        cvUrl: validatedData.cvUrl || null,
        internalRate: validatedData.internalRate || null,
        country: validatedData.country || null,
        languages: validatedData.languages,
      },
    });

    // Update skills if provided
    if (validatedData.skills) {
      // Remove existing skills
      await prisma.developerSkill.deleteMany({
        where: { developerId: id },
      });

      // Add new skills
      for (const skillData of validatedData.skills) {
        let skill = await prisma.skill.findUnique({
          where: { name: skillData.name },
        });

        if (!skill) {
          skill = await prisma.skill.create({
            data: { name: skillData.name },
          });
        }

        await prisma.developerSkill.create({
          data: {
            developerId: developer.id,
            skillId: skill.id,
            years: skillData.years,
            isPrimary: skillData.isPrimary,
          },
        });
      }
    }

    revalidatePath("/dashboard/bench");
    return { success: true, data: developer };
  } catch (error) {
    console.error("Failed to update developer:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to update developer" };
  }
}

// DELETE: Remove developer
export async function deleteDeveloper(id: string) {
  try {
    const company = await getCurrentCompany();

    // Verify ownership
    const existing = await prisma.developer.findFirst({
      where: { id, companyId: company.id },
    });
    if (!existing) return { success: false, error: "Developer not found" };

    await prisma.developer.delete({
      where: { id },
    });

    revalidatePath("/dashboard/bench");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete developer:", error);
    return { success: false, error: "Failed to delete developer" };
  }
}
