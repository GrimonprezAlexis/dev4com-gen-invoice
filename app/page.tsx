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
  Search,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [clientSearch, setClientSearch] = useState("");
  const [clientSortBy, setClientSortBy] = useState<"name" | "amount" | "quotes">("amount");
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
            <DialogContent resizable className="w-[95vw] max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[85vh] flex flex-col p-0 gap-0">
              <div className="px-4 py-3 border-b shrink-0">
                <DialogTitle className="text-base">
                  {editingInvoice ? "Modifier le devis" : "Nouveau devis"}
                </DialogTitle>
              </div>
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
              <DialogContent resizable className="w-[95vw] max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[85vh] flex flex-col p-0 gap-0">
                <div className="px-4 py-3 border-b shrink-0">
                  <DialogTitle className="text-base">
                    {editingInvoice ? "Modifier le devis" : "Nouveau devis"}
                  </DialogTitle>
                </div>
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
              <div className="lg:col-span-5">
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
              <div className="lg:col-span-7 h-[calc(100vh-250px)] overflow-hidden border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                {selectedInvoice ? (
                  <QuotePreview invoice={selectedInvoice} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sélectionnez un devis
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
              <div className="lg:col-span-5">
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
              <div className="lg:col-span-7 h-[calc(100vh-250px)] overflow-hidden border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                {selectedBillingInvoice ? (
                  <BillingPreview invoice={selectedBillingInvoice} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    Sélectionnez une facture
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Total clients</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {Array.from(new Set(invoices.map((inv) => inv.client.siren))).length}
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <p className="text-xs text-muted-foreground">CA Total</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {invoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toLocaleString("fr-FR")} €
              </p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Devis</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {invoices.length}
              </p>
            </div>
          </div>

          {/* Compact filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[150px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher un client..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Select value={clientSortBy} onValueChange={(v: "name" | "amount" | "quotes") => setClientSortBy(v)}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <ArrowUpDown className="w-3 h-3 mr-1" />
                <SelectValue placeholder="Trier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amount">Montant</SelectItem>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="quotes">Nb devis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Compact client list */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {(() => {
              // Build client list with aggregated data
              const clientsMap = new Map<string, {
                client: typeof invoices[0]["client"];
                totalAmount: number;
                quotesCount: number;
                acceptedCount: number;
              }>();

              invoices.forEach((inv) => {
                const existing = clientsMap.get(inv.client.siren);
                if (existing) {
                  existing.totalAmount += inv.totalAmount;
                  existing.quotesCount += 1;
                  if (inv.status === "accepted") existing.acceptedCount += 1;
                } else {
                  clientsMap.set(inv.client.siren, {
                    client: inv.client,
                    totalAmount: inv.totalAmount,
                    quotesCount: 1,
                    acceptedCount: inv.status === "accepted" ? 1 : 0,
                  });
                }
              });

              let clients = Array.from(clientsMap.values());

              // Filter by search
              if (clientSearch) {
                const searchLower = clientSearch.toLowerCase();
                clients = clients.filter((c) =>
                  c.client.name.toLowerCase().includes(searchLower) ||
                  c.client.siren?.toLowerCase().includes(searchLower)
                );
              }

              // Sort
              clients.sort((a, b) => {
                switch (clientSortBy) {
                  case "name":
                    return a.client.name.localeCompare(b.client.name);
                  case "amount":
                    return b.totalAmount - a.totalAmount;
                  case "quotes":
                    return b.quotesCount - a.quotesCount;
                  default:
                    return 0;
                }
              });

              return clients.map(({ client, totalAmount, quotesCount, acceptedCount }) => (
                <div
                  key={client.siren}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-sm transition-all"
                >
                  {/* Avatar */}
                  <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    {client?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{client?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {client?.address || `SIREN: ${client?.siren}`}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm text-green-600 dark:text-green-400">
                      {totalAmount.toLocaleString("fr-FR")} €
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {quotesCount} devis • {acceptedCount} accepté{acceptedCount > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ));
            })()}
          </div>

          {invoices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>Aucun client pour le moment</p>
              <p className="text-xs mt-1">Créez un devis pour ajouter votre premier client</p>
            </div>
          )}
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
