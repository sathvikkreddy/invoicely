import type { ZodDefaultDetailsSchema } from "@/zod-schemas/invoice/default-details";
import { db, schema } from "@invoicely/db";
import { eq } from "drizzle-orm";

async function getDefaultDetailsQuery(userId: string): Promise<ZodDefaultDetailsSchema | null> {
  const defaults = await db.query.invoiceDefaults.findFirst({
    where: eq(schema.invoiceDefaults.userId, userId),
    columns: {
      companyDetails: true,
      clientDetails: true,
    },
  });

  return defaults ?? null;
}

async function saveDefaultDetailsQuery(userId: string, details: ZodDefaultDetailsSchema): Promise<void> {
  await db
    .insert(schema.invoiceDefaults)
    .values({
      userId,
      companyDetails: details.companyDetails,
      clientDetails: details.clientDetails,
    })
    .onConflictDoUpdate({
      target: schema.invoiceDefaults.userId,
      set: {
        companyDetails: details.companyDetails,
        clientDetails: details.clientDetails,
        updatedAt: new Date(),
      },
    });
}

export { getDefaultDetailsQuery, saveDefaultDetailsQuery };
