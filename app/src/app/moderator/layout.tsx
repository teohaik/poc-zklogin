"use client";

import { useAuthentication } from "../hooks/useAuthentication";

export default function ModeratorRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthentication();
  if (user?.role !== "moderator") {
    return "Not allowed";
  }
  return children;
}
