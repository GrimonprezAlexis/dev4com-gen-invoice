import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { draftContent, catalogData, quoteData } = body;

    if (!draftContent) {
      return NextResponse.json(
        { error: "Le contenu brouillon est requis" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "votre-clé-api-anthropic-ici") {
      return NextResponse.json(
        {
          error: "Clé API Anthropic non configurée. Configurez ANTHROPIC_API_KEY dans .env.local"
        },
        { status: 500 }
      );
    }

    // Importer dynamiquement le SDK
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const prompt = `Tu es un expert en rédaction commerciale et en génération de devis professionnels.

À partir du contenu brouillon, génère des services détaillés et structurés.

CONTEXTE DE L'ENTREPRISE:
- Entreprise: ${catalogData?.company || "Dev4Ecom"}
- Type de stratégie: ${catalogData?.strategy_type || "Service"}
- Marché cible: ${catalogData?.target_market || "PME"}
- Devise: ${catalogData?.currency || "EUR"}

CONTENU BROUILLON À TRANSFORMER:
${draftContent}

INSTRUCTIONS:
1. Parse le brouillon pour identifier les services/prestations
2. Génère une liste de services avec descriptions professionnelles
3. Pour chaque service, estime une quantité réaliste et un prix unitaire approprié
4. Retourne UNIQUEMENT un JSON valide (pas de texte supplémentaire) avec cette structure exacte:
{
  "services": [
    {
      "description": "Description professionnelle du service",
      "quantity": 1,
      "unitPrice": 1000
    }
  ],
  "paymentTerms": "Conditions de paiement professionnelles"
}

EXEMPLES:
Brouillon: "Création site web 3 pages, maintenance 1 an"
Retour JSON:
{
  "services": [
    {
      "description": "Création de site web professionnel (3 pages)",
      "quantity": 1,
      "unitPrice": 1500
    },
    {
      "description": "Maintenance et support technique (12 mois)",
      "quantity": 1,
      "unitPrice": 300
    }
  ],
  "paymentTerms": "50% à la signature du devis, 50% à la livraison"
}

Retourne UNIQUEMENT le JSON sans explication ou markdown.`;

    const message = await client.messages.create({
      model: "claude-opus-4-5-20251101",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse le JSON retourné
    let parsedData;
    try {
      // Nettoyer les backticks markdown si présentes
      const cleanedText = responseText
        .replace(/^```json\n?/, "")
        .replace(/\n?```$/, "")
        .replace(/```$/, "")
        .trim();
      parsedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Erreur parsing JSON:", responseText, parseError);
      return NextResponse.json(
        {
          error: "Erreur lors du parsing de la réponse IA",
          details: responseText
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      services: parsedData.services || [],
      paymentTerms: parsedData.paymentTerms || "",
    });
  } catch (error) {
    console.error("Erreur API generate-quote-content:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: error.message,
          details: "Voir les logs du serveur pour plus d'informations"
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Erreur serveur inconnue" },
      { status: 500 }
    );
  }
}
