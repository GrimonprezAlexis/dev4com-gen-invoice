import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Resend } from "resend";
import { buildEmailHtml } from "@/lib/email-template";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, "invoices", params.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    const data = docSnap.data();
    return NextResponse.json({
      ...data,
      id: docSnap.id,
      date: data.date?.toDate?.()?.toISOString() || data.date,
      validUntil: data.validUntil?.toDate?.()?.toISOString() || data.validUntil,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
    });
  } catch (error) {
    console.error("Error getting quote:", error);
    return NextResponse.json(
      { error: "Failed to get quote" },
      { status: 500 }
    );
  }
}

const resend = new Resend(process.env.RESEND_API_KEY);

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + " €";
};

const buildQuoteSummaryBlock = (number: string, companyName: string, totalAmount: string, signatureName: string) => {
  const font = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
  const row = (label: string, value: string, bold = false, italic = false, last = false) => `
<tr>
<td style="padding: 7px 0;${last ? "" : " border-bottom: 1px solid #e8e6e1;"}">
<span style="font-family: ${font}; font-size: 12px; color: #94a3b8;">${label}</span>
</td>
<td style="padding: 7px 0;${last ? "" : " border-bottom: 1px solid #e8e6e1;"} text-align: right;">
<span style="font-family: ${font}; font-size: 13px; font-weight: ${bold ? "700" : "600"}; font-style: ${italic ? "italic" : "normal"}; color: #1e293b;">${value}</span>
</td>
</tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding: 16px 20px; background-color: #f8f7f4; border: 1px solid #e8e6e1;">
<p style="margin: 0 0 14px; font-family: ${font}; font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.06em; text-transform: uppercase;">Récapitulatif du devis</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${row("Numéro", number)}
${row("Émetteur", companyName)}
${row("Montant Total TTC", `<strong>${totalAmount}</strong>`, true)}
${row("Signé par", signatureName, false, true, true)}
</table>
</td>
</tr>
</table>`;
};

const generateOwnerNotificationEmail = (quote: any, signatureName: string, clientEmail: string) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
      <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
          <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <span style="font-size: 32px;">🎉</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Nouveau devis accepté !</h1>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Un client vient d'accepter et de signer un devis.
          </p>

          <!-- Quote Details -->
          <div style="background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #3b82f6; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">Détails du devis</h2>
            <div style="border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 14px;">Numéro:</span>
              <span style="color: white; font-size: 14px; float: right; font-weight: 600;">${quote.number}</span>
            </div>
            <div style="border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 14px;">Client:</span>
              <span style="color: #3b82f6; font-size: 14px; float: right;">${quote.client?.name || 'N/A'}</span>
            </div>
            <div style="border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 14px;">Email client:</span>
              <span style="color: white; font-size: 14px; float: right;">${clientEmail}</span>
            </div>
            <div style="border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 14px;">Montant Total TTC:</span>
              <span style="color: #10b981; font-size: 18px; float: right; font-weight: 700;">${formatCurrency(quote.totalAmount)}</span>
            </div>
            <div style="border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 14px;">Acompte (${quote.deposit}%):</span>
              <span style="color: white; font-size: 14px; float: right;">${formatCurrency(quote.totalAmount * quote.deposit / 100)}</span>
            </div>
            <div style="padding-top: 8px;">
              <span style="color: #94a3b8; font-size: 14px;">Signataire:</span>
              <span style="color: white; font-size: 14px; float: right; font-style: italic;">${signatureName}</span>
            </div>
          </div>

          <!-- Services Preview -->
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h3 style="color: #475569; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Services commandés:</h3>
            ${quote.services?.map((s: any) => `
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="color: #64748b; font-size: 13px;">${s.quantity}x ${s.description}</span>
                <span style="color: #475569; font-size: 13px; font-weight: 500;">${formatCurrency(s.amount)}</span>
              </div>
            `).join('') || ''}
          </div>

          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
            Pensez à contacter le client pour finaliser les détails.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 20px 32px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Notification automatique de signature de devis
          </p>
        </div>
      </div>
    </div>
  `;
};

const formatCurrencyWithSymbol = (amount: number, currency: string) => {
  if (currency === 'CHF') {
    return new Intl.NumberFormat("de-CH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " CHF";
  }
  return formatCurrency(amount);
};

const generateClientPaymentEmail = (quote: any, clientName: string, paidAmount: number, currency: string, isDeposit: boolean) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
      <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px; text-align: center;">
          <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <span style="font-size: 32px;">💳</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Paiement confirmé</h1>
        </div>

        <div style="padding: 32px;">
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Bonjour <strong>${clientName}</strong>,
          </p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Nous vous confirmons que votre paiement a bien été reçu et traité avec succès.
          </p>

          <div style="background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #3b82f6; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">Détails du paiement</h2>
            <div style="border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 14px;">Devis n°:</span>
              <span style="color: white; font-size: 14px; float: right; font-weight: 600;">${quote.number}</span>
            </div>
            <div style="border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 14px;">${isDeposit ? `Acompte (${quote.deposit}%)` : 'Montant payé'}:</span>
              <span style="color: #10b981; font-size: 18px; float: right; font-weight: 700;">${formatCurrencyWithSymbol(paidAmount, currency)}</span>
            </div>
            ${isDeposit ? `
            <div style="border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 14px;">Total du devis:</span>
              <span style="color: white; font-size: 14px; float: right;">${formatCurrencyWithSymbol(quote.totalAmount, currency)}</span>
            </div>
            <div style="padding-top: 8px;">
              <span style="color: #94a3b8; font-size: 14px;">Solde restant:</span>
              <span style="color: white; font-size: 14px; float: right;">${formatCurrencyWithSymbol(quote.totalAmount - paidAmount, currency)}</span>
            </div>
            ` : `
            <div style="padding-top: 8px;">
              <span style="color: #94a3b8; font-size: 14px;">Émetteur:</span>
              <span style="color: #3b82f6; font-size: 14px; float: right;">${quote.company?.name || 'N/A'}</span>
            </div>
            `}
          </div>

          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
            L'équipe de <strong>${quote.company?.name || 'Dev4Ecom'}</strong> vous recontactera prochainement pour les prochaines étapes.
          </p>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
            Merci pour votre confiance !
          </p>
        </div>

        <div style="background: #f1f5f9; padding: 20px 32px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Cet email a été envoyé automatiquement suite à votre paiement.
          </p>
        </div>
      </div>
    </div>
  `;
};

const generateOwnerPaymentEmail = (quote: any, clientName: string, clientEmail: string, paidAmount: number, currency: string, isDeposit: boolean) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
      <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
          <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <span style="font-size: 32px;">💰</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Paiement reçu !</h1>
        </div>

        <div style="padding: 32px;">
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Un paiement vient d'être reçu pour le devis <strong>${quote.number}</strong>.
          </p>

          <div style="background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #3b82f6; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">Détails du paiement</h2>
            <div style="border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 14px;">Devis n°:</span>
              <span style="color: white; font-size: 14px; float: right; font-weight: 600;">${quote.number}</span>
            </div>
            <div style="border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 14px;">Client:</span>
              <span style="color: #3b82f6; font-size: 14px; float: right;">${clientName}</span>
            </div>
            <div style="border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 14px;">Email:</span>
              <span style="color: white; font-size: 14px; float: right;">${clientEmail}</span>
            </div>
            <div style="border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 14px;">${isDeposit ? `Acompte reçu (${quote.deposit}%)` : 'Montant reçu'}:</span>
              <span style="color: #10b981; font-size: 18px; float: right; font-weight: 700;">${formatCurrencyWithSymbol(paidAmount, currency)}</span>
            </div>
            ${isDeposit ? `
            <div style="padding-top: 8px;">
              <span style="color: #94a3b8; font-size: 14px;">Solde restant:</span>
              <span style="color: #f59e0b; font-size: 14px; float: right; font-weight: 600;">${formatCurrencyWithSymbol(quote.totalAmount - paidAmount, currency)}</span>
            </div>
            ` : ''}
          </div>

          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
            ${isDeposit ? 'Pensez à envoyer la facture pour le solde restant.' : 'Le paiement complet a été reçu.'}
          </p>
        </div>

        <div style="background: #f1f5f9; padding: 20px 32px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Notification automatique de paiement Stripe
          </p>
        </div>
      </div>
    </div>
  `;
};

const buildVirementInfoBlock = (
  accountHolder: string,
  iban: string,
  bic: string,
  reference: string,
  amount: string
) => {
  const font = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
  const ibanFormatted = iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
  const row = (label: string, value: string, mono = false, last = false) => `
<tr>
<td style="padding: 7px 0;${last ? "" : " border-bottom: 1px solid #e8e6e1;"}">
<span style="font-family: ${font}; font-size: 12px; color: #94a3b8;">${label}</span>
</td>
<td style="padding: 7px 0;${last ? "" : " border-bottom: 1px solid #e8e6e1;"} text-align: right;">
<span style="font-family: ${mono ? "'Courier New', Courier, monospace" : font}; font-size: ${last ? "16px" : "13px"}; font-weight: ${last ? "700" : "600"}; color: ${last ? "#0f172a" : "#1e293b"};">${value}</span>
</td>
</tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding: 16px 20px; background-color: #f8f7f4; border: 1px solid #e8e6e1;">
<p style="margin: 0 0 14px; font-family: ${font}; font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.06em; text-transform: uppercase;">Coordonnées bancaires</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${row("Bénéficiaire", accountHolder)}
${row("IBAN", ibanFormatted, true)}
${bic ? row("BIC / SWIFT", bic, true) : ""}
${row("Référence", reference)}
${row("Montant", amount, false, true)}
</table>
<p style="margin: 14px 0 0; font-family: ${font}; font-size: 11px; color: #94a3b8; line-height: 1.5;">Pensez à indiquer la référence <strong style="color: #64748b;">${reference}</strong> dans le libellé de votre virement.</p>
</td>
</tr>
</table>`;
};

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, signature, payment, action, withPayment } = body;

    const docRef = doc(db, "invoices", params.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    const quoteData = docSnap.data();

    // Handle virement confirmation: send email only, no Firestore update
    if (action === "virement") {
      const sigName = signature?.name || quoteData.signature?.name || "Client";
      const sigEmail = signature?.email || quoteData.signature?.email;
      const currency = quoteData.currency || "EUR";
      const isDeposit = (quoteData.deposit || 0) > 0;
      const virementAmount = isDeposit
        ? quoteData.totalAmount * (quoteData.deposit / 100)
        : quoteData.totalAmount;
      const amountStr = formatCurrencyWithSymbol(virementAmount, currency);
      const reference = `Devis ${quoteData.number}`;
      const paymentAccount = quoteData.paymentAccount;

      try {
        if (sigEmail && paymentAccount?.iban) {
          const infoBlock = buildVirementInfoBlock(
            paymentAccount.accountHolder || quoteData.company?.name || "",
            paymentAccount.iban,
            paymentAccount.bic || "",
            reference,
            amountStr
          );
          const message = `Bonjour ${sigName},\n\nVotre devis ${quoteData.number} a bien été signé et accepté. Pour finaliser votre commande, veuillez effectuer un virement bancaire avec les coordonnées ci-dessous.\n\nL'équipe de ${quoteData.company?.name || "Dev4Ecom"} vous recontactera dès réception de votre virement.\n\nMerci pour votre confiance !`;
          await resend.emails.send({
            from: "Dev4Ecom <contact@dev4com.com>",
            to: sigEmail,
            subject: `Virement en attente - Devis ${quoteData.number}`,
            html: buildEmailHtml({
              message,
              companyName: quoteData.company?.name || "Dev4Ecom",
              companyLogo: quoteData.company?.logo,
              companyAddress: quoteData.company?.address,
              companySiren: quoteData.showSiren ? (quoteData.company?.siren || "") : "",
              documentType: "quote",
              documentNumber: quoteData.number,
              infoBlock,
            }),
          });
        }

        await resend.emails.send({
          from: "Dev4Ecom <contact@dev4com.com>",
          to: "contact@dev4com.com",
          subject: `⏳ Virement attendu - Devis ${quoteData.number} - ${quoteData.client?.name || "Client"}`,
          html: buildEmailHtml({
            message: `Le client ${sigName} (${sigEmail || "email non renseigné"}) a confirmé avoir noté les coordonnées bancaires pour le devis ${quoteData.number}.\n\nMontant attendu : ${amountStr}\nRéférence : ${reference}`,
            companyName: quoteData.company?.name || "Dev4Ecom",
            documentType: "quote",
            documentNumber: quoteData.number,
          }),
        });
      } catch (emailError) {
        console.error("Error sending virement emails:", emailError);
      }

      return NextResponse.json({ success: true });
    }

    const signedAt = new Date();

    const updateData: Record<string, any> = {};

    if (status) {
      updateData.status = status;
    }

    if (signature) {
      updateData.signature = {
        name: signature.name,
        email: signature.email,
        signedAt,
      };
    }

    if (payment) {
      updateData.payment = {
        stripeSessionId: payment.stripeSessionId,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: new Date(),
      };
      updateData.paymentStatus = "paid";
      updateData.status = "paid";
    }

    await updateDoc(docRef, updateData);

    const quote = { ...quoteData, id: docSnap.id } as any;

    // Send confirmation emails if quote is accepted (signature step)
    // When withPayment=true, the client email is deferred to the payment confirmation step
    if (status === "accepted" && signature) {
      try {
        if (!withPayment && signature.email) {
          const currency = quote.currency || "EUR";
          const totalStr = formatCurrencyWithSymbol(quote.totalAmount, currency);
          const summaryBlock = buildQuoteSummaryBlock(
            quote.number,
            quote.company?.name || "Dev4Ecom",
            totalStr,
            signature.name
          );
          await resend.emails.send({
            from: "Dev4Ecom <contact@dev4com.com>",
            to: signature.email,
            subject: `Confirmation de signature - Devis ${quote.number}`,
            html: buildEmailHtml({
              message: `Bonjour ${signature.name},\n\nVotre devis ${quote.number} a bien été accepté et signé avec succès. L'équipe de ${quote.company?.name || "Dev4Ecom"} vous recontactera prochainement pour les prochaines étapes.\n\nMerci pour votre confiance !`,
              companyName: quote.company?.name || "Dev4Ecom",
              companyLogo: quote.company?.logo,
              companyAddress: quote.company?.address,
              companySiren: quote.showSiren ? (quote.company?.siren || "") : "",
              documentType: "quote",
              documentNumber: quote.number,
              infoBlock: summaryBlock,
            }),
          });
        }

        await resend.emails.send({
          from: "Dev4Ecom <contact@dev4com.com>",
          to: "contact@dev4com.com",
          subject: `🎉 Devis ${quote.number} accepté - ${quote.client?.name || 'Client'}`,
          html: generateOwnerNotificationEmail(quote, signature.name, signature.email || 'Non renseigné'),
        });
      } catch (emailError) {
        console.error("Error sending confirmation emails:", emailError);
      }
    }

    // Send payment confirmation emails (payment step)
    if (payment && !status) {
      const clientEmail = quoteData.signature?.email;
      const clientName = quoteData.signature?.name || quote.client?.name || 'Client';
      const paidAmount = payment.amount;
      const currency = payment.currency || 'EUR';
      const isDeposit = quote.deposit > 0;

      try {
        if (clientEmail) {
          await resend.emails.send({
            from: "Dev4Ecom <contact@dev4com.com>",
            to: clientEmail,
            subject: `Confirmation de paiement - Devis ${quote.number}`,
            html: generateClientPaymentEmail(quote, clientName, paidAmount, currency, isDeposit),
          });
        }

        await resend.emails.send({
          from: "Dev4Ecom <contact@dev4com.com>",
          to: "contact@dev4com.com",
          subject: `💰 Paiement reçu - Devis ${quote.number} - ${quote.client?.name || 'Client'}`,
          html: generateOwnerPaymentEmail(quote, clientName, clientEmail || 'Non renseigné', paidAmount, currency, isDeposit),
        });
      } catch (emailError) {
        console.error("Error sending payment confirmation emails:", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating quote:", error);
    return NextResponse.json(
      { error: "Failed to update quote" },
      { status: 500 }
    );
  }
}
