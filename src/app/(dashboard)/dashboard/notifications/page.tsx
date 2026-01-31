import { getNotifications } from "@/app/(dashboard)/notifications/actions";
import { NotificationsClient } from "./notifications-client";

export default async function NotificationsPage() {
  const result = await getNotifications();

  const notifications =
    result.success && result.data
      ? result.data.map((n) => ({
          ...n,
          createdAt: n.createdAt.toString(),
        }))
      : [];

  return <NotificationsClient notifications={notifications} />;
}
