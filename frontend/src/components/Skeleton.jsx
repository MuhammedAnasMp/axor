import React from 'react';

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded bg-surface-dim/50 ${className}`}
      {...props}
    />
  );
}

export function SkeletonText({ className = '', lines = 1, ...props }) {
  return (
    <div className={`space-y-2 w-full ${className}`} {...props}>
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          className={`h-3 ${
            idx === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '', hasIcon = true, ...props }) {
  return (
    <div
      className={`rounded-lg bg-white p-5 shadow-sm border-l-4 border-surface-dim/40 space-y-4 ${className}`}
      style={{ boxShadow: '0px 1px 3px rgba(0,0,0,0.1)' }}
      {...props}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        {hasIcon && <Skeleton className="h-5 w-5 rounded-full" />}
      </div>
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function SkeletonTableRow({ columns, ...props }) {
  return (
    <tr {...props}>
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="px-4 py-3">
          <Skeleton className="h-3.5 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, idx) => (
        <SkeletonTableRow key={idx} columns={columns} />
      ))}
    </>
  );
}

export function SkeletonForm({ fields = 3, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, idx) => (
        <div key={idx} className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
      <Skeleton className="h-9 w-24" />
    </div>
  );
}

export function Spinner({ className = '', size = 'sm', color = 'white', ...props }) {
  const sizeClasses = {
    xs: 'h-3 w-3 border-2',
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
  };

  const colorClasses = {
    white: 'border-white border-t-transparent',
    blue: 'border-brand-blue border-t-transparent',
    gray: 'border-text-secondary border-t-transparent',
  };

  return (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size] || sizeClasses.sm} ${colorClasses[color] || colorClasses.white} ${className}`}
      {...props}
    />
  );
}
