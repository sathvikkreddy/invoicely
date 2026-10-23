import { createCallbackUrl, type CallbackSearchParams } from "@/lib/auth-callback";
import { listUserImageKeys } from "@/lib/cloudflare/r2/list-user-image-keys";
import { serializeDatabaseInvoice } from "@/lib/invoice/serialize-invoice";
import { listInvoicesQuery } from "@/lib/db-queries/invoice/listInvoices";
import InvoicePage from "@/app/(dashboard)/create/invoice/invoice";
import { requireServerSession } from "@/lib/server-session";
import { notFound } from "next/navigation";
import { z } from "zod";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<CallbackSearchParams>;
}

const Page = async ({ params, searchParams }: PageProps) => {
  const { id } = await params;
  const session = await requireServerSession(createCallbackUrl(`/edit/${encodeURIComponent(id)}`, await searchParams));
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) notFound();

  const [databaseInvoices, images] = await Promise.all([
    listInvoicesQuery(session.user.id),
    listUserImageKeys(session.user.id),
  ]);
  const invoices = databaseInvoices.map(serializeDatabaseInvoice);
  const invoice = invoices.find(({ id: invoiceId }) => invoiceId === parsedId.data);

  if (!invoice) notFound();

  return (
    <InvoicePage invoiceId={parsedId.data} defaultInvoice={invoice.invoiceFields} invoices={invoices} images={images} />
  );
};

export default Page;
