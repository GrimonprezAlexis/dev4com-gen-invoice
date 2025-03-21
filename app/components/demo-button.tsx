"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { generateDemoInvoices } from "@/app/utils/demo";
import { saveInvoice } from "@/lib/firebase";
import { toast } from "sonner";
import { useConfetti } from "@/app/hooks/use-confetti";

export function DemoButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const fireConfetti = useConfetti();

  const handleGenerateDemos = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const demoInvoices = await generateDemoInvoices();
      
      // Save all demo invoices to Firebase
      await Promise.all(demoInvoices.map(invoice => saveInvoice(invoice)));
      
      fireConfetti();
      toast.success("5 devis de démonstration ont été générés !");
    } catch (error) {
      console.error("Error generating demo invoices:", error);
      toast.error("Erreur lors de la génération des devis de démonstration");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleGenerateDemos}
      disabled={isGenerating}
    >
      <Sparkles className="mr-2 h-4 w-4" />
      {isGenerating ? "Génération..." : "Démo"}
    </Button>
  );
}