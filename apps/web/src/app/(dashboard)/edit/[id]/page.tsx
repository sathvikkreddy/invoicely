import { createCallbackUrl, type CallbackSearchParams } from "@/lib/auth-callback";
import { listUserImageKeys } from "@/lib/cloudflare/r2/list-user-image-keys";
import { serializeDatabaseInvoice } from "@/lib/invoice/serialize-invoice";
import { listInvoicesQuery } from "@/lib/db-queries/invoice/listInvoices";
import { getInvoiceQuery } from "@/lib/db-queries/invoice/getInvoice";
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

  const [databaseInvoice, databaseInvoices, images] = await Promise.all([
    getInvoiceQuery(parsedId.data, session.user.id),
    listInvoicesQuery(session.user.id),
    listUserImageKeys(session.user.id),
  ]);

  if (!databaseInvoice) notFound();

  return (
    <InvoicePage
      invoiceId={parsedId.data}
      defaultInvoice={serializeDatabaseInvoice(databaseInvoice).invoiceFields}
      invoices={databaseInvoices.map(serializeDatabaseInvoice)}
      images={images}
    />
  );
};

export default Page;
