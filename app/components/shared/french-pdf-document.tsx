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
import { formatFrenchNumber } from "@/lib/swiss-utils";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#333333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: "2px solid #2563eb",
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  logo: {
    width: 150,
    height: 60,
  },
  title: {
    fontSize: 24,
    color: "#2563eb",
    marginBottom: 5,
    fontWeight: "bold",
  },
  invoiceNumber: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: "#6b7280",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#1f2937",
    textTransform: "uppercase",
  },
  companyInfo: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  table: {
    marginVertical: 15,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 6,
    fontWeight: "bold",
    fontSize: 10,
    borderBottom: "1px solid #e5e7eb",
  },
  tableRow: {
    flexDirection: "row",
    padding: 6,
    borderBottom: "1px solid #e5e7eb",
    fontSize: 10,
    minHeight: 25,
  },
  col1: { width: "8%", paddingRight: 4 },
  col2: { width: "52%", paddingRight: 4 },
  col3: { width: "20%", paddingRight: 4, textAlign: "right" },
  col4: { width: "20%", textAlign: "right" },
  totalsSection: {
    marginTop: 15,
    marginLeft: "auto",
    width: "40%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "4px 0",
    fontSize: 10,
  },
  totalRowBold: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "4px 0",
    fontWeight: "bold",
    borderTop: "2px solid #2563eb",
    marginTop: 4,
    fontSize: 11,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
  },
  footerText: {
    fontSize: 9,
    color: "#6b7280",
    textAlign: "center",
    borderTop: "1px solid #e5e7eb",
    paddingTop: 10,
  },
  conditions: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  conditionsTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#1f2937",
  },
  conditionsText: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.4,
  },
  paymentAccount: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#f0f9ff",
    borderRadius: 4,
    borderLeft: "3px solid #2563eb",
  },
  paymentAccountTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#1f2937",
  },
  paymentAccountRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  paymentAccountLabel: {
    fontSize: 9,
    color: "#4b5563",
    width: 80,
    fontWeight: "bold",
  },
  paymentAccountValue: {
    fontSize: 9,
    color: "#1f2937",
    flex: 1,
  },
  signatureSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f0fdf4",
    borderRadius: 4,
    borderLeft: "3px solid #10b981",
  },
  signatureTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 8,
  },
  signatureName: {
    fontSize: 18,
    color: "#1e3a5f",
    fontStyle: "italic",
    marginBottom: 4,
  },
  signatureDate: {
    fontSize: 8,
    color: "#6b7280",
  },
  // QR Code section for French invoices
  qrSection: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  qrContainer: {
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
  },
  qrCode: {
    width: 80,
    height: 80,
    marginBottom: 5,
  },
  qrLabel: {
    fontSize: 7,
    color: "#64748b",
    textAlign: "center",
  },
  qrAmount: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1e40af",
    textAlign: "center",
    marginTop: 2,
  },
});

// Get logo dimensions based on size setting
const getLogoDimensions = (size?: "small" | "medium" | "large") => {
  const sizes = {
    small: { width: 70, height: 60 },
    medium: { width: 100, height: 75 },
    large: { width: 130, height: 85 },
  };
  return sizes[size || "medium"];
};

interface FrenchPDFDocumentProps {
  document: Invoice | BillingInvoice;
  type: "quote" | "billing";
  qrCodeDataUrl?: string;
}

export const FrenchPDFDocument = ({ document, type, qrCodeDataUrl }: FrenchPDFDocumentProps) => {
  const isQuote = type === "quote";
  const title = isQuote ? "DEVIS" : "FACTURE";
  const currencySymbol = document.currency === "CHF" ? "CHF" : "€";
  const vatMessage = "TVA non applicable, art. 293 B du CGI";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.invoiceNumber}>N° {document.number}</Text>
            <Text style={styles.date}>
              Date: {new Date(document.date).toLocaleDateString("fr-FR")}
            </Text>
            {isQuote ? (
              <Text style={styles.date}>
                Valable jusqu'au:{" "}
                {new Date(
                  (document as Invoice).validUntil
                ).toLocaleDateString("fr-FR")}
              </Text>
            ) : (
              <Text style={styles.date}>
                Devis associe: {(document as BillingInvoice).quoteNumber}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            {document.company.logo && (
              <Image
                src={document.company.logo}
                style={getLogoDimensions(document.company.logoSize)}
              />
            )}
          </View>
        </View>

        <View style={{ flexDirection: "row", marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Emetteur</Text>
            <Text style={styles.companyInfo}>{document.company.name}</Text>
            <Text style={styles.companyInfo}>{document.company.address}</Text>
            <Text style={styles.companyInfo}>
              SIREN: {document.company.siren}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Client</Text>
            <Text style={styles.companyInfo}>{document.client.name}</Text>
            <Text style={styles.companyInfo}>{document.client.address}</Text>
            {document.client.siren && (
              <Text style={styles.companyInfo}>
                SIREN: {document.client.siren}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Qte</Text>
            <Text style={styles.col2}>Description</Text>
            <Text style={styles.col3}>Prix unitaire</Text>
            <Text style={styles.col4}>Montant</Text>
          </View>

          {document.services.map((service) => (
            <View key={service.id} style={styles.tableRow}>
              <Text style={styles.col1}>{service.quantity}</Text>
              <Text style={styles.col2}>{service.description}</Text>
              <Text style={styles.col3}>
                {formatFrenchNumber(service.unitPrice)} {currencySymbol}
              </Text>
              <Text style={styles.col4}>
                {formatFrenchNumber(service.amount)} {currencySymbol}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsSection}>
          {isQuote ? (
            (document as Invoice).showTax ? (
              <>
                <View style={styles.totalRow}>
                  <Text>Montant HT :</Text>
                  <Text>
                    {formatFrenchNumber((document as Invoice).subtotal)}{" "}
                    {currencySymbol}
                  </Text>
                </View>
                {(document as Invoice).discount.value > 0 && (
                  <View style={styles.totalRow}>
                    <Text>Remise :</Text>
                    <Text>
                      {(document as Invoice).discount.type === "percentage"
                        ? `${(document as Invoice).discount.value}%`
                        : `${formatFrenchNumber(
                            (document as Invoice).discount.value
                          )} ${currencySymbol}`}
                    </Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text>Total HT :</Text>
                  <Text>
                    {formatFrenchNumber(document.totalAmount)} {currencySymbol}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text>TVA (20%) :</Text>
                  <Text>
                    {formatFrenchNumber(document.totalAmount * 0.2)}{" "}
                    {currencySymbol}
                  </Text>
                </View>
                <View style={styles.totalRowBold}>
                  <Text>Total TTC :</Text>
                  <Text>
                    {formatFrenchNumber(document.totalAmount * 1.2)}{" "}
                    {currencySymbol}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text>Acompte ({(document as Invoice).deposit}%):</Text>
                  <Text>
                    {formatFrenchNumber(
                      (document.totalAmount * (document as Invoice).deposit) / 100
                    )}{" "}
                    {currencySymbol}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text>Solde:</Text>
                  <Text>
                    {formatFrenchNumber((document as Invoice).remainingBalance)}{" "}
                    {currencySymbol}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.totalRow}>
                  <Text>Total HT :</Text>
                  <Text>
                    {formatFrenchNumber((document as Invoice).subtotal)}{" "}
                    {currencySymbol}
                  </Text>
                </View>
                {(document as Invoice).discount.value > 0 && (
                  <View style={styles.totalRow}>
                    <Text>Remise :</Text>
                    <Text>
                      {(document as Invoice).discount.type === "percentage"
                        ? `${(document as Invoice).discount.value}%`
                        : `${formatFrenchNumber(
                            (document as Invoice).discount.value
                          )} ${currencySymbol}`}
                    </Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text>Acompte ({(document as Invoice).deposit}%) :</Text>
                  <Text>
                    {formatFrenchNumber(
                      (document.totalAmount * (document as Invoice).deposit) / 100
                    )}{" "}
                    {currencySymbol}
                  </Text>
                </View>
                <View style={styles.totalRowBold}>
                  <Text>Total TTC :</Text>
                  <Text>
                    {formatFrenchNumber(document.totalAmount)} {currencySymbol}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={{ fontSize: 8 }}>{vatMessage}</Text>
                </View>
              </>
            )
          ) : (document as BillingInvoice).showTax ? (
            <>
              {/* Show deposit deduction if applicable */}
              {(document as BillingInvoice).depositDeducted && (document as BillingInvoice).originalTotal && (
                <>
                  <View style={styles.totalRow}>
                    <Text>Total du devis :</Text>
                    <Text>
                      {formatFrenchNumber((document as BillingInvoice).originalTotal || 0)}{" "}
                      {currencySymbol}
                    </Text>
                  </View>
                  <View style={[styles.totalRow, { color: "#4caf50" }]}>
                    <Text style={{ color: "#4caf50" }}>
                      Acompte versé ({(document as BillingInvoice).depositPercent}%) :
                    </Text>
                    <Text style={{ color: "#4caf50" }}>
                      - {formatFrenchNumber((document as BillingInvoice).depositAmount || 0)}{" "}
                      {currencySymbol}
                    </Text>
                  </View>
                </>
              )}
              <View style={styles.totalRow}>
                <Text>Montant HT :</Text>
                <Text>
                  {formatFrenchNumber((document as BillingInvoice).subtotal)}{" "}
                  {currencySymbol}
                </Text>
              </View>
              {(document as BillingInvoice).discount.value > 0 && (
                <View style={styles.totalRow}>
                  <Text>Remise :</Text>
                  <Text>
                    {(document as BillingInvoice).discount.type === "percentage"
                      ? `${(document as BillingInvoice).discount.value}%`
                      : `${formatFrenchNumber(
                          (document as BillingInvoice).discount.value
                        )} ${currencySymbol}`}
                  </Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text>{(document as BillingInvoice).depositDeducted ? "Solde HT :" : "Total HT :"}</Text>
                <Text>
                  {formatFrenchNumber(document.totalAmount)} {currencySymbol}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text>TVA ({(document as BillingInvoice).taxRate}%):</Text>
                <Text>
                  {formatFrenchNumber((document as BillingInvoice).taxAmount)}{" "}
                  {currencySymbol}
                </Text>
              </View>
              <View style={styles.totalRowBold}>
                <Text>{(document as BillingInvoice).depositDeducted ? "Solde TTC:" : "Total TTC:"}</Text>
                <Text>
                  {formatFrenchNumber((document as BillingInvoice).totalWithTax)}{" "}
                  {currencySymbol}
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* Show deposit deduction if applicable */}
              {(document as BillingInvoice).depositDeducted && (document as BillingInvoice).originalTotal && (
                <>
                  <View style={styles.totalRow}>
                    <Text>Total du devis :</Text>
                    <Text>
                      {formatFrenchNumber((document as BillingInvoice).originalTotal || 0)}{" "}
                      {currencySymbol}
                    </Text>
                  </View>
                  <View style={[styles.totalRow, { color: "#4caf50" }]}>
                    <Text style={{ color: "#4caf50" }}>
                      Acompte versé ({(document as BillingInvoice).depositPercent}%) :
                    </Text>
                    <Text style={{ color: "#4caf50" }}>
                      - {formatFrenchNumber((document as BillingInvoice).depositAmount || 0)}{" "}
                      {currencySymbol}
                    </Text>
                  </View>
                </>
              )}
              <View style={styles.totalRow}>
                <Text>Montant :</Text>
                <Text>
                  {formatFrenchNumber((document as BillingInvoice).subtotal)}{" "}
                  {currencySymbol}
                </Text>
              </View>
              {(document as BillingInvoice).discount.value > 0 && (
                <View style={styles.totalRow}>
                  <Text>Remise :</Text>
                  <Text>
                    {(document as BillingInvoice).discount.type === "percentage"
                      ? `${(document as BillingInvoice).discount.value}%`
                      : `${formatFrenchNumber(
                          (document as BillingInvoice).discount.value
                        )} ${currencySymbol}`}
                  </Text>
                </View>
              )}
              <View style={styles.totalRow}>
                <Text>{(document as BillingInvoice).depositDeducted ? "Solde à payer :" : "Net a payer :"}</Text>
                <Text>
                  {formatFrenchNumber(document.totalAmount)} {currencySymbol}
                </Text>
              </View>
              <View style={styles.totalRowBold}>
                <Text style={{ fontSize: 8 }}>{vatMessage}</Text>
              </View>
            </>
          )}
        </View>

        {isQuote ? (
          <View style={styles.conditions}>
            {/* <Text style={styles.conditionsTitle}>Conditions</Text> */}
            <Text style={styles.conditionsText}>
              Delai de livraison: {(document as Invoice).deliveryTime}
            </Text>
            <Text style={styles.conditionsText}>
              Conditions de paiement: {(document as Invoice).paymentTerms}
            </Text>
          </View>
        ) : (
          (document as BillingInvoice).notes && (
            <View style={styles.conditions}>
              <Text style={styles.conditionsTitle}>Notes</Text>
              <Text style={styles.conditionsText}>
                {(document as BillingInvoice).notes}
              </Text>
            </View>
          )
        )}

        {/* Payment Account Section with QR Code */}
        {document.paymentAccount && (
          <View style={{ flexDirection: "row", marginTop: 15, gap: 15 }}>
            <View style={[styles.paymentAccount, { flex: 1 }]}>
              <Text style={styles.paymentAccountTitle}>Coordonnees bancaires</Text>
              <View style={styles.paymentAccountRow}>
                <Text style={styles.paymentAccountLabel}>IBAN :</Text>
                <Text style={styles.paymentAccountValue}>
                  {document.paymentAccount.iban}
                </Text>
              </View>
              <View style={styles.paymentAccountRow}>
                <Text style={styles.paymentAccountLabel}>BIC / SWIFT :</Text>
                <Text style={styles.paymentAccountValue}>
                  {document.paymentAccount.bic}
                </Text>
              </View>
              <View style={styles.paymentAccountRow}>
                <Text style={styles.paymentAccountLabel}>Titulaire :</Text>
                <Text style={styles.paymentAccountValue}>
                  {document.paymentAccount.accountHolder}
                </Text>
              </View>
            </View>

            {/* QR Code for payment (French invoices) */}
            {!isQuote && qrCodeDataUrl && (
              <View style={styles.qrContainer}>
                <Image src={qrCodeDataUrl} style={styles.qrCode} />
                <Text style={styles.qrLabel}>Scannez pour payer</Text>
                <Text style={styles.qrAmount}>
                  {formatFrenchNumber(
                    (document as BillingInvoice).showTax
                      ? (document as BillingInvoice).totalWithTax
                      : document.totalAmount
                  )} {currencySymbol}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Signature Section */}
        {isQuote && (document as Invoice).signature && (
          <View style={styles.signatureSection}>
            <Text style={styles.signatureTitle}>Signature client</Text>
            <Text style={styles.signatureName}>
              {(document as Invoice).signature?.name}
            </Text>
            <Text style={styles.signatureDate}>
              Signe electroniquement le{" "}
              {(document as Invoice).signature?.signedAt
                ? new Date(
                    (document as Invoice).signature!.signedAt!
                  ).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : ""}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isQuote
              ? `Ce devis est valable jusqu'au ${new Date(
                  (document as Invoice).validUntil
                ).toLocaleDateString("fr-FR")}.
              Pour toute question, n'hesitez pas a nous contacter.`
              : `Date d'echeance : ${new Date(
                  (document as BillingInvoice).dueDate
                ).toLocaleDateString("fr-FR")}`}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
