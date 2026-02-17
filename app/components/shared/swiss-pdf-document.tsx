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
    padding: "30 40",
    paddingBottom: 10, // Leave space for QR-Bill
  },
  // Header container - compact
  headerContainer: {
    marginBottom: 5,
  },
  // Top row: Logo + Company info on same line
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 0,
  },
  // Logo container
  logoContainer: {
    marginRight: 6,
  },
  logo: {
    // dimensions set dynamically
  },
  // Company info next to logo
  companyInfo: {
    flex: 1,
    justifyContent: "center",
  },
  companyName: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 15,
    marginBottom: 0,
    fontFamily: "Helvetica-Bold",
  },
  companyText: {
    fontSize: 8,
    color: COLORS.secondary,
    lineHeight: 1.4,
  },
  // Client section - below company
  clientSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  clientLabel: {
    fontSize: 7,
    color: COLORS.secondary,
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clientName: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 2,
    fontFamily: "Helvetica-Bold",
  },
  clientText: {
    fontSize: 8,
    color: COLORS.primary,
    lineHeight: 1.4,
  },
  // Invoice title section - more compact
  invoiceTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
    marginTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.accent,
  },
  invoiceTitleText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.primary,
    fontFamily: "Helvetica-Bold",
  },
  invoiceDate: {
    fontSize: 8,
    color: COLORS.secondary,
    textAlign: "right",
  },
  // Table - more compact
  table: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.accent,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableHeaderText: {
    color: COLORS.white,
    fontSize: 7,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  // Column widths
  colPosition: { width: "10%" },
  colQuantity: { width: "15%", textAlign: "center" },
  colDescription: { width: "50%" },
  colTotal: { width: "25%", textAlign: "right" },
  cellText: {
    fontSize: 8.5,
    color: COLORS.primary,
  },
  // Summary section - compact
  summarySection: {
    marginTop: 8,
    marginLeft: "auto",
    width: "45%",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  summaryLabel: {
    fontSize: 8,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  summaryValue: {
    fontSize: 8,
    color: COLORS.accent,
    fontWeight: "bold",
  },
  summaryDivider: {
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    marginVertical: 3,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: 3,
  },
  totalLabel: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  // Notes section - compact
  notesSection: {
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  notesTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 3,
  },
  notesText: {
    fontSize: 7,
    color: COLORS.secondary,
    lineHeight: 1.3,
  },
  // VAT note - compact
  vatNote: {
    fontSize: 7,
    color: COLORS.secondary,
    marginTop: 8,
    fontStyle: "italic",
  },
  // Conditions (for quotes) - compact
  conditionsSection: {
    marginTop: 10,
    padding: 6,
    backgroundColor: COLORS.light,
  },
  conditionsTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 3,
  },
  conditionsText: {
    fontSize: 7,
    color: COLORS.primary,
    lineHeight: 1.4,
  },
  // Deposit info for quotes - compact
  depositInfo: {
    marginTop: 8,
    padding: 6,
    backgroundColor: "#e8f5e9",
    borderLeftWidth: 2,
    borderLeftColor: "#4caf50",
  },
  depositTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 3,
  },
  depositText: {
    fontSize: 7,
    color: "#1b5e20",
    lineHeight: 1.2,
  },
  // Signature section - compact
  signatureSection: {
    marginTop: 10,
    padding: 6,
    backgroundColor: COLORS.light,
  },
  signatureTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 3,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: "Courier",
    fontStyle: "italic",
    marginBottom: 2,
  },
  signatureDate: {
    fontSize: 7,
    color: COLORS.secondary,
  },
  // Payment account section (for non-QR-Bill cases)
  paymentAccountSection: {
    marginTop: 10,
    padding: 8,
    backgroundColor: COLORS.light,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.accent,
  },
  paymentAccountTitle: {
    fontSize: 8,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  paymentAccountRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  paymentAccountLabel: {
    fontSize: 7.5,
    color: COLORS.secondary,
    width: 70,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
  },
  paymentAccountValue: {
    fontSize: 7.5,
    color: COLORS.primary,
    flex: 1,
  },
  // QR Code for EPC (non-Swiss QR-Bill)
  qrSection: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  qrContainer: {
    alignItems: "center",
    padding: 8,
    backgroundColor: COLORS.light,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  qrCode: {
    width: 70,
    height: 70,
    marginBottom: 4,
  },
  qrLabel: {
    fontSize: 6.5,
    color: COLORS.secondary,
    textAlign: "center",
  },
  qrAmount: {
    fontSize: 8,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
    color: COLORS.accent,
    textAlign: "center",
    marginTop: 2,
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
const formatSwissDate = (date: string | Date | any): string => {
  // Handle Firestore Timestamp objects
  const d = date?.toDate ? date.toDate() : date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
  if (isNaN(d.getTime())) return "";
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
  const currencySymbol = doc.currency === "EUR" ? "EUR" : "CHF";

  // Calculate totals
  const subtotal = doc.subtotal;
  let discountAmount = 0;
  if (doc.discount?.value > 0) {
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

  // Determine if we should show QR-Bill (Swiss QR at bottom of page)
  const showQRBill = qrCodeDataUrl && doc.paymentAccount?.country === "CH";
  // Show payment account details (IBAN/BIC) when no Swiss QR-Bill
  const showPaymentAccount = doc.paymentAccount && !showQRBill;
  // Show EPC QR code inline when available but not a Swiss QR-Bill
  const showEpcQR = qrCodeDataUrl && !showQRBill;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Header */}
          <View style={styles.headerContainer}>
            {/* Top row: Logo + Company info */}
            <View style={styles.headerTopRow}>
              {doc.company.logo && (
                <View style={styles.logoContainer}>
                  <Image
                    src={doc.company.logo}
                    style={[styles.logo, getLogoDimensions(doc.company.logoSize)]}
                  />
                </View>
              )}
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>{doc.company.name}</Text>
                <Text style={styles.companyText}>
                  {doc.company.address}
                  {(doc.company.postalCode || doc.company.city) &&
                    `, ${doc.company.postalCode || ""} ${doc.company.city || ""}`.trim()}
                </Text>
              </View>
            </View>

            {/* Client section below */}
            <View style={styles.clientSection}>
              <Text style={styles.clientLabel}>Destinataire</Text>
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
                  {currencySymbol} {formatSwissNumber(service.amount)}
                </Text>
              </View>
            ))}
          </View>

          {/* Summary Section */}
          <View style={styles.summarySection}>
            {isBilling ? (
              (() => {
                const hasDeposit = depositDeducted && originalTotal;
                const additionalServicesTotal = billingDoc.additionalServicesTotal || 0;
                const hasAdditional = additionalServicesTotal > 0;
                const soldeHT = hasDeposit
                  ? (originalTotal || 0) - (deductedAmount || 0)
                  : totalHT - additionalServicesTotal;

                return (
                  <>
                    {/* Discount - shown before Total devis for clarity */}
                    {discountAmount > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>
                          Remise {doc.discount.type === "percentage" ? `(${doc.discount.value}%)` : ""}
                        </Text>
                        <Text style={styles.summaryValue}>-{currencySymbol} {formatSwissNumber(discountAmount)}</Text>
                      </View>
                    )}
                    {/* Total devis */}
                    {hasDeposit && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { fontWeight: "normal" }]}>Total devis</Text>
                        <Text style={[styles.summaryValue, { color: COLORS.secondary }]}>
                          {currencySymbol} {formatSwissNumber(originalTotal || 0)}
                        </Text>
                      </View>
                    )}
                    {/* Acompte versé */}
                    {hasDeposit && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { fontWeight: "normal", color: "#4caf50" }]}>
                          Acompte versé
                        </Text>
                        <Text style={[styles.summaryValue, { color: "#4caf50" }]}>
                          -{currencySymbol} {formatSwissNumber(deductedAmount || 0)}
                        </Text>
                      </View>
                    )}
                    {/* Solde HT */}
                    {hasDeposit && (
                      <>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Solde HT</Text>
                          <Text style={styles.summaryValue}>
                            {currencySymbol} {formatSwissNumber(soldeHT)}
                          </Text>
                        </View>
                      </>
                    )}
                    {/* If no deposit, show base amount */}
                    {!hasDeposit && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Montant HT</Text>
                        <Text style={styles.summaryValue}>
                          {currencySymbol} {formatSwissNumber(totalHT - additionalServicesTotal)}
                        </Text>
                      </View>
                    )}
                    {/* Services additionnels */}
                    {hasAdditional && (
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { fontWeight: "normal", color: "#d97706" }]}>
                          Services additionnels
                        </Text>
                        <Text style={[styles.summaryValue, { color: "#d97706" }]}>
                          +{currencySymbol} {formatSwissNumber(additionalServicesTotal)}
                        </Text>
                      </View>
                    )}
                    {/* TVA if applicable */}
                    {showTax && (
                      <>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                          <Text style={[styles.summaryLabel, { fontWeight: "normal" }]}>TVA ({taxRate}%)</Text>
                          <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
                            {currencySymbol} {formatSwissNumber(taxAmount)}
                          </Text>
                        </View>
                      </>
                    )}
                    {/* Total final */}
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>{showTax ? "Total TTC" : "Total"}</Text>
                      <Text style={styles.totalValue}>{currencySymbol} {formatSwissNumber(totalTTC)}</Text>
                    </View>
                  </>
                );
              })()
            ) : (
              <>
                {/* Quote summary (unchanged) */}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Somme</Text>
                  <Text style={styles.summaryValue}>{currencySymbol} {formatSwissNumber(subtotal)}</Text>
                </View>
                {discountAmount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Remise {doc.discount.type === "percentage" ? `(${doc.discount.value}%)` : ""}
                    </Text>
                    <Text style={styles.summaryValue}>-{currencySymbol} {formatSwissNumber(discountAmount)}</Text>
                  </View>
                )}
                {showTax && (
                  <>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total HT</Text>
                      <Text style={styles.summaryValue}>{currencySymbol} {formatSwissNumber(totalHT)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { fontWeight: "normal" }]}>TVA</Text>
                      <Text style={[styles.summaryValue, { color: COLORS.primary }]}>{taxRate}%</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { fontWeight: "normal" }]}>Montant TVA</Text>
                      <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
                        {currencySymbol} {formatSwissNumber(taxAmount)}
                      </Text>
                    </View>
                  </>
                )}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{showTax ? "Total TTC" : "Total"}</Text>
                  <Text style={styles.totalValue}>{currencySymbol} {formatSwissNumber(totalTTC)}</Text>
                </View>
              </>
            )}
          </View>

          {/* Conditions (for quotes) */}
          {isQuote && (
            <View style={styles.conditionsSection}>
              {/* <Text style={styles.conditionsTitle}>Conditions</Text> */}
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
              {/* <Text style={styles.depositTitle}>Acompte demandé</Text> */}
              <Text style={styles.depositText}>
                Acompte : {depositPercent}% soit {currencySymbol} {formatSwissNumber(depositAmount)}
              </Text>
              <Text style={styles.depositText}>
                Solde à la livraison : {currencySymbol} {formatSwissNumber(quoteDoc.remainingBalance)}
              </Text>
              {/* <Text style={styles.depositText}>
                Veuillez utiliser le bulletin de versement ci-dessous pour régler l'acompte.
              </Text> */}
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

          {/* Payment Account Details (when no Swiss QR-Bill) */}
          {showPaymentAccount && (
            <View style={{ flexDirection: "row", marginTop: 10, gap: 10 }}>
              <View style={[styles.paymentAccountSection, { flex: 1 }]}>
                <Text style={styles.paymentAccountTitle}>Coordonnées bancaires</Text>
                <View style={styles.paymentAccountRow}>
                  <Text style={styles.paymentAccountLabel}>IBAN :</Text>
                  <Text style={styles.paymentAccountValue}>
                    {doc.paymentAccount!.iban}
                  </Text>
                </View>
                <View style={styles.paymentAccountRow}>
                  <Text style={styles.paymentAccountLabel}>BIC / SWIFT :</Text>
                  <Text style={styles.paymentAccountValue}>
                    {doc.paymentAccount!.bic}
                  </Text>
                </View>
                <View style={styles.paymentAccountRow}>
                  <Text style={styles.paymentAccountLabel}>Titulaire :</Text>
                  <Text style={styles.paymentAccountValue}>
                    {doc.paymentAccount!.accountHolder}
                  </Text>
                </View>
              </View>

              {/* EPC QR Code alongside payment details */}
              {showEpcQR && (
                <View style={styles.qrContainer}>
                  <Image src={qrCodeDataUrl} style={styles.qrCode} />
                  <Text style={styles.qrLabel}>Scannez pour payer</Text>
                  <Text style={styles.qrAmount}>
                    {currencySymbol} {formatSwissNumber(showTax ? totalTTC : totalHT)}
                  </Text>
                </View>
              )}
            </View>
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
