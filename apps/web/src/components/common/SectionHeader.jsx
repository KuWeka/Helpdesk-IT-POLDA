import React from 'react';

export default function SectionHeader({ title, subtitle, actions, align = 'left' }) {
  const isCenter = align === 'center';

  return (
    <div
      className={`mb-4 flex flex-col gap-1 ${
        isCenter ? 'items-center text-center' : 'sm:flex-row sm:items-center sm:justify-between'
      }`}
    >
      <div className={isCenter ? 'text-center' : ''}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && (
        <div className={isCenter ? 'mt-2 flex gap-2 justify-center' : 'mt-2 sm:mt-0 flex gap-2'}>
          {actions}
        </div>
      )}
    </div>
  );
}
