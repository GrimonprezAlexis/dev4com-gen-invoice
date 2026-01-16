import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc, getDoc, setDoc } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const stats = {
      invoices: 0,
      billingInvoices: 0,
      templates: 0,
      paymentAccounts: 0,
      company: false,
    };

    // 1. Migrate ALL invoices (devis)
    console.log("Starting migration for invoices...");
    const invoicesRef = collection(db, "invoices");
    const invoicesSnapshot = await getDocs(invoicesRef);
    console.log(`Found ${invoicesSnapshot.docs.length} invoices`);

    for (const docSnapshot of invoicesSnapshot.docs) {
      try {
        await updateDoc(doc(db, "invoices", docSnapshot.id), { userId });
        stats.invoices++;
        console.log(`Updated invoice: ${docSnapshot.id}`);
      } catch (err) {
        console.error(`Error updating invoice ${docSnapshot.id}:`, err);
      }
    }

    // 2. Migrate ALL billing invoices (factures)
    console.log("Starting migration for billingInvoices...");
    const billingRef = collection(db, "billingInvoices");
    const billingSnapshot = await getDocs(billingRef);
    console.log(`Found ${billingSnapshot.docs.length} billing invoices`);

    for (const docSnapshot of billingSnapshot.docs) {
      try {
        await updateDoc(doc(db, "billingInvoices", docSnapshot.id), { userId });
        stats.billingInvoices++;
        console.log(`Updated billing invoice: ${docSnapshot.id}`);
      } catch (err) {
        console.error(`Error updating billing invoice ${docSnapshot.id}:`, err);
      }
    }

    // 3. Migrate ALL templates
    console.log("Starting migration for templates...");
    const templatesRef = collection(db, "templates");
    const templatesSnapshot = await getDocs(templatesRef);
    console.log(`Found ${templatesSnapshot.docs.length} templates`);

    for (const docSnapshot of templatesSnapshot.docs) {
      try {
        await updateDoc(doc(db, "templates", docSnapshot.id), { userId });
        stats.templates++;
        console.log(`Updated template: ${docSnapshot.id}`);
      } catch (err) {
        console.error(`Error updating template ${docSnapshot.id}:`, err);
      }
    }

    // 4. Migrate ALL payment accounts
    console.log("Starting migration for paymentAccounts...");
    const paymentsRef = collection(db, "paymentAccounts");
    const paymentsSnapshot = await getDocs(paymentsRef);
    console.log(`Found ${paymentsSnapshot.docs.length} payment accounts`);

    for (const docSnapshot of paymentsSnapshot.docs) {
      try {
        await updateDoc(doc(db, "paymentAccounts", docSnapshot.id), { userId });
        stats.paymentAccounts++;
        console.log(`Updated payment account: ${docSnapshot.id}`);
      } catch (err) {
        console.error(`Error updating payment account ${docSnapshot.id}:`, err);
      }
    }

    // 5. Migrate company data
    console.log("Starting migration for company...");
    const companyRef = collection(db, "company");
    const companySnapshot = await getDocs(companyRef);
    console.log(`Found ${companySnapshot.docs.length} company documents`);

    for (const docSnapshot of companySnapshot.docs) {
      try {
        const companyData = docSnapshot.data();
        // Copy to user's document
        await setDoc(doc(db, "company", userId), { ...companyData, userId });
        stats.company = true;
        console.log(`Copied company data to user: ${userId}`);
      } catch (err) {
        console.error(`Error copying company data:`, err);
      }
    }

    console.log("Migration completed:", stats);

    return NextResponse.json({
      success: true,
      message: `Migration terminée: ${stats.invoices} devis, ${stats.billingInvoices} factures, ${stats.templates} modèles, ${stats.paymentAccounts} comptes de paiement`,
      stats,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed", details: String(error) },
      { status: 500 }
    );
  }
}
