import { initializeApp } from "firebase/app";
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Collection references
const invoicesCollection = collection(db, "invoices");
const billingInvoicesCollection = collection(db, "billingInvoices");
const companyCollection = collection(db, "company");
const templatesCollection = collection(db, "templates");
const paymentAccountsCollection = collection(db, "paymentAccounts");

// Template operations
export const saveTemplate = async (template: Invoice) => {
  try {
    const docRef = doc(templatesCollection, template.id);
    await setDoc(docRef, {
      ...template,
      isTemplate: true,
      createdAt: new Date(),
    });
    return template;
  } catch (error) {
    console.error("Error saving template:", error);
    throw error;
  }
};

export const getTemplates = async () => {
  try {
    // First try with the composite index
    try {
      const q = query(
        templatesCollection,
        where("isTemplate", "==", true),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        date: doc.data().date,
        validUntil: doc.data().validUntil,
        createdAt: doc.data().createdAt.toDate(),
      })) as Invoice[];
    } catch (indexError) {
      // If composite index error, fallback to simple query
      console.warn(
        "Composite index not available, falling back to simple query"
      );
      const q = query(templatesCollection, where("isTemplate", "==", true));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        date: doc.data().date,
        validUntil: doc.data().validUntil,
        createdAt: doc.data().createdAt.toDate(),
      })) as Invoice[];
    }
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
export const saveCompany = async (company: Company) => {
  try {
    const docRef = doc(companyCollection, "main");
    await setDoc(docRef, company);
    return company;
  } catch (error) {
    console.error("Error saving company:", error);
    throw error;
  }
};

export const getCompany = async (): Promise<Company | null> => {
  try {
    const docRef = doc(companyCollection, "main");
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
export const saveInvoice = async (invoice: Invoice) => {
  try {
    const docRef = doc(db, "invoices", invoice.id);
    await setDoc(docRef, {
      ...invoice,
      currency: invoice.currency || "EUR",
      showTax: typeof invoice.showTax === "boolean" ? invoice.showTax : false,
      createdAt: new Date(),
      date: new Date(invoice.date),
      validUntil: new Date(invoice.validUntil),
    });
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

export const getInvoices = async () => {
  try {
    const q = query(invoicesCollection, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      currency: doc.data().currency || "EUR",
      date: doc.data().date.toDate().toISOString(),
      validUntil: doc.data().validUntil.toDate().toISOString(),
      createdAt: doc.data().createdAt.toDate(),
    })) as Invoice[];
  } catch (error) {
    console.error("Error getting invoices:", error);
    throw error;
  }
};

// Billing Invoice operations
export const saveBillingInvoice = async (invoice: BillingInvoice) => {
  try {
    // First, find the quote by its number
    const q = query(
      invoicesCollection,
      where("number", "==", invoice.quoteNumber)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error(`Quote with number ${invoice.quoteNumber} not found`);
    }

    const quoteDoc = querySnapshot.docs[0];

    // Save the billing invoice
    const docRef = doc(db, "billingInvoices", invoice.id);
    await setDoc(docRef, {
      ...invoice,
      currency: invoice.currency || "EUR",
      createdAt: new Date(),
      date: new Date(invoice.date),
      dueDate: new Date(invoice.dueDate),
      paymentDate: invoice.paymentDate ? new Date(invoice.paymentDate) : null,
    });

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

export const getBillingInvoices = async () => {
  try {
    const q = query(billingInvoicesCollection, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      currency: doc.data().currency || "EUR",
      date: doc.data().date.toDate().toISOString(),
      dueDate: doc.data().dueDate.toDate().toISOString(),
      createdAt: doc.data().createdAt.toDate(),
    })) as BillingInvoice[];
  } catch (error) {
    console.error("Error getting billing invoices:", error);
    throw error;
  }
};

// Payment Account operations
export const savePaymentAccount = async (account: PaymentAccount) => {
  try {
    const docRef = doc(paymentAccountsCollection, account.id);
    await setDoc(docRef, account);
    return account;
  } catch (error) {
    console.error("Error saving payment account:", error);
    throw error;
  }
};

export const getPaymentAccounts = async (): Promise<PaymentAccount[]> => {
  try {
    const querySnapshot = await getDocs(paymentAccountsCollection);
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
