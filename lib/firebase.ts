import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { Invoice, BillingInvoice, Company, PaymentAccount } from "@/app/types";

const firebaseConfig = {
  apiKey: "AIzaSyBUlU1esFktMUK0TgJIqCww7xkGCqTU3cs",
  authDomain: "dev4com-f68e3.firebaseapp.com",
  projectId: "dev4com-f68e3",
  storageBucket: "dev4com-f68e3.firebasestorage.app",
  messagingSenderId: "634868566361",
  appId: "1:634868566361:web:ea1a3efef52666b455e448",
  measurementId: "G-3D57QJVRBN",
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

// Collection references
const invoicesCollection = collection(db, "invoices");
const billingInvoicesCollection = collection(db, "billingInvoices");
const companyCollection = collection(db, "company");
const templatesCollection = collection(db, "templates");
const paymentAccountsCollection = collection(db, "paymentAccounts");

// Template operations
export const saveTemplate = async (template: Invoice, userId: string) => {
  try {
    const docRef = doc(templatesCollection, template.id);
    await setDoc(docRef, {
      ...template,
      userId,
      isTemplate: true,
      createdAt: new Date(),
    });
    return template;
  } catch (error) {
    console.error("Error saving template:", error);
    throw error;
  }
};

export const getTemplates = async (userId: string) => {
  try {
    // Simple query by userId only, filter isTemplate client-side
    const q = query(templatesCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const templates = querySnapshot.docs
      .map((doc) => ({
        ...doc.data(),
        id: doc.id,
        date: doc.data().date,
        validUntil: doc.data().validUntil,
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }))
      .filter((t: any) => t.isTemplate === true) as Invoice[];

    // Sort by createdAt desc client-side
    return templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error getting templates:", error);
    throw error;
  }
};

export const deleteTemplate = async (id: string) => {
  try {
    const docRef = doc(templatesCollection, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting template:", error);
    throw error;
  }
};

// Company operations
export const saveCompany = async (company: Company, userId: string) => {
  try {
    const docRef = doc(companyCollection, userId);
    await setDoc(docRef, { ...company, userId });
    return company;
  } catch (error) {
    console.error("Error saving company:", error);
    throw error;
  }
};

export const getCompany = async (userId: string): Promise<Company | null> => {
  try {
    const docRef = doc(companyCollection, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Company;
    }
    return null;
  } catch (error) {
    console.error("Error getting company:", error);
    throw error;
  }
};

// Invoice operations
export const saveInvoice = async (invoice: Invoice, userId: string) => {
  try {
    const docRef = doc(db, "invoices", invoice.id);
    await setDoc(docRef, cleanUndefined({
      ...invoice,
      userId,
      currency: invoice.currency || "EUR",
      showTax: typeof invoice.showTax === "boolean" ? invoice.showTax : false,
      billingCountry: invoice.billingCountry || "FR",
      createdAt: new Date(),
      date: new Date(invoice.date),
      validUntil: new Date(invoice.validUntil),
    }));
  } catch (error) {
    console.error("Error saving invoice:", error);
    throw error;
  }
};

export const updateInvoice = async (id: string, invoice: Partial<Invoice>) => {
  try {
    const docRef = doc(db, "invoices", id);
    await updateDoc(docRef, {
      ...invoice,
      ...(invoice.currency && { currency: invoice.currency }),
      ...(typeof invoice.showTax === "boolean" && { showTax: invoice.showTax }),
      ...(invoice.billingCountry && { billingCountry: invoice.billingCountry }),
      ...(invoice.date && { date: new Date(invoice.date) }),
      ...(invoice.validUntil && { validUntil: new Date(invoice.validUntil) }),
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    throw error;
  }
};

export const deleteInvoice = async (id: string) => {
  try {
    const docRef = doc(db, "invoices", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting invoice:", error);
    throw error;
  }
};

export const getInvoices = async (userId: string) => {
  try {
    // Try with orderBy first, fallback to simple query if index doesn't exist
    let querySnapshot;
    try {
      const q = query(
        invoicesCollection,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      querySnapshot = await getDocs(q);
    } catch (indexError) {
      console.warn("Index not available, using simple query");
      const q = query(invoicesCollection, where("userId", "==", userId));
      querySnapshot = await getDocs(q);
    }

    const invoices = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      currency: doc.data().currency || "EUR",
      date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date,
      validUntil: doc.data().validUntil?.toDate?.()?.toISOString() || doc.data().validUntil,
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    })) as Invoice[];

    // Sort by createdAt desc client-side
    return invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error getting invoices:", error);
    throw error;
  }
};

// Helper to remove undefined values (Firestore rejects them)
const cleanUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(cleanUndefined);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanUndefined(value);
      }
    }
    return cleaned;
  }
  return obj;
};

// Helper to safely convert a date value to a JS Date
const toDate = (date: any): Date => {
  if (!date) return new Date();
  if (date?.toDate) return date.toDate();
  if (date?.seconds) return new Date(date.seconds * 1000);
  const d = new Date(date);
  return isNaN(d.getTime()) ? new Date() : d;
};

// Billing Invoice operations
export const saveBillingInvoice = async (invoice: BillingInvoice, userId: string) => {
  try {
    // First, find the quote by its number
    const q = query(
      invoicesCollection,
      where("userId", "==", userId),
      where("number", "==", invoice.quoteNumber)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error(`Quote with number ${invoice.quoteNumber} not found`);
    }

    const quoteDoc = querySnapshot.docs[0];

    // Check if document already exists (update vs create)
    const docRef = doc(db, "billingInvoices", invoice.id);
    const existingDoc = await getDoc(docRef);
    const existingCreatedAt = existingDoc.exists()
      ? existingDoc.data().createdAt
      : null;

    // Clean the invoice data (remove undefined values)
    const cleanedInvoice = cleanUndefined({
      ...invoice,
      userId,
      currency: invoice.currency || "EUR",
      billingCountry: invoice.billingCountry || "FR",
      createdAt: existingCreatedAt || new Date(),
      date: toDate(invoice.date),
      dueDate: toDate(invoice.dueDate),
      paymentDate: invoice.paymentDate ? toDate(invoice.paymentDate) : null,
    });

    await setDoc(docRef, cleanedInvoice);

    // Update the quote to indicate a billing invoice was generated
    await updateDoc(doc(db, "invoices", quoteDoc.id), {
      hasBillingInvoice: true,
    });

    return invoice;
  } catch (error) {
    console.error("Error saving billing invoice:", error);
    throw error;
  }
};

export const updateBillingInvoice = async (
  id: string,
  invoice: Partial<BillingInvoice>
) => {
  try {
    const docRef = doc(db, "billingInvoices", id);
    await updateDoc(docRef, {
      ...invoice,
      ...(invoice.currency && { currency: invoice.currency }),
      ...(invoice.billingCountry && { billingCountry: invoice.billingCountry }),
      ...(invoice.date && { date: new Date(invoice.date) }),
      ...(invoice.dueDate && { dueDate: new Date(invoice.dueDate) }),
    });
  } catch (error) {
    console.error("Error updating billing invoice:", error);
    throw error;
  }
};

export const deleteBillingInvoice = async (id: string) => {
  try {
    const docRef = doc(db, "billingInvoices", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting billing invoice:", error);
    throw error;
  }
};

export const getBillingInvoices = async (userId: string) => {
  try {
    // Try with orderBy first, fallback to simple query if index doesn't exist
    let querySnapshot;
    try {
      const q = query(
        billingInvoicesCollection,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      querySnapshot = await getDocs(q);
    } catch (indexError) {
      console.warn("Index not available, using simple query");
      const q = query(billingInvoicesCollection, where("userId", "==", userId));
      querySnapshot = await getDocs(q);
    }

    const invoices = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      currency: doc.data().currency || "EUR",
      date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date,
      dueDate: doc.data().dueDate?.toDate?.()?.toISOString() || doc.data().dueDate,
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    })) as BillingInvoice[];

    // Sort by createdAt desc client-side
    return invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error getting billing invoices:", error);
    throw error;
  }
};

// Payment Account operations
export const savePaymentAccount = async (account: PaymentAccount, userId: string) => {
  try {
    const docRef = doc(paymentAccountsCollection, account.id);
    await setDoc(docRef, { ...account, userId });
    return account;
  } catch (error) {
    console.error("Error saving payment account:", error);
    throw error;
  }
};

export const getPaymentAccounts = async (userId: string): Promise<PaymentAccount[]> => {
  try {
    const q = query(paymentAccountsCollection, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as PaymentAccount[];
  } catch (error) {
    console.error("Error getting payment accounts:", error);
    throw error;
  }
};

export const deletePaymentAccount = async (id: string) => {
  try {
    const docRef = doc(paymentAccountsCollection, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting payment account:", error);
    throw error;
  }
};

// Migration function to assign existing data to a user
export const migrateDataToUser = async (userId: string) => {
  try {
    const stats = {
      invoices: 0,
      billingInvoices: 0,
      templates: 0,
      paymentAccounts: 0,
      company: false,
    };

    // Migrate ALL invoices (devis) - assign to user
    const invoicesSnapshot = await getDocs(invoicesCollection);
    for (const docSnapshot of invoicesSnapshot.docs) {
      await updateDoc(doc(db, "invoices", docSnapshot.id), { userId });
      stats.invoices++;
    }
    console.log(`Migrated ${stats.invoices} invoices`);

    // Migrate ALL billing invoices (factures) - assign to user
    const billingSnapshot = await getDocs(billingInvoicesCollection);
    for (const docSnapshot of billingSnapshot.docs) {
      await updateDoc(doc(db, "billingInvoices", docSnapshot.id), { userId });
      stats.billingInvoices++;
    }
    console.log(`Migrated ${stats.billingInvoices} billing invoices`);

    // Migrate ALL templates - assign to user
    const templatesSnapshot = await getDocs(templatesCollection);
    for (const docSnapshot of templatesSnapshot.docs) {
      await updateDoc(doc(db, "templates", docSnapshot.id), { userId });
      stats.templates++;
    }
    console.log(`Migrated ${stats.templates} templates`);

    // Migrate ALL payment accounts - assign to user
    const paymentsSnapshot = await getDocs(paymentAccountsCollection);
    for (const docSnapshot of paymentsSnapshot.docs) {
      await updateDoc(doc(db, "paymentAccounts", docSnapshot.id), { userId });
      stats.paymentAccounts++;
    }
    console.log(`Migrated ${stats.paymentAccounts} payment accounts`);

    // Migrate company data (copy from 'main' to userId if exists)
    const mainCompanyRef = doc(companyCollection, "main");
    const mainCompanySnap = await getDoc(mainCompanyRef);
    if (mainCompanySnap.exists()) {
      const companyData = mainCompanySnap.data();
      await setDoc(doc(companyCollection, userId), { ...companyData, userId });
      stats.company = true;
      console.log("Migrated company data");
    }

    console.log("Migration completed:", stats);
    return {
      success: true,
      message: `Migration terminée: ${stats.invoices} devis, ${stats.billingInvoices} factures, ${stats.templates} modèles, ${stats.paymentAccounts} comptes de paiement`,
      stats
    };
  } catch (error) {
    console.error("Error migrating data:", error);
    throw error;
  }
};

// ─── Export / Import ───

export interface UserDataExport {
  version: string;
  exportedAt: string;
  userId: string;
  data: {
    company: Company | null;
    invoices: Invoice[];
    billingInvoices: BillingInvoice[];
    templates: Invoice[];
    paymentAccounts: PaymentAccount[];
  };
}

export const exportUserData = async (userId: string): Promise<UserDataExport> => {
  const [company, invoices, billingInvoices, templates, paymentAccounts] = await Promise.all([
    getCompany(userId),
    getInvoices(userId),
    getBillingInvoices(userId),
    getTemplates(userId),
    getPaymentAccounts(userId),
  ]);

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    userId,
    data: {
      company,
      invoices,
      billingInvoices,
      templates,
      paymentAccounts,
    },
  };
};

export const importUserData = async (
  userId: string,
  exportData: UserDataExport
): Promise<{ imported: { company: boolean; invoices: number; billingInvoices: number; templates: number; paymentAccounts: number } }> => {
  const result = { company: false, invoices: 0, billingInvoices: 0, templates: 0, paymentAccounts: 0 };

  // Import company
  if (exportData.data.company) {
    await saveCompany(exportData.data.company, userId);
    result.company = true;
  }

  // Import invoices
  for (const invoice of exportData.data.invoices) {
    await saveInvoice(invoice, userId);
    result.invoices++;
  }

  // Import billing invoices
  for (const billing of exportData.data.billingInvoices) {
    await saveBillingInvoice(billing, userId);
    result.billingInvoices++;
  }

  // Import templates
  for (const template of exportData.data.templates) {
    await saveTemplate(template, userId);
    result.templates++;
  }

  // Import payment accounts
  for (const account of exportData.data.paymentAccounts) {
    await savePaymentAccount(account, userId);
    result.paymentAccounts++;
  }

  return { imported: result };
};
