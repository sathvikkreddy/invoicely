import { desc, eq } from "drizzle-orm";
import { db, schema } from "@invoicely/db";

export const listClientsQuery = async (userId: string) => {
  return db.query.clients.findMany({
    where: eq(schema.clients.userId, userId),
    orderBy: desc(schema.clients.updatedAt),
  });
};
