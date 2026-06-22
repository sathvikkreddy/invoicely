import { createInvoiceFieldKeyStringValuesSchema } from "@/zod-schemas/invoice/create-invoice";
import { z } from "zod";

// Default sender/client details a user can save once and reuse to pre-fill new
// invoices. Names/addresses are not required here (unlike the invoice schema) so
// a user can save partial defaults (e.g. only company details).
export const defaultDetailsSchema = z.object({
  companyDetails: z.object(
    {
      name: z.string({ invalid_type_error: "Company name must be a string" }),
      address: z.string({ invalid_type_error: "Address must be a string" }),
      gstin: z.string({ invalid_type_error: "GSTIN must be a string" }),
      state: z.string({ invalid_type_error: "State must be a string" }),
      stateCode: z.string({ invalid_type_error: "State code must be a string" }),
      metadata: z.array(createInvoiceFieldKeyStringValuesSchema),
    },
    { invalid_type_error: "Company details must be an object" },
  ),
  billingClientDetails: z.object(
    {
      name: z.string({ invalid_type_error: "Client name must be a string" }),
      address: z.string({ invalid_type_error: "Address must be a string" }),
      gstin: z.string({ invalid_type_error: "GSTIN must be a string" }),
      state: z.string({ invalid_type_error: "State must be a string" }),
      stateCode: z.string({ invalid_type_error: "State code must be a string" }),
      metadata: z.array(createInvoiceFieldKeyStringValuesSchema),
    },
    { invalid_type_error: "Billing client details must be an object" },
  ),
});

export type ZodDefaultDetailsSchema = z.infer<typeof defaultDetailsSchema>;

export const defaultDetailsSchemaDefaultValues: ZodDefaultDetailsSchema = {
  companyDetails: {
    name: "SAI LAKSHMI NARASIMHA PACKAGINGS",
    address: "21-690/7/A/1, Shivalayanagar,  Suraram , IDA Jeedimetla,  Hyderabad",
    gstin: "36CVWPK4641J1ZX",
    state: "Telangana",
    stateCode: "36",
    metadata: [
      {
        label: "Email",
        value: "slnpackagings@gmail.com",
      },
    ],
  },
  billingClientDetails: {
    name: "",
    address: "",
    gstin: "",
    state: "",
    stateCode: "",
    metadata: [],
  },
};
