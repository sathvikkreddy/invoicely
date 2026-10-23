import { createCallbackUrl, type CallbackSearchParams } from "@/lib/auth-callback";
import { serializeDatabaseInvoice } from "@/lib/invoice/serialize-invoice";
import { listInvoicesQuery } from "@/lib/db-queries/invoice/listInvoices";
import { requireServerSession } from "@/lib/server-session";
import InvoicesPage from "./invoices";

interface PageProps {
  searchParams: Promise<CallbackSearchParams>;
}

const Page = async ({ searchParams }: PageProps) => {
  const session = await requireServerSession(createCallbackUrl("/invoices", await searchParams));
  const invoices = await listInvoicesQuery(session.user.id);
  return <InvoicesPage invoices={invoices.map(serializeDatabaseInvoice)} />;
};

export default Page;
