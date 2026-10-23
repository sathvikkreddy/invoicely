import type { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import type { Invoice, SerializedInvoiceFields } from "@/types/common/invoice";
import type { InvoiceStatusType } from "@invoicely/db/schema/invoice";
import Decimal from "decimal.js";

interface DatabaseInvoice {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: InvoiceStatusType;
  paidAt: Date | null;
  invoiceFields: {
    companyDetails: ZodCreateInvoiceSchema["companyDetails"];
    clientDetails: ZodCreateInvoiceSchema["clientDetails"];
    invoiceDetails: Omit<ZodCreateInvoiceSchema["invoiceDetails"], "billingDetails"> & {
      billingDetails: Array<{
        label: string;
        type: "fixed" | "percentage";
        value: Decimal | number;
      }>;
    };
    items: Array<{
      name: string;
      description: string;
      quantity: number;
      unitPrice: Decimal | number;
    }>;
    metadata: ZodCreateInvoiceSchema["metadata"];
  };
}

function serializeInvoiceFields(invoiceFields: ZodCreateInvoiceSchema): SerializedInvoiceFields {
  return {
    ...invoiceFields,
    invoiceDetails: {
      ...invoiceFields.invoiceDetails,
      date: invoiceFields.invoiceDetails.date.toISOString(),
      dueDate: invoiceFields.invoiceDetails.dueDate?.toISOString() ?? null,
    },
  };
}

function deserializeInvoiceFields(invoiceFields: SerializedInvoiceFields): ZodCreateInvoiceSchema {
  return {
    ...invoiceFields,
    invoiceDetails: {
      ...invoiceFields.invoiceDetails,
      date: new Date(invoiceFields.invoiceDetails.date),
      dueDate: invoiceFields.invoiceDetails.dueDate ? new Date(invoiceFields.invoiceDetails.dueDate) : null,
    },
  };
}

function serializeDatabaseInvoice(invoice: DatabaseInvoice): Invoice {
  const invoiceFields: ZodCreateInvoiceSchema = {
    ...invoice.invoiceFields,
    items: invoice.invoiceFields.items.map((item) => ({
      ...item,
      unitPrice: Decimal.isDecimal(item.unitPrice) ? item.unitPrice.toNumber() : item.unitPrice,
    })),
    invoiceDetails: {
      ...invoice.invoiceFields.invoiceDetails,
      billingDetails: invoice.invoiceFields.invoiceDetails.billingDetails.map((detail) => ({
        ...detail,
        value: Decimal.isDecimal(detail.value) ? detail.value.toNumber() : detail.value,
      })),
    },
  };

  return {
    id: invoice.id,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
    status: invoice.status,
    paidAt: invoice.paidAt?.toISOString() ?? null,
    invoiceFields: serializeInvoiceFields(invoiceFields),
  };
}

export { deserializeInvoiceFields, serializeDatabaseInvoice, serializeInvoiceFields };
