"use server";

import { insertInvoiceQuery, replaceInvoiceQuery } from "@/lib/db-queries/invoice/insertInvoice";
import { serializedCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { deleteInvoiceQuery } from "@/lib/db-queries/invoice/deleteInvoice";
import { getInvoiceQuery } from "@/lib/db-queries/invoice/getInvoice";
import type { SerializedInvoiceFields } from "@/types/common/invoice";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import { invoiceStatusEnum } from "@invoicely/db/schema/invoice";
import type { ActionResult } from "@/types/action-result";
import { actionFailure } from "@/actions/action-result";
import { getServerSession } from "@/lib/server-session";
import { revalidatePath } from "next/cache";
import { db, schema } from "@invoicely/db";
import * as Sentry from "@sentry/nextjs";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const invoiceIdSchema = z.string().uuid();
const editInvoiceSchema = z.object({
  id: invoiceIdSchema,
  invoice: serializedCreateInvoiceSchema,
});
const updateStatusSchema = z.object({
  id: invoiceIdSchema,
  status: z.enum(invoiceStatusEnum.enumValues),
});

function revalidateInvoicePaths(id?: string): void {
  revalidatePath("/dashboard");
  revalidatePath("/invoices");
  revalidatePath("/create/invoice");
  if (id) revalidatePath(`/edit/${id}`);
}

async function createInvoiceAction(
  input: SerializedInvoiceFields,
): Promise<ActionResult<{ invoiceId: string; message: string }>> {
  const session = await getServerSession();
  if (!session) return actionFailure("UNAUTHORIZED", "You must be signed in to create an invoice.");

  const parsed = serializedCreateInvoiceSchema.safeParse(input);
  if (!parsed.success) return actionFailure("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid invoice.");

  try {
    const invoiceId = await insertInvoiceQuery(parsed.data, session.user.id);
    revalidateInvoicePaths(invoiceId);
    return { success: true, data: { invoiceId, message: SUCCESS_MESSAGES.INVOICE_SAVED } };
  } catch (error) {
    Sentry.captureException(error);
    return actionFailure("INTERNAL", ERROR_MESSAGES.FAILED_TO_INSERT_DATA);
  }
}

async function editInvoiceAction(input: {
  id: string;
  invoice: SerializedInvoiceFields;
}): Promise<ActionResult<{ message: string }>> {
  const session = await getServerSession();
  if (!session) return actionFailure("UNAUTHORIZED", "You must be signed in to edit an invoice.");

  const parsed = editInvoiceSchema.safeParse(input);
  if (!parsed.success) return actionFailure("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid invoice.");

  try {
    const existingInvoice = await getInvoiceQuery(parsed.data.id, session.user.id);
    if (!existingInvoice) return actionFailure("NOT_FOUND", ERROR_MESSAGES.INVOICE_NOT_FOUND);

    await replaceInvoiceQuery(parsed.data.id, parsed.data.invoice, session.user.id);
    revalidateInvoicePaths(parsed.data.id);
    return { success: true, data: { message: SUCCESS_MESSAGES.INVOICE_EDITED } };
  } catch (error) {
    Sentry.captureException(error);
    return actionFailure("INTERNAL", ERROR_MESSAGES.FAILED_TO_EDIT_INVOICE);
  }
}

async function deleteInvoiceAction(input: { id: string }): Promise<ActionResult<{ message: string }>> {
  const session = await getServerSession();
  if (!session) return actionFailure("UNAUTHORIZED", "You must be signed in to delete an invoice.");

  const parsed = z.object({ id: invoiceIdSchema }).safeParse(input);
  if (!parsed.success) return actionFailure("VALIDATION", "Invalid invoice ID.");

  try {
    const existingInvoice = await getInvoiceQuery(parsed.data.id, session.user.id);
    if (!existingInvoice) return actionFailure("NOT_FOUND", ERROR_MESSAGES.INVOICE_NOT_FOUND);

    await deleteInvoiceQuery(parsed.data.id, session.user.id);
    revalidateInvoicePaths();
    return { success: true, data: { message: SUCCESS_MESSAGES.INVOICE_DELETED } };
  } catch (error) {
    Sentry.captureException(error);
    return actionFailure("INTERNAL", ERROR_MESSAGES.FAILED_TO_DELETE_INVOICE);
  }
}

async function updateInvoiceStatusAction(input: {
  id: string;
  status: (typeof invoiceStatusEnum.enumValues)[number];
}): Promise<ActionResult<{ message: string }>> {
  const session = await getServerSession();
  if (!session) return actionFailure("UNAUTHORIZED", "You must be signed in to update an invoice.");

  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) return actionFailure("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid status.");

  try {
    const invoice = await db.query.invoices.findFirst({
      where: and(eq(schema.invoices.id, parsed.data.id), eq(schema.invoices.userId, session.user.id)),
    });

    if (!invoice) return actionFailure("NOT_FOUND", ERROR_MESSAGES.INVOICE_NOT_FOUND);
    if (invoice.status === parsed.data.status) {
      return actionFailure("CONFLICT", ERROR_MESSAGES.TRY_UPDATING_TO_DIFFERENT_STATUS);
    }

    await db
      .update(schema.invoices)
      .set({
        status: parsed.data.status,
        paidAt: parsed.data.status === "success" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.invoices.id, parsed.data.id), eq(schema.invoices.userId, session.user.id)));

    revalidateInvoicePaths(parsed.data.id);
    return { success: true, data: { message: SUCCESS_MESSAGES.INVOICE_STATUS_UPDATED } };
  } catch (error) {
    Sentry.captureException(error);
    return actionFailure("INTERNAL", "Failed to update invoice status.");
  }
}

export { createInvoiceAction, deleteInvoiceAction, editInvoiceAction, updateInvoiceStatusAction };
