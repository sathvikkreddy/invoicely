import { gstinSchema, stateCodeSchema, stateSchema } from "@/zod-schemas/common/invoice-party";
import { z } from "zod";

export const valueType = z.enum(["percentage", "fixed"], {
  errorMap: () => ({
    message: "Value type must be either 'percentage' or 'fixed'",
  }),
});

export const createInvoiceFieldKeyStringValuesSchema = z.object(
  {
    label: z.string({ invalid_type_error: "Label must be a string" }).min(1, {
      message: "Label cannot be empty",
    }),
    value: z.string({ invalid_type_error: "Value must be a string" }).min(1, {
      message: "Value cannot be empty",
    }),
  },
  { invalid_type_error: "Field key string values must be an object" },
);

export const createInvoiceItemSchema = z.object(
  {
    name: z
      .string({ invalid_type_error: "Item name must be a string" })
      .min(1, { message: "Item name cannot be empty" }),
    description1: z.string({
      invalid_type_error: "Item description 1 must be a string",
    }),
    description2: z.string({
      invalid_type_error: "Item description 2 must be a string",
    }),
    quantity: z.coerce
      .number({ invalid_type_error: "Quantity must be a number" })
      .positive({ message: "Quantity must be positive" }),
    units: z.string({ invalid_type_error: "Units must be a string" }).trim().min(1, {
      message: "Units cannot be empty",
    }),
    unitPrice: z.coerce
      .number({ invalid_type_error: "Unit price must be a number" })
      .positive({ message: "Unit price must be positive" }),
    hsnSac: z.string({ invalid_type_error: "HSN/SAC must be a string" }),
    cgstRate: z.coerce.number({ invalid_type_error: "CGST rate must be a number" }).min(0),
    sgstRate: z.coerce.number({ invalid_type_error: "SGST rate must be a number" }).min(0),
    igstRate: z.coerce.number({ invalid_type_error: "IGST rate must be a number" }).min(0),
    metadata: z.array(createInvoiceFieldKeyStringValuesSchema),
  },
  { invalid_type_error: "Item must be an object" },
);

export type CreateInvoiceItem = z.output<typeof createInvoiceItemSchema>;

export const createInvoiceFieldKeyNumberValuesSchema = z.object(
  {
    label: z.string({ invalid_type_error: "Label must be a string" }).min(1, {
      message: "Label cannot be empty",
    }),
    value: z.number({ invalid_type_error: "Value must be a number" }),
    type: valueType,
  },
  { invalid_type_error: "Field key number values must be an object" },
);

const createInvoicePartySchema = z.object({
  name: z.string({ invalid_type_error: "Client name must be a string" }).min(1, {
    message: "Client name cannot be empty",
  }),
  address: z.string({ invalid_type_error: "Address must be a string" }).trim().min(1, {
    message: "Address cannot be empty",
  }),
  gstin: gstinSchema,
  state: stateSchema,
  stateCode: stateCodeSchema,
  metadata: z.array(createInvoiceFieldKeyStringValuesSchema),
});

export const createInvoiceSchema = z.object({
  companyDetails: z.object(
    {
      logoBase64: z.string({ invalid_type_error: "Logo base64 must be a string" }).optional(),
      logo: z
        .string({ invalid_type_error: "Logo must be a string" })
        .refine(
          (val) =>
            !val ||
            val.startsWith("data:image") ||
            val.startsWith("blob:") ||
            val.startsWith("https://") ||
            val.startsWith("http://"),
          {
            message: "Logo must be a valid image URL, blob URL or data URL",
          },
        )
        .nullable()
        .optional(),
      signatureBase64: z.string({ invalid_type_error: "Signature base64 must be a string" }).optional(),
      signature: z
        .string({ invalid_type_error: "Signature must be a string" })
        .refine(
          (val) =>
            !val ||
            val.startsWith("data:image") ||
            val.startsWith("blob:") ||
            val.startsWith("https://") ||
            val.startsWith("http://"),
          {
            message: "Signature must be a valid image URL, blob URL or data URL",
          },
        )
        .nullable()
        .optional(),
      name: z.string({ invalid_type_error: "Company name must be a string" }).min(1, {
        message: "Company name cannot be empty",
      }),
      address: z.string({ invalid_type_error: "Address must be a string" }).trim().min(1, {
        message: "Address cannot be empty",
      }),
      gstin: gstinSchema,
      state: stateSchema,
      stateCode: stateCodeSchema,
      metadata: z.array(createInvoiceFieldKeyStringValuesSchema),
    },
    { invalid_type_error: "Company details must be an object" },
  ),
  billingClientDetails: createInvoicePartySchema,
  shippingClientDetails: createInvoicePartySchema.extend({
    sameAsBilling: z.boolean({ invalid_type_error: "Same as billing must be a boolean" }),
  }),
  invoiceDetails: z.object(
    {
      theme: z.object({
        baseColor: z.string({ invalid_type_error: "Base color must be a string" }).min(1, {
          message: "Base color cannot be empty",
        }),
        mode: z.enum(["dark", "light"], { invalid_type_error: "Mode must be either 'dark' or 'light'" }),
        template: z
          .enum(["classic", "default", "vercel"], {
            invalid_type_error: "Template must be either 'classic', 'default' or 'vercel'",
          })
          .default("classic")
          .optional(),
        font: z
          .enum(["quicksand", "geist", "inter", "jetbrainsmono"], {
            invalid_type_error: "Invalid font",
          })
          .optional(),
      }),
      currency: z
        .string({ invalid_type_error: "Currency must be a string" })
        .min(1, { message: "Currency cannot be empty" }),
      prefix: z.string({ invalid_type_error: "Prefix must be a string" }),
      serialNumber: z
        .string({ invalid_type_error: "Serial number must be a string" })
        .min(1, { message: "Serial number cannot be empty" }),
      date: z.date({ invalid_type_error: "Date must be a valid date" }),
      dueDate: z.date({ invalid_type_error: "Due date must be a valid date" }).optional().nullable(),
      poNumber: z.string({ invalid_type_error: "PO number must be a string" }),
      eWaybillNumber: z.string({ invalid_type_error: "E-waybill number must be a string" }),
      paymentTerms: z.string({
        invalid_type_error: "Payment terms must be a string",
      }),
      billingDetails: z.array(createInvoiceFieldKeyNumberValuesSchema),
    },
    { invalid_type_error: "Invoice details must be an object" },
  ),
  items: z.array(createInvoiceItemSchema).min(1, { message: "Add at least one invoice item" }),
  metadata: z.object(
    {
      notes: z.string({ invalid_type_error: "Notes must be a string" }),
      terms: z.string({ invalid_type_error: "Terms must be a string" }),
      paymentInformation: z.array(createInvoiceFieldKeyStringValuesSchema),
    },
    { invalid_type_error: "Metadata must be an object" },
  ),
});

export type ZodCreateInvoiceSchema = z.infer<typeof createInvoiceSchema>;

export const createInvoiceSchemaDefaultValues: ZodCreateInvoiceSchema = {
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
    name: "SAI LAKSHMI NARASIMHA PACKAGINGS",
    address: "21-690/7/A/1, Shivalayanagar,  Suraram , IDA Jeedimetla,  Hyderabad",
    gstin: "36ABAFS5306A1ZQ",
    state: "Telangana",
    stateCode: "36",
    metadata: [],
  },
  shippingClientDetails: {
    sameAsBilling: true,
    name: "SAI LAKSHMI NARASIMHA PACKAGINGS",
    address: "21-690/7/A/1, Shivalayanagar,  Suraram , IDA Jeedimetla,  Hyderabad",
    gstin: "36ABAFS5306A1ZQ",
    state: "Telangana",
    stateCode: "36",
    metadata: [],
  },
  invoiceDetails: {
    theme: {
      template: "classic",
      baseColor: "#635CFF",
      mode: "light",
    },
    currency: "INR",
    prefix: "SLNP-",
    serialNumber: "0001",
    date: new Date(), // now
    dueDate: null,
    poNumber: "",
    eWaybillNumber: "",
    paymentTerms: "",
    billingDetails: [],
  },
  items: [
    {
      name: "HDPE PP WOVEN SACKS",
      description1: "Printing Bags",
      description2: "",
      quantity: 1000,
      units: "Nos",
      unitPrice: 15,
      hsnSac: "39239090",
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      metadata: [
        { label: "Size", value: "24 x 40" },
        { label: "Bags x Bundles", value: "600 x 1, 500 x 2" },
      ],
    },
  ],
  metadata: {
    notes: "",
    terms: "",
    paymentInformation: [],
  },
};
