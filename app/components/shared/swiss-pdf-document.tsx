"use client";

import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { Invoice, BillingInvoice } from "@/app/types";
import { formatSwissNumber } from "@/lib/swiss-utils";

// Colors
const COLORS = {
  primary: "#000000",
  secondary: "#666666",
  accent: "#c00000", // Red for headers and totals
  light: "#f5f5f5",
  white: "#ffffff",
  border: "#cccccc",
};

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  // Main content area (above QR-Bill)
  mainContent: {
    padding: "40 50",
    paddingBottom: 20,
  },
  // Header container
  headerContainer: {
    marginBottom: 25,
  },
  // Top row: Logo left, Client right
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  // Left side: Logo + Company
  companySection: {
    width: "50%",
  },
  logo: {
    marginBottom: 10,
  },
  companyName: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  companyText: {
    fontSize: 9,
    color: COLORS.primary,
    lineHeight: 1.5,
  },
  // Right side: Client block
  clientSection: {
    width: "45%",
    alignItems: "flex-end",
  },
  clientBlock: {
    width: "100%",
    maxWidth: 180,
  },
  clientName: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 2,
    fontFamily: "Helvetica-Bold",
  },
  clientText: {
    fontSize: 9,
    color: COLORS.primary,
    lineHeight: 1.5,
  },
  // Invoice title section
  invoiceTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    marginTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  invoiceTitleText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  invoiceDate: {
    fontSize: 9,
    color: COLORS.secondary,
    textAlign: "right",
  },
  // Table
  table: {
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.accent,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  // Column widths
  colPosition: { width: "10%" },
  colQuantity: { width: "15%", textAlign: "center" },
  colDescription: { width: "50%" },
  colTotal: { width: "25%", textAlign: "right" },
  cellText: {
    fontSize: 9,
    color: COLORS.primary,
  },
  // Summary section
  summarySection: {
    marginTop: 10,
    marginLeft: "auto",
    width: "50%",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  summaryLabel: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  summaryValue: {
    fontSize: 9,
    color: COLORS.accent,
    fontWeight: "bold",
  },
  summaryDivider: {
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    marginVertical: 5,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  // Notes section
  notesSection: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 5,
  },
  notesText: {
    fontSize: 8,
    color: COLORS.secondary,
    lineHeight: 1.4,
  },
  // VAT note
  vatNote: {
    fontSize: 8,
    color: COLORS.secondary,
    marginTop: 15,
    fontStyle: "italic",
  },
  // Conditions (for quotes)
  conditionsSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: COLORS.light,
  },
  conditionsTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 5,
  },
  conditionsText: {
    fontSize: 8,
    color: COLORS.primary,
    lineHeight: 1.5,
  },
  // Deposit info for quotes
  depositInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#e8f5e9",
    borderLeftWidth: 3,
    borderLeftColor: "#4caf50",
  },
  depositTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 5,
  },
  depositText: {
    fontSize: 8,
    color: "#1b5e20",
    lineHeight: 1.5,
  },
  // Signature section
  signatureSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: COLORS.light,
  },
  signatureTitle: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 5,
  },
  signatureName: {
    fontSize: 12,
    fontStyle: "italic",
    marginBottom: 3,
  },
  signatureDate: {
    fontSize: 8,
    color: COLORS.secondary,
  },
  // QR-Bill section (full width image at bottom)
  qrBillSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 297, // 105mm in points
  },
  qrBillImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
});

// Get logo dimensions based on size setting
const getLogoDimensions = (size?: "small" | "medium" | "large") => {
  const sizes = {
    small: { width: 40, height: 40 },
    medium: { width: 50, height: 50 },
    large: { width: 60, height: 60 },
  };
  return sizes[size || "medium"];
};

// Format Swiss date (DD.MM.YYYY)
const formatSwissDate = (date: string | Date): string => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

interface SwissPDFDocumentProps {
  document: Invoice | BillingInvoice;
  type: "quote" | "billing";
  qrCodeDataUrl?: string;
}

export const SwissPDFDocument = ({ document: doc, type, qrCodeDataUrl }: SwissPDFDocumentProps) => {
  const isQuote = type === "quote";
  const isBilling = type === "billing";
  const title = isQuote ? "Devis" : "Facture";

  // Calculate totals
  const subtotal = doc.subtotal;
  let discountAmount = 0;
  if (doc.discount.value > 0) {
    if (doc.discount.type === "percentage") {
      discountAmount = (subtotal * doc.discount.value) / 100;
    } else {
      discountAmount = doc.discount.value;
    }
  }
  const totalHT = doc.totalAmount;

  // Check if we should show tax
  const billingDoc = doc as BillingInvoice;
  const showTax = billingDoc.showTax && billingDoc.taxRate && billingDoc.taxRate > 0;
  const taxRate = showTax ? billingDoc.taxRate : 0;
  const taxAmount = showTax ? (totalHT * taxRate) / 100 : 0;
  const totalTTC = totalHT + taxAmount;

  // For quotes, calculate deposit amount
  const quoteDoc = doc as Invoice;
  const depositPercent = isQuote ? quoteDoc.deposit : 0;
  const depositAmount = isQuote ? totalHT * (depositPercent / 100) : 0;

  // For billing invoices, check if deposit was deducted
  const depositDeducted = isBilling && billingDoc.depositDeducted;
  const originalTotal = depositDeducted ? billingDoc.originalTotal : undefined;
  const deductedAmount = depositDeducted ? billingDoc.depositAmount : undefined;

  // Determine if we should show QR-Bill
  const showQRBill = qrCodeDataUrl && doc.paymentAccount?.country === "CH";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.headerTopRow}>
              {/* Left: Logo + Company */}
              <View style={styles.companySection}>
                {doc.company.logo && (
                  <Image
                    src={doc.company.logo}
                    style={[styles.logo, getLogoDimensions(doc.company.logoSize)]}
                  />
                )}
                <Text style={styles.companyName}>{doc.company.name}</Text>
                <Text style={styles.companyText}>{doc.company.address}</Text>
                {(doc.company.postalCode || doc.company.city) && (
                  <Text style={styles.companyText}>
                    {doc.company.postalCode} {doc.company.city}
                  </Text>
                )}
              </View>

              {/* Right: Client */}
              <View style={styles.clientSection}>
                <View style={styles.clientBlock}>
                  <Text style={styles.clientName}>{doc.client.name}</Text>
                  {doc.client.address && (
                    <Text style={styles.clientText}>{doc.client.address}</Text>
                  )}
                  {(doc.client.postalCode || doc.client.city) && (
                    <Text style={styles.clientText}>
                      {doc.client.postalCode} {doc.client.city}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Invoice Title */}
          <View style={styles.invoiceTitle}>
            <Text style={styles.invoiceTitleText}>
              {title} Nr. {doc.number}
            </Text>
            <Text style={styles.invoiceDate}>
              {doc.company.city || "Genève"} {formatSwissDate(doc.date)}
            </Text>
          </View>

          {/* Services Table */}
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colPosition]}>Position</Text>
              <Text style={[styles.tableHeaderText, styles.colQuantity]}>Quantité</Text>
              <Text style={[styles.tableHeaderText, styles.colDescription]}>Description</Text>
              <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
            </View>

            {/* Table Rows */}
            {doc.services.map((service, index) => (
              <View key={service.id} style={styles.tableRow}>
                <Text style={[styles.cellText, styles.colPosition]}>{index + 1}</Text>
                <Text style={[styles.cellText, styles.colQuantity]}>{service.quantity}</Text>
                <Text style={[styles.cellText, styles.colDescription]}>{service.description}</Text>
                <Text style={[styles.cellText, styles.colTotal]}>
                  CHF {formatSwissNumber(service.amount)}
                </Text>
              </View>
            ))}
          </View>

          {/* Summary Section */}
          <View style={styles.summarySection}>
            {/* Original total if deposit deducted */}
            {depositDeducted && originalTotal && (
              <>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { fontWeight: "normal" }]}>Total du devis</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.secondary }]}>
                    CHF {formatSwissNumber(originalTotal)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { fontWeight: "normal", color: "#4caf50" }]}>
                    Acompte versé ({billingDoc.depositPercent}%)
                  </Text>
                  <Text style={[styles.summaryValue, { color: "#4caf50" }]}>
                    - CHF {formatSwissNumber(deductedAmount || 0)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
              </>
            )}

            {/* Subtotal */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {depositDeducted ? "Solde" : "Somme"}
              </Text>
              <Text style={styles.summaryValue}>CHF {formatSwissNumber(subtotal)}</Text>
            </View>

            {/* Discount */}
            {discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Remise {doc.discount.type === "percentage" ? `(${doc.discount.value}%)` : ""}
                </Text>
                <Text style={styles.summaryValue}>- CHF {formatSwissNumber(discountAmount)}</Text>
              </View>
            )}

            {/* Total HT if showing tax */}
            {showTax && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total HT</Text>
                  <Text style={styles.summaryValue}>CHF {formatSwissNumber(totalHT)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { fontWeight: "normal" }]}>TVA</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{taxRate}%</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { fontWeight: "normal" }]}>Montant TVA</Text>
                  <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
                    CHF {formatSwissNumber(taxAmount)}
                  </Text>
                </View>
              </>
            )}

            {/* Grand Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{showTax ? "Total TTC" : "Total"}</Text>
              <Text style={styles.totalValue}>CHF {formatSwissNumber(totalTTC)}</Text>
            </View>
          </View>

          {/* Conditions (for quotes) */}
          {isQuote && (
            <View style={styles.conditionsSection}>
              <Text style={styles.conditionsTitle}>Conditions</Text>
              <Text style={styles.conditionsText}>
                Délai de livraison : {quoteDoc.deliveryTime}
              </Text>
              <Text style={styles.conditionsText}>
                Conditions de paiement : {quoteDoc.paymentTerms}
              </Text>
              <Text style={styles.conditionsText}>
                Validité : {formatSwissDate(quoteDoc.validUntil)}
              </Text>
            </View>
          )}

          {/* Deposit info for quotes with QR-Bill */}
          {isQuote && depositPercent > 0 && showQRBill && (
            <View style={styles.depositInfo}>
              <Text style={styles.depositTitle}>Acompte demandé</Text>
              <Text style={styles.depositText}>
                Acompte : {depositPercent}% soit CHF {formatSwissNumber(depositAmount)}
              </Text>
              <Text style={styles.depositText}>
                Solde à la livraison : CHF {formatSwissNumber(quoteDoc.remainingBalance)}
              </Text>
              <Text style={styles.depositText}>
                Veuillez utiliser le bulletin de versement ci-dessous pour régler l'acompte.
              </Text>
            </View>
          )}

          {/* Notes (for billing invoices) */}
          {isBilling && billingDoc.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Remarques</Text>
              <Text style={styles.notesText}>{billingDoc.notes}</Text>
            </View>
          )}

          {/* VAT Note */}
          {!showTax && (
            <Text style={styles.vatNote}>
              Entreprise non assujettie à la TVA (art. 10 al. 2 let. a LTVA)
            </Text>
          )}

          {/* Signature Section (for quotes) */}
          {isQuote && quoteDoc.signature && (
            <View style={styles.signatureSection}>
              <Text style={styles.signatureTitle}>Signature client</Text>
              <Text style={styles.signatureName}>{quoteDoc.signature?.name}</Text>
              <Text style={styles.signatureDate}>
                Signé électroniquement le{" "}
                {quoteDoc.signature?.signedAt
                  ? formatSwissDate(quoteDoc.signature.signedAt)
                  : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Swiss QR-Bill Section (generated by swissqrbill library) */}
        {showQRBill && (
          <View style={styles.qrBillSection}>
            <Image src={qrCodeDataUrl} style={styles.qrBillImage} />
          </View>
        )}
      </Page>
    </Document>
  );
};
