import { UpsertClientSchema } from "@/zod-schemas/client/client";
import { db, schema } from "@invoicely/db";
import { v4 as uuidv4 } from "uuid";

export const upsertClientQuery = async (client: UpsertClientSchema, userId: string) => {
  const [savedClient] = await db
    .insert(schema.clients)
    .values({
      id: uuidv4(),
      userId,
      ...client,
    })
    .onConflictDoUpdate({
      target: [schema.clients.userId, schema.clients.billingGstin],
      set: {
        billingName: client.billingName,
        billingAddress: client.billingAddress,
        billingState: client.billingState,
        billingStateCode: client.billingStateCode,
        billingMetadata: client.billingMetadata,
        sameAsBilling: client.sameAsBilling,
        shippingName: client.shippingName,
        shippingAddress: client.shippingAddress,
        shippingGstin: client.shippingGstin,
        shippingState: client.shippingState,
        shippingStateCode: client.shippingStateCode,
        shippingMetadata: client.shippingMetadata,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!savedClient) {
    throw new Error("Failed to save client");
  }

  return savedClient;
};
