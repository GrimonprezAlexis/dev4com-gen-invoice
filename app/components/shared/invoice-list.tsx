"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  Pencil,
  Check,
  X,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
} from "lucide-react";
import { PDFDownloadButton } from "./pdf-download-button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "../status-badge";
import { QuoteEmailDialog } from "../quotes/email-dialog";
import { BillingEmailDialog } from "../billing/email-dialog";
import { GenerateInvoiceDialog } from "../generate-invoice-dialog";
import { Invoice, BillingInvoice } from "@/app/types";
import { Checkbox } from "@/components/ui/checkbox";

interface InvoiceListProps {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  viewMode: "grid" | "split";
  onSelect: (invoice: Invoice) => void;
  onPreview: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onStatusUpdate: (
    id: string,
    status: "draft" | "pending" | "sent" | "accepted" | "rejected" | "paid"
  ) => void;
  onGenerateInvoice?: (invoice: BillingInvoice) => void;
  onDelete?: (ids: string[]) => void;
  type: "quote" | "billing";
}

export function InvoiceList({
  invoices,
  selectedInvoice,
  viewMode,
  onSelect,
  onPreview,
  onEdit,
  onStatusUpdate,
  onGenerateInvoice,
  onDelete,
  type,
}: InvoiceListProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "client">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Stats
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const acceptedAmount = invoices
    .filter((inv) => inv.status === "accepted" || inv.status === "paid")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const acceptedCount = invoices.filter((inv) => inv.status === "accepted" || inv.status === "paid").length;
  const conversionRate = invoices.length > 0 ? ((acceptedCount / invoices.length) * 100).toFixed(0) : 0;

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
      result = result.filter((inv) => inv.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "date":
          comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
          break;
        case "amount":
          comparison = b.totalAmount - a.totalAmount;
          break;
        case "client":
          comparison = a.client.name.localeCompare(b.client.name);
          break;
      }
      return sortOrder === "asc" ? -comparison : comparison;
    });

    return result;
  }, [invoices, search, statusFilter, sortBy, sortOrder]);

  // Group invoices by month when sorted by date
  const groupedByMonth = useMemo(() => {
    if (sortBy !== "date") return null;
    const groups: { key: string; label: string; invoices: Invoice[] }[] = [];
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

  const handleToggleSelection = (id: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedInvoices(
      selectedInvoices.length === filteredInvoices.length ? [] : filteredInvoices.map((inv) => inv.id)
    );
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(selectedInvoices);
      setSelectedInvoices([]);
      setIsSelectionMode(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const renderCompactCard = (invoice: Invoice) => (
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
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{invoice.number}</span>
          {invoice.fake && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">Demo</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{invoice.client.name}</p>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        {invoice.deposit > 0 ? (
          <>
            <p className="font-semibold text-sm">
              {(invoice.totalAmount * invoice.deposit / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} {invoice.currency === "CHF" ? "CHF" : "€"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Total: {invoice.totalAmount.toLocaleString("fr-FR")} {invoice.currency === "CHF" ? "CHF" : "€"}
            </p>
          </>
        ) : (
          <p className="font-semibold text-sm">
            {invoice.totalAmount.toLocaleString("fr-FR")} {invoice.currency === "CHF" ? "CHF" : "€"}
          </p>
        )}
      </div>

      {/* Status */}
      <div className="shrink-0">
        <StatusBadge
          status={invoice.status}
          onStatusChange={(newStatus) => onStatusUpdate(invoice.id, newStatus)}
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(invoice)}>
                <Pencil className="w-4 h-4 mr-2" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <PDFDownloadButton
                  document={invoice}
                  type={type}
                  fileName={`${type === "quote" ? "Devis" : "Facture"}_${invoice.number}.pdf`}
                  className="w-full"
                />
              </DropdownMenuItem>
              {type === "quote" ? (
                <QuoteEmailDialog invoice={invoice} onEmailSent={() => onStatusUpdate(invoice.id, "sent")} />
              ) : (
                <BillingEmailDialog invoice={invoice as unknown as BillingInvoice} onEmailSent={() => {}} />
              )}
              {type === "quote" && (invoice.status === "accepted" || invoice.status === "paid") && onGenerateInvoice && (
                <GenerateInvoiceDialog quote={invoice} onGenerate={onGenerateInvoice} />
              )}
              {type === "quote" && invoice.status !== "accepted" && invoice.status !== "paid" && (
                <DropdownMenuItem onClick={() => onStatusUpdate(invoice.id, "accepted")} className="text-green-600">
                  <Check className="w-4 h-4 mr-2" /> Accepté
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onStatusUpdate(invoice.id, "rejected")} className="text-orange-600">
                <X className="w-4 h-4 mr-2" /> Refusé
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedInvoices([invoice.id]);
                  setIsDeleteDialogOpen(true);
                }}
                className="text-red-600"
              >
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
          <p className="text-[10px] text-muted-foreground">{invoices.length} devis</p>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
          <p className="text-xs text-muted-foreground">Acceptés</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">{acceptedAmount.toLocaleString("fr-FR")} €</p>
          <p className="text-[10px] text-muted-foreground">{acceptedCount} devis</p>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
          <p className="text-xs text-muted-foreground">Conversion</p>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{conversionRate}%</p>
          <p className="text-[10px] text-muted-foreground">taux de succès</p>
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
            <SelectItem value="accepted">Accepté</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="sent">Envoyé</SelectItem>
            <SelectItem value="paid">Payé</SelectItem>
            <SelectItem value="rejected">Refusé</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v: "date" | "amount" | "client") => setSortBy(v)}>
          <SelectTrigger className="w-[110px] h-8 text-xs">
            <ArrowUpDown className="w-3 h-3 mr-1" />
            <SelectValue placeholder="Trier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="amount">Montant</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
        {invoices.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSelectionMode(!isSelectionMode)}
            className="text-xs h-8"
          >
            {isSelectionMode ? "Annuler" : "Sélectionner"}
          </Button>
        )}
        {isSelectionMode && (
          <>
            <Button variant="outline" size="sm" onClick={handleSelectAll} className="text-xs h-8">
              {selectedInvoices.length === filteredInvoices.length ? "Désélect." : "Tout"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={selectedInvoices.length === 0}
              className="text-xs h-8"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              ({selectedInvoices.length})
            </Button>
          </>
        )}
      </div>

      {/* List */}
      {groupedByMonth ? (
        <div className="space-y-1">
          {groupedByMonth.map((group) => (
            <div key={group.key}>
              <div className="flex items-center gap-3 py-2 px-1">
                <Calendar className="w-3 h-3 text-muted-foreground/50" /><span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">{group.label}</span>
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
            Supprimer {selectedInvoices.length} devis{selectedInvoices.length > 1 ? "s" : ""} ? Cette action est irréversible.
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
