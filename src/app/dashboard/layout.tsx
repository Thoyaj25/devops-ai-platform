import type { ReactNode } from "react";

import DashboardLayout from "@/components/layout/DashboardLayout";

type Props = {
  children: ReactNode;
};

export default function Layout({
  children,
}: Props) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}