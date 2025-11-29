'use client';

import { ReactNode } from "react";
import { useAuthGuard } from "../lib/useAuthGuard";

interface Props {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: Props) => {
  const { loading } = useAuthGuard();

  if (loading) {
    return <div className="page-shell">Loading...</div>;
  }

  return <>{children}</>;
};
