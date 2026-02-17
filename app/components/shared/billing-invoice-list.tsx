"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  Filter,
  Search,
  ArrowUpDown,
  Check,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { PDFDownloadButton } from "./pdf-download-button";
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
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { BillingInvoice } from "@/app/types";
import { StatusBadge, BillingStatus } from "../status-badge";
import { DateRangePicker } from "../date-range-picker";
import { toast } from "sonner";
import { BillingEmailDialog } from "../billing/email-dialog";
import { BillingInvoiceEditDialog } from "../billing/billing-invoice-edit-dialog";
import { useConfetti } from "@/app/hooks/use-confetti";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRange } from "react-day-picker";

interface BillingInvoiceListProps {
  invoices: BillingInvoice[];
  selectedInvoice: BillingInvoice | null;
  viewMode: "grid" | "split";
  onSelect: (invoice: BillingInvoice) => void;
  onPreview: (invoice: BillingInvoice) => void;
  onUpdate: (invoice: BillingInvoice) => void;
  onDelete: (id: string) => void;
  onSend?: (invoice: BillingInvoice) => void;
}

export function BillingInvoiceList({
  invoices,
  selectedInvoice,
  viewMode,
  onSelect,
  onPreview,
  onUpdate,
  onDelete,
  onSend,
}: BillingInvoiceListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "dueDate">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<BillingInvoice | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const fireConfetti = useConfetti();

  const handleMarkAsPaid = (invoice: BillingInvoice) => {
    const updatedInvoice = {
      ...invoice,
      paymentStatus: "paid" as const,
      paymentDate: new Date().toISOString(),
    };
    onUpdate(updatedInvoice);
    fireConfetti();
    toast.success("Facture marquée comme payée !");
  };

  const handleDelete = async () => {
    if (invoiceToDelete) {
      onDelete(invoiceToDelete.id);
      setIsDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const handleDeleteClick = (invoice: BillingInvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setInvoiceToDelete(invoice);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleSelection = (id: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Stats
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalWithTax, 0);
  const pendingAmount = invoices.filter((inv) => inv.paymentStatus === "pending").reduce((sum, inv) => sum + inv.totalWithTax, 0);
  const paidCount = invoices.filter((inv) => inv.paymentStatus === "paid").length;
  const recoveryRate = invoices.length > 0 ? ((paidCount / invoices.length) * 100).toFixed(0) : 0;

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.number.toLowerCase().includes(searchLower) ||
          inv.client.name.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((inv) => inv.paymentStatus === statusFilter);
    }

    // Date range filter
    if (dateRange?.from) {
      const from = dateRange.from.getTime();
      const to = dateRange.to ? dateRange.to.getTime() : from;
      result = result.filter((inv) => {
        const d = new Date(inv.date).getTime();
        return d >= from && d <= to + 86400000;
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "date":
          comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
          break;
        case "amount":
          comparison = b.totalWithTax - a.totalWithTax;
          break;
        case "dueDate":
          comparison = new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
          break;
      }
      return sortOrder === "asc" ? -comparison : comparison;
    });

    return result;
  }, [invoices, search, statusFilter, dateRange, sortBy, sortOrder]);

  // Group invoices by month when sorted by date
  const groupedByMonth = useMemo(() => {
    if (sortBy !== "date") return null;
    const groups: { key: string; label: string; invoices: BillingInvoice[] }[] = [];
    let currentKey = "";
    for (const inv of filteredInvoices) {
      const d = new Date(inv.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      if (key !== currentKey) {
        currentKey = key;
        const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
        groups.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1), invoices: [] });
      }
      groups[groups.length - 1].invoices.push(inv);
    }
    return groups;
  }, [filteredInvoices, sortBy]);

  const renderCompactCard = (invoice: BillingInvoice) => (
    <div
      key={invoice.id}
      className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border rounded-lg hover:shadow-sm transition-all cursor-pointer
        ${viewMode === "split" && selectedInvoice?.id === invoice.id ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-200 dark:border-slate-700"}
        ${isSelectionMode && selectedInvoices.includes(invoice.id) ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : ""}`}
      onClick={() => {
        if (isSelectionMode) handleToggleSelection(invoice.id);
        else if (viewMode === "split") onSelect(invoice);
      }}
    >
      {isSelectionMode && (
        <Checkbox
          checked={selectedInvoices.includes(invoice.id)}
          onCheckedChange={() => handleToggleSelection(invoice.id)}
          className="shrink-0"
        />
      )}

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm truncate block">{invoice.number}</span>
        <p className="text-xs text-muted-foreground truncate">{invoice.client.name}</p>
      </div>

      {/* Amount + Services additionnels */}
      <div className="text-right shrink-0">
        <p className="font-semibold text-sm">
          {invoice.totalWithTax.toLocaleString("fr-FR")} {invoice.currency === "CHF" ? "CHF" : "€"}
        </p>
        {(invoice.additionalServicesTotal ?? 0) > 0 ? (
          <p className="text-[10px] text-orange-600">
            +{invoice.additionalServicesTotal!.toLocaleString("fr-FR")} {invoice.currency === "CHF" ? "CHF" : "€"} add.
          </p>
        ) : null}
      </div>

      {/* Status */}
      <div className="shrink-0">
        <StatusBadge
          status={invoice.paymentStatus}
          variant="billing"
          onStatusChange={(newStatus: BillingStatus) => {
            const updatedInvoice = {
              ...invoice,
              paymentStatus: newStatus,
              ...(newStatus === "paid" ? { paymentDate: new Date().toISOString() } : {}),
            };
            onUpdate(updatedInvoice);
            if (newStatus === "paid") {
              fireConfetti();
              toast.success("Facture marquée comme payée !");
            }
          }}
        />
      </div>

      {/* Actions */}
      {!isSelectionMode && (
        <div className="flex items-center gap-1 shrink-0">
          {viewMode === "grid" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(invoice);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <BillingInvoiceEditDialog invoice={invoice} onUpdate={onUpdate} />
              <DropdownMenuItem asChild>
                <PDFDownloadButton
                  document={invoice}
                  type="billing"
                  fileName={`Facture_${invoice.number}.pdf`}
                  className="w-full"
                />
              </DropdownMenuItem>
              <BillingEmailDialog invoice={invoice} onEmailSent={() => onSend?.(invoice)} />
              <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice)} className="text-green-600">
                <Check className="w-4 h-4 mr-2" /> Marquer payée
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleDeleteClick(invoice, e)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Compact stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalAmount.toLocaleString("fr-FR")} €</p>
          <p className="text-[10px] text-muted-foreground">{invoices.length} facture{invoices.length > 1 ? "s" : ""}</p>
        </div>
        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
          <p className="text-xs text-muted-foreground">En attente</p>
          <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{pendingAmount.toLocaleString("fr-FR")} €</p>
          <p className="text-[10px] text-muted-foreground">{invoices.filter((i) => i.paymentStatus === "pending").length} facture{invoices.filter((i) => i.paymentStatus === "pending").length > 1 ? "s" : ""}</p>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
          <p className="text-xs text-muted-foreground">Recouvrement</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">{recoveryRate}%</p>
          <p className="text-[10px] text-muted-foreground">{paidCount} payée{paidCount > 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Compact filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[110px] h-8 text-xs">
            <Filter className="w-3 h-3 mr-1" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="partial">Partiel</SelectItem>
            <SelectItem value="paid">Payé</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v: "date" | "amount" | "dueDate") => setSortBy(v)}>
          <SelectTrigger className="w-[110px] h-8 text-xs">
            <ArrowUpDown className="w-3 h-3 mr-1" />
            <SelectValue placeholder="Trier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="amount">Montant</SelectItem>
            <SelectItem value="dueDate">Échéance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {groupedByMonth ? (
        <div className="space-y-1">
          {groupedByMonth.map((group) => (
            <div key={group.key}>
              <div className="flex items-center gap-3 py-2 px-1">
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">{group.label}</span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground/60 tabular-nums">{group.invoices.length}</span>
              </div>
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2" : "space-y-2"}>
                {group.invoices.map(renderCompactCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2" : "space-y-2"}>
          {filteredInvoices.map(renderCompactCard)}
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Supprimer cette facture ? Cette action est irréversible.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
