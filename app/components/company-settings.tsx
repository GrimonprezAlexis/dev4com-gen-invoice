"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Company, PaymentAccount, BillingCountry } from "../types";
import { toast } from "sonner";
import {
  Upload,
  X,
  Plus,
  Trash2,
  CreditCard,
  Building2,
  Image,
  ChevronDown,
  Database,
  Loader2,
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Download,
  HardDrive,
} from "lucide-react";
import {
  saveCompany,
  getCompany,
  savePaymentAccount,
  getPaymentAccounts,
  deletePaymentAccount,
  exportUserData,
  importUserData,
  UserDataExport,
} from "@/lib/firebase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { changeEmail, changePassword } from "@/lib/firebase-auth";

// --- Collapsible Section Component ---
function SettingsSection({
  icon: Icon,
  title,
  subtitle,
  children,
  defaultOpen = false,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950/50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
      >
        <div className="shrink-0 w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-slate-600 dark:text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{title}</span>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/50">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---
export function CompanySettings() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company>({
    name: "",
    address: "",
    siren: "",
    logo: "",
    country: "FR",
    city: "",
    postalCode: "",
  });
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [newAccount, setNewAccount] = useState<Omit<PaymentAccount, "id">>({
    name: "",
    iban: "",
    bic: "",
    accountHolder: "",
    country: "FR",
    address: "",
    city: "",
    zip: "",
  });
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Account management state
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [companyData, accountsData] = await Promise.all([
          getCompany(user.uid),
          getPaymentAccounts(user.uid),
        ]);
        if (companyData) setCompany(companyData);
        setPaymentAccounts(accountsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Erreur lors du chargement des donnees");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  // --- Company ---
  const handleSave = async () => {
    if (!user) return;
    try {
      await saveCompany(company, user.uid);
      toast.success("Informations de l'entreprise mises a jour");
    } catch (error) {
      console.error("Error saving company data:", error);
      toast.error("Erreur lors de la sauvegarde");
    }
  };

  // --- Logo ---
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Le fichier est trop volumineux. Taille maximum : 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Veuillez selectionner une image valide");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setCompany((prev) => ({ ...prev, logo: dataUrl, logoSize: "medium" }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setCompany((prev) => ({ ...prev, logo: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Payment Accounts ---
  const handleAddPaymentAccount = async () => {
    if (!user) return;
    if (!newAccount.name || !newAccount.iban || !newAccount.bic || !newAccount.accountHolder) {
      toast.error("Veuillez remplir tous les champs du compte de paiement");
      return;
    }
    if (newAccount.country === "CH") {
      if (!newAccount.address || !newAccount.city || !newAccount.zip) {
        toast.error("Pour un compte suisse, l'adresse, la ville et le code postal sont obligatoires");
        return;
      }
      const cleanIban = newAccount.iban.replace(/\s/g, "").toUpperCase();
      if (!cleanIban.startsWith("CH") && !cleanIban.startsWith("LI")) {
        toast.error("L'IBAN d'un compte suisse doit commencer par CH ou LI");
        return;
      }
    }
    try {
      const account: PaymentAccount = { ...newAccount, id: Date.now().toString() };
      await savePaymentAccount(account, user.uid);
      setPaymentAccounts((prev) => [...prev, account]);
      setNewAccount({ name: "", iban: "", bic: "", accountHolder: "", country: "FR", address: "", city: "", zip: "" });
      setIsAddingAccount(false);
      toast.success("Compte de paiement ajoute");
    } catch (error) {
      console.error("Error adding payment account:", error);
      toast.error("Erreur lors de l'ajout du compte de paiement");
    }
  };

  const handleDeletePaymentAccount = async (id: string) => {
    try {
      await deletePaymentAccount(id);
      setPaymentAccounts((prev) => prev.filter((a) => a.id !== id));
      toast.success("Compte de paiement supprime");
    } catch (error) {
      console.error("Error deleting payment account:", error);
      toast.error("Erreur lors de la suppression du compte de paiement");
    }
  };

  // --- Account Management ---
  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setIsChangingEmail(true);
    try {
      await changeEmail(newEmail, emailPassword);
      toast.success("Un email de verification a ete envoye a votre nouvelle adresse. Verifiez votre boite de reception.");
      setNewEmail("");
      setEmailPassword("");
    } catch (error: any) {
      const code = error?.code || "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast.error("Mot de passe incorrect");
      } else if (code === "auth/email-already-in-use") {
        toast.error("Cet email est deja utilise par un autre compte");
      } else if (code === "auth/invalid-email") {
        toast.error("Adresse email invalide");
      } else if (code === "auth/requires-recent-login") {
        toast.error("Session expiree. Veuillez vous reconnecter puis reessayer.");
      } else {
        toast.error("Erreur lors du changement d'email");
        console.error("Change email error:", error);
      }
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Mot de passe modifie avec succes");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      const code = error?.code || "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast.error("Mot de passe actuel incorrect");
      } else if (code === "auth/weak-password") {
        toast.error("Le mot de passe est trop faible (minimum 6 caracteres)");
      } else if (code === "auth/requires-recent-login") {
        toast.error("Session expiree. Veuillez vous reconnecter puis reessayer.");
      } else {
        toast.error("Erreur lors du changement de mot de passe");
        console.error("Change password error:", error);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // --- Export / Import ---
  const handleExport = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const data = await exportUserData(user.uid);
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dev4com-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Donnees exportees avec succes");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erreur lors de l'exportation des donnees");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setIsImporting(true);
    try {
      const text = await file.text();
      const data: UserDataExport = JSON.parse(text);
      if (!data.version || !data.data) {
        throw new Error("Format de fichier invalide");
      }
      const result = await importUserData(user.uid, data);
      const r = result.imported;
      toast.success(
        `Import termine : ${r.invoices} devis, ${r.billingInvoices} factures, ${r.templates} modeles, ${r.paymentAccounts} comptes`
      );
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Import error:", error);
      toast.error(error instanceof SyntaxError ? "Fichier JSON invalide" : "Erreur lors de l'importation");
    } finally {
      setIsImporting(false);
      if (importFileRef.current) importFileRef.current.value = "";
    }
  };

  // --- Migration ---
  const handleMigrateData = async () => {
    if (!user) return;
    setIsMigrating(true);
    try {
      const response = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Migration failed");
      toast.success(result.message || "Migration des donnees terminee avec succes !");
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Error migrating data:", error);
      toast.error("Erreur lors de la migration des donnees");
    } finally {
      setIsMigrating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold">Parametres</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerez votre entreprise, comptes de paiement et securite
          </p>
        </div>
        {user?.email && (
          <span className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
            {user.email}
          </span>
        )}
      </div>

      {/* ─── Section 1: Entreprise ─── */}
      <SettingsSection
        icon={Building2}
        title="Informations de l'entreprise"
        subtitle={company.name || "Non configure"}
        defaultOpen={true}
      >
        <div className="space-y-3 mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Nom de l'entreprise</Label>
              <Input
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                placeholder="Mon entreprise"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Pays de facturation</Label>
              <Select
                value={company.country || "FR"}
                onValueChange={(value: BillingCountry) => setCompany({ ...company, country: value })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="CH">Suisse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Adresse</Label>
            <Input
              value={company.address}
              onChange={(e) => setCompany({ ...company, address: e.target.value })}
              placeholder={company.country === "CH" ? "Rue et numero" : "Adresse complete"}
              className="h-9 text-sm"
            />
          </div>

          {company.country === "CH" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Code postal (NPA)</Label>
                <Input
                  value={company.postalCode || ""}
                  onChange={(e) => setCompany({ ...company, postalCode: e.target.value })}
                  placeholder="1000"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Ville</Label>
                <Input
                  value={company.city || ""}
                  onChange={(e) => setCompany({ ...company, city: e.target.value })}
                  placeholder="Lausanne"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          )}

          {company.country === "FR" && (
            <div>
              <Label className="text-xs text-muted-foreground">SIREN</Label>
              <Input
                value={company.siren}
                onChange={(e) => setCompany({ ...company, siren: e.target.value })}
                placeholder="123 456 789"
                className="h-9 text-sm"
              />
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700">
              Enregistrer
            </Button>
          </div>
        </div>
      </SettingsSection>

      {/* ─── Section 2: Logo ─── */}
      <SettingsSection
        icon={Image}
        title="Logo de l'entreprise"
        subtitle={company.logo ? "Logo configure" : "Aucun logo"}
        badge={
          company.logo ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
              Actif
            </span>
          ) : null
        }
      >
        <div className="mt-3 space-y-3">
          <div className="flex items-start gap-4">
            {company.logo ? (
              <div className="relative w-[160px] h-[64px] border rounded-lg overflow-hidden bg-white dark:bg-slate-900 shrink-0">
                <img
                  src={company.logo}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-[160px] h-[64px] border-2 border-dashed rounded-lg shrink-0">
                <div className="text-center">
                  <Upload className="mx-auto h-5 w-5 text-muted-foreground/50" />
                  <p className="text-[10px] text-muted-foreground mt-1">Aucun logo</p>
                </div>
              </div>
            )}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-3 w-3" />
                {company.logo ? "Changer" : "Ajouter un logo"}
              </Button>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                JPG, PNG, GIF (max 5MB)
              </p>
            </div>
          </div>

          {company.logo && (
            <div>
              <Label className="text-xs text-muted-foreground">Taille du logo</Label>
              <div className="flex gap-1.5 mt-1">
                {(["small", "medium", "large"] as const).map((size) => (
                  <Button
                    key={size}
                    type="button"
                    variant={company.logoSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCompany({ ...company, logoSize: size })}
                    className="text-xs h-7"
                  >
                    {size === "small" ? "Petit" : size === "medium" ? "Moyen" : "Grand"}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {company.logo && (
            <div className="flex justify-end">
              <Button onClick={handleSave} size="sm" className="bg-blue-600 hover:bg-blue-700">
                Enregistrer
              </Button>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* ─── Section 3: Comptes de paiement ─── */}
      <SettingsSection
        icon={CreditCard}
        title="Comptes de paiement"
        subtitle={`${paymentAccounts.length} compte${paymentAccounts.length > 1 ? "s" : ""} configure${paymentAccounts.length > 1 ? "s" : ""}`}
        badge={
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground">
            {paymentAccounts.length}
          </span>
        }
      >
        <div className="mt-3 space-y-3">
          {/* Existing accounts */}
          {paymentAccounts.map((account) => (
            <div
              key={account.id}
              className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50 flex justify-between items-start"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{account.name}</p>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      account.country === "CH"
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    }`}
                  >
                    {account.country === "CH" ? "CH" : "FR"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate">{account.iban}</p>
                <p className="text-xs text-muted-foreground">
                  {account.accountHolder}
                  {account.country === "CH" && account.address && (
                    <> &middot; {account.address}, {account.zip} {account.city}</>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                onClick={() => handleDeletePaymentAccount(account.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          {paymentAccounts.length === 0 && !isAddingAccount && (
            <p className="text-xs text-muted-foreground text-center py-6">
              Aucun compte de paiement enregistre
            </p>
          )}

          {/* Add new account form */}
          {isAddingAccount && (
            <div className="p-3 border-2 border-dashed border-blue-200 dark:border-blue-900 rounded-lg space-y-3 bg-blue-50/30 dark:bg-blue-950/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Pays du compte</Label>
                  <Select
                    value={newAccount.country || "FR"}
                    onValueChange={(value: BillingCountry) =>
                      setNewAccount({ ...newAccount, country: value })
                    }
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="CH">Suisse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Nom du compte</Label>
                  <Input
                    placeholder="Compte principal"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Titulaire</Label>
                <Input
                  placeholder={newAccount.country === "CH" ? "Jean Dupont" : "EI GRIMONPREZ Alexis"}
                  value={newAccount.accountHolder}
                  onChange={(e) => setNewAccount({ ...newAccount, accountHolder: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">IBAN</Label>
                  <Input
                    placeholder={
                      newAccount.country === "CH"
                        ? "CH58 0079 1123 0008 8901 2"
                        : "FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                    }
                    value={newAccount.iban}
                    onChange={(e) => setNewAccount({ ...newAccount, iban: e.target.value })}
                    className="h-8 text-sm font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">BIC / SWIFT</Label>
                  <Input
                    placeholder="XXXXXXXX"
                    value={newAccount.bic}
                    onChange={(e) => setNewAccount({ ...newAccount, bic: e.target.value })}
                    className="h-8 text-sm font-mono"
                  />
                </div>
              </div>

              {newAccount.country === "CH" && (
                <div className="border-t border-blue-200 dark:border-blue-900 pt-3 space-y-3">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    Adresse du titulaire (requis pour QR-Facture)
                  </p>
                  <div>
                    <Label className="text-xs text-muted-foreground">Adresse</Label>
                    <Input
                      placeholder="Rue de la Gare 12"
                      value={newAccount.address || ""}
                      onChange={(e) => setNewAccount({ ...newAccount, address: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">NPA</Label>
                      <Input
                        placeholder="1000"
                        value={newAccount.zip || ""}
                        onChange={(e) => setNewAccount({ ...newAccount, zip: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Ville</Label>
                      <Input
                        placeholder="Lausanne"
                        value={newAccount.city || ""}
                        onChange={(e) => setNewAccount({ ...newAccount, city: e.target.value })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingAccount(false);
                    setNewAccount({
                      name: "", iban: "", bic: "", accountHolder: "",
                      country: "FR", address: "", city: "", zip: "",
                    });
                  }}
                >
                  Annuler
                </Button>
                <Button size="sm" onClick={handleAddPaymentAccount} className="bg-blue-600 hover:bg-blue-700">
                  <Check className="w-3 h-3 mr-1" />
                  Enregistrer
                </Button>
              </div>
            </div>
          )}

          {!isAddingAccount && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingAccount(true)}
              className="w-full border-dashed"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Ajouter un compte de paiement
            </Button>
          )}
        </div>
      </SettingsSection>

      {/* ─── Section 4: Securite du compte ─── */}
      <SettingsSection
        icon={Shield}
        title="Securite du compte"
        subtitle="Email et mot de passe"
      >
        <div className="mt-3 space-y-5">
          {/* Change Email */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <Label className="text-sm font-medium">Changer l'email</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Email actuel : <span className="font-medium text-foreground">{user?.email}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Nouvel email</Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nouveau@email.com"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Mot de passe actuel</Label>
                <Input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Confirmez votre mot de passe"
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground">
                Un email de verification sera envoye a la nouvelle adresse. Le changement sera effectif apres validation.
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleChangeEmail}
                disabled={isChangingEmail || !newEmail || !emailPassword}
              >
                {isChangingEmail && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Changer l'email
              </Button>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* Change Password */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              <Label className="text-sm font-medium">Changer le mot de passe</Label>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mot de passe actuel"
                  className="h-9 text-sm pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 caracteres"
                    className="h-9 text-sm pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Confirmer</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez le mot de passe"
                  className="h-9 text-sm"
                />
                {confirmPassword && newPassword && (
                  <p className={`text-[10px] mt-1 ${
                    confirmPassword === newPassword
                      ? "text-green-600"
                      : "text-red-500"
                  }`}>
                    {confirmPassword === newPassword ? "Les mots de passe correspondent" : "Les mots de passe ne correspondent pas"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleChangePassword}
                disabled={
                  isChangingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
              >
                {isChangingPassword && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Changer le mot de passe
              </Button>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* ─── Section 5: Sauvegarde des donnees ─── */}
      <SettingsSection
        icon={HardDrive}
        title="Sauvegarde des donnees"
        subtitle="Exporter ou importer vos donnees au format JSON"
      >
        <div className="mt-3 space-y-4">
          {/* Export */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Exporter les donnees</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Telecharge un fichier JSON contenant tous vos devis, factures, modeles, comptes de paiement et informations d'entreprise.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                disabled={isExporting}
                className="mt-2"
              >
                {isExporting ? (
                  <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Exportation...</>
                ) : (
                  <><Download className="w-3 h-3 mr-1" /> Telecharger le backup</>
                )}
              </Button>
            </div>
          </div>

          {/* Import */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Importer des donnees</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Restaurez vos donnees a partir d'un fichier JSON exporte precedemment.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => importFileRef.current?.click()}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Importation...</>
                  ) : (
                    <><Upload className="w-3 h-3 mr-1" /> Selectionner un fichier</>
                  )}
                </Button>
              </div>
              <div className="flex items-start gap-1.5 mt-2">
                <AlertCircle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground">
                  L'import ajoutera les donnees au compte actuel. Les donnees existantes avec le meme ID seront ecrasees.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* ─── Section 6: Migration (admin only) ─── */}
      {user?.uid === "YmRZEzDugpNn8Vei2qN1vd3wuOA2" && (
        <SettingsSection
          icon={Database}
          title="Migration des donnees"
          subtitle="Importer les donnees existantes"
          badge={
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              Admin
            </span>
          }
        >
          <div className="mt-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              Importez toutes les donnees existantes de la base de donnees et associez-les a votre compte utilisateur.
            </p>
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200 mb-3">
                <strong>Attention :</strong> Cette action va associer toutes les donnees existantes sans userId a votre compte.
              </p>
              <Button
                onClick={handleMigrateData}
                disabled={isMigrating}
                variant="outline"
                size="sm"
                className="border-amber-400 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Migration en cours...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-3 w-3" />
                    Importer les donnees existantes
                  </>
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              UID: {user.uid}
            </p>
          </div>
        </SettingsSection>
      )}
    </div>
  );
}
