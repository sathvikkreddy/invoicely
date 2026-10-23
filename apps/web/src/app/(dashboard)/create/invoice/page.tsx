import { createInvoiceSchemaDefaultValues, type ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { serializeDatabaseInvoice, serializeInvoiceFields } from "@/lib/invoice/serialize-invoice";
import { createCallbackUrl, type CallbackSearchParams } from "@/lib/auth-callback";
import { getDefaultDetailsQuery } from "@/lib/db-queries/invoice/default-details";
import { listUserImageKeys } from "@/lib/cloudflare/r2/list-user-image-keys";
import { getNextInvoiceNumber } from "@/lib/invoice/get-next-invoice-number";
import { listInvoicesQuery } from "@/lib/db-queries/invoice/listInvoices";
import { requireServerSession } from "@/lib/server-session";
import InvoicePage from "./invoice-client";

interface PageProps {
  searchParams: Promise<CallbackSearchParams>;
}

const Page = async ({ searchParams }: PageProps) => {
  const session = await requireServerSession(createCallbackUrl("/create/invoice", await searchParams));
  const [databaseInvoices, savedDetails, images] = await Promise.all([
    listInvoicesQuery(session.user.id),
    getDefaultDetailsQuery(session.user.id),
    listUserImageKeys(session.user.id),
  ]);
  const invoices = databaseInvoices.map(serializeDatabaseInvoice);
  const nextInvoiceNumber = getNextInvoiceNumber(invoices);
  const { companyDetails: builtInCompany, clientDetails: builtInClient } = createInvoiceSchemaDefaultValues;

  const defaultInvoice: ZodCreateInvoiceSchema = {
    ...createInvoiceSchemaDefaultValues,
    companyDetails: {
      ...builtInCompany,
      name: savedDetails?.companyDetails.name || builtInCompany.name,
      address: savedDetails?.companyDetails.address || builtInCompany.address,
      metadata: savedDetails?.companyDetails.metadata.length
        ? savedDetails.companyDetails.metadata
        : builtInCompany.metadata,
    },
    clientDetails: {
      ...builtInClient,
      name: savedDetails?.clientDetails.name || builtInClient.name,
      address: savedDetails?.clientDetails.address || builtInClient.address,
      metadata: savedDetails?.clientDetails.metadata.length
        ? savedDetails.clientDetails.metadata
        : builtInClient.metadata,
    },
    invoiceDetails: {
      ...createInvoiceSchemaDefaultValues.invoiceDetails,
      prefix: nextInvoiceNumber.prefix,
      serialNumber: nextInvoiceNumber.serialNumber,
    },
  };

  return <InvoicePage defaultInvoice={serializeInvoiceFields(defaultInvoice)} invoices={invoices} images={images} />;
};

export default Page;
