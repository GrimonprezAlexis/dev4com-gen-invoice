import { Invoice } from "../types";

const demoLogos = [
  "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&fit=crop",
  "https://images.unsplash.com/photo-1599305446868-59e861c19d68?w=200&fit=crop",
  "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=200&fit=crop",
  "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&fit=crop",
  "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=200&fit=crop"
];

const demoCompanies = [
  { name: "TechStart SAS", address: "15 rue de la Paix, 75002 Paris", siren: "123456789", logo: demoLogos[0] },
  { name: "Digital Solutions", address: "8 avenue des Champs-Élysées, 75008 Paris", siren: "987654321", logo: demoLogos[1] },
  { name: "WebPro Agency", address: "25 rue du Commerce, 75015 Paris", siren: "456789123", logo: demoLogos[2] },
  { name: "Innovate Studio", address: "42 rue du Faubourg Saint-Honoré, 75008 Paris", siren: "789123456", logo: demoLogos[3] },
  { name: "Future Tech", address: "18 rue de Rivoli, 75004 Paris", siren: "321654987", logo: demoLogos[4] }
];

const demoServices = [
  { description: "Développement site e-commerce", unitPrice: 5000 },
  { description: "Intégration CMS", unitPrice: 2500 },
  { description: "Design UI/UX", unitPrice: 3000 },
  { description: "Optimisation SEO", unitPrice: 1500 },
  { description: "Maintenance annuelle", unitPrice: 4000 },
  { description: "Développement application mobile", unitPrice: 8000 },
  { description: "Intégration API", unitPrice: 2000 },
  { description: "Formation équipe", unitPrice: 1200 },
  { description: "Support technique", unitPrice: 800 },
  { description: "Hébergement premium", unitPrice: 600 }
];

export async function generateDemoInvoices(): Promise<Invoice[]> {
  const statuses: ('draft' | 'sent' | 'accepted' | 'rejected')[] = ['draft', 'sent', 'accepted', 'rejected'];

  return Array.from({ length: 5 }, (_, index) => {
    const selectedServices = demoServices
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 2)
      .map(service => ({
        id: crypto.randomUUID(),
        description: service.description,
        quantity: Math.floor(Math.random() * 3) + 1,
        unitPrice: service.unitPrice,
        amount: 0
      }));

    selectedServices.forEach(service => {
      service.amount = service.quantity * service.unitPrice;
    });

    const subtotal = selectedServices.reduce((sum, service) => sum + service.amount, 0);
    const discountValue = Math.random() > 0.5 ? Math.floor(Math.random() * 20) : 0;
    const discountType = Math.random() > 0.5 ? 'percentage' : 'fixed';
    const discountAmount = discountType === 'percentage' 
      ? (subtotal * discountValue / 100)
      : discountValue;
    const totalAmount = subtotal - discountAmount;
    const deposit = Math.floor(Math.random() * 4) * 25;
    const remainingBalance = totalAmount * (1 - deposit / 100);

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    const validUntil = new Date(date);
    validUntil.setDate(validUntil.getDate() + 30);

    const selectedCompany = demoCompanies[Math.floor(Math.random() * demoCompanies.length)];

    return {
      id: crypto.randomUUID(),
      number: `DEMO-${String(index + 1).padStart(3, '0')}`,
      date: date.toISOString(),
      validUntil: validUntil.toISOString(),
      company: {
        name: "Dev4Ecom",
        address: "60 rue François 1er, 75008 Paris",
        siren: "814 428 785",
        logo: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=200&fit=crop"
      },
      client: selectedCompany,
      services: selectedServices,
      subtotal,
      discount: {
        type: discountType,
        value: discountValue
      },
      totalAmount,
      deposit,
      remainingBalance,
      paymentTerms: `${deposit}% à la signature, ${100 - deposit}% à la livraison`,
      deliveryTime: `${Math.floor(Math.random() * 3) + 2} semaines`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: date,
      isTemplate: false
    };
  });
}