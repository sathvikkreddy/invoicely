import type { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import type { InvoiceStatusType } from "@invoicely/db/schema/invoice";

export interface SerializedInvoiceFields extends Omit<ZodCreateInvoiceSchema, "invoiceDetails"> {
  invoiceDetails: Omit<ZodCreateInvoiceSchema["invoiceDetails"], "date" | "dueDate"> & {
    date: string;
    dueDate?: string | null;
  };
}

export interface Invoice {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: InvoiceStatusType;
  paidAt: string | null;
  invoiceFields: SerializedInvoiceFields;
}

export type InvoiceImageType = "logo" | "signature";
