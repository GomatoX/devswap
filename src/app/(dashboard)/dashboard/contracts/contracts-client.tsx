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
  FileCheck,
  Plus,
  MoreVertical,
  Send,
  CheckCircle,
  Clock,
  FileText,
  Building2,
  Pencil,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  createContract,
  updateContractStatus,
  getRequestsWithoutContracts,
  agreeToContract,
  updateContract,
} from "./actions";

type Contract = {
  id: string;
  title: string;
  terms: string;
  hourlyRate: number;
  currency: string;
  startDate: Date | string;
  endDate: Date | string | null;
  status: string;
  sentAt: Date | string | null;
  acceptedAt: Date | string | null;
  vendorAgreedAt: Date | string | null;
  clientAgreedAt: Date | string | null;
  createdAt: Date | string;
  request: {
    id: string;
    client: { id: string; name: string };
    vendor: { id: string; name: string };
    listing: {
      developer: { pseudonym: string; title: string };
      hourlyRate: number;
    };
  };
  timesheets: unknown[];
  invoices: unknown[];
};

type AvailableRequest = {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  agreedRate: number | null;
  client: { id: string; name: string };
  vendor: { id: string; name: string };
  listing: {
    developer: { pseudonym: string; title: string };
    hourlyRate: number;
  };
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500",
  SENT: "bg-blue-500",
  ACCEPTED: "bg-green-500",
  ACTIVE: "bg-emerald-500",
  COMPLETED: "bg-primary",
  CANCELLED: "bg-red-500",
};

export function ContractsClient({
  contracts,
  currentCompanyId,
}: {
  contracts: Contract[];
  currentCompanyId: string;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [availableRequests, setAvailableRequests] = useState<
    AvailableRequest[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    requestId: "",
    title: "",
    terms: "",
    hourlyRate: "",
    startDate: "",
    endDate: "",
  });

  const loadAvailableRequests = async () => {
    const result = await getRequestsWithoutContracts();
    if (result.success && result.data) {
      setAvailableRequests(result.data);
    }
  };

  const handleOpenCreate = async () => {
    await loadAvailableRequests();
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.requestId || !formData.title || !formData.startDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const result = await createContract({
      requestId: formData.requestId,
      title: formData.title,
      terms: formData.terms,
      hourlyRate: parseFloat(formData.hourlyRate),
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
    });

    if (result.success) {
      toast.success("Contract created!");
      setCreateOpen(false);
      setFormData({
        requestId: "",
        title: "",
        terms: "",
        hourlyRate: "",
        startDate: "",
        endDate: "",
      });
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create contract");
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (
    contractId: string,
    status: "SENT" | "ACCEPTED" | "ACTIVE" | "COMPLETED" | "CANCELLED",
  ) => {
    const result = await updateContractStatus(contractId, status);
    if (result.success) {
      toast.success(`Contract ${status.toLowerCase()}`);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update contract");
    }
  };

  const [agreeingId, setAgreeingId] = useState<string | null>(null);
  const handleAgree = async (contractId: string) => {
    setAgreeingId(contractId);
    const result = await agreeToContract(contractId);
    if (result.success) {
      if (result.fullyAgreed) {
        toast.success("Both parties agreed! Contract is now active.");
      } else {
        toast.success("You agreed to the contract. Waiting for other party.");
      }
      router.refresh();
    } else {
      toast.error(result.error || "Failed to agree to contract");
    }
    setAgreeingId(null);
  };

  // Edit contract state
  const [editOpen, setEditOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [editData, setEditData] = useState({
    title: "",
    terms: "",
    hourlyRate: "",
    startDate: "",
    endDate: "",
  });

  const handleOpenEdit = (contract: Contract) => {
    setEditingContract(contract);
    setEditData({
      title: contract.title,
      terms: contract.terms,
      hourlyRate: String(contract.hourlyRate),
      startDate: format(new Date(contract.startDate), "yyyy-MM-dd"),
      endDate: contract.endDate
        ? format(new Date(contract.endDate), "yyyy-MM-dd")
        : "",
    });
    setEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;

    setLoading(true);
    const result = await updateContract(editingContract.id, {
      title: editData.title,
      terms: editData.terms,
      hourlyRate: parseFloat(editData.hourlyRate),
      startDate: editData.startDate,
      endDate: editData.endDate || null,
    });

    if (result.success) {
      toast.success("Contract updated! Both parties need to agree again.");
      setEditOpen(false);
      setEditingContract(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update contract");
    }
    setLoading(false);
  };

  const _selectedRequest = availableRequests.find(
    (r) => r.id === formData.requestId,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
          <p className="text-muted-foreground">
            Manage engagement contracts and terms
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Contract
        </Button>
      </div>

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileCheck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No contracts yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Create contracts from accepted requests to formalize engagements.
            </p>
            <Button onClick={handleOpenCreate} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Create First Contract
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contracts.map((contract) => {
            const isVendor = contract.request.vendor.id === currentCompanyId;
            const counterparty = isVendor
              ? contract.request.client
              : contract.request.vendor;

            return (
              <Card key={contract.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {contract.title}
                        <Badge className={statusColors[contract.status]}>
                          {contract.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Building2 className="h-3 w-3" />
                        {isVendor ? "Client:" : "Vendor:"} {counterparty.name}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {contract.status === "DRAFT" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(contract.id, "SENT")
                            }
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send to {isVendor ? "Client" : "Vendor"}
                          </DropdownMenuItem>
                        )}
                        {contract.status === "DRAFT" && (
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(contract)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Contract
                          </DropdownMenuItem>
                        )}
                        {contract.status === "SENT" && !isVendor && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(contract.id, "ACCEPTED")
                            }
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Accept Contract
                          </DropdownMenuItem>
                        )}
                        {contract.status === "ACCEPTED" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(contract.id, "ACTIVE")
                            }
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Active
                          </DropdownMenuItem>
                        )}
                        {contract.status === "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusUpdate(contract.id, "COMPLETED")
                            }
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark Completed
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Developer</span>
                      <p className="font-medium">
                        {contract.request.listing.developer.pseudonym}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rate</span>
                      <p className="font-medium">€{contract.hourlyRate}/hr</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration</span>
                      <p className="font-medium">
                        {format(new Date(contract.startDate), "MMM d")} -{" "}
                        {contract.endDate
                          ? format(new Date(contract.endDate), "MMM d, yyyy")
                          : "Ongoing"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Activity</span>
                      <p className="font-medium flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {contract.timesheets.length} pending timesheets
                      </p>
                    </div>
                  </div>

                  {/* Agreement Status + I Agree Button for DRAFT */}
                  {contract.status === "DRAFT" && (
                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5">
                          {contract.vendorAgreedAt ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          Vendor{" "}
                          {contract.vendorAgreedAt ? "agreed" : "pending"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {contract.clientAgreedAt ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          Client{" "}
                          {contract.clientAgreedAt ? "agreed" : "pending"}
                        </span>
                      </div>
                      {((isVendor && !contract.vendorAgreedAt) ||
                        (!isVendor && !contract.clientAgreedAt)) && (
                        <Button
                          size="sm"
                          onClick={() => handleAgree(contract.id)}
                          disabled={agreeingId === contract.id}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          {agreeingId === contract.id
                            ? "Processing..."
                            : "I Agree"}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Contract Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Contract</DialogTitle>
            <DialogDescription>
              Formalize an engagement with a contract
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Request *</Label>
              <Select
                value={formData.requestId}
                onValueChange={(value) => {
                  const req = availableRequests.find((r) => r.id === value);
                  setFormData({
                    ...formData,
                    requestId: value,
                    hourlyRate: req
                      ? String(req.agreedRate || req.listing.hourlyRate)
                      : "",
                    startDate: req
                      ? format(new Date(req.startDate), "yyyy-MM-dd")
                      : "",
                    endDate: req
                      ? format(new Date(req.endDate), "yyyy-MM-dd")
                      : "",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a request" />
                </SelectTrigger>
                <SelectContent>
                  {availableRequests.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No eligible requests
                    </SelectItem>
                  ) : (
                    availableRequests.map((req) => (
                      <SelectItem key={req.id} value={req.id}>
                        {req.listing.developer.pseudonym} - {req.client.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Contract Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Frontend Development Services"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate (€) *</Label>
              <Input
                id="hourlyRate"
                type="number"
                min="1"
                value={formData.hourlyRate}
                onChange={(e) =>
                  setFormData({ ...formData, hourlyRate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                placeholder="Enter contract terms..."
                rows={4}
                value={formData.terms}
                onChange={(e) =>
                  setFormData({ ...formData, terms: e.target.value })
                }
              />
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
                {loading ? "Creating..." : "Create Contract"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>
              Update contract terms. Both parties will need to re-agree after
              changes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Contract Title *</Label>
              <Input
                id="editTitle"
                value={editData.title}
                onChange={(e) =>
                  setEditData({ ...editData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editStartDate">Start Date *</Label>
                <Input
                  id="editStartDate"
                  type="date"
                  value={editData.startDate}
                  onChange={(e) =>
                    setEditData({ ...editData, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEndDate">End Date</Label>
                <Input
                  id="editEndDate"
                  type="date"
                  value={editData.endDate}
                  onChange={(e) =>
                    setEditData({ ...editData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editHourlyRate">Hourly Rate (€) *</Label>
              <Input
                id="editHourlyRate"
                type="number"
                min="1"
                value={editData.hourlyRate}
                onChange={(e) =>
                  setEditData({ ...editData, hourlyRate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTerms">Terms & Conditions</Label>
              <Textarea
                id="editTerms"
                rows={4}
                value={editData.terms}
                onChange={(e) =>
                  setEditData({ ...editData, terms: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
