import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ListingDetailClient } from "./listing-detail-client";

async function getListing(id: string) {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });

  const listing = await prisma.listing.findUnique({
    where: { id },
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
              description: true,
            },
          },
        },
      },
    },
  });

  if (!listing) return null;

  // Serialize Decimal to number for client component
  const serializedListing = {
    ...listing,
    hourlyRate: Number(listing.hourlyRate),
  };

  return { listing: serializedListing, currentCompanyId: user?.companyId };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const result = await getListing(id);

  if (!result?.listing) {
    notFound();
  }

  return (
    <ListingDetailClient
      listing={result.listing}
      isOwnListing={
        result.listing.developer.company.id === result.currentCompanyId
      }
    />
  );
}
