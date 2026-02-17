"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartOptions,
} from "chart.js";
import { Invoice, BillingInvoice } from "../types";
import { getInvoices, getBillingInvoices } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import {
  format,
  subMonths,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { fr } from "date-fns/locale";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const chartOptions: ChartOptions<"bar"> = {
  responsive: true,
  plugins: {
    legend: {
      position: "bottom" as const,
    },
  },
  scales: {
    y: {
      type: "linear",
      beginAtZero: true,
      ticks: {
        callback: function (value) {
          return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
        },
      },
    },
  },
};

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingInvoices, setBillingInvoices] = useState<BillingInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [fetchedInvoices, fetchedBillingInvoices] = await Promise.all([
          getInvoices(user.uid),
          getBillingInvoices(user.uid),
        ]);
        setInvoices(fetchedInvoices);
        setBillingInvoices(fetchedBillingInvoices);
      } catch (error) {
        console.error("Error loading data for analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Calculate key metrics
  const acceptedInvoices = invoices.filter((inv) => inv.status === "accepted" || inv.status === "paid");
  const totalRevenue = acceptedInvoices.reduce(
    (sum, inv) => sum + inv.totalAmount,
    0
  );
  const averageInvoiceValue =
    invoices.length > 0 ? totalRevenue / invoices.length : 0;
  const conversionRate =
    invoices.length > 0 ? (acceptedInvoices.length / invoices.length) * 100 : 0;

  // Calculate monthly data for the last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      month: format(date, "MMM", { locale: fr }),
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  }).reverse();

  const monthlyData = {
    labels: last6Months.map((m) => m.month),
    datasets: [
      {
        label: "Montant des devis (€)",
        data: last6Months.map((month) => {
          return invoices
            .filter(
              (inv) =>
                (inv.status === "accepted" || inv.status === "paid") &&
                isWithinInterval(new Date(inv.date), {
                  start: month.start,
                  end: month.end,
                })
            )
            .reduce((sum, inv) => sum + inv.totalAmount, 0);
        }),
        backgroundColor: "rgba(37, 99, 235, 0.5)",
        borderColor: "rgb(37, 99, 235)",
        borderWidth: 1,
      },
    ],
  };

  // Calculate status distribution
  const statusData = {
    labels: ["Acceptés", "En attente", "Refusés"],
    datasets: [
      {
        data: [
          invoices.filter((inv) => inv.status === "accepted" || inv.status === "paid").length,
          invoices.filter((inv) => inv.status === "sent").length,
          invoices.filter((inv) => inv.status === "rejected").length,
        ],
        backgroundColor: [
          "rgba(34, 197, 94, 0.5)",
          "rgba(37, 99, 235, 0.5)",
          "rgba(239, 68, 68, 0.5)",
        ],
        borderColor: [
          "rgb(34, 197, 94)",
          "rgb(37, 99, 235)",
          "rgb(239, 68, 68)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Calculate billing metrics
  const totalBilled = billingInvoices.reduce(
    (sum, inv) => sum + inv.totalWithTax,
    0
  );
  const paidInvoices = billingInvoices.filter(
    (inv) => inv.paymentStatus === "paid"
  );
  const totalPaid = paidInvoices.reduce(
    (sum, inv) => sum + inv.totalWithTax,
    0
  );
  const paymentRate =
    billingInvoices.length > 0
      ? (paidInvoices.length / billingInvoices.length) * 100
      : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">
            Chiffre d'affaires total
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {totalRevenue.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </p>
          <p className="text-sm text-muted-foreground">
            {acceptedInvoices.length} devis acceptés
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Valeur moyenne</h3>
          <p className="text-3xl font-bold text-green-600">
            {averageInvoiceValue.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </p>
          <p className="text-sm text-muted-foreground">par devis</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Taux de conversion</h3>
          <p className="text-3xl font-bold text-purple-600">
            {conversionRate.toFixed(1)}%
          </p>
          <p className="text-sm text-muted-foreground">
            des devis sont acceptés
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Taux de recouvrement</h3>
          <p className="text-3xl font-bold text-orange-600">
            {paymentRate.toFixed(1)}%
          </p>
          <p className="text-sm text-muted-foreground">
            {paidInvoices.length} factures payées sur {billingInvoices.length}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Évolution mensuelle</h3>
          <Bar data={monthlyData} options={chartOptions} />
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Statut des devis</h3>
          <div className="w-2/3 mx-auto">
            <Doughnut data={statusData} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Facturation</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total facturé</span>
              <span className="font-semibold">
                {totalBilled.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total encaissé</span>
              <span className="font-semibold text-green-600">
                {totalPaid.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Reste à encaisser</span>
              <span className="font-semibold text-orange-600">
                {(totalBilled - totalPaid).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Clients</h3>
          <div className="space-y-4">
            {Array.from(new Set(invoices.map((inv) => inv.client.siren)))
              .map((siren) => {
                const clientInvoices = invoices.filter(
                  (inv) => inv.client.siren === siren
                );
                const client = clientInvoices[0].client;
                const totalAmount = clientInvoices
                  .filter((inv) => inv.status === "accepted" || inv.status === "paid")
                  .reduce((sum, inv) => sum + inv.totalAmount, 0);
                return {
                  client,
                  totalAmount,
                  invoiceCount: clientInvoices.length,
                };
              })
              .sort((a, b) => b.totalAmount - a.totalAmount)
              .slice(0, 5)
              .map(({ client, totalAmount, invoiceCount }) => (
                <div
                  key={client.siren}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoiceCount} devis
                    </p>
                  </div>
                  <span className="font-semibold">
                    {totalAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </span>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
