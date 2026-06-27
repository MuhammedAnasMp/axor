import React from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

export default function Protected({ children }) {
  const { data: user, isLoading: loading, isError } = useQuery({
    queryKey: ['authUser'],
    queryFn: () => api.auth.me(),
    retry: false,
  });

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-blue border-t-transparent"></div>
      </div>
    );
  }

  const authenticated = !!user && !isError;

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
