import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Resend } from "resend";

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

const generateClientConfirmationEmail = (quote: any, signatureName: string) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 40px 20px;">
      <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
          <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <span style="font-size: 32px;">✅</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Confirmation de signature</h1>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Bonjour <strong>${signatureName}</strong>,
          </p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            Nous vous confirmons que votre devis a bien été accepté et signé avec succès.
          </p>

          <!-- Quote Summary -->
          <div style="background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="color: #3b82f6; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">Récapitulatif du devis</h2>
            <div style="border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 14px;">Numéro:</span>
              <span style="color: white; font-size: 14px; float: right; font-weight: 600;">${quote.number}</span>
            </div>
            <div style="border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 14px;">Émetteur:</span>
              <span style="color: #3b82f6; font-size: 14px; float: right;">${quote.company?.name || 'N/A'}</span>
            </div>
            <div style="border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="color: #94a3b8; font-size: 14px;">Montant Total TTC:</span>
              <span style="color: #3b82f6; font-size: 16px; float: right; font-weight: 700;">${formatCurrency(quote.totalAmount)}</span>
            </div>
            <div style="padding-top: 8px;">
              <span style="color: #94a3b8; font-size: 14px;">Signé par:</span>
              <span style="color: white; font-size: 14px; float: right; font-style: italic;">${signatureName}</span>
            </div>
          </div>

          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
            L'équipe de <strong>${quote.company?.name || 'Dev4Ecom'}</strong> vous recontactera prochainement pour les prochaines étapes.
          </p>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0;">
            Merci pour votre confiance !
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 20px 32px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Cet email a été envoyé automatiquement suite à votre signature électronique.
          </p>
        </div>
      </div>
    </div>
  `;
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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, signature } = body;

    const docRef = doc(db, "invoices", params.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    const quoteData = docSnap.data();
    const signedAt = new Date();

    await updateDoc(docRef, {
      status,
      ...(signature && {
        signature: {
          name: signature.name,
          email: signature.email,
          signedAt,
        }
      }),
    });

    // Send confirmation emails if quote is accepted
    if (status === "accepted" && signature) {
      const quote = { ...quoteData, id: docSnap.id };

      try {
        // Send confirmation to client
        if (signature.email) {
          await resend.emails.send({
            from: "Dev4Ecom <contact@dev4com.com>",
            to: signature.email,
            subject: `Confirmation de signature - Devis ${quote.number}`,
            html: generateClientConfirmationEmail(quote, signature.name),
          });
        }

        // Send notification to owner
        await resend.emails.send({
          from: "Dev4Ecom <contact@dev4com.com>",
          to: "contact@dev4com.com",
          subject: `🎉 Devis ${quote.number} accepté - ${quote.client?.name || 'Client'}`,
          html: generateOwnerNotificationEmail(quote, signature.name, signature.email || 'Non renseigné'),
        });
      } catch (emailError) {
        console.error("Error sending confirmation emails:", emailError);
        // Don't fail the request if emails fail to send
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
