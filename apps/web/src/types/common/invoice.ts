import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import type { InvoiceStatusType } from "@invoicely/db/schema/invoice";

export interface Invoice {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: InvoiceStatusType;
  paidAt: Date | null;
  invoiceFields: ZodCreateInvoiceSchema;
}

export type InvoiceImageType = "logo" | "signature";
export type AssetStorageType = "local" | "server";
