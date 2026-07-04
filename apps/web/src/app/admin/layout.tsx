import type { Metadata } from "next";
import * as React from "react";

import AdminLayoutClient from "./AdminLayoutClient";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutClient>
      {children}
    </AdminLayoutClient>
  );
}