import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import type { InvoiceStatusType } from "@invoicely/db/schema/invoice";
import { getInvoiceTotals } from "@/constants/pdf-helpers";
import { ERROR_MESSAGES } from "@/constants/issues";
import { db, schema } from "@invoicely/db";
import { v4 as uuidv4 } from "uuid";
import Decimal from "decimal.js";

interface InsertInvoiceOptions {
  status?: InvoiceStatusType;
  paidAt?: Date | null;
}

export const insertInvoiceQuery = async (
  invoice: ZodCreateInvoiceSchema,
  userId: string,
  id?: string,
  options?: InsertInvoiceOptions,
) => {
  getInvoiceTotals(invoice);
  const shippingClientDetails = invoice.shippingClientDetails.sameAsBilling
    ? {
        ...invoice.billingClientDetails,
        sameAsBilling: true,
      }
    : invoice.shippingClientDetails;

  // Inserting invoice in db
  const [insertedInvoice] = await db
    .insert(schema.invoices)
    .values({
      id: id ?? uuidv4(),
      status: options?.status ?? "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
      paidAt: options?.paidAt ?? undefined,
      userId: userId,
    })
    .returning({
      id: schema.invoices.id,
    });

  if (!insertedInvoice) {
    throw new Error(ERROR_MESSAGES.FAILED_TO_INSERT_DATA + "~ invoice record");
  }

  // Inserting invoice field in db
  const [insertedInvoiceField] = await db
    .insert(schema.invoiceFields)
    .values({
      id: uuidv4(),
      invoiceId: insertedInvoice.id,
    })
    .returning({
      id: schema.invoiceFields.id,
    });

  if (!insertedInvoiceField) {
    throw new Error(ERROR_MESSAGES.FAILED_TO_INSERT_DATA + "~ invoice field record");
  }

  // Inserting company details in db
  const [insertedCompanyDetails] = await db
    .insert(schema.invoiceCompanyDetails)
    .values({
      id: uuidv4(),
      name: invoice.companyDetails.name,
      address: invoice.companyDetails.address,
      gstin: invoice.companyDetails.gstin,
      state: invoice.companyDetails.state,
      stateCode: invoice.companyDetails.stateCode,
      invoiceFieldId: insertedInvoiceField.id,
      logo: invoice.companyDetails.logo,
      signature: invoice.companyDetails.signature,
    })
    .returning({
      id: schema.invoiceCompanyDetails.id,
    });

  if (!insertedCompanyDetails) {
    throw new Error(ERROR_MESSAGES.FAILED_TO_INSERT_DATA + "~ company details record");
  }

  // Inserting company details metadata in db
  if (invoice.companyDetails.metadata.length > 0) {
    await db.insert(schema.invoiceCompanyDetailsMetadata).values(
      invoice.companyDetails.metadata.map((metadata) => ({
        id: uuidv4(),
        label: metadata.label,
        value: metadata.value,
        invoiceCompanyDetailsId: insertedCompanyDetails.id,
      })),
    );
  }

  // Inserting billing client details in db
  const [insertedBillingClientDetails] = await db
    .insert(schema.invoiceBillingClientDetails)
    .values({
      id: uuidv4(),
      name: invoice.billingClientDetails.name,
      address: invoice.billingClientDetails.address,
      gstin: invoice.billingClientDetails.gstin,
      state: invoice.billingClientDetails.state,
      stateCode: invoice.billingClientDetails.stateCode,
      invoiceFieldId: insertedInvoiceField.id,
    })
    .returning({
      id: schema.invoiceBillingClientDetails.id,
    });

  if (!insertedBillingClientDetails) {
    throw new Error(ERROR_MESSAGES.FAILED_TO_INSERT_DATA + "~ billing client details record");
  }

  // Inserting billing client details metadata in db
  if (invoice.billingClientDetails.metadata.length > 0) {
    await db.insert(schema.invoiceBillingClientDetailsMetadata).values(
      invoice.billingClientDetails.metadata.map((metadata) => ({
        id: uuidv4(),
        label: metadata.label,
        value: metadata.value,
        invoiceBillingClientDetailsId: insertedBillingClientDetails.id,
      })),
    );
  }

  // Inserting shipping client details in db
  const [insertedShippingClientDetails] = await db
    .insert(schema.invoiceShippingClientDetails)
    .values({
      id: uuidv4(),
      sameAsBilling: shippingClientDetails.sameAsBilling,
      name: shippingClientDetails.name,
      address: shippingClientDetails.address,
      gstin: shippingClientDetails.gstin,
      state: shippingClientDetails.state,
      stateCode: shippingClientDetails.stateCode,
      invoiceFieldId: insertedInvoiceField.id,
    })
    .returning({
      id: schema.invoiceShippingClientDetails.id,
    });

  if (!insertedShippingClientDetails) {
    throw new Error(ERROR_MESSAGES.FAILED_TO_INSERT_DATA + "~ shipping client details record");
  }

  // Inserting shipping client details metadata in db
  if (shippingClientDetails.metadata.length > 0) {
    await db.insert(schema.invoiceShippingClientDetailsMetadata).values(
      shippingClientDetails.metadata.map((metadata) => ({
        id: uuidv4(),
        label: metadata.label,
        value: metadata.value,
        invoiceShippingClientDetailsId: insertedShippingClientDetails.id,
      })),
    );
  }

  // Inserting invoice details in db
  const [insertedInvoiceDetails] = await db
    .insert(schema.invoiceDetails)
    .values({
      id: uuidv4(),
      currency: invoice.invoiceDetails.currency,
      prefix: invoice.invoiceDetails.prefix,
      serialNumber: invoice.invoiceDetails.serialNumber,
      date: invoice.invoiceDetails.date,
      dueDate: invoice.invoiceDetails.dueDate,
      poNumber: invoice.invoiceDetails.poNumber,
      eWaybillNumber: invoice.invoiceDetails.eWaybillNumber,
      paymentTerms: invoice.invoiceDetails.paymentTerms,
      theme: invoice.invoiceDetails.theme,
      invoiceFieldId: insertedInvoiceField.id,
    })
    .returning({
      id: schema.invoiceDetails.id,
    });

  if (!insertedInvoiceDetails) {
    throw new Error(ERROR_MESSAGES.FAILED_TO_INSERT_DATA + "~ invoice details record");
  }

  // Inserting invoice billing information in db
  if (invoice.invoiceDetails.billingDetails.length > 0) {
    await db.insert(schema.invoiceDetailsBillingDetails).values(
      invoice.invoiceDetails.billingDetails.map((billingDetail) => ({
        id: uuidv4(),
        label: billingDetail.label,
        invoiceDetailsId: insertedInvoiceDetails.id,
        value: new Decimal(billingDetail.value),
        type: billingDetail.type,
      })),
    );
  }

  // Inserting invoice items in db
  if (invoice.items.length > 0) {
    for (const item of invoice.items) {
      const [insertedItem] = await db
        .insert(schema.invoiceItems)
        .values({
          id: uuidv4(),
          description: item.description,
          hsnSac: item.hsnSac,
          name: item.name,
          quantity: item.quantity,
          units: item.units,
          unitPrice: new Decimal(item.unitPrice),
          cgstRate: new Decimal(item.cgstRate ?? 0),
          sgstRate: new Decimal(item.sgstRate ?? 0),
          igstRate: new Decimal(item.igstRate ?? 0),
          invoiceFieldId: insertedInvoiceField.id,
        })
        .returning({
          id: schema.invoiceItems.id,
        });

      if (!insertedItem) {
        throw new Error(ERROR_MESSAGES.FAILED_TO_INSERT_DATA + "~ invoice item record");
      }

      if (item.metadata.length > 0) {
        await db.insert(schema.invoiceItemMetadata).values(
          item.metadata.map((metadata) => ({
            id: uuidv4(),
            label: metadata.label,
            value: metadata.value,
            invoiceItemId: insertedItem.id,
          })),
        );
      }
    }
  }

  // Inserting invoice metadata in db
  const [insertedInvoiceMetadata] = await db
    .insert(schema.invoiceMetadata)
    .values({
      id: uuidv4(),
      notes: invoice.metadata.notes,
      terms: invoice.metadata.terms,
      invoiceFieldId: insertedInvoiceField.id,
    })
    .returning({
      id: schema.invoiceMetadata.id,
    });

  if (!insertedInvoiceMetadata) {
    throw new Error(ERROR_MESSAGES.FAILED_TO_INSERT_DATA + "~ invoice metadata record");
  }

  // Inserting invoice metadata payment information in db
  if (invoice.metadata.paymentInformation.length > 0) {
    await db.insert(schema.invoiceMetadataPaymentInformation).values(
      invoice.metadata.paymentInformation.map((paymentInformation) => ({
        id: uuidv4(),
        label: paymentInformation.label,
        value: paymentInformation.value,
        invoiceMetadataId: insertedInvoiceMetadata.id,
      })),
    );
  }

  // after successfully inserting return the invoice id
  return insertedInvoice.id;
};
