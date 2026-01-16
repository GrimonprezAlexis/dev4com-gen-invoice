"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  FileText,
  Plus,
  Settings,
  BarChart,
  LayoutGrid,
  Columns,
  Menu,
  Receipt,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { QuoteForm } from "./components/quotes/form";
import { QuotePreview } from "./components/quotes/preview";
import { CompanySettings } from "./components/company-settings";
import { AnalyticsDashboard } from "./components/analytics-dashboard";
import { QuoteList } from "./components/quotes/list";
import { BillingList } from "./components/billing/list";
import { BillingPreview } from "./components/billing/preview";
import { BillingInvoice, Invoice } from "./types";
import { useConfetti } from "./hooks/use-confetti";
import { DemoButton } from "./components/demo-button";
import { ThemeToggle } from "./components/theme-toggle";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/contexts/auth-context";

import {
  saveInvoice,
  getInvoices,
  deleteInvoice,
  saveBillingInvoice,
  getBillingInvoices,
  deleteBillingInvoice,
  updateInvoice,
} from "@/lib/firebase";

function HomeContent() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("invoices");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "split">("grid");
  const [billingInvoices, setBillingInvoices] = useState<BillingInvoice[]>([]);
  const [selectedBillingInvoice, setSelectedBillingInvoice] =
    useState<BillingInvoice | null>(null);
  const [isBillingPreviewOpen, setIsBillingPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fireConfetti = useConfetti();

  useEffect(() => {
    if (!user) return;

    const loadInvoices = async () => {
      try {
        const fetchedInvoices = await getInvoices(user.uid);
        setInvoices(fetchedInvoices);
      } catch (error) {
        console.error("Error loading invoices:", error);
        toast.error("Erreur lors du chargement des devis");
      }
    };

    const loadBillingInvoices = async () => {
      try {
        const fetchedBillingInvoices = await getBillingInvoices(user.uid);
        setBillingInvoices(fetchedBillingInvoices);
      } catch (error) {
        console.error("Error loading billing invoices:", error);
        toast.error("Erreur lors du chargement des factures");
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoices();
    loadBillingInvoices();
  }, [user]);

  const handleSaveInvoice = async (invoice: Invoice) => {
    if (!user) return;
    try {
      await saveInvoice(invoice, user.uid);

      if (editingInvoice) {
        const newInvoices = invoices.map((inv) =>
          inv.id === editingInvoice.id ? invoice : inv
        );
        setInvoices(newInvoices);
        toast.success("Devis mis à jour avec succès !");
      } else {
        setInvoices((prev) => [invoice, ...prev]);
        toast.success("Nouveau devis créé avec succès !");
      }

      setIsDialogOpen(false);
      setEditingInvoice(null);
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Erreur lors de la sauvegarde du devis");
    }
  };

  const handleUpdateBillingInvoice = async (invoice: BillingInvoice) => {
    if (!user) return;
    try {
      await saveBillingInvoice(invoice, user.uid);
      const newBillingInvoices = billingInvoices.map((inv) =>
        inv.id === invoice.id ? invoice : inv
      );
      setBillingInvoices(newBillingInvoices);
      toast.success("Facture mise à jour avec succès !");
    } catch (error) {
      console.error("Error updating billing invoice:", error);
      toast.error("Erreur lors de la mise à jour de la facture");
    }
  };

  const handleGenerateInvoice = async (invoice: BillingInvoice) => {
    if (!user) return;
    try {
      await saveBillingInvoice(invoice, user.uid);
      const updatedBillingInvoices = await getBillingInvoices(user.uid);
      setBillingInvoices(updatedBillingInvoices);
      setActiveTab("billing");
      toast.success("Facture générée avec succès !");
    } catch (error) {
      console.error("Error generating billing invoice:", error);
      toast.error("Erreur lors de la génération de la facture");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Déconnexion réussie");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const updateInvoiceStatus = async (
    invoiceId: string,
    status: "draft" | "sent" | "accepted" | "rejected"
  ) => {
    try {
      await updateInvoice(invoiceId, { status });
      const updatedInvoices = invoices.map((invoice) => {
        if (invoice.id === invoiceId) {
          if (status === "accepted") {
            fireConfetti();
            toast.success("🎉 Félicitations ! Le devis a été accepté !");
          } else if (status === "sent") {
            toast.info("Le devis a été marqué comme envoyé");
          } else if (status === "rejected") {
            toast.error("Le devis a été refusé");
          }
          return { ...invoice, status };
        }
        return invoice;
      });
      setInvoices(updatedInvoices);
    } catch (error) {
      console.error("Error updating invoice status:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const handleDeleteInvoices = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => deleteInvoice(id)));
      const newInvoices = invoices.filter(
        (invoice) => !ids.includes(invoice.id)
      );
      setInvoices(newInvoices);
      toast.success(
        `${ids.length} devis supprimé${ids.length > 1 ? "s" : ""} avec succès !`
      );
    } catch (error) {
      console.error("Error deleting invoices:", error);
      toast.error("Erreur lors de la suppression des devis");
    }
  };

  const handleDeleteBillingInvoice = async (id: string) => {
    try {
      await deleteBillingInvoice(id);
      const newBillingInvoices = billingInvoices.filter(
        (invoice) => invoice.id !== id
      );
      setBillingInvoices(newBillingInvoices);
      toast.success("Facture supprimée avec succès !");
    } catch (error) {
      console.error("Error deleting billing invoice:", error);
      toast.error("Erreur lors de la suppression de la facture");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-2 sm:p-4 space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 bg-background z-50 pb-2 border-b">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            Dev4Ecom
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="sm:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="hidden sm:flex gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === "grid" ? "split" : "grid")}
          >
            {viewMode === "grid" ? (
              <Columns className="mr-2 h-4 w-4" />
            ) : (
              <LayoutGrid className="mr-2 h-4 w-4" />
            )}
            {viewMode === "grid" ? "Vue divisée" : "Vue grille"}
          </Button>
          <DemoButton />
          <Button variant="outline" onClick={handleLogout} title="Déconnexion">
            <LogOut className="h-4 w-4" />
          </Button>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingInvoice(null);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Devis
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[92vw] sm:w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogTitle>
                {editingInvoice
                  ? "Modifier le devis"
                  : "Créer un nouveau devis"}
              </DialogTitle>
              <QuoteForm
                key={editingInvoice?.id || "new"}
                onSave={handleSaveInvoice}
                initialData={editingInvoice}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="right" className="w-[300px] sm:hidden">
          <div className="flex flex-col gap-4 mt-8">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={() => {
                setViewMode(viewMode === "grid" ? "split" : "grid");
                setIsMobileMenuOpen(false);
              }}
            >
              {viewMode === "grid" ? (
                <Columns className="mr-2 h-4 w-4" />
              ) : (
                <LayoutGrid className="mr-2 h-4 w-4" />
              )}
              {viewMode === "grid" ? "Vue divisée" : "Vue grille"}
            </Button>
            <DemoButton />
            <Button variant="outline" onClick={handleLogout} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingInvoice(null);
                setIsMobileMenuOpen(false);
              }}
            >
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Devis
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[92vw] sm:w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogTitle>
                  {editingInvoice
                    ? "Modifier le devis"
                    : "Créer un nouveau devis"}
                </DialogTitle>
                <QuoteForm
                  key={editingInvoice?.id || "new"}
                  onSave={handleSaveInvoice}
                  initialData={editingInvoice}
                />
              </DialogContent>
            </Dialog>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="w-[92vw] sm:w-full sm:max-w-7xl max-h-[90vh]">
          <DialogTitle>Aperçu du devis</DialogTitle>
          {selectedInvoice && <QuotePreview invoice={selectedInvoice} />}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isBillingPreviewOpen}
        onOpenChange={setIsBillingPreviewOpen}
      >
        <DialogContent className="w-[92vw] sm:w-full sm:max-w-7xl max-h-[90vh]">
          <DialogTitle>Aperçu de la facture</DialogTitle>
          {selectedBillingInvoice && (
            <BillingPreview invoice={selectedBillingInvoice} />
          )}
        </DialogContent>
      </Dialog>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="w-full grid grid-cols-5 h-auto p-1">
          <TabsTrigger
            value="invoices"
            className="flex items-center py-2 sm:py-3"
          >
            <FileText className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Devis</span>
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="flex items-center py-2 sm:py-3"
          >
            <Receipt className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Factures</span>
          </TabsTrigger>
          <TabsTrigger
            value="clients"
            className="flex items-center py-2 sm:py-3"
          >
            <Building2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Clients</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center py-2 sm:py-3"
          >
            <BarChart className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Analyses</span>
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex items-center py-2 sm:py-3"
          >
            <Settings className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Paramètres</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          {viewMode === "grid" ? (
            <QuoteList
              invoices={invoices}
              selectedInvoice={selectedInvoice}
              viewMode={viewMode}
              onSelect={setSelectedInvoice}
              onPreview={(invoice) => {
                setSelectedInvoice(invoice);
                setIsPreviewOpen(true);
              }}
              onEdit={(invoice) => {
                setEditingInvoice(invoice);
                setIsDialogOpen(true);
              }}
              onStatusUpdate={updateInvoiceStatus}
              onGenerateInvoice={handleGenerateInvoice}
              onDelete={handleDeleteInvoices}
              type="quote"
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4 xl:col-span-3">
                <ScrollArea className="h-[calc(100vh-250px)]">
                  <div className="pr-4">
                    <QuoteList
                      invoices={invoices}
                      selectedInvoice={selectedInvoice}
                      viewMode={viewMode}
                      onSelect={setSelectedInvoice}
                      onPreview={(invoice) => {
                        setSelectedInvoice(invoice);
                        setIsPreviewOpen(true);
                      }}
                      onEdit={(invoice) => {
                        setEditingInvoice(invoice);
                        setIsDialogOpen(true);
                      }}
                      onStatusUpdate={updateInvoiceStatus}
                      onGenerateInvoice={handleGenerateInvoice}
                      onDelete={handleDeleteInvoices}
                      type="quote"
                    />
                  </div>
                </ScrollArea>
              </div>
              <div className="lg:col-span-8 xl:col-span-9 h-[calc(100vh-250px)] overflow-hidden">
                {selectedInvoice ? (
                  <QuotePreview invoice={selectedInvoice} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Sélectionnez un devis pour afficher l&apos;aperçu
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="billing">
          {viewMode === "grid" ? (
            <BillingList
              invoices={billingInvoices}
              selectedInvoice={selectedBillingInvoice}
              viewMode={viewMode}
              onSelect={setSelectedBillingInvoice}
              onPreview={(invoice) => {
                setSelectedBillingInvoice(invoice);
                setIsBillingPreviewOpen(true);
              }}
              onUpdate={handleUpdateBillingInvoice}
              onDelete={handleDeleteBillingInvoice}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-4 xl:col-span-3">
                <ScrollArea className="h-[calc(100vh-250px)]">
                  <div className="pr-4">
                    <BillingList
                      invoices={billingInvoices}
                      selectedInvoice={selectedBillingInvoice}
                      viewMode={viewMode}
                      onSelect={setSelectedBillingInvoice}
                      onPreview={(invoice) => {
                        setSelectedBillingInvoice(invoice);
                        setIsBillingPreviewOpen(true);
                      }}
                      onUpdate={handleUpdateBillingInvoice}
                      onDelete={handleDeleteBillingInvoice}
                    />
                  </div>
                </ScrollArea>
              </div>
              <div className="lg:col-span-8 xl:col-span-9 h-[calc(100vh-250px)] overflow-hidden">
                {selectedBillingInvoice ? (
                  <BillingPreview invoice={selectedBillingInvoice} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>
                        Sélectionnez une facture pour afficher l&apos;aperçu
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(new Set(invoices.map((inv) => inv.client.siren))).map(
              (siren) => {
                const client = invoices.find(
                  (inv) => inv.client.siren === siren
                )?.client;
                const clientInvoices = invoices.filter(
                  (inv) => inv.client.siren === siren
                );
                const totalAmount = clientInvoices.reduce(
                  (sum, inv) => sum + inv.totalAmount,
                  0
                );

                return (
                  <div key={siren} className="bg-card p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{client?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          SIREN: {client?.siren}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {totalAmount.toLocaleString("fr-FR")} €
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {clientInvoices.length} devis
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {client?.address}
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="settings">
          <CompanySettings />
        </TabsContent>
      </Tabs>

      <Toaster />
    </main>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
