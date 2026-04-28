
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Card } from '@/components/ui/card.jsx';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils.js';

export default function TechnicianCard({ technician, isSelected, onClick }) {
  const initials = technician?.name?.substring(0, 2).toUpperCase() || 'TK';
  
  return (
    <Card 
      className={cn(
        "p-4 cursor-pointer transition-all duration-200 border-2 hover:border-primary/50",
        isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:shadow-sm"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar className="h-12 w-12 rounded-xl border border-border">
            <AvatarImage src="" />
            <AvatarFallback className="bg-secondary text-secondary-foreground rounded-xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-card"></div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-sm truncate pr-2">{technician?.name || 'Teknisi'}</h4>
            {isSelected && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
          </div>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {technician.specializations?.map((spec, idx) => (
              <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0 font-medium bg-muted/30">
                {spec}
              </Badge>
            ))}
            {(!technician.specializations || technician.specializations.length === 0) && (
              <span className="text-xs text-muted-foreground">General Support</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
