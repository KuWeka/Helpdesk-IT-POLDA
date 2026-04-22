import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';

export default function InsightCard({
  title,
  children,
  isLoading = false,
  icon: Icon = null,
}) {
  return (
    <Card className="border-border bg-card/95 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
