# Dev4Ecom - Generateur de Devis & Factures

## Architecture

- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **UI**: Tailwind CSS + shadcn/ui (Radix primitives)
- **Backend**: Firebase (Firestore + Auth)
- **PDF**: @react-pdf/renderer (French & Swiss templates)
- **QR**: swissqrbill (Swiss QR-Bill), qrcode (French EPC/SEPA)
- **IA**: Groq API (Llama 3.3 70B) pour la redaction automatique de devis

## Structure des fichiers

```
app/
  page.tsx                          # Page principale (tabs: Devis, Factures, Clients, Analyses, Parametres)
  types/index.ts                    # Types TS: Invoice, BillingInvoice, Company, PaymentAccount, Service
  api/
    generate-quote-content/route.ts # API IA (Groq/Llama) pour generer des services depuis du texte brouillon
    migrate/route.ts                # Migration de donnees admin
    send-invoice/route.ts           # Envoi email devis (Resend)
    send-billing-invoice/route.ts   # Envoi email facture (Resend)
    quotes/[id]/route.ts            # API devis par ID
  components/
    quotes/
      form.tsx                      # Wrapper QuoteForm -> InvoiceForm
      list.tsx                      # Liste des devis avec filtres, actions, selection multiple
      preview.tsx                   # Preview PDF devis (genere QR suisse si CH)
    billing/
      list.tsx                      # Liste des factures
      preview.tsx                   # Preview PDF facture (genere QR suisse/EPC)
    shared/
      invoice-form.tsx              # Formulaire principal (services drag&drop, collapse, IA, TVA, devise)
      billing-invoice-form.tsx      # Formulaire facture (depuis un devis existant)
      document-preview.tsx          # Route vers SwissPDFDocument ou FrenchPDFDocument
      swiss-pdf-document.tsx        # Template PDF Suisse (QR-Bill en bas de page)
      french-pdf-document.tsx       # Template PDF Francais (EPC QR inline)
      pdf-download-button.tsx       # Bouton telechargement PDF avec generation QR
    company-settings.tsx            # Page Parametres (entreprise, logo, paiement, securite, backup)
    ai-rewrite-dialog.tsx           # Modale IA pour rediger les services
    template-selector.tsx           # Selecteur de modeles de devis
    analytics-dashboard.tsx         # Dashboard analytique (charts)
    demo-button.tsx                 # Bouton demo (donnees fictives)
    theme-toggle.tsx                # Dark/Light mode
  hooks/
    use-confetti.ts                 # Animation confetti (devis accepte)

components/
  ui/                               # Composants shadcn/ui (dialog, button, input, select, etc.)
  auth/
    protected-route.tsx             # Wrapper auth pour les pages protegees

contexts/
  auth-context.tsx                  # Context React pour l'authentification Firebase

lib/
  firebase.ts                       # Config Firebase + CRUD Firestore (invoices, billing, company, templates, payment accounts, export/import)
  firebase-auth.ts                  # Auth Firebase (login, register, logout, changeEmail, changePassword, reauthenticate)
  swiss-utils.ts                    # Utilitaires suisses (formatage nombres, validation IBAN, TVA, QR EPC)
  swissqrbill-utils.ts             # Generation QR-Bill suisse (SVG -> PNG)
  utils.ts                          # cn() helper (tailwind-merge + clsx)
```

## Collections Firestore

| Collection         | Doc ID          | Champs cles                                  |
| ------------------- | --------------- | --------------------------------------------- |
| `invoices`          | UUID            | userId, number, client, services, status, ... |
| `billingInvoices`   | UUID            | userId, quoteNumber, paymentStatus, ...       |
| `company`           | userId          | name, address, siren, logo, country           |
| `templates`         | UUID            | userId, isTemplate=true, templateName, ...    |
| `paymentAccounts`   | ID timestamp    | userId, iban, bic, accountHolder, country     |

## Fonctionnalites cles

### Multi-pays (FR / CH)
- Template PDF different selon `billingCountry` (FR ou CH)
- Swiss QR-Bill (swissqrbill) en bas de page pour les devis et factures suisses
- French EPC/SEPA QR code inline pour les factures francaises
- Validation IBAN suisse, champs adresse obligatoires pour QR-Facture
- Formatage nombres : FR = `1 234,56` / CH = `1'234.56`

### IA (Groq API)
- Endpoint: `/api/generate-quote-content`
- Modele: `llama-3.3-70b-versatile` (gratuit via Groq)
- Input: texte brouillon -> Output: JSON {services[], paymentTerms}
- Variable d'env: `GROQ_API_KEY`

### Services dans le formulaire
- Drag & drop natif HTML5 pour reordonner
- Collapsible: chaque service peut etre replie (vue compacte)
- Bouton "Tout replier / Tout ouvrir"

### Modales
- Prop `resizable` sur DialogContent pour redimensionner manuellement
- Responsive: `w-[95vw] max-w-2xl lg:max-w-4xl xl:max-w-5xl`

### Gestion du compte
- Changement email (verification par email)
- Changement mot de passe (reauthentification requise)
- Export JSON complet (backup) / Import JSON (restauration)

## Variables d'environnement

```env
GROQ_API_KEY=          # Cle API Groq (gratuit - https://console.groq.com)
RESEND_API_KEY=        # Envoi d'emails
# Firebase (cote client, dans le code)
```

## Conventions

- Langue UI: Francais
- Devise par defaut: EUR (alternativement CHF)
- Formulaires compacts: inputs `h-8`/`h-9`, labels `text-xs text-muted-foreground`
- Sections collapsibles avec ChevronDown/ChevronUp
- Toasts via `sonner` pour les notifications
- Les dates Firestore sont converties avec `toDate()` helper
- `cleanUndefined()` avant chaque ecriture Firestore
