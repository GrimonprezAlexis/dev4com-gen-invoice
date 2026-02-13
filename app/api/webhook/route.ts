import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const documentId = session.metadata?.documentId || session.metadata?.quoteId;
    const documentType = session.metadata?.documentType || "quote";

    if (documentId) {
      try {
        const collectionName = documentType === "billing" ? "billingInvoices" : "invoices";
        const docRef = doc(db, collectionName, documentId);
        const updatePayload: Record<string, any> = {
          paymentStatus: "paid",
          payment: {
            stripeSessionId: session.id,
            amount: (session.amount_total || 0) / 100,
            currency: session.currency?.toUpperCase() || "EUR",
            paidAt: new Date(),
          },
        };
        // For quotes, also update the workflow status to "paid"
        if (documentType === "quote") {
          updatePayload.status = "paid";
        }
        await updateDoc(docRef, updatePayload);
      } catch (err) {
        console.error(`Error updating ${documentType} after webhook:`, err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
