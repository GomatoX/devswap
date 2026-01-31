import { auth, clerkClient } from "@clerk/nextjs/server";

// Check if current user is a platform admin
export async function isAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user.publicMetadata?.isAdmin === true;
  } catch {
    return false;
  }
}

// Get admin status for current user (with user info)
export async function getAdminStatus() {
  const { userId } = await auth();
  if (!userId) return { isAdmin: false, userId: null };

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return {
      isAdmin: user.publicMetadata?.isAdmin === true,
      userId,
      email: user.emailAddresses[0]?.emailAddress,
    };
  } catch {
    return { isAdmin: false, userId };
  }
}

// Helper to require admin access (throws if not admin)
export async function requireAdmin() {
  const adminStatus = await getAdminStatus();
  if (!adminStatus.isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }
  return adminStatus;
}

// Set user as admin (for initial setup - run manually or via admin action)
export async function setUserAsAdmin(userId: string, isAdminFlag: boolean) {
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      isAdmin: isAdminFlag,
    },
  });
}
