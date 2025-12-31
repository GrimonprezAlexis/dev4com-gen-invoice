"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Mail, Check, X, Receipt, Trash2, Download } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { PDFDocument } from "./document-preview";
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
    status: "draft" | "sent" | "accepted" | "rejected"
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

  const handleDelete = () => {
    if (onDelete) {
      onDelete(selectedInvoices);
      setSelectedInvoices([]);
      setIsSelectionMode(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const renderInvoiceCard = (invoice: Invoice) => (
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
          {invoice.fake && (
            <span className="text-xs text-blue-500 font-medium">Demo</span>
          )}
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <p className="font-bold">
            {invoice.totalAmount.toLocaleString("fr-FR")}{" "}
            {invoice.currency === "CHF" ? "CHF" : "€"}
          </p>
          {invoice.discount?.value > 0 && (
            <p className="text-sm text-green-600">
              Remise:{" "}
              {invoice.discount.type === "percentage"
                ? `${invoice.discount.value}%`
                : `${invoice.discount.value.toLocaleString("fr-FR")}€`}
            </p>
          )}
          <StatusBadge status={invoice.status} />
        </div>
      </div>
      <div className="text-sm text-muted-foreground mb-4">
        <p>Créé le: {new Date(invoice.createdAt).toLocaleDateString()}</p>
        <p>
          Valide jusqu'au: {new Date(invoice.validUntil).toLocaleDateString()}
        </p>
      </div>
      {!isSelectionMode && (
        <div className="flex flex-wrap gap-2 justify-end">
          {viewMode === "grid" && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(invoice);
              }}
              className="w-full sm:w-auto"
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
                className="w-full sm:w-auto"
                onClick={(e) => e.stopPropagation()}
              >
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => onEdit(invoice)}
                className="text-blue-600"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <PDFDownloadLink
                  document={
                    <PDFDocument
                      document={invoice}
                      type={type}
                    />
                  }
                  fileName={`${type === "quote" ? "Devis" : "Facture"}_${invoice.number}.pdf`}
                  className="flex items-center w-full text-green-600"
                >
                  {({ loading }) => (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      {loading ? "Préparation..." : `Télécharger ${type === "quote" ? "le devis" : "la facture"}`}
                    </>
                  )}
                </PDFDownloadLink>
              </DropdownMenuItem>
              <Dialog>
                {type === "quote" ? (
                  <QuoteEmailDialog
                    invoice={invoice}
                    onEmailSent={() => onStatusUpdate(invoice.id, "sent")}
                  />
                ) : (
                  <BillingEmailDialog
                    invoice={invoice as unknown as BillingInvoice}
                    onEmailSent={() => {}}
                  />
                )}
              </Dialog>
              {type === "quote" &&
                invoice.status === "accepted" &&
                onGenerateInvoice && (
                  <Dialog>
                    <GenerateInvoiceDialog
                      quote={invoice}
                      onGenerate={onGenerateInvoice}
                    />
                  </Dialog>
                )}
              {type === "quote" && invoice.status !== "accepted" && (
                <DropdownMenuItem
                  onClick={() => onStatusUpdate(invoice.id, "accepted")}
                  className="text-green-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Marquer comme accepté
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onStatusUpdate(invoice.id, "rejected")}
                className="text-red-600"
              >
                <X className="w-4 h-4 mr-2" />
                Marquer comme refusé
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedInvoices([invoice.id]);
                  setIsDeleteDialogOpen(true);
                }}
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

  return (
    <div className="space-y-4">
      {invoices.length > 0 && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setIsSelectionMode(!isSelectionMode)}
          >
            {isSelectionMode
              ? "Annuler la sélection"
              : "Sélectionner des devis"}
          </Button>
          {isSelectionMode && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSelectAll}>
                {selectedInvoices.length === invoices.length
                  ? "Tout désélectionner"
                  : "Tout sélectionner"}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={selectedInvoices.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer ({selectedInvoices.length})
              </Button>
            </div>
          )}
        </div>
      )}

      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4"
        }
      >
        {invoices.map(renderInvoiceCard)}
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer {selectedInvoices.length} devis
            {selectedInvoices.length > 1 ? "s" : ""} ? Cette action est
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
