
import React from 'react';
import { Badge } from '@/components/ui/badge.jsx';
import { cn } from '@/lib/utils.js';

export default function StatusBadge({ status, className }) {
  const getStatusVariant = (s) => {
    switch (s?.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'proses':
        return 'info';
      case 'selesai':
        return 'success';
      case 'dibatalkan':
        return 'secondary';
      case 'ditolak':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getStatusVariant(status)} className={cn('font-medium capitalize', className)}>
      {status || 'Unknown'}
    </Badge>
  );
}
