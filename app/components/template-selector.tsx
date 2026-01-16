"use client";

import { useState, useEffect } from "react";
import { Check, Save, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Invoice } from "../types";
import { toast } from "sonner";
import { getTemplates, saveTemplate, deleteTemplate } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";

interface TemplateSelectorProps {
  onSelectTemplate: (template: Invoice) => void;
  currentInvoice?: Invoice;
}

const TEMPLATE_CATEGORIES = [
  "Site web",
  "E-commerce",
  "Marketing digital",
  "Maintenance",
  "Consulting",
  "Autre"
];

export function TemplateSelector({ onSelectTemplate, currentInvoice }: TemplateSelectorProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Invoice[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateCategory, setTemplateCategory] = useState<string>("Autre");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user]);

  const loadTemplates = async () => {
    if (!user) return;
    try {
      const fetchedTemplates = await getTemplates(user.uid);
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Erreur lors du chargement des modèles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!currentInvoice || !user) return;
    if (!templateName.trim()) {
      toast.error("Veuillez saisir un nom pour le modèle");
      return;
    }

    try {
      const template: Invoice = {
        ...currentInvoice,
        id: crypto.randomUUID(),
        isTemplate: true,
        templateName,
        templateDescription,
        templateCategory,
        status: 'draft',
        date: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await saveTemplate(template, user.uid);
      await loadTemplates();

      setTemplateName("");
      setTemplateDescription("");
      setTemplateCategory("Autre");
      setIsSaveDialogOpen(false);
      toast.success("Modèle enregistré avec succès !");
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Erreur lors de l'enregistrement du modèle");
    }
  };

  const handleSelectTemplate = (template: Invoice) => {
    const newInvoice: Invoice = {
      ...template,
      id: crypto.randomUUID(),
      isTemplate: false,
      templateName: undefined,
      templateDescription: undefined,
      templateCategory: undefined,
      number: `DEV-${Date.now()}`,
      date: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'draft',
      createdAt: new Date(),
    };
    onSelectTemplate(newInvoice);
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      await deleteTemplate(templateToDelete.id);
      await loadTemplates();
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
      toast.success("Modèle supprimé avec succès !");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Erreur lors de la suppression du modèle");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span>Chargement des modèles...</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Check className="mr-2 h-4 w-4" />
            Utiliser un modèle
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogTitle>Sélectionner un modèle</DialogTitle>
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 gap-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div>
                        <p className="font-semibold">{template.templateName}</p>
                        <p className="text-sm text-muted-foreground">
                          {template.services.length} service{template.services.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      {template.templateDescription && (
                        <p className="text-sm text-muted-foreground">
                          {template.templateDescription}
                        </p>
                      )}
                      {template.templateCategory && (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {template.templateCategory}
                        </span>
                      )}
                    </div>
                    <div className="text-right space-y-2">
                      <p className="font-bold">
                        {template.totalAmount.toLocaleString('fr-FR')} €
                      </p>
                      {template.discount?.value > 0 && (
                        <p className="text-sm text-green-600">
                          Remise: {template.discount.type === 'percentage'
                            ? `${template.discount.value}%`
                            : `${template.discount.value.toLocaleString('fr-FR')}€`}
                        </p>
                      )}
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTemplateToDelete(template);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSelectTemplate(template)}
                        >
                          Utiliser
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {templates.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Aucun modèle enregistré
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {currentInvoice && (
        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Enregistrer comme modèle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Enregistrer comme modèle</DialogTitle>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Nom du modèle</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ex: Développement site vitrine"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateDescription">Description</Label>
                <Textarea
                  id="templateDescription"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Description du modèle..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateCategory">Catégorie</Label>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveTemplate} className="w-full">
                Enregistrer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogTitle>Confirmer la suppression</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer le modèle "{templateToDelete?.templateName}" ?
            Cette action est irréversible.
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTemplate}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}