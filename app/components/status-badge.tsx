"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check } from "lucide-react";

type Status = "draft" | "sent" | "accepted" | "rejected" | "paid";

const STATUS_CONFIG: Record<Status, { color: string; label: string }> = {
  draft: { color: "bg-gray-500", label: "Brouillon" },
  sent: { color: "bg-blue-500", label: "Envoyé" },
  accepted: { color: "bg-green-500", label: "Accepté" },
  rejected: { color: "bg-red-500", label: "Refusé" },
  paid: { color: "bg-emerald-600", label: "Payé" },
};

interface StatusBadgeProps {
  status: Status;
  onStatusChange?: (status: Status) => void;
}

export function StatusBadge({ status, onStatusChange }: StatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  if (!onStatusChange) {
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  }

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
          {(Object.entries(STATUS_CONFIG) as [Status, { color: string; label: string }][]).map(
            ([key, { color, label }]) => (
              <button
                key={key}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (key !== status) {
                    onStatusChange(key);
                  }
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm hover:bg-accent transition-colors text-left"
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />
                <span className="flex-1">{label}</span>
                {key === status && (
                  <Check className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
              </button>
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
