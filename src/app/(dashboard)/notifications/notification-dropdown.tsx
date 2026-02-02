"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "./actions";

type Notification = {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date | string;
};

export function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  const fetchNotifications = useCallback(async () => {
    const result = await getNotifications();
    if (result.success && result.data) {
      setNotifications(result.data);
      setUnreadCount(result.unreadCount || 0);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    let isMounted = true;
    const doFetch = async () => {
      if (isMounted) {
        await fetchNotifications();
      }
    };
    void doFetch();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => void fetchNotifications(), 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const handleMarkAsRead = (
    e: React.MouseEvent,
    notificationId: string,
    wasUnread: boolean,
  ) => {
    e.stopPropagation();
    if (!wasUnread) return;

    startTransition(async () => {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    });
  };

  const handleDelete = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    startTransition(async () => {
      await deleteNotification(notificationId);
      const wasUnread = !notifications.find((n) => n.id === notificationId)
        ?.isRead;
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      startTransition(async () => {
        await markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      });
    }
    if (notification.link) {
      router.push(notification.link);
      setOpen(false);
    }
  };

  // Show only 3 most recent notifications in dropdown
  const recentNotifications = notifications.slice(0, 3);
  const hasMore = notifications.length > 3;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
              disabled={isPending}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {recentNotifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`relative p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                  !notification.isRead ? "bg-primary/5" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  {/* Unread indicator */}
                  <div className="pt-1.5">
                    {!notification.isRead ? (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    ) : (
                      <div className="h-2 w-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        !notification.isRead
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>

                  {/* Actions - always visible, compact layout */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) =>
                          handleMarkAsRead(e, notification.id, true)
                        }
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDelete(e, notification.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View all link */}
        <div className="border-t p-2">
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block w-full text-center text-sm text-muted-foreground hover:text-foreground py-2 rounded-md hover:bg-muted/50 transition-colors"
          >
            {hasMore
              ? `View all notifications (${notifications.length})`
              : "View all notifications"}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
