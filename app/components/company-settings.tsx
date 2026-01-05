"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Company } from "../types";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { saveCompany, getCompany } from "@/lib/firebase";

export function CompanySettings() {
  const [company, setCompany] = useState<Company>({
    name: "",
    address: "",
    siren: "",
    logo: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const companyData = await getCompany();
        if (companyData) {
          setCompany(companyData);
        }
      } catch (error) {
        console.error("Error loading company data:", error);
        toast.error("Erreur lors du chargement des données de l'entreprise");
      } finally {
        setIsLoading(false);
      }
    };
    loadCompany();
  }, []);

  const handleSave = async () => {
    try {
      await saveCompany(company);
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
      </div>
    </Card>
  );
}