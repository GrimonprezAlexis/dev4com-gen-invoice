"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check } from "lucide-react";

export type QuoteStatus = "draft" | "pending" | "sent" | "accepted" | "rejected" | "paid";
export type BillingStatus = "pending" | "partial" | "paid";

const QUOTE_STATUS_CONFIG: Record<QuoteStatus, { color: string; label: string }> = {
  accepted: { color: "bg-green-500", label: "Accepté" },
  draft: { color: "bg-gray-500", label: "Brouillon" },
  pending: { color: "bg-orange-500", label: "En attente" },
  sent: { color: "bg-blue-500", label: "Envoyé" },
  paid: { color: "bg-emerald-600", label: "Payé" },
  rejected: { color: "bg-red-500", label: "Refusé" },
};

const BILLING_STATUS_CONFIG: Record<BillingStatus, { color: string; label: string }> = {
  pending: { color: "bg-blue-500", label: "En attente" },
  partial: { color: "bg-yellow-500", label: "Partiel" },
  paid: { color: "bg-green-500", label: "Payée" },
};

// Sorted alphabetically by label
const QUOTE_STATUS_ORDER: QuoteStatus[] = ["accepted", "draft", "pending", "sent", "paid", "rejected"];
const BILLING_STATUS_ORDER: BillingStatus[] = ["pending", "partial", "paid"];

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
  variant?: "quote";
  onStatusChange?: (status: QuoteStatus) => void;
}

interface BillingStatusBadgeProps {
  status: BillingStatus;
  variant: "billing";
  onStatusChange?: (status: BillingStatus) => void;
}

type StatusBadgeProps = QuoteStatusBadgeProps | BillingStatusBadgeProps;

export function StatusBadge(props: StatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const isBilling = props.variant === "billing";

  const config = isBilling
    ? BILLING_STATUS_CONFIG[props.status as BillingStatus] || BILLING_STATUS_CONFIG.pending
    : QUOTE_STATUS_CONFIG[props.status as QuoteStatus] || QUOTE_STATUS_CONFIG.draft;

  if (!props.onStatusChange) {
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  }

  const entries = isBilling
    ? BILLING_STATUS_ORDER.map((key) => ({ key, ...BILLING_STATUS_CONFIG[key] }))
    : QUOTE_STATUS_ORDER.map((key) => ({ key, ...QUOTE_STATUS_CONFIG[key] }));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="cursor-pointer"
        >
          <Badge className={`${config.color} text-white hover:opacity-80 transition-opacity`}>
            {config.label}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end" sideOffset={6}>
        <div className="space-y-0.5">
          {entries.map(({ key, color, label }) => (
            <button
              key={key}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (key !== props.status) {
                  (props.onStatusChange as (s: string) => void)(key);
                }
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm hover:bg-accent transition-colors text-left"
            >
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
              <span className="flex-1">{label}</span>
              {key === props.status && (
                <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
