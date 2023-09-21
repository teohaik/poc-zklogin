"use client";

import { useAuthentication } from "../hooks/useAuthentication";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthentication();
  if (user?.role !== "admin") {
    return "Not allowed";
  }
  return children;
}
