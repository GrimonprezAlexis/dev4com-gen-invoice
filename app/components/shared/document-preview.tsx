"use client";

import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  PDFViewer,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Invoice, BillingInvoice } from "@/app/types";
import Image from "next/image";

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
  highlight: {
    color: "#2563eb",
  },
});

interface DocumentPreviewProps {
  document: Invoice | BillingInvoice;
  type: "quote" | "billing";
}

const formatNumber = (number: number) => {
  return number
    .toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    })
    .replace(/\s/g, " ");
};

// Separate Document component for reuse in downloads
export const PDFDocument = ({ document, type }: DocumentPreviewProps) => {
  const isQuote = type === "quote";
  const title = isQuote ? "DEVIS" : "FACTURE";
  const currencySymbol = document.currency === "CHF" ? "CHF" : "€";

  return (
    <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.invoiceNumber}>N° {document.number}</Text>
              <Text style={styles.date}>
                Date: {new Date(document.date).toLocaleDateString()}
              </Text>
              {isQuote ? (
                <Text style={styles.date}>
                  Valable jusqu&apos;au:{" "}
                  {new Date(
                    (document as Invoice).validUntil
                  ).toLocaleDateString()}
                </Text>
              ) : (
                <Text style={styles.date}>
                  Devis associé: {(document as BillingInvoice).quoteNumber}
                </Text>
              )}
            </View>
            <View style={styles.headerRight}>
              {document.company.logo && (
                <Image
                  src={document.company.logo}
                  style={styles.logo}
                  alt="Logo de l'entreprise"
                />
              )}
            </View>
          </View>

          <View style={{ flexDirection: "row", marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Émetteur</Text>
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
              <Text style={styles.companyInfo}>
                SIREN: {document.client.siren}
              </Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>Qté</Text>
              <Text style={styles.col2}>Description</Text>
              <Text style={styles.col3}>Prix unitaire</Text>
              <Text style={styles.col4}>Montant</Text>
            </View>

            {document.services.map((service) => (
              <View key={service.id} style={styles.tableRow}>
                <Text style={styles.col1}>{service.quantity}</Text>
                <Text style={styles.col2}>{service.description}</Text>
                <Text style={styles.col3}>
                  {formatNumber(service.unitPrice)} {currencySymbol}
                </Text>
                <Text style={styles.col4}>
                  {formatNumber(service.amount)} {currencySymbol}
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
                      {formatNumber((document as Invoice).subtotal)}{" "}
                      {currencySymbol}
                    </Text>
                  </View>
                  {(document as Invoice).discount.value > 0 && (
                    <View style={styles.totalRow}>
                      <Text>Remise :</Text>
                      <Text>
                        {(document as Invoice).discount.type === "percentage"
                          ? `${(document as Invoice).discount.value}%`
                          : `${formatNumber(
                              (document as Invoice).discount.value
                            )} ${currencySymbol}`}
                      </Text>
                    </View>
                  )}
                  <View style={styles.totalRow}>
                    <Text>Total HT :</Text>
                    <Text>
                      {formatNumber(document.totalAmount)} {currencySymbol}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text>
                      TVA ({document.currency === "EUR" ? "20" : "8.1"}%):
                    </Text>
                    <Text>
                      {formatNumber(
                        document.totalAmount *
                          (document.currency === "EUR" ? 0.2 : 0.081)
                      )}{" "}
                      {currencySymbol}
                    </Text>
                  </View>
                  <View style={styles.totalRowBold}>
                    <Text>Total TTC :</Text>
                    <Text>
                      {formatNumber(
                        document.totalAmount *
                          (1 + (document.currency === "EUR" ? 0.2 : 0.081))
                      )}{" "}
                      {currencySymbol}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text>Acompte ({(document as Invoice).deposit}%):</Text>
                    <Text>
                      {formatNumber(
                        (document.totalAmount * (document as Invoice).deposit) /
                          100
                      )}{" "}
                      {currencySymbol}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text>Solde:</Text>
                    <Text>
                      {formatNumber((document as Invoice).remainingBalance)}{" "}
                      {currencySymbol}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.totalRow}>
                    <Text>Montant :</Text>
                    <Text>
                      {formatNumber((document as Invoice).subtotal)}{" "}
                      {currencySymbol}
                    </Text>
                  </View>
                  {(document as Invoice).discount.value > 0 && (
                    <View style={styles.totalRow}>
                      <Text>Remise :</Text>
                      <Text>
                        {(document as Invoice).discount.type === "percentage"
                          ? `${(document as Invoice).discount.value}%`
                          : `${formatNumber(
                              (document as Invoice).discount.value
                            )} ${currencySymbol}`}
                      </Text>
                    </View>
                  )}
                  <View style={styles.totalRow}>
                    <Text>Total Remise :</Text>
                    <Text>
                      {formatNumber(document.totalAmount)} {currencySymbol}
                    </Text>
                  </View>
                  <View style={styles.totalRowBold}>
                    <Text style={{ fontSize: 8 }}>
                      TVA non applicable, art. 293 B CGI
                    </Text>
                  </View>
                </>
              )
            ) : (document as BillingInvoice).showTax ? (
              <>
                <View style={styles.totalRow}>
                  <Text>Montant HT :</Text>
                  <Text>
                    {formatNumber((document as BillingInvoice).subtotal)}{" "}
                    {currencySymbol}
                  </Text>
                </View>
                {(document as BillingInvoice).discount.value > 0 && (
                  <View style={styles.totalRow}>
                    <Text>Remise :</Text>
                    <Text>
                      {(document as BillingInvoice).discount.type === "percentage"
                        ? `${(document as BillingInvoice).discount.value}%`
                        : `${formatNumber(
                            (document as BillingInvoice).discount.value
                          )} ${currencySymbol}`}
                    </Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text>Total HT :</Text>
                  <Text>
                    {formatNumber(document.totalAmount)} {currencySymbol}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text>TVA ({(document as BillingInvoice).taxRate}%):</Text>
                  <Text>
                    {formatNumber((document as BillingInvoice).taxAmount)}{" "}
                    {currencySymbol}
                  </Text>
                </View>
                <View style={styles.totalRowBold}>
                  <Text>Total TTC:</Text>
                  <Text>
                    {formatNumber((document as BillingInvoice).totalWithTax)}{" "}
                    {currencySymbol}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.totalRow}>
                  <Text>Montant :</Text>
                  <Text>
                    {formatNumber((document as BillingInvoice).subtotal)}{" "}
                    {currencySymbol}
                  </Text>
                </View>
                {(document as BillingInvoice).discount.value > 0 && (
                  <View style={styles.totalRow}>
                    <Text>Remise :</Text>
                    <Text>
                      {(document as BillingInvoice).discount.type === "percentage"
                        ? `${(document as BillingInvoice).discount.value}%`
                        : `${formatNumber(
                            (document as BillingInvoice).discount.value
                          )} ${currencySymbol}`}
                    </Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text>Total Remise :</Text>
                  <Text>
                    {formatNumber(document.totalAmount)} {currencySymbol}
                  </Text>
                </View>
                <View style={styles.totalRowBold}>
                  <Text style={{ fontSize: 8 }}>
                    TVA non applicable, art. 293 B CGI
                  </Text>
                </View>
              </>
            )}
          </View>

          {isQuote ? (
            <View style={styles.conditions}>
              <Text style={styles.conditionsTitle}>Conditions</Text>
              <Text style={styles.conditionsText}>
                Délai de livraison: {(document as Invoice).deliveryTime}
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

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isQuote
                ? `Ce devis est valable jusqu'au ${new Date(
                    (document as Invoice).validUntil
                  ).toLocaleDateString()}. 
                Pour toute question, n'hésitez pas à nous contacter.`
                : `Date d'échéance : ${new Date(
                    (document as BillingInvoice).dueDate
                  ).toLocaleDateString()}`}
            </Text>
          </View>
        </Page>
      </Document>
  );
};

// Preview component that wraps the PDF document in a viewer
export function DocumentPreview(props: DocumentPreviewProps) {
  return (
    <PDFViewer className="w-full h-[80vh]">
      <PDFDocument {...props} />
    </PDFViewer>
  );
}
