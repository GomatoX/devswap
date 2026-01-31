import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET to .env");
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    const {
      id,
      email_addresses,
      first_name,
      last_name,
      image_url,
      unsafe_metadata,
    } = evt.data;

    const email = email_addresses[0]?.email_address;
    const fullName = [first_name, last_name].filter(Boolean).join(" ") || null;

    // Get company info from unsafe_metadata (passed during signup)
    const companyName =
      (unsafe_metadata?.companyName as string) ||
      `${fullName || email}'s Company`;
    const registrationCode =
      (unsafe_metadata?.registrationCode as string) || `REG-${Date.now()}`;
    const termsAccepted = unsafe_metadata?.termsAccepted as boolean;
    const termsVersion = (unsafe_metadata?.termsVersion as string) || "v1.0";

    // Create company first
    const company = await prisma.company.create({
      data: {
        name: companyName,
        slug: slugify(companyName) + "-" + Date.now().toString(36),
        registrationCode,
        status: "PENDING_VERIFICATION",
      },
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        clerkId: id,
        email,
        fullName,
        avatarUrl: image_url,
        role: "COMPANY_ADMIN",
        companyId: company.id,
      },
    });

    // Record terms acceptance if provided
    if (termsAccepted) {
      await prisma.termsAcceptance.create({
        data: {
          userId: user.id,
          version: termsVersion,
          ipAddress: headerPayload.get("x-forwarded-for") || "unknown",
        },
      });
    }

    console.log(`Created user ${user.id} with company ${company.id}`);
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const email = email_addresses[0]?.email_address;
    const fullName = [first_name, last_name].filter(Boolean).join(" ") || null;

    await prisma.user.update({
      where: { clerkId: id },
      data: {
        email,
        fullName,
        avatarUrl: image_url,
      },
    });
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (id) {
      await prisma.user.delete({
        where: { clerkId: id },
      });
    }
  }

  return new Response("", { status: 200 });
}
