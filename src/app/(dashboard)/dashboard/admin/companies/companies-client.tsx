"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  Users,
  Code,
  Briefcase,
  CheckCircle,
  XCircle,
  Globe,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  AlertCircle,
  Search,
  MoreVertical,
  Play,
  Pause,
  Eye,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  verifyCompany,
  suspendCompany,
  suspendListing,
  activateListing,
  requestAdditionalInfo,
} from "../actions";
import { formatDistanceToNow } from "date-fns";

type Listing = {
  id: string;
  status: string;
  hourlyRate: number;
  currency: string;
  workType: string;
  availableFrom: Date | string;
  createdAt: Date | string;
};

type Developer = {
  id: string;
  realName: string;
  pseudonym: string;
  title: string;
  level: string;
  email: string | null;
  country: string | null;
  skills: Array<{ skill: { name: string }; years: number; isPrimary: boolean }>;
  listings: Listing[];
};

type User = {
  id: string;
  clerkId: string;
  fullName: string | null;
  email: string;
  role: string;
  createdAt: Date | string;
};

type Company = {
  id: string;
  name: string;
  slug: string;
  status: string;
  registrationCode: string;
  vatCode: string | null;
  website: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  country: string | null;
  createdAt: Date | string;
  users: User[];
  developers: Developer[];
  _count: { purchases: number; sales: number };
};

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING_VERIFICATION: {
    label: "Pending",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  },
  ACTIVE: {
    label: "Active",
    color: "bg-green-500/10 text-green-600 border-green-500/30",
  },
  SUSPENDED: {
    label: "Suspended",
    color: "bg-red-500/10 text-red-600 border-red-500/30",
  },
};

export function CompaniesClient({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [requestInfoDialog, setRequestInfoDialog] = useState<{
    open: boolean;
    companyId: string;
    companyName: string;
  }>({ open: false, companyId: "", companyName: "" });
  const [requestMessage, setRequestMessage] = useState("");

  const pendingCompanies = companies.filter(
    (c) => c.status === "PENDING_VERIFICATION",
  );
  const activeCompanies = companies.filter((c) => c.status === "ACTIVE");
  const suspendedCompanies = companies.filter((c) => c.status === "SUSPENDED");

  const filterCompanies = (list: Company[]) => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.registrationCode.toLowerCase().includes(q) ||
        c.users.some((u) => u.email.toLowerCase().includes(q)),
    );
  };

  const handleVerify = async (id: string) => {
    setProcessing(id);
    const result = await verifyCompany(id);
    if (result.success) {
      toast.success("Company verified successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to verify");
    }
    setProcessing(null);
  };

  const handleSuspend = async (id: string) => {
    setProcessing(id);
    const result = await suspendCompany(id);
    if (result.success) {
      toast.success("Company suspended");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to suspend");
    }
    setProcessing(null);
  };

  const handleSuspendListing = async (listingId: string) => {
    setProcessing(listingId);
    const result = await suspendListing(listingId);
    if (result.success) {
      toast.success("Listing suspended");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to suspend listing");
    }
    setProcessing(null);
  };

  const handleActivateListing = async (listingId: string) => {
    setProcessing(listingId);
    const result = await activateListing(listingId);
    if (result.success) {
      toast.success("Listing activated");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to activate listing");
    }
    setProcessing(null);
  };

  const handleRequestInfo = async () => {
    if (!requestMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }
    setProcessing(requestInfoDialog.companyId);
    const result = await requestAdditionalInfo(
      requestInfoDialog.companyId,
      requestMessage,
    );
    if (result.success) {
      toast.success(`Request sent to ${result.notifiedCount} user(s)`);
      setRequestInfoDialog({ open: false, companyId: "", companyName: "" });
      setRequestMessage("");
    } else {
      toast.error(result.error || "Failed to send request");
    }
    setProcessing(null);
  };

  const openRequestInfoDialog = (companyId: string, companyName: string) => {
    setRequestInfoDialog({ open: true, companyId, companyName });
    setRequestMessage(
      "To complete the verification of your company, please provide additional information:\n\n- Valid company registration certificate\n- VAT registration (if applicable)\n- Contact person details\n\nYou can update this in your company settings.",
    );
  };

  const totalListings = companies.reduce(
    (sum, c) => sum + c.developers.reduce((s, d) => s + d.listings.length, 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Management</h1>
        <p className="text-muted-foreground">
          View and manage all registered companies
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Companies
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingCompanies.length} pending verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Developers
            </CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.reduce((sum, c) => sum + c.developers.length, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Listings
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalListings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.reduce(
                (sum, c) => sum + c._count.purchases + c._count.sales,
                0,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, code, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Companies Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({filterCompanies(pendingCompanies).length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({filterCompanies(activeCompanies).length})
          </TabsTrigger>
          <TabsTrigger value="suspended">
            Suspended ({filterCompanies(suspendedCompanies).length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({filterCompanies(companies).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          <CompanyList
            companies={filterCompanies(pendingCompanies)}
            processing={processing}
            onVerify={handleVerify}
            onSuspend={handleSuspend}
            onSuspendListing={handleSuspendListing}
            onActivateListing={handleActivateListing}
            onRequestInfo={openRequestInfoDialog}
          />
        </TabsContent>

        <TabsContent value="active" className="space-y-4 mt-4">
          <CompanyList
            companies={filterCompanies(activeCompanies)}
            processing={processing}
            onVerify={handleVerify}
            onSuspend={handleSuspend}
            onSuspendListing={handleSuspendListing}
            onActivateListing={handleActivateListing}
            onRequestInfo={openRequestInfoDialog}
          />
        </TabsContent>

        <TabsContent value="suspended" className="space-y-4 mt-4">
          <CompanyList
            companies={filterCompanies(suspendedCompanies)}
            processing={processing}
            onVerify={handleVerify}
            onSuspend={handleSuspend}
            onSuspendListing={handleSuspendListing}
            onActivateListing={handleActivateListing}
            onRequestInfo={openRequestInfoDialog}
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-4">
          <CompanyList
            companies={filterCompanies(companies)}
            processing={processing}
            onVerify={handleVerify}
            onSuspend={handleSuspend}
            onSuspendListing={handleSuspendListing}
            onActivateListing={handleActivateListing}
            onRequestInfo={openRequestInfoDialog}
          />
        </TabsContent>
      </Tabs>

      {/* Request Info Dialog */}
      <Dialog
        open={requestInfoDialog.open}
        onOpenChange={(open) =>
          setRequestInfoDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Additional Information</DialogTitle>
            <DialogDescription>
              Send a notification to {requestInfoDialog.companyName} asking for
              additional verification data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter your message..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={6}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setRequestInfoDialog({
                  open: false,
                  companyId: "",
                  companyName: "",
                })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestInfo}
              disabled={processing === requestInfoDialog.companyId}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompanyList({
  companies,
  processing,
  onVerify,
  onSuspend,
  onSuspendListing,
  onActivateListing,
  onRequestInfo,
}: {
  companies: Company[];
  processing: string | null;
  onVerify: (id: string) => void;
  onSuspend: (id: string) => void;
  onSuspendListing: (id: string) => void;
  onActivateListing: (id: string) => void;
  onRequestInfo: (companyId: string, companyName: string) => void;
}) {
  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No companies found</h3>
          <p className="text-muted-foreground">
            No companies match the current filter.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {companies.map((company) => (
        <CompanyCard
          key={company.id}
          company={company}
          processing={processing}
          onVerify={onVerify}
          onSuspend={onSuspend}
          onSuspendListing={onSuspendListing}
          onActivateListing={onActivateListing}
          onRequestInfo={onRequestInfo}
        />
      ))}
    </div>
  );
}

function CompanyCard({
  company,
  processing,
  onVerify,
  onSuspend,
  onSuspendListing,
  onActivateListing,
  onRequestInfo,
}: {
  company: Company;
  processing: string | null;
  onVerify: (id: string) => void;
  onSuspend: (id: string) => void;
  onSuspendListing: (id: string) => void;
  onActivateListing: (id: string) => void;
  onRequestInfo: (companyId: string, companyName: string) => void;
}) {
  const isProcessing = processing === company.id;
  const status =
    statusConfig[company.status] || statusConfig.PENDING_VERIFICATION;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {company.name}
              <Badge variant="outline" className={status.color}>
                {status.label}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              {company.registrationCode} • Registered{" "}
              {formatDistanceToNow(new Date(company.createdAt), {
                addSuffix: true,
              })}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isProcessing}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {company.status !== "ACTIVE" && (
                <DropdownMenuItem onClick={() => onVerify(company.id)}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Verify Company
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onRequestInfo(company.id, company.name)}
              >
                <MessageSquare className="mr-2 h-4 w-4 text-blue-600" />
                Request Info
              </DropdownMenuItem>
              {company.status !== "SUSPENDED" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onSuspend(company.id)}
                    className="text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Suspend Company
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Company Details Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            icon={FileText}
            label="Registration Code"
            value={company.registrationCode}
          />
          {company.vatCode && (
            <DetailItem
              icon={FileText}
              label="VAT Code"
              value={company.vatCode}
            />
          )}
          {company.website && (
            <DetailItem
              icon={Globe}
              label="Website"
              value={company.website}
              isLink
            />
          )}
          {company.contactEmail && (
            <DetailItem
              icon={Mail}
              label="Contact Email"
              value={company.contactEmail}
            />
          )}
          {company.contactPhone && (
            <DetailItem
              icon={Phone}
              label="Contact Phone"
              value={company.contactPhone}
            />
          )}
          {company.country && (
            <DetailItem icon={MapPin} label="Country" value={company.country} />
          )}
        </div>

        {company.description && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {company.description}
            </p>
          </div>
        )}

        {/* Accordion for Users, Developers, Listings */}
        <Accordion type="multiple" className="w-full">
          {/* Users */}
          <AccordionItem value="users">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Users ({company.users.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {company.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.fullName || "—"}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(user.createdAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>

          {/* Developers */}
          <AccordionItem value="developers">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span>Developers ({company.developers.length})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {company.developers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No developers added yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Primary Skills</TableHead>
                      <TableHead>Listings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.developers.map((dev) => (
                      <TableRow key={dev.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{dev.pseudonym}</p>
                            <p className="text-xs text-muted-foreground">
                              {dev.realName}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{dev.title}</TableCell>
                        <TableCell>{dev.level}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {dev.skills
                              .filter((s) => s.isPrimary)
                              .slice(0, 3)
                              .map((s) => (
                                <Badge key={s.skill.name} variant="secondary">
                                  {s.skill.name}
                                </Badge>
                              ))}
                          </div>
                        </TableCell>
                        <TableCell>{dev.listings.length}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Listings */}
          <AccordionItem value="listings">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>
                  Listings (
                  {company.developers.reduce(
                    (sum, d) => sum + d.listings.length,
                    0,
                  )}
                  )
                </span>
                {company.status === "PENDING_VERIFICATION" &&
                  company.developers.some((d) => d.listings.length > 0) && (
                    <Badge
                      variant="outline"
                      className="text-yellow-600 bg-yellow-50 ml-2"
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Hidden until verified
                    </Badge>
                  )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {company.developers.every((d) => d.listings.length === 0) ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No listings created yet
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Developer</TableHead>
                      <TableHead>Work Type</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Available From</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.developers.flatMap((dev) =>
                      dev.listings.map((listing) => (
                        <TableRow key={listing.id}>
                          <TableCell>{dev.pseudonym}</TableCell>
                          <TableCell>{listing.workType}</TableCell>
                          <TableCell>
                            {listing.currency} {listing.hourlyRate}/hr
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                listing.status === "ACTIVE"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {listing.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(
                              listing.availableFrom,
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                title="Preview listing"
                              >
                                <Link href={`/dashboard/market/${listing.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={processing === listing.id}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {listing.status === "ACTIVE" ? (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onSuspendListing(listing.id)
                                      }
                                      className="text-red-600"
                                    >
                                      <Pause className="mr-2 h-4 w-4" />
                                      Suspend Listing
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onActivateListing(listing.id)
                                      }
                                    >
                                      <Play className="mr-2 h-4 w-4 text-green-600" />
                                      Activate Listing
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      )),
                    )}
                  </TableBody>
                </Table>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  isLink,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  isLink?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {isLink ? (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium">{value}</p>
        )}
      </div>
    </div>
  );
}
