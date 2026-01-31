"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Clock, Check, X, Plus } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { toast } from "sonner";
import {
  createTimesheet,
  approveTimesheet,
  rejectTimesheet,
} from "./timesheet-actions";

type Timesheet = {
  id: string;
  weekStart: Date | string;
  hours: number | { toString: () => string };
  description: string | null;
  status: string;
  createdAt: Date | string;
};

type TimesheetsPanelProps = {
  requestId: string;
  timesheets: Timesheet[];
  role: "client" | "vendor";
  requestStatus: string;
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500" },
  approved: { label: "Approved", color: "bg-green-500" },
  rejected: { label: "Rejected", color: "bg-red-500" },
};

export function TimesheetsPanel({
  requestId,
  timesheets,
  role,
  requestStatus,
}: TimesheetsPanelProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const canLogTime = role === "vendor" && requestStatus === "ACCEPTED";
  const canApprove = role === "client";

  const totalHours = timesheets.reduce((sum, ts) => {
    const hours =
      typeof ts.hours === "number" ? ts.hours : parseFloat(ts.hours.toString());
    return sum + hours;
  }, 0);

  const approvedHours = timesheets
    .filter((ts) => ts.status === "approved")
    .reduce((sum, ts) => {
      const hours =
        typeof ts.hours === "number"
          ? ts.hours
          : parseFloat(ts.hours.toString());
      return sum + hours;
    }, 0);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    const result = await approveTimesheet(id);
    if (result.success) {
      toast.success("Timesheet approved");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to approve");
    }
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    const result = await rejectTimesheet(id);
    if (result.success) {
      toast.success("Timesheet rejected");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to reject");
    }
    setProcessing(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Timesheets</CardTitle>
            <CardDescription>
              {approvedHours}h approved / {totalHours}h total
            </CardDescription>
          </div>
          {canLogTime && (
            <LogTimesheetDialog
              requestId={requestId}
              open={dialogOpen}
              onOpenChange={setDialogOpen}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {timesheets.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No timesheets logged yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {timesheets.map((ts) => {
              const hours =
                typeof ts.hours === "number"
                  ? ts.hours
                  : parseFloat(ts.hours.toString());
              const status = statusConfig[ts.status] || statusConfig.pending;
              const weekStart = new Date(ts.weekStart);
              const weekEnd = addDays(weekStart, 6);

              return (
                <div
                  key={ts.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{hours}h</span>
                      <Badge
                        variant="secondary"
                        className={`${status.color} text-white text-xs`}
                      >
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(weekStart, "MMM d")} -{" "}
                      {format(weekEnd, "MMM d, yyyy")}
                    </p>
                    {ts.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {ts.description}
                      </p>
                    )}
                  </div>

                  {canApprove && ts.status === "pending" && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleApprove(ts.id)}
                        disabled={processing === ts.id}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(ts.id)}
                        disabled={processing === ts.id}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LogTimesheetDialog({
  requestId,
  open,
  onOpenChange,
}: {
  requestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    weekStart: format(
      startOfWeek(new Date(), { weekStartsOn: 1 }),
      "yyyy-MM-dd",
    ),
    hours: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hours) {
      toast.error("Please enter hours worked");
      return;
    }

    setLoading(true);
    const result = await createTimesheet({
      requestId,
      weekStart: formData.weekStart,
      hours: parseFloat(formData.hours),
      description: formData.description || undefined,
    });

    if (result.success) {
      toast.success("Timesheet logged");
      onOpenChange(false);
      setFormData({
        weekStart: format(
          startOfWeek(new Date(), { weekStartsOn: 1 }),
          "yyyy-MM-dd",
        ),
        hours: "",
        description: "",
      });
      router.refresh();
    } else {
      toast.error(result.error || "Failed to log timesheet");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Log Time
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Timesheet</DialogTitle>
          <DialogDescription>
            Record hours worked for a specific week.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weekStart">Week Starting</Label>
            <Input
              id="weekStart"
              type="date"
              value={formData.weekStart}
              onChange={(e) =>
                setFormData({ ...formData, weekStart: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Hours Worked *</Label>
            <Input
              id="hours"
              type="number"
              step="0.5"
              min="0.5"
              max="80"
              placeholder="40"
              value={formData.hours}
              onChange={(e) =>
                setFormData({ ...formData, hours: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What did you work on this week?"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Logging..." : "Log Timesheet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
