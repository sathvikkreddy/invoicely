import { insertInvoice } from "./insertInvoice";
import { deleteInvoice } from "./deleteInvoice";
import { createTRPCRouter } from "@/trpc/init";
import { listInvoices } from "./listInvoices";
import { editInvoice } from "./editInvoice";
import { getInvoice } from "./getInvoice";

export const invoiceRouter = createTRPCRouter({
  list: listInvoices,
  insert: insertInvoice,
  delete: deleteInvoice,
  get: getInvoice,
  edit: editInvoice,
});
