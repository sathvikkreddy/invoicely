"use client";

import { buildFinancialDashboard, type DashboardInvoice } from "@/lib/dashboard/financial-dashboard";
import { useMemo, useState, useTransition } from "react";
import { DashboardView } from "./dashboard-view.client";
import { useRouter } from "next/navigation";

function FinancialDashboard({ invoices }: { invoices: DashboardInvoice[] }) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [selectedCurrency, setSelectedCurrency] = useState("");
  const [months, setMonths] = useState<6 | 12>(6);
  const today = new Date().setHours(0, 0, 0, 0);
  const dashboard = useMemo(
    () => buildFinancialDashboard(invoices, { months, now: new Date(today) }),
    // Refresh the date-sensitive overdue calculation when the page rerenders on a new day.
    [invoices, months, today],
  );

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <DashboardView
      dashboard={dashboard}
      selectedCurrency={selectedCurrency}
      onCurrencyChange={setSelectedCurrency}
      months={months}
      onMonthsChange={setMonths}
      isLoading={false}
      isRefreshing={isRefreshing}
      onRefresh={refresh}
    />
  );
}

export { FinancialDashboard };
