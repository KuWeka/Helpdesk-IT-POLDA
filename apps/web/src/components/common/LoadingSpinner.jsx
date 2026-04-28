
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils.js';

export default function LoadingSpinner({ className, size = 24 }) {
  return (
    <div className={cn('flex justify-center items-center p-4', className)}>
      <Loader2 
        className="animate-spin text-primary" 
        size={size} 
      />
    </div>
  );
}
