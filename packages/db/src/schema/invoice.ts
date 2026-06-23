import { pgTable, text, timestamp, uuid, pgEnum, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { PdfTemplateName } from "@/app/(dashboard)/create/invoice/invoiceHelpers/invoice-templates";
import { InvoiceFontName } from "@/constants/pdf-fonts";
import { Numeric } from "../custom/decimal";
import { relations } from "drizzle-orm";
import { Decimal } from "decimal.js";
import { users } from "./user";

interface InvoiceTheme {
  baseColor: string;
  mode: "dark" | "light";
  template?: PdfTemplateName;
  font?: InvoiceFontName;
}

// Enums
export const invoiceStatusEnum = pgEnum("invoice_status", ["pending", "success", "error", "expired", "refunded"]);
export const invoiceValueTypesEnum = pgEnum("invoice_value_types", ["fixed", "percentage"]);

// export enum types
export type InvoiceStatusType = (typeof invoiceStatusEnum.enumValues)[number];
export type InvoiceValueTypesType = (typeof invoiceValueTypesEnum.enumValues)[number];

// Tables
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  status: invoiceStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
});

export const invoiceFields = pgTable("invoice_fields", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id, { onDelete: "cascade" })
    .notNull(),
});

export const invoiceCompanyDetails = pgTable("invoice_company_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  gstin: text("gstin").notNull().default(""),
  state: text("state").notNull().default(""),
  stateCode: text("state_code").notNull().default(""),
  logo: text("logo"),
  signature: text("signature"),
  invoiceFieldId: uuid("invoice_field_id")
    .references(() => invoiceFields.id, { onDelete: "cascade" })
    .notNull(),
});

export const invoiceCompanyDetailsMetadata = pgTable("invoice_company_details_metadata", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  invoiceCompanyDetailsId: uuid("invoice_company_details_id")
    .references(() => invoiceCompanyDetails.id, { onDelete: "cascade" })
    .notNull(),
});
export const invoiceBillingClientDetails = pgTable("invoice_billing_client_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  gstin: text("gstin").notNull().default(""),
  state: text("state").notNull().default(""),
  stateCode: text("state_code").notNull().default(""),
  invoiceFieldId: uuid("invoice_field_id")
    .references(() => invoiceFields.id, { onDelete: "cascade" })
    .notNull(),
});

export const invoiceBillingClientDetailsMetadata = pgTable("invoice_billing_client_details_metadata", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  invoiceBillingClientDetailsId: uuid("invoice_billing_client_details_id")
    .references(() => invoiceBillingClientDetails.id, { onDelete: "cascade" })
    .notNull(),
});

export const invoiceShippingClientDetails = pgTable("invoice_shipping_client_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  sameAsBilling: boolean("same_as_billing").notNull().default(true),
  name: text("name").notNull(),
  address: text("address").notNull(),
  gstin: text("gstin").notNull().default(""),
  state: text("state").notNull().default(""),
  stateCode: text("state_code").notNull().default(""),
  invoiceFieldId: uuid("invoice_field_id")
    .references(() => invoiceFields.id, { onDelete: "cascade" })
    .notNull(),
});

export const invoiceShippingClientDetailsMetadata = pgTable("invoice_shipping_client_details_metadata", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  invoiceShippingClientDetailsId: uuid("invoice_shipping_client_details_id")
    .references(() => invoiceShippingClientDetails.id, { onDelete: "cascade" })
    .notNull(),
});

export const invoiceDetails = pgTable("invoice_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  theme: jsonb("theme").$type<InvoiceTheme>().notNull(),
  currency: text("currency").notNull(),
  prefix: text("prefix").notNull(),
  serialNumber: text("serial_number").notNull(),
  date: timestamp("date").notNull(),
  dueDate: timestamp("due_date"),
  poNumber: text("po_number").notNull().default(""),
  eWaybillNumber: text("e_waybill_number").notNull().default(""),
  paymentTerms: text("payment_terms").notNull().default(""),
  invoiceFieldId: uuid("invoice_field_id")
    .references(() => invoiceFields.id, { onDelete: "cascade" })
    .notNull(),
});

export const invoiceDetailsBillingDetails = pgTable("invoice_details_billing_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  type: invoiceValueTypesEnum("type").notNull(),
  value: Numeric("value", { precision: 10, scale: 2 }).notNull(),
  invoiceDetailsId: uuid("invoice_details_id")
    .references(() => invoiceDetails.id, { onDelete: "cascade" })
    .notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description1: text("description_1").notNull(),
  description2: text("description_2").notNull().default(""),
  hsnSac: text("hsn_sac").notNull().default(""),
  quantity: integer("quantity").notNull(),
  units: text("units").notNull().default("Nos"),
  unitPrice: Numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  cgstRate: Numeric("cgst_rate", { precision: 5, scale: 2 }).notNull().default(new Decimal(9)),
  sgstRate: Numeric("sgst_rate", { precision: 5, scale: 2 }).notNull().default(new Decimal(9)),
  igstRate: Numeric("igst_rate", { precision: 5, scale: 2 }).notNull().default(new Decimal(0)),
  invoiceFieldId: uuid("invoice_field_id")
    .references(() => invoiceFields.id, { onDelete: "cascade" })
    .notNull(),
});

export const invoiceItemMetadata = pgTable("invoice_item_metadata", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  invoiceItemId: uuid("invoice_item_id")
    .references(() => invoiceItems.id, { onDelete: "cascade" })
    .notNull(),
});

export const invoiceMetadata = pgTable("invoice_metadata", {
  id: uuid("id").primaryKey().defaultRandom(),
  notes: text("notes").notNull(),
  terms: text("terms").notNull(),
  invoiceFieldId: uuid("invoice_field_id")
    .references(() => invoiceFields.id, { onDelete: "cascade" })
    .notNull(),
});

export const invoiceMetadataPaymentInformation = pgTable("invoice_metadata_payment_information", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  invoiceMetadataId: uuid("invoice_metadata_id")
    .references(() => invoiceMetadata.id, { onDelete: "cascade" })
    .notNull(),
});

// Relations
export const invoiceRelations = relations(invoices, ({ one }) => ({
  invoiceFields: one(invoiceFields, {
    fields: [invoices.id],
    references: [invoiceFields.invoiceId],
  }),
}));

export const invoiceFieldsRelations = relations(invoiceFields, ({ one, many }) => ({
  companyDetails: one(invoiceCompanyDetails, {
    fields: [invoiceFields.id],
    references: [invoiceCompanyDetails.invoiceFieldId],
  }),
  billingClientDetails: one(invoiceBillingClientDetails, {
    fields: [invoiceFields.id],
    references: [invoiceBillingClientDetails.invoiceFieldId],
  }),
  shippingClientDetails: one(invoiceShippingClientDetails, {
    fields: [invoiceFields.id],
    references: [invoiceShippingClientDetails.invoiceFieldId],
  }),
  invoiceDetails: one(invoiceDetails, {
    fields: [invoiceFields.id],
    references: [invoiceDetails.invoiceFieldId],
  }),
  metadata: one(invoiceMetadata, {
    fields: [invoiceFields.id],
    references: [invoiceMetadata.invoiceFieldId],
  }),
  items: many(invoiceItems),
}));

export const invoiceCompanyDetailsRelations = relations(invoiceCompanyDetails, ({ many }) => ({
  metadata: many(invoiceCompanyDetailsMetadata),
}));

export const invoiceBillingClientDetailsRelations = relations(invoiceBillingClientDetails, ({ many }) => ({
  metadata: many(invoiceBillingClientDetailsMetadata),
}));

export const invoiceShippingClientDetailsRelations = relations(invoiceShippingClientDetails, ({ many }) => ({
  metadata: many(invoiceShippingClientDetailsMetadata),
}));

export const invoiceDetailsRelations = relations(invoiceDetails, ({ many }) => ({
  billingDetails: many(invoiceDetailsBillingDetails),
}));

export const invoiceMetadataRelations = relations(invoiceMetadata, ({ many }) => ({
  paymentInformation: many(invoiceMetadataPaymentInformation),
}));

// Reverse Relations
export const invoiceCompanyDetailsMetadataRelations = relations(invoiceCompanyDetailsMetadata, ({ one }) => ({
  companyDetails: one(invoiceCompanyDetails, {
    fields: [invoiceCompanyDetailsMetadata.invoiceCompanyDetailsId],
    references: [invoiceCompanyDetails.id],
  }),
}));

export const invoiceBillingClientDetailsMetadataRelations = relations(
  invoiceBillingClientDetailsMetadata,
  ({ one }) => ({
    billingClientDetails: one(invoiceBillingClientDetails, {
      fields: [invoiceBillingClientDetailsMetadata.invoiceBillingClientDetailsId],
      references: [invoiceBillingClientDetails.id],
    }),
  }),
);

export const invoiceShippingClientDetailsMetadataRelations = relations(
  invoiceShippingClientDetailsMetadata,
  ({ one }) => ({
    shippingClientDetails: one(invoiceShippingClientDetails, {
      fields: [invoiceShippingClientDetailsMetadata.invoiceShippingClientDetailsId],
      references: [invoiceShippingClientDetails.id],
    }),
  }),
);

export const invoiceDetailsBillingDetailsRelations = relations(invoiceDetailsBillingDetails, ({ one }) => ({
  invoiceDetails: one(invoiceDetails, {
    fields: [invoiceDetailsBillingDetails.invoiceDetailsId],
    references: [invoiceDetails.id],
  }),
}));

export const invoiceMetadataPaymentInformationRelations = relations(invoiceMetadataPaymentInformation, ({ one }) => ({
  metadata: one(invoiceMetadata, {
    fields: [invoiceMetadataPaymentInformation.invoiceMetadataId],
    references: [invoiceMetadata.id],
  }),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one, many }) => ({
  invoiceField: one(invoiceFields, {
    fields: [invoiceItems.invoiceFieldId],
    references: [invoiceFields.id],
  }),
  metadata: many(invoiceItemMetadata),
}));

export const invoiceItemMetadataRelations = relations(invoiceItemMetadata, ({ one }) => ({
  item: one(invoiceItems, {
    fields: [invoiceItemMetadata.invoiceItemId],
    references: [invoiceItems.id],
  }),
}));
