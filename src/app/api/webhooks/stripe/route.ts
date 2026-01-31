import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { SubscriptionTier, SubscriptionStatus } from "@prisma/client";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const companyId = session.metadata?.companyId;
        const type = session.metadata?.type;

        if (companyId && type === "SUBSCRIPTION") {
          // Subscription checkout completed
          const subscriptionId = session.subscription as string;

          await prisma.company.update({
            where: { id: companyId },
            data: {
              subscriptionStatus: "ACTIVE" as SubscriptionStatus,
              subscriptionTier: "BUYER" as SubscriptionTier,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscriptionId,
            },
          });
          console.log(`Company ${companyId} subscription activated`);
        } else if (type === "MATCHMAKING_FEE") {
          // Matchmaking fee paid - finalize the deal!
          const requestId = session.metadata?.requestId;
          const buyerCompanyId = session.metadata?.companyId;
          const vendorId = session.metadata?.vendorId;
          const listingId = session.metadata?.listingId;

          if (requestId && buyerCompanyId) {
            // Get the request with conversation
            const request = await prisma.request.findUnique({
              where: { id: requestId },
              include: {
                conversation: true,
                vendor: {
                  select: {
                    contactEmail: true,
                    contactPhone: true,
                    name: true,
                  },
                },
              },
            });

            if (request) {
              // 1. Update request status to ACCEPTED
              await prisma.request.update({
                where: { id: requestId },
                data: { status: "ACCEPTED" },
              });

              // 2. Mark listing as BOOKED
              if (listingId) {
                await prisma.listing.update({
                  where: { id: listingId },
                  data: { status: "BOOKED" },
                });
              }

              // 3. Send system message revealing contacts
              if (request.conversation) {
                const vendorContacts = [];
                if (request.vendor.contactEmail)
                  vendorContacts.push(`Email: ${request.vendor.contactEmail}`);
                if (request.vendor.contactPhone)
                  vendorContacts.push(`Phone: ${request.vendor.contactPhone}`);

                const contactInfo =
                  vendorContacts.length > 0
                    ? vendorContacts.join("\n")
                    : `Company: ${request.vendor.name}`;

                await prisma.message.create({
                  data: {
                    conversationId: request.conversation.id,
                    content: `🎉 Payment received! Deal finalized.\n\n📇 Vendor Contact Information:\n${contactInfo}\n\nYou can now communicate off-platform. Congratulations on your new engagement!`,
                    // System message - no sender
                  },
                });
              }

              // 4. Decrement founding member deals if applicable
              const buyerCompany = await prisma.company.findUnique({
                where: { id: buyerCompanyId },
              });

              if (
                buyerCompany?.isFoundingMember &&
                buyerCompany.foundingDealsRemaining > 0
              ) {
                await prisma.company.update({
                  where: { id: buyerCompanyId },
                  data: {
                    foundingDealsRemaining:
                      buyerCompany.foundingDealsRemaining - 1,
                  },
                });
              }

              console.log(
                `Matchmaking fee paid - deal finalized for request ${requestId}`,
              );
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const companyId = subscription.metadata?.companyId;

        if (companyId) {
          let status: SubscriptionStatus = "INACTIVE";

          if (subscription.status === "active") {
            status = "ACTIVE";
          } else if (subscription.status === "past_due") {
            status = "PAST_DUE";
          } else if (
            subscription.status === "canceled" ||
            subscription.status === "unpaid"
          ) {
            status = "CANCELLED";
          }

          await prisma.company.update({
            where: { id: companyId },
            data: {
              subscriptionStatus: status,
              subscriptionEndsAt: new Date(
                (subscription as unknown as { current_period_end: number })
                  .current_period_end * 1000,
              ),
            },
          });
          console.log(`Company ${companyId} subscription updated to ${status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const companyId = subscription.metadata?.companyId;

        if (companyId) {
          await prisma.company.update({
            where: { id: companyId },
            data: {
              subscriptionStatus: "CANCELLED" as SubscriptionStatus,
              subscriptionTier: "FREE" as SubscriptionTier,
              subscriptionEndsAt: null,
              stripeSubscriptionId: null,
            },
          });
          console.log(`Company ${companyId} subscription cancelled`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`Payment succeeded for invoice ${invoice.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as { subscription?: string })
          .subscription;

        if (subscriptionId) {
          // Find company by subscription and mark as past due
          const company = await prisma.company.findFirst({
            where: { stripeSubscriptionId: subscriptionId },
          });

          if (company) {
            await prisma.company.update({
              where: { id: company.id },
              data: { subscriptionStatus: "PAST_DUE" as SubscriptionStatus },
            });
          }
        }
        console.log(`Payment failed for invoice ${invoice.id}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
}
