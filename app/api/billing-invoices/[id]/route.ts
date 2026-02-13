import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, "billingInvoices", params.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      );
    }

    const data = docSnap.data();
    return NextResponse.json({
      ...data,
      id: docSnap.id,
      date: data.date?.toDate?.()?.toISOString() || data.date,
      dueDate: data.dueDate?.toDate?.()?.toISOString() || data.dueDate,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      paymentDate: data.paymentDate?.toDate?.()?.toISOString() || data.paymentDate,
    });
  } catch (error) {
    console.error("Error getting billing invoice:", error);
    return NextResponse.json(
      { error: "Failed to get billing invoice" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { payment } = body;

    const docRef = doc(db, "billingInvoices", params.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      );
    }

    const updateData: Record<string, any> = {};

    if (payment) {
      updateData.payment = {
        stripeSessionId: payment.stripeSessionId,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: new Date(),
      };
      updateData.paymentStatus = "paid";
    }

    await updateDoc(docRef, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating billing invoice:", error);
    return NextResponse.json(
      { error: "Failed to update billing invoice" },
      { status: 500 }
    );
  }
}
