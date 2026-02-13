"use client";

import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500';
      case 'sent':
        return 'bg-blue-500';
      case 'accepted':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'paid':
        return 'bg-emerald-600';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'sent':
        return 'Envoyé';
      case 'accepted':
        return 'Accepté';
      case 'rejected':
        return 'Refusé';
      case 'paid':
        return 'Payé';
      default:
        return status;
    }
  };

  return (
    <Badge className={`${getStatusColor()} text-white`}>
      {getStatusText()}
    </Badge>
  );
}