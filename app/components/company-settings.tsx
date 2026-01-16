"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Company, PaymentAccount } from "../types";
import { toast } from "sonner";
import { Upload, X, Plus, Trash2, CreditCard } from "lucide-react";
import { saveCompany, getCompany, savePaymentAccount, getPaymentAccounts, deletePaymentAccount } from "@/lib/firebase";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { Database, Loader2 } from "lucide-react";

export function CompanySettings() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company>({
    name: "",
    address: "",
    siren: "",
    logo: "",
  });
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [newAccount, setNewAccount] = useState<Omit<PaymentAccount, "id">>({
    name: "",
    iban: "",
    bic: "",
    accountHolder: "",
  });
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [companyData, accountsData] = await Promise.all([
          getCompany(user.uid),
          getPaymentAccounts(user.uid),
        ]);
        if (companyData) {
          setCompany(companyData);
        }
        setPaymentAccounts(accountsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    try {
      await saveCompany(company, user.uid);
      toast.success("Informations de l'entreprise mises à jour");
    } catch (error) {
      console.error("Error saving company data:", error);
      toast.error("Erreur lors de la sauvegarde des données de l'entreprise");
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Le fichier est trop volumineux. Taille maximum : 5MB");
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner une image valide");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setCompany(prev => ({ ...prev, logo: dataUrl, logoSize: "medium" }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setCompany(prev => ({ ...prev, logo: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddPaymentAccount = async () => {
    if (!user) return;
    if (!newAccount.name || !newAccount.iban || !newAccount.bic || !newAccount.accountHolder) {
      toast.error("Veuillez remplir tous les champs du compte de paiement");
      return;
    }

    try {
      const account: PaymentAccount = {
        ...newAccount,
        id: Date.now().toString(),
      };
      await savePaymentAccount(account, user.uid);
      setPaymentAccounts((prev) => [...prev, account]);
      setNewAccount({ name: "", iban: "", bic: "", accountHolder: "" });
      setIsAddingAccount(false);
      toast.success("Compte de paiement ajouté");
    } catch (error) {
      console.error("Error adding payment account:", error);
      toast.error("Erreur lors de l'ajout du compte de paiement");
    }
  };

  const handleDeletePaymentAccount = async (id: string) => {
    try {
      await deletePaymentAccount(id);
      setPaymentAccounts((prev) => prev.filter((a) => a.id !== id));
      toast.success("Compte de paiement supprimé");
    } catch (error) {
      console.error("Error deleting payment account:", error);
      toast.error("Erreur lors de la suppression du compte de paiement");
    }
  };

  const handleMigrateData = async () => {
    if (!user) return;

    setIsMigrating(true);
    try {
      // Call the server-side migration API
      const response = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Migration failed");
      }

      toast.success(result.message || "Migration des données terminée avec succès !");

      // Reload the page to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Error migrating data:", error);
      toast.error("Erreur lors de la migration des données");
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Informations de l'entreprise</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="companyName">Nom de l'entreprise</Label>
          <Input
            id="companyName"
            value={company.name}
            onChange={(e) => setCompany({ ...company, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="companyAddress">Adresse</Label>
          <Input
            id="companyAddress"
            value={company.address}
            onChange={(e) => setCompany({ ...company, address: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="companySiren">SIREN</Label>
          <Input
            id="companySiren"
            value={company.siren}
            onChange={(e) => setCompany({ ...company, siren: e.target.value })}
          />
        </div>
        <div>
          <Label>Logo de l'entreprise</Label>
          <div className="mt-2 space-y-4">
            {company.logo ? (
              <div className="relative w-[200px] h-[80px] border rounded-lg overflow-hidden">
                <img
                  src={company.logo}
                  alt="Logo de l'entreprise"
                  className="w-full h-full object-contain"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-[200px] h-[80px] border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-1 text-sm text-muted-foreground">Aucun logo</p>
                </div>
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {company.logo ? "Changer le logo" : "Ajouter un logo"}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Format accepté : JPG, PNG, GIF (max 5MB)
              </p>
            </div>
            {company.logo && (
              <div className="space-y-2">
                <Label>Taille du logo</Label>
                <div className="flex gap-2">
                  {(["small", "medium", "large"] as const).map((size) => (
                    <Button
                      key={size}
                      type="button"
                      variant={company.logoSize === size ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCompany({ ...company, logoSize: size })}
                      className="capitalize"
                    >
                      {size === "small" ? "Petit" : size === "medium" ? "Moyen" : "Grand"}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Enregistrer</Button>
        </div>

        <Separator className="my-8" />

        {/* Payment Accounts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Comptes de paiement</h3>
            </div>
            {!isAddingAccount && (
              <Button variant="outline" size="sm" onClick={() => setIsAddingAccount(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un compte
              </Button>
            )}
          </div>

          {/* Existing accounts */}
          {paymentAccounts.length > 0 && (
            <div className="space-y-3">
              {paymentAccounts.map((account) => (
                <div
                  key={account.id}
                  className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 flex justify-between items-start"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">IBAN :</span> {account.iban}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">BIC :</span> {account.bic}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Titulaire :</span> {account.accountHolder}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleDeletePaymentAccount(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {paymentAccounts.length === 0 && !isAddingAccount && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun compte de paiement enregistré
            </p>
          )}

          {/* Add new account form */}
          {isAddingAccount && (
            <div className="p-4 border rounded-lg space-y-4">
              <div>
                <Label htmlFor="accountName">Nom du compte</Label>
                <Input
                  id="accountName"
                  placeholder="Ex: Compte principal"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                  value={newAccount.iban}
                  onChange={(e) => setNewAccount({ ...newAccount, iban: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="bic">BIC / SWIFT</Label>
                <Input
                  id="bic"
                  placeholder="XXXXXXXX"
                  value={newAccount.bic}
                  onChange={(e) => setNewAccount({ ...newAccount, bic: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="accountHolder">Nom associé au compte</Label>
                <Input
                  id="accountHolder"
                  placeholder="Ex: EI GRIMONPREZ Alexis"
                  value={newAccount.accountHolder}
                  onChange={(e) => setNewAccount({ ...newAccount, accountHolder: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingAccount(false);
                    setNewAccount({ name: "", iban: "", bic: "", accountHolder: "" });
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleAddPaymentAccount}>
                  Enregistrer le compte
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Data Migration Section - Only visible for admin user */}
        {user?.uid === "YmRZEzDugpNn8Vei2qN1vd3wuOA2" && (
          <>
            <Separator className="my-8" />
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Migration des données</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Importez toutes les données existantes de la base de données et associez-les à votre compte utilisateur.
                Cette action va récupérer tous les devis, factures, modèles et comptes de paiement non attribués.
              </p>
              <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                  <strong>Attention :</strong> Cette action va associer toutes les données existantes sans userId à votre compte.
                  Assurez-vous d'être le propriétaire de ces données.
                </p>
                <Button
                  onClick={handleMigrateData}
                  disabled={isMigrating}
                  variant="outline"
                  className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
                >
                  {isMigrating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Migration en cours...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Importer les données existantes
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                ID utilisateur : {user.uid}
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}