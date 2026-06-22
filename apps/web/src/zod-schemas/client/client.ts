import { createInvoiceFieldKeyStringValuesSchema } from "@/zod-schemas/invoice/create-invoice";
import { gstinSchema, stateCodeSchema, stateSchema } from "@/zod-schemas/common/invoice-party";
import { z } from "zod";

export const upsertClientSchema = z.object({
  billingName: z.string({ invalid_type_error: "Billing name must be a string" }).trim().min(1),
  billingAddress: z.string({ invalid_type_error: "Billing address must be a string" }).trim().min(1),
  billingGstin: gstinSchema,
  billingState: stateSchema,
  billingStateCode: stateCodeSchema,
  billingMetadata: z.array(createInvoiceFieldKeyStringValuesSchema),
  sameAsBilling: z.boolean({ invalid_type_error: "Same as billing must be a boolean" }),
  shippingName: z.string({ invalid_type_error: "Shipping name must be a string" }).trim().min(1),
  shippingAddress: z.string({ invalid_type_error: "Shipping address must be a string" }).trim().min(1),
  shippingGstin: gstinSchema,
  shippingState: stateSchema,
  shippingStateCode: stateCodeSchema,
  shippingMetadata: z.array(createInvoiceFieldKeyStringValuesSchema),
});

export type UpsertClientSchema = z.infer<typeof upsertClientSchema>;
