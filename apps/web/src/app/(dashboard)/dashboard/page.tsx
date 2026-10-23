import { getDashboardInvoicesQuery } from "@/lib/db-queries/invoice/getDashboardInvoices";
import { createCallbackUrl, type CallbackSearchParams } from "@/lib/auth-callback";
import { generateWebsiteMetadata } from "@/constants/meta-data";
import { requireServerSession } from "@/lib/server-session";
import { FinancialDashboard } from "./dashboard.client";
import type { Metadata } from "next";

export const metadata: Metadata = generateWebsiteMetadata({
  title: "Financial Dashboard | Invoicely",
});

interface DashboardPageProps {
  searchParams: Promise<CallbackSearchParams>;
}

async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await requireServerSession(createCallbackUrl("/dashboard", await searchParams));
  const invoices = await getDashboardInvoicesQuery(session.user.id);
  const serializedInvoices = invoices.map((invoice) => ({
    ...invoice,
    paidAt: invoice.paidAt?.toISOString() ?? null,
    invoiceFields: {
      ...invoice.invoiceFields,
      invoiceDetails: {
        ...invoice.invoiceFields.invoiceDetails,
        date: invoice.invoiceFields.invoiceDetails.date.toISOString(),
        dueDate: invoice.invoiceFields.invoiceDetails.dueDate?.toISOString() ?? null,
        billingDetails: invoice.invoiceFields.invoiceDetails.billingDetails.map((detail) => ({
          ...detail,
          value: detail.value.toString(),
        })),
      },
      items: invoice.invoiceFields.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toString(),
      })),
    },
  }));

  return <FinancialDashboard invoices={serializedInvoices} />;
}

export default DashboardPage;
