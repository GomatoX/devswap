"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { RequestStatus } from "@prisma/client";

// Validation schemas
const createRequestSchema = z.object({
  listingId: z.string().uuid("Invalid listing"),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
  message: z.string().min(10, "Please provide a message (min 10 characters)"),
});

export type CreateRequestInput = z.input<typeof createRequestSchema>;

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

// GET: Fetch all requests (both as client and vendor)
export async function getRequests() {
  try {
    const { company } = await getCurrentUserAndCompany();

    const requests = await prisma.request.findMany({
      where: {
        OR: [{ clientId: company.id }, { vendorId: company.id }],
      },
      include: {
        listing: {
          include: {
            developer: {
              include: {
                skills: { include: { skill: true } },
              },
            },
          },
        },
        client: { select: { id: true, name: true, slug: true, logoUrl: true } },
        vendor: { select: { id: true, name: true, slug: true, logoUrl: true } },
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Enrich with role info and convert Decimals to numbers
    const enrichedRequests = requests.map((req) => ({
      ...req,
      agreedRate: req.agreedRate ? Number(req.agreedRate) : null,
      listing: {
        ...req.listing,
        hourlyRate: Number(req.listing.hourlyRate),
      },
      role: req.clientId === company.id ? "client" : "vendor",
      counterparty: req.clientId === company.id ? req.vendor : req.client,
    }));

    return { success: true, data: enrichedRequests };
  } catch (error) {
    console.error("Failed to fetch requests:", error);
    return { success: false, error: "Failed to fetch requests" };
  }
}

// GET: Fetch single request with full conversation
export async function getRequest(id: string) {
  try {
    const { company, user } = await getCurrentUserAndCompany();

    const request = await prisma.request.findFirst({
      where: {
        id,
        OR: [{ clientId: company.id }, { vendorId: company.id }],
      },
      include: {
        listing: {
          include: {
            developer: {
              include: {
                skills: { include: { skill: true } },
              },
            },
          },
        },
        client: { select: { id: true, name: true, slug: true, logoUrl: true } },
        vendor: { select: { id: true, name: true, slug: true, logoUrl: true } },
        conversation: {
          include: {
            messages: {
              include: {
                sender: {
                  select: { id: true, fullName: true, avatarUrl: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        timesheets: {
          orderBy: { weekStart: "desc" },
        },
        rating: {
          include: {
            fromCompany: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!request) return { success: false, error: "Request not found" };

    // Map timesheets to legacy format for backward compatibility and convert Decimals
    const mappedTimesheets = request.timesheets.map((ts) => ({
      id: ts.id,
      weekStart: ts.weekStart,
      hours: Number(ts.totalHours), // Convert Decimal to number
      description: null as string | null,
      status: ts.status.toLowerCase(), // Convert enum to lowercase string
      createdAt: ts.createdAt,
    }));

    return {
      success: true,
      data: {
        ...request,
        agreedRate: request.agreedRate ? Number(request.agreedRate) : null,
        listing: {
          ...request.listing,
          hourlyRate: Number(request.listing.hourlyRate),
        },
        timesheets: mappedTimesheets,
        role: request.clientId === company.id ? "client" : "vendor",
        counterparty:
          request.clientId === company.id ? request.vendor : request.client,
        currentUserId: user.id,
      },
    };
  } catch (error) {
    console.error("Failed to fetch request:", error);
    return { success: false, error: "Failed to fetch request" };
  }
}

// CREATE: Send engagement request
export async function createRequest(input: CreateRequestInput) {
  try {
    const validatedData = createRequestSchema.parse(input);
    const { company, user } = await getCurrentUserAndCompany();

    // Get listing and verify it's from another company
    const listing = await prisma.listing.findUnique({
      where: { id: validatedData.listingId },
      include: { developer: true },
    });

    if (!listing) return { success: false, error: "Listing not found" };
    if (listing.developer.companyId === company.id) {
      return { success: false, error: "Cannot request your own listing" };
    }

    // Create request with conversation
    const request = await prisma.request.create({
      data: {
        listingId: validatedData.listingId,
        clientId: company.id,
        vendorId: listing.developer.companyId,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        agreedRate: listing.hourlyRate,
        conversation: {
          create: {
            messages: {
              create: {
                senderId: user.id,
                content: validatedData.message,
              },
            },
          },
        },
      },
    });

    // Notify vendor company users about the new request
    const vendorCompany = await prisma.company.findUnique({
      where: { id: listing.developer.companyId },
      include: { users: true },
    });

    if (vendorCompany) {
      await prisma.notification.createMany({
        data: vendorCompany.users.map((vendorUser) => ({
          userId: vendorUser.id,
          title: "New Engagement Request",
          message: `${company.name} has requested to engage ${listing.developer.pseudonym || "your developer"}`,
          link: `/dashboard/requests/${request.id}`,
        })),
      });
    }

    revalidatePath("/dashboard/requests");
    revalidatePath("/dashboard/market");
    return { success: true, data: request };
  } catch (error) {
    console.error("Failed to create request:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to create request" };
  }
}

// UPDATE: Update request status
export async function updateRequestStatus(id: string, status: RequestStatus) {
  try {
    const { company } = await getCurrentUserAndCompany();

    // Verify access
    const existing = await prisma.request.findFirst({
      where: {
        id,
        OR: [{ clientId: company.id }, { vendorId: company.id }],
      },
    });
    if (!existing) return { success: false, error: "Request not found" };

    // Vendors can accept/reject, both can cancel
    const isVendor = existing.vendorId === company.id;
    const allowedTransitions: Record<RequestStatus, RequestStatus[]> = {
      PENDING: isVendor
        ? [
            RequestStatus.OFFER_SENT,
            RequestStatus.ACCEPTED,
            RequestStatus.REJECTED,
            RequestStatus.NEGOTIATING,
          ]
        : [RequestStatus.CANCELLED],
      NEGOTIATING: [
        RequestStatus.OFFER_SENT,
        RequestStatus.CANCELLED,
        RequestStatus.REJECTED,
      ],
      OFFER_SENT: [
        RequestStatus.ACCEPTED,
        RequestStatus.REJECTED,
        RequestStatus.CANCELLED,
      ],
      ACCEPTED: [RequestStatus.IN_PROGRESS, RequestStatus.CANCELLED],
      IN_PROGRESS: [RequestStatus.COMPLETED, RequestStatus.CANCELLED],
      REJECTED: [],
      CANCELLED: [],
      COMPLETED: [],
    };

    if (!allowedTransitions[existing.status].includes(status)) {
      return { success: false, error: "Invalid status transition" };
    }

    const request = await prisma.request.update({
      where: { id },
      data: { status },
      include: {
        client: { include: { users: true } },
        vendor: { include: { users: true } },
      },
    });

    // Notify the other party about the status change
    const otherCompany = isVendor ? request.client : request.vendor;
    const statusMessages: Record<string, { title: string; message: string }> = {
      NEGOTIATING: {
        title: "Request in Negotiation",
        message: `Your engagement request is now being negotiated by ${company.name}`,
      },
      OFFER_SENT: {
        title: "Offer Sent",
        message: `${company.name} has sent you an offer`,
      },
      ACCEPTED: {
        title: "Request Accepted! 🎉",
        message: `Your engagement request has been accepted by ${company.name}`,
      },
      REJECTED: {
        title: "Request Declined",
        message: `Your engagement request was declined by ${company.name}`,
      },
      CANCELLED: {
        title: "Request Cancelled",
        message: `The engagement request was cancelled by ${company.name}`,
      },
      COMPLETED: {
        title: "Engagement Completed",
        message: `The engagement with ${company.name} has been marked as completed`,
      },
    };

    const notification = statusMessages[status];
    if (notification && otherCompany.users.length > 0) {
      await prisma.notification.createMany({
        data: otherCompany.users.map((u) => ({
          userId: u.id,
          title: notification.title,
          message: notification.message,
          link: `/dashboard/requests/${id}`,
        })),
      });
    }

    revalidatePath("/dashboard/requests");
    revalidatePath(`/dashboard/requests/${id}`);
    return { success: true, data: request };
  } catch (error) {
    console.error("Failed to update request status:", error);
    return { success: false, error: "Failed to update request" };
  }
}

// Validation schema for offer
const sendOfferSchema = z.object({
  requestId: z.string().uuid("Invalid request"),
  offeredRate: z.number().positive("Rate must be positive"),
  offeredStartDate: z.string().transform((s) => new Date(s)),
  offeredEndDate: z.string().transform((s) => new Date(s)),
  offerNotes: z.string().optional(),
});

export type SendOfferInput = z.input<typeof sendOfferSchema>;

// SEND OFFER: Vendor sends offer with rate and dates
export async function sendOffer(input: SendOfferInput) {
  try {
    const { company } = await getCurrentUserAndCompany();
    const data = sendOfferSchema.parse(input);

    // Verify vendor access
    const existing = await prisma.request.findFirst({
      where: {
        id: data.requestId,
        vendorId: company.id,
        status: { in: ["PENDING", "NEGOTIATING"] },
      },
      include: {
        client: { include: { users: true } },
      },
    });

    if (!existing) {
      return {
        success: false,
        error: "Request not found or not in valid state",
      };
    }

    // Update request with offer details
    const request = await prisma.request.update({
      where: { id: data.requestId },
      data: {
        status: "OFFER_SENT",
        offeredRate: data.offeredRate,
        offeredStartDate: data.offeredStartDate,
        offeredEndDate: data.offeredEndDate,
        offerNotes: data.offerNotes || null,
        offerSentAt: new Date(),
      },
    });

    // Notify client
    if (existing.client.users.length > 0) {
      await prisma.notification.createMany({
        data: existing.client.users.map((u) => ({
          userId: u.id,
          title: "Offer Received! 📋",
          message: `${company.name} has sent you an offer for their developer`,
          link: `/dashboard/requests/${data.requestId}`,
        })),
      });
    }

    revalidatePath("/dashboard/requests");
    revalidatePath(`/dashboard/requests/${data.requestId}`);
    return { success: true, data: request };
  } catch (error) {
    console.error("Failed to send offer:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to send offer" };
  }
}

// REVISE OFFER: Vendor can revise offer (rollback to NEGOTIATING)
export async function reviseOffer(requestId: string) {
  try {
    const { company } = await getCurrentUserAndCompany();

    // Verify vendor access and current state
    const existing = await prisma.request.findFirst({
      where: {
        id: requestId,
        vendorId: company.id,
        status: "OFFER_SENT",
      },
      include: {
        client: { include: { users: true } },
      },
    });

    if (!existing) {
      return {
        success: false,
        error: "Request not found or cannot be revised",
      };
    }

    // Clear offer data and return to negotiating
    const request = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "NEGOTIATING",
        offeredRate: null,
        offeredStartDate: null,
        offeredEndDate: null,
        offerNotes: null,
        offerSentAt: null,
      },
    });

    // Notify client
    if (existing.client.users.length > 0) {
      await prisma.notification.createMany({
        data: existing.client.users.map((u) => ({
          userId: u.id,
          title: "Offer Revised",
          message: `${company.name} is revising their offer`,
          link: `/dashboard/requests/${requestId}`,
        })),
      });
    }

    revalidatePath("/dashboard/requests");
    revalidatePath(`/dashboard/requests/${requestId}`);
    return { success: true, data: request };
  } catch (error) {
    console.error("Failed to revise offer:", error);
    return { success: false, error: "Failed to revise offer" };
  }
}

// SEND MESSAGE: Add message to conversation
export async function sendMessage(requestId: string, content: string) {
  try {
    const { company, user } = await getCurrentUserAndCompany();

    // Verify access and get request details
    const request = await prisma.request.findFirst({
      where: {
        id: requestId,
        OR: [{ clientId: company.id }, { vendorId: company.id }],
      },
      include: {
        conversation: true,
        client: { include: { users: true } },
        vendor: { include: { users: true } },
      },
    });

    if (!request) return { success: false, error: "Request not found" };
    if (!request.conversation) {
      return { success: false, error: "No conversation found" };
    }

    const message = await prisma.message.create({
      data: {
        conversationId: request.conversation.id,
        senderId: user.id,
        content,
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: request.conversation.id },
      data: { updatedAt: new Date() },
    });

    // Notify the other party about the new message
    const isClient = request.clientId === company.id;
    const otherCompany = isClient ? request.vendor : request.client;
    const otherUsers = otherCompany.users.filter((u) => u.id !== user.id);

    if (otherUsers.length > 0) {
      await prisma.notification.createMany({
        data: otherUsers.map((u) => ({
          userId: u.id,
          title: "New Message",
          message: `${user.fullName || "Someone"} sent a message in your engagement request`,
          link: `/dashboard/requests/${requestId}`,
        })),
      });
    }

    revalidatePath(`/dashboard/requests/${requestId}`);
    return { success: true, data: message };
  } catch (error) {
    console.error("Failed to send message:", error);
    return { success: false, error: "Failed to send message" };
  }
}

// Helper: Get request counts by status for tabs
export async function getRequestCounts() {
  try {
    const { company } = await getCurrentUserAndCompany();

    const counts = await prisma.request.groupBy({
      by: ["status"],
      where: {
        OR: [{ clientId: company.id }, { vendorId: company.id }],
      },
      _count: true,
    });

    const result = {
      all: 0,
      pending: 0,
      active: 0,
      completed: 0,
    };

    for (const count of counts) {
      result.all += count._count;
      if (count.status === "PENDING") result.pending += count._count;
      if (["ACCEPTED", "IN_PROGRESS"].includes(count.status)) {
        result.active += count._count;
      }
      if (count.status === "COMPLETED") result.completed += count._count;
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to get request counts:", error);
    return { success: false, error: "Failed to get counts" };
  }
}
