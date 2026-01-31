import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
  // Developer profile photo
  // awaitServerData: false returns URL to client immediately without waiting for onUploadComplete
  // This is needed in dev mode where Uploadthing can't callback to localhost
  developerPhoto: f(
    { image: { maxFileSize: "4MB", maxFileCount: 1 } },
    { awaitServerData: false },
  )
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Photo uploaded by:", metadata.userId);
      console.log("File URL:", file.ufsUrl);
      return { url: file.ufsUrl };
    }),

  // Developer CV/Resume
  developerCV: f(
    {
      pdf: { maxFileSize: "8MB", maxFileCount: 1 },
      "application/msword": { maxFileSize: "8MB", maxFileCount: 1 },
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        {
          maxFileSize: "8MB",
          maxFileCount: 1,
        },
    },
    { awaitServerData: false },
  )
    .middleware(async () => {
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("CV uploaded by:", metadata.userId);
      console.log("File URL:", file.ufsUrl);
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
