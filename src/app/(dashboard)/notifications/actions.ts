"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) throw new Error("User not found");
  return user;
}

// Get all notifications for current user
export async function getNotifications() {
  try {
    const user = await getCurrentUser();

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });

    return { success: true, data: notifications, unreadCount };
  } catch (error) {
    console.error("Failed to get notifications:", error);
    return { success: false, error: "Failed to load notifications" };
  }
}

// Mark notification as read
export async function markAsRead(notificationId: string) {
  try {
    const user = await getCurrentUser();

    await prisma.notification.updateMany({
      where: { id: notificationId, userId: user.id },
      data: { isRead: true },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return { success: false, error: "Failed to update notification" };
  }
}

// Mark all notifications as read
export async function markAllAsRead() {
  try {
    const user = await getCurrentUser();

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark all as read:", error);
    return { success: false, error: "Failed to update notifications" };
  }
}

// Create a notification (to be called from other places in the app)
export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        link: data.link,
      },
    });

    return { success: true, data: notification };
  } catch (error) {
    console.error("Failed to create notification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string) {
  try {
    const user = await getCurrentUser();

    await prisma.notification.deleteMany({
      where: { id: notificationId, userId: user.id },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return { success: false, error: "Failed to delete notification" };
  }
}
