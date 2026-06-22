import { ZodDefaultDetailsSchema } from "@/zod-schemas/invoice/default-details";
import { InvoiceImageType } from "../common/invoice";

export interface IDBImage {
  id: string;
  type: InvoiceImageType;
  createdAt: Date;
  base64: string;
}

export interface IDBDefaultDetails extends ZodDefaultDetailsSchema {
  id: string;
  updatedAt: Date;
}
