import { boolean, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./user";

interface ClientMetadata {
  label: string;
  value: string;
}

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    billingName: text("billing_name").notNull(),
    billingAddress: text("billing_address").notNull(),
    billingGstin: text("billing_gstin").notNull(),
    billingState: text("billing_state").notNull(),
    billingStateCode: text("billing_state_code").notNull(),
    billingMetadata: jsonb("billing_metadata").$type<ClientMetadata[]>().notNull().default([]),
    sameAsBilling: boolean("same_as_billing").notNull().default(true),
    shippingName: text("shipping_name").notNull(),
    shippingAddress: text("shipping_address").notNull(),
    shippingGstin: text("shipping_gstin").notNull(),
    shippingState: text("shipping_state").notNull(),
    shippingStateCode: text("shipping_state_code").notNull(),
    shippingMetadata: jsonb("shipping_metadata").$type<ClientMetadata[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    billingGstinUserIdUnique: uniqueIndex("clients_user_id_billing_gstin_unique").on(table.userId, table.billingGstin),
  }),
);

export type Client = typeof clients.$inferSelect;
