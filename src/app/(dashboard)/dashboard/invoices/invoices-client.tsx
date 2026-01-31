"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Receipt,
  Plus,
  MoreVertical,
  Send,
  CheckCircle,
  Building2,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import {
  createInvoice,
  updateInvoiceStatus,
  getInvoiceableContracts,
} from "./actions";

type Invoice = {
  id: string;
  number: string;
  amount: number;
  currency: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  status: string;
  dueDate: Date | string | null;
  sentAt: Date | string | null;
  paidAt: Date | string | null;
  lineItems: unknown;
  contract: {
    id: string;
    title: string;
    hourlyRate: number;
    request: {
      client: { id: string; name: string };
      vendor: { id: string; name: string };
      listing: { developer: { pseudonym: string } };
    };
  };
};

type InvoiceableContract = {
  id: string;
  title: string;
  hourlyRate: number;
  request: {
    client: { name: string };
    listing: { developer: { pseudonym: string } };
  };
  timesheets: Array<{
    id: string;
    weekStart: Date | string;
    totalHours: number;
  }>;
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500",
  SENT: "bg-blue-500",
  PAID: "bg-green-500",
  OVERDUE: "bg-red-500",
  CANCELLED: "bg-gray-400",
};

export function InvoicesClient({
  invoices,
  currentCompanyId,
}: {
  invoices: Invoice[];
  currentCompanyId: string;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [contracts, setContracts] = useState<InvoiceableContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState("");
  const [selectedTimesheets, setSelectedTimesheets] = useState<string[]>([]);

  const selectedContract = contracts.find((c) => c.id === selectedContractId);

  const loadContracts = async () => {
    const result = await getInvoiceableContracts();
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
    if (!selectedContractId || selectedTimesheets.length === 0) {
      toast.error("Please select a contract and at least one timesheet");
      return;
    }

    setLoading(true);
    const result = await createInvoice({
      contractId: selectedContractId,
      timesheetIds: selectedTimesheets,
    });

    if (result.success) {
      toast.success("Invoice created!");
      setCreateOpen(false);
      setSelectedContractId("");
      setSelectedTimesheets([]);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create invoice");
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (
    invoiceId: string,
    status: "SENT" | "PAID",
  ) => {
    const result = await updateInvoiceStatus(invoiceId, status);
    if (result.success) {
      toast.success(`Invoice marked as ${status.toLowerCase()}`);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update invoice");
    }
  };

  const toggleTimesheet = (id: string) => {
    setSelectedTimesheets((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const calculateTotal = () => {
    if (!selectedContract) return 0;
    const hours = selectedContract.timesheets
      .filter((ts) => selectedTimesheets.includes(ts.id))
      .reduce((acc, ts) => acc + ts.totalHours, 0);
    return hours * selectedContract.hourlyRate;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Generate and track payment invoices
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Create invoices from approved timesheets to request payment.
            </p>
            <Button onClick={handleOpenCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create First Invoice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invoices.map((inv) => {
            const isVendor =
              inv.contract.request.vendor.id === currentCompanyId;

            return (
              <Card key={inv.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Receipt className="h-4 w-4" />
                        {inv.number}
                        <Badge className={statusColors[inv.status]}>
                          {inv.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Building2 className="h-3 w-3" />
                        {inv.contract.request.client.name} -{" "}
                        {inv.contract.request.listing.developer.pseudonym}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {inv.status === "DRAFT" && isVendor && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(inv.id, "SENT")}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send Invoice
                          </DropdownMenuItem>
                        )}
                        {(inv.status === "SENT" ||
                          inv.status === "OVERDUE") && (
                          <DropdownMenuItem
                            onClick={() => handleStatusUpdate(inv.id, "PAID")}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Paid
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Period</span>
                      <p className="font-medium">
                        {format(new Date(inv.periodStart), "MMM d")} -{" "}
                        {format(new Date(inv.periodEnd), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Amount</span>
                      <p className="font-medium text-lg flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {inv.amount.toLocaleString()} {inv.currency}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due Date</span>
                      <p className="font-medium">
                        {inv.dueDate
                          ? format(new Date(inv.dueDate), "MMM d, yyyy")
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        {inv.paidAt ? "Paid On" : "Sent On"}
                      </span>
                      <p className="font-medium">
                        {inv.paidAt
                          ? format(new Date(inv.paidAt), "MMM d, yyyy")
                          : inv.sentAt
                            ? format(new Date(inv.sentAt), "MMM d, yyyy")
                            : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>
              Select approved timesheets to invoice
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Contract *</Label>
              <Select
                value={selectedContractId}
                onValueChange={(value) => {
                  setSelectedContractId(value);
                  setSelectedTimesheets([]);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contract" />
                </SelectTrigger>
                <SelectContent>
                  {contracts.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No invoiceable contracts
                    </SelectItem>
                  ) : (
                    contracts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.request.listing.developer.pseudonym} -{" "}
                        {c.request.client.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedContract && (
              <div className="space-y-2">
                <Label>Select Timesheets</Label>
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {selectedContract.timesheets.map((ts) => (
                    <div
                      key={ts.id}
                      className="flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={ts.id}
                          checked={selectedTimesheets.includes(ts.id)}
                          onCheckedChange={() => toggleTimesheet(ts.id)}
                        />
                        <label
                          htmlFor={ts.id}
                          className="text-sm cursor-pointer"
                        >
                          Week of{" "}
                          {format(new Date(ts.weekStart), "MMM d, yyyy")}
                        </label>
                      </div>
                      <span className="text-sm font-medium">
                        {ts.totalHours}h = €
                        {(
                          ts.totalHours * selectedContract.hourlyRate
                        ).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTimesheets.length > 0 && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Invoice Total</span>
                  <span className="text-xl font-bold">
                    €{calculateTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || selectedTimesheets.length === 0}
              >
                {loading ? "Creating..." : "Create Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
