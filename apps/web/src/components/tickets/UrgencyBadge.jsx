
import React from 'react';
import { Badge } from '@/components/ui/badge.jsx';
import { cn } from '@/lib/utils.js';

export default function UrgencyBadge({ urgency, className }) {
  const getUrgencyVariant = (u) => {
    switch (u?.toLowerCase()) {
      case 'rendah':
        return 'success';
      case 'sedang':
        return 'warning';
      case 'tinggi':
        return 'destructive';
      case 'kritis':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getUrgencyVariant(urgency)} className={cn('font-medium capitalize', className)}>
      {urgency || 'Unknown'}
    </Badge>
  );
}
