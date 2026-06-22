import { z } from "zod";

export const EditInvoicePageSchema = z.object({
  type: z.literal("server"),
  id: z.string().uuid(),
});
