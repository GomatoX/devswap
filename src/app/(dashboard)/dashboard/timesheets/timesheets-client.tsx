"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, startOfWeek, addDays } from "date-fns";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  Plus,
  MoreVertical,
  Send,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  createTimesheet,
  submitTimesheet,
  updateTimesheetStatus,
  getActiveContracts,
} from "./actions";

type TimesheetEntry = {
  id: string;
  date: Date | string;
  hours: number;
  description: string | null;
};

type Timesheet = {
  id: string;
  weekStart: Date | string;
  weekEnd: Date | string;
  totalHours: number;
  status: string;
  submittedAt: Date | string | null;
  approvedAt: Date | string | null;
  rejectionReason: string | null;
  entries: TimesheetEntry[];
  contract: {
    id: string;
    title: string;
    hourlyRate: number;
    request: {
      client: { id: string; name: string };
      vendor: { id: string; name: string };
      listing: {
        developer: { pseudonym: string };
      };
    };
  };
};

type ActiveContract = {
  id: string;
  title: string;
  hourlyRate: number;
  request: {
    listing: { developer: { pseudonym: string } };
    client: { name: string };
    vendor: { name: string };
  };
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500",
  SUBMITTED: "bg-blue-500",
  APPROVED: "bg-green-500",
  REJECTED: "bg-red-500",
};

export function TimesheetsClient({
  timesheets,
  currentCompanyId,
}: {
  timesheets: Timesheet[];
  currentCompanyId: string;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [contracts, setContracts] = useState<ActiveContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState("");
  const [weekStart, setWeekStart] = useState(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"),
  );
  const [entries, setEntries] = useState<
    { hours: string; description: string }[]
  >(Array(5).fill({ hours: "8", description: "" }));

  const loadContracts = async () => {
    const result = await getActiveContracts();
    if (result.success && result.data) {
      setContracts(result.data);
    }
  };

  const handleOpenCreate = async () => {
    await loadContracts();
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractId) {
      toast.error("Please select a contract");
      return;
    }

    setLoading(true);
    const weekStartDate = new Date(weekStart);
    const formattedEntries = entries.map((entry, index) => ({
      date: format(addDays(weekStartDate, index), "yyyy-MM-dd"),
      hours: parseFloat(entry.hours) || 0,
      description: entry.description || undefined,
    }));

    const result = await createTimesheet({
      contractId: selectedContractId,
      weekStart,
      entries: formattedEntries.filter((e) => e.hours > 0),
    });

    if (result.success) {
      toast.success("Timesheet created!");
      setCreateOpen(false);
      setSelectedContractId("");
      setEntries(Array(5).fill({ hours: "8", description: "" }));
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create timesheet");
    }
    setLoading(false);
  };

  const handleSubmit = async (id: string) => {
    const result = await submitTimesheet(id);
    if (result.success) {
      toast.success("Timesheet submitted for approval");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to submit");
    }
  };

  const handleApprove = async (id: string) => {
    const result = await updateTimesheetStatus(id, "APPROVED");
    if (result.success) {
      toast.success("Timesheet approved");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to approve");
    }
  };

  const handleReject = async (id: string) => {
    const result = await updateTimesheetStatus(
      id,
      "REJECTED",
      "Needs revision",
    );
    if (result.success) {
      toast.info("Timesheet rejected");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to reject");
    }
  };

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timesheets</h1>
          <p className="text-muted-foreground">
            Track and approve working hours
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Timesheet
        </Button>
      </div>

      {/* Timesheets List */}
      {timesheets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No timesheets yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Create timesheets from active contracts to track hours.
            </p>
            <Button onClick={handleOpenCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create First Timesheet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {timesheets.map((ts) => {
            const isVendor = ts.contract.request.vendor.id === currentCompanyId;
            const canApprove = !isVendor && ts.status === "SUBMITTED";

            return (
              <Card key={ts.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="h-4 w-4" />
                        Week of {format(new Date(ts.weekStart), "MMM d, yyyy")}
                        <Badge className={statusColors[ts.status]}>
                          {ts.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {ts.contract.request.listing.developer.pseudonym} -{" "}
                        {ts.contract.title}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {ts.status === "DRAFT" && isVendor && (
                          <DropdownMenuItem onClick={() => handleSubmit(ts.id)}>
                            <Send className="mr-2 h-4 w-4" />
                            Submit for Approval
                          </DropdownMenuItem>
                        )}
                        {canApprove && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleApprove(ts.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleReject(ts.id)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      {ts.entries.map((entry) => (
                        <div key={entry.id} className="text-center">
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(entry.date), "EEE")}
                          </div>
                          <div className="font-medium">{entry.hours}h</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{ts.totalHours}h</div>
                      <div className="text-sm text-muted-foreground">
                        €
                        {(
                          ts.totalHours * ts.contract.hourlyRate
                        ).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {ts.rejectionReason && (
                    <p className="mt-2 text-sm text-red-600">
                      Rejection reason: {ts.rejectionReason}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Timesheet Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Timesheet</DialogTitle>
            <DialogDescription>Log your hours for the week</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Contract *</Label>
              <Select
                value={selectedContractId}
                onValueChange={setSelectedContractId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contract" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No active contracts
                    </SelectItem>
                  ) : (
                    contracts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.request.listing.developer.pseudonym} - {c.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Week Starting</Label>
              <Input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Hours per Day</Label>
              <div className="grid grid-cols-5 gap-2">
                {days.map((day, index) => (
                  <div key={day} className="space-y-1">
                    <span className="text-xs text-center block">{day}</span>
                    <Input
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                      value={entries[index].hours}
                      onChange={(e) => {
                        const newEntries = [...entries];
                        newEntries[index] = {
                          ...newEntries[index],
                          hours: e.target.value,
                        };
                        setEntries(newEntries);
                      }}
                      className="text-center"
                    />
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Timesheet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
