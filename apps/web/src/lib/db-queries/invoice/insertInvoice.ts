import type { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { ERROR_MESSAGES } from "@/constants/issues";
import type { BatchItem } from "drizzle-orm/batch";
import { db, schema } from "@invoicely/db";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import Decimal from "decimal.js";

type PostgresBatchItem = BatchItem<"pg">;
type PostgresBatch = [PostgresBatchItem, ...PostgresBatchItem[]];

function toBatch(queries: PostgresBatchItem[]): PostgresBatch {
  const [first, ...remaining] = queries;
  if (!first) throw new Error(ERROR_MESSAGES.FAILED_TO_INSERT_DATA);
  return [first, ...remaining];
}

function buildInvoiceFieldQueries(invoice: ZodCreateInvoiceSchema, invoiceId: string): PostgresBatchItem[] {
  const invoiceFieldId = uuidv4();
  const companyDetailsId = uuidv4();
  const clientDetailsId = uuidv4();
  const invoiceDetailsId = uuidv4();
  const invoiceMetadataId = uuidv4();

  const queries: PostgresBatchItem[] = [
    db.insert(schema.invoiceFields).values({
      id: invoiceFieldId,
      invoiceId,
    }),
    db.insert(schema.invoiceCompanyDetails).values({
      id: companyDetailsId,
      name: invoice.companyDetails.name,
      address: invoice.companyDetails.address,
      invoiceFieldId,
      logo: invoice.companyDetails.logo,
      signature: invoice.companyDetails.signature,
    }),
  ];

  if (invoice.companyDetails.metadata.length > 0) {
    queries.push(
      db.insert(schema.invoiceCompanyDetailsMetadata).values(
        invoice.companyDetails.metadata.map((metadata) => ({
          id: uuidv4(),
          label: metadata.label,
          value: metadata.value,
          invoiceCompanyDetailsId: companyDetailsId,
        })),
      ),
    );
  }

  queries.push(
    db.insert(schema.invoiceClientDetails).values({
      id: clientDetailsId,
      name: invoice.clientDetails.name,
      address: invoice.clientDetails.address,
      invoiceFieldId,
    }),
  );

  if (invoice.clientDetails.metadata.length > 0) {
    queries.push(
      db.insert(schema.invoiceClientDetailsMetadata).values(
        invoice.clientDetails.metadata.map((metadata) => ({
          id: uuidv4(),
          label: metadata.label,
          value: metadata.value,
          invoiceClientDetailsId: clientDetailsId,
        })),
      ),
    );
  }

  queries.push(
    db.insert(schema.invoiceDetails).values({
      id: invoiceDetailsId,
      currency: invoice.invoiceDetails.currency,
      prefix: invoice.invoiceDetails.prefix,
      serialNumber: invoice.invoiceDetails.serialNumber,
      date: invoice.invoiceDetails.date,
      dueDate: invoice.invoiceDetails.dueDate,
      paymentTerms: invoice.invoiceDetails.paymentTerms,
      theme: invoice.invoiceDetails.theme,
      invoiceFieldId,
    }),
  );

  if (invoice.invoiceDetails.billingDetails.length > 0) {
    queries.push(
      db.insert(schema.invoiceDetailsBillingDetails).values(
        invoice.invoiceDetails.billingDetails.map((billingDetail) => ({
          id: uuidv4(),
          label: billingDetail.label,
          invoiceDetailsId,
          value: new Decimal(billingDetail.value),
          type: billingDetail.type,
        })),
      ),
    );
  }

  if (invoice.items.length > 0) {
    queries.push(
      db.insert(schema.invoiceItems).values(
        invoice.items.map((item) => ({
          id: uuidv4(),
          description: item.description,
          name: item.name,
          quantity: item.quantity,
          unitPrice: new Decimal(item.unitPrice),
          invoiceFieldId,
        })),
      ),
    );
  }

  queries.push(
    db.insert(schema.invoiceMetadata).values({
      id: invoiceMetadataId,
      notes: invoice.metadata.notes,
      terms: invoice.metadata.terms,
      invoiceFieldId,
    }),
  );

  if (invoice.metadata.paymentInformation.length > 0) {
    queries.push(
      db.insert(schema.invoiceMetadataPaymentInformation).values(
        invoice.metadata.paymentInformation.map((paymentInformation) => ({
          id: uuidv4(),
          label: paymentInformation.label,
          value: paymentInformation.value,
          invoiceMetadataId,
        })),
      ),
    );
  }

  return queries;
}

async function insertInvoiceQuery(invoice: ZodCreateInvoiceSchema, userId: string): Promise<string> {
  const invoiceId = uuidv4();
  const now = new Date();
  const queries: PostgresBatchItem[] = [
    db.insert(schema.invoices).values({
      id: invoiceId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      userId,
    }),
    ...buildInvoiceFieldQueries(invoice, invoiceId),
  ];

  // Neon HTTP does not implement db.transaction(); db.batch() delegates to
  // Neon's transactional batch API, so a failed child insert rolls back all rows.
  await db.batch(toBatch(queries));
  return invoiceId;
}

async function replaceInvoiceQuery(id: string, invoice: ZodCreateInvoiceSchema, userId: string): Promise<void> {
  const [existingInvoice] = await db
    .select({ id: schema.invoices.id })
    .from(schema.invoices)
    .where(and(eq(schema.invoices.id, id), eq(schema.invoices.userId, userId)))
    .limit(1);

  if (!existingInvoice) throw new Error(ERROR_MESSAGES.INVOICE_NOT_FOUND);

  const queries: PostgresBatchItem[] = [
    db.delete(schema.invoiceFields).where(eq(schema.invoiceFields.invoiceId, existingInvoice.id)),
    ...buildInvoiceFieldQueries(invoice, existingInvoice.id),
    db
      .update(schema.invoices)
      .set({ updatedAt: new Date() })
      .where(and(eq(schema.invoices.id, existingInvoice.id), eq(schema.invoices.userId, userId))),
  ];

  await db.batch(toBatch(queries));
}

export { insertInvoiceQuery, replaceInvoiceQuery };
