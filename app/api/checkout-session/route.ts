import { NextResponse } from "next/server";
import Stripe from "stripe";

const isProduction = process.env.VERCEL_ENV === "production";

function getStripe() {
  const key = isProduction
    ? process.env.STRIPE_SECRET_KEY_LIVE
    : process.env.STRIPE_SECRET_KEY_TEST;
  if (!key) throw new Error(`STRIPE_SECRET_KEY_${isProduction ? "LIVE" : "TEST"} is not set`);
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

export async function POST(request: Request) {
  try {
    const stripe = getStripe();

    const { documentId, documentType = "quote", amount, currency, customerEmail, productName } =
      await request.json();

    if (!documentId || !amount || !currency) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const origin = new URL(request.url).origin;
    const typeParam = documentType === "billing" ? "&type=billing" : "";
    const paymentParam = "&withPayment=true";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: productName || `Document ${documentId}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        documentId,
        documentType,
      },
      success_url: `${origin}/validation/${documentId}?payment=success&session_id={CHECKOUT_SESSION_ID}${typeParam}${paymentParam}`,
      cancel_url: `${origin}/validation/${documentId}?payment=cancelled${typeParam}${paymentParam}`,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
