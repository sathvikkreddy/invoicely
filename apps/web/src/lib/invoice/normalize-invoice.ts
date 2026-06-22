import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";

function normalizeInvoiceForRender(invoice: ZodCreateInvoiceSchema): ZodCreateInvoiceSchema {
  if (!invoice.shippingClientDetails.sameAsBilling) return invoice;

  return {
    ...invoice,
    shippingClientDetails: {
      ...invoice.billingClientDetails,
      sameAsBilling: true,
    },
  };
}

export { normalizeInvoiceForRender };
