"use client";

import { EmailDialog as BaseEmailDialog } from "../shared/email-dialog";
import { BillingInvoice } from "@/app/types";

interface BillingEmailDialogProps {
  invoice: BillingInvoice;
  onEmailSent: () => void;
}

export function BillingEmailDialog({ invoice, onEmailSent }: BillingEmailDialogProps) {
  return (
    <BaseEmailDialog
      document={invoice}
      type="billing"
      onEmailSent={onEmailSent}
      emailTemplate={{
        from: "factures@dev4ecom.com",
        subject: `Facture ${invoice.number} - ${invoice.company.name}`,
        defaultMessage: `
Cher client,

Veuillez trouver ci-joint la facture ${invoice.number} correspondant au devis ${invoice.quoteNumber}.

Détails de la facture :
• Montant HT : ${invoice.totalAmount.toLocaleString('fr-FR')} €
• TVA (${invoice.taxRate}%) : ${invoice.taxAmount.toLocaleString('fr-FR')} €
• Montant TTC : ${invoice.totalWithTax.toLocaleString('fr-FR')} €
• Date d'échéance : ${new Date(invoice.dueDate).toLocaleDateString()}

Services facturés :
${invoice.services.map(service => `• ${service.description} : ${service.quantity} × ${service.unitPrice.toLocaleString('fr-FR')} € = ${service.amount.toLocaleString('fr-FR')} €`).join('\n')}

${invoice.notes ? `\nNotes :\n${invoice.notes}` : ''}

Je reste à votre disposition pour toute information complémentaire.

Cordialement,
${invoice.company.name}
${invoice.company.address}
SIREN : ${invoice.company.siren}
        `.trim()
      }}
    />
  );
}