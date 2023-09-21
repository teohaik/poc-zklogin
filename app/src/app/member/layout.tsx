"use client";

import { useAuthentication } from "../hooks/useAuthentication";

export default function MemberRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthentication();
  if (user?.role !== "member") {
    return "Not allowed";
  }
  return children;
}
