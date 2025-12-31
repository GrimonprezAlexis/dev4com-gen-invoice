"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye,
  Filter,
  Search,
  ArrowUpDown,
  Calendar,
  Check,
  Trash2,
  Download,
} from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { PDFDocument } from "./document-preview";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { BillingInvoice } from "@/app/types";
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
  const [invoiceToDelete, setInvoiceToDelete] = useState<BillingInvoice | null>(
    null
  );
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
      fireConfetti();
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
    setSelectedInvoices((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoices.map((inv) => inv.id));
    }
  };

  const renderInvoiceCard = (invoice: BillingInvoice) => (
    <Card
      key={invoice.id}
      className={`p-4 hover:shadow-lg transition-shadow cursor-pointer relative
        ${
          viewMode === "split" && selectedInvoice?.id === invoice.id
            ? "border-blue-500 border-2"
            : ""
        }
        ${
          isSelectionMode && selectedInvoices.includes(invoice.id)
            ? "border-blue-500 border-2"
            : ""
        }`}
      onClick={() => {
        if (isSelectionMode) {
          handleToggleSelection(invoice.id);
        } else if (viewMode === "split") {
          onSelect(invoice);
        }
      }}
    >
      {isSelectionMode && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            checked={selectedInvoices.includes(invoice.id)}
            onCheckedChange={() => handleToggleSelection(invoice.id)}
          />
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
        <div>
          <p className="font-semibold">{invoice.number}</p>
          <p className="text-sm text-muted-foreground">{invoice.client.name}</p>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <p className="font-bold">
            {invoice.totalWithTax.toLocaleString("fr-FR")} €
          </p>
          <p className="text-sm text-muted-foreground">
            TVA: {invoice.taxAmount.toLocaleString("fr-FR")} €
          </p>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              invoice.paymentStatus === "paid"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : invoice.paymentStatus === "partial"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            }`}
          >
            {invoice.paymentStatus === "paid"
              ? "Payée"
              : invoice.paymentStatus === "partial"
              ? "Partiel"
              : "En attente"}
          </span>
        </div>
      </div>
      <div className="text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <p>Émise le: {new Date(invoice.date).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <p>Échéance: {new Date(invoice.dueDate).toLocaleDateString()}</p>
        </div>
      </div>
      {!isSelectionMode && (
        <div className="flex justify-end gap-2">
          {viewMode === "grid" && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(invoice);
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => e.stopPropagation()}
              >
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <Dialog>
                <BillingInvoiceEditDialog
                  invoice={invoice}
                  onUpdate={onUpdate}
                />
              </Dialog>
              <DropdownMenuItem asChild>
                <PDFDownloadLink
                  document={
                    <PDFDocument
                      document={invoice}
                      type="billing"
                    />
                  }
                  fileName={`Facture_${invoice.number}.pdf`}
                  className="flex items-center w-full text-green-600"
                >
                  {({ loading }) => (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      {loading ? "Préparation..." : "Télécharger la facture"}
                    </>
                  )}
                </PDFDownloadLink>
              </DropdownMenuItem>
              <Dialog>
                <BillingEmailDialog
                  invoice={invoice}
                  onEmailSent={() => onSend?.(invoice)}
                />
              </Dialog>
              <DropdownMenuItem
                onClick={() => handleMarkAsPaid(invoice)}
                className="text-green-600"
              >
                <Check className="w-4 h-4 mr-2" />
                Marquer comme payé
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => handleDeleteClick(invoice, e)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </Card>
  );

  const infoCards = (
    <div
      className={`space-y-4 ${
        viewMode === "split"
          ? "lg:space-y-4"
          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      }`}
    >
      <Card className="p-4 sm:p-6 bg-blue-50 dark:bg-blue-950">
        <div className="flex flex-col">
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Total des factures
          </h3>
          <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
            {invoices
              .reduce((sum, inv) => sum + inv.totalWithTax, 0)
              .toLocaleString("fr-FR")}{" "}
            €
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {invoices.length} facture{invoices.length > 1 ? "s" : ""}
          </p>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 bg-yellow-50 dark:bg-yellow-950">
        <div className="flex flex-col">
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            En attente de paiement
          </h3>
          <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {invoices
              .filter((inv) => inv.paymentStatus === "pending")
              .reduce((sum, inv) => sum + inv.totalWithTax, 0)
              .toLocaleString("fr-FR")}{" "}
            €
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {invoices.filter((inv) => inv.paymentStatus === "pending").length}{" "}
            facture
            {invoices.filter((inv) => inv.paymentStatus === "pending").length >
            1
              ? "s"
              : ""}
          </p>
        </div>
      </Card>

      <Card
        className={`p-4 sm:p-6 bg-green-50 dark:bg-green-950 ${
          viewMode === "split" ? "" : "sm:col-span-2 lg:col-span-1"
        }`}
      >
        <div className="flex flex-col">
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Taux de recouvrement
          </h3>
          <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
            {invoices.length > 0
              ? (
                  (invoices.filter((inv) => inv.paymentStatus === "paid")
                    .length /
                    invoices.length) *
                  100
                ).toFixed(1)
              : 0}
            %
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {invoices.filter((inv) => inv.paymentStatus === "paid").length}{" "}
            facture
            {invoices.filter((inv) => inv.paymentStatus === "paid").length > 1
              ? "s"
              : ""}{" "}
            payée
            {invoices.filter((inv) => inv.paymentStatus === "paid").length > 1
              ? "s"
              : ""}
          </p>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {infoCards}

      <div className="flex flex-col gap-4">
        <div className="w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher par n° de facture, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="partial">Partiel</SelectItem>
              <SelectItem value="paid">Payé</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value: "date" | "amount" | "dueDate") =>
              setSortBy(value)
            }
          >
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date d'émission</SelectItem>
              <SelectItem value="amount">Montant</SelectItem>
              <SelectItem value="dueDate">Échéance</SelectItem>
            </SelectContent>
          </Select>

          <DateRangePicker
            date={dateRange}
            onSelect={setDateRange}
            className="flex-1 min-w-[200px]"
          />
        </div>
      </div>

      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4"
        }
      >
        {invoices.map(renderInvoiceCard)}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer cette facture ? Cette action est
            irréversible.
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
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
