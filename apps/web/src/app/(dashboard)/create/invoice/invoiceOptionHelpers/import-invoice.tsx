import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogContentContainer,
  DialogDescription,
  DialogHeader,
  DialogHeaderContainer,
  DialogIcon,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { importInvoiceColumnConfig, importInvoiceColumns } from "@/components/table-columns/invoices";
import { DataTable } from "@/components/ui/data-table";
import { InboxArrowDownIcon } from "@/assets/icons";
import { Invoice } from "@/types/common/invoice";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/client-auth";
import { useTRPC } from "@/trpc/client";

const ImportInvoice = ({ form }: { form: UseFormReturn<ZodCreateInvoiceSchema> }) => {
  const [open, setOpen] = React.useState(false);

  const trpc = useTRPC();
  const { data: session } = useSession();

  // Fetching Invoices from the Postgres (Server)
  const trpcData = useQuery({
    ...trpc.invoice.list.queryOptions(),
    enabled: !!session?.user, // Only fetch if user is logged in
  });

  const isLoading = trpcData.isLoading;
  const data = trpcData.data ?? [];

  const handleRowClick = (invoice: Invoice) => {
    // Reset form field to imported invoice
    form.reset(invoice.invoiceFields);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <InboxArrowDownIcon className="text-muted-foreground" />
          <span>Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-full">
        <DialogHeaderContainer>
          <DialogIcon>
            <InboxArrowDownIcon />
          </DialogIcon>
          <DialogHeader>
            <DialogTitle>Import Invoice</DialogTitle>
            <DialogDescription>Click on an invoice to import the data</DialogDescription>
          </DialogHeader>
        </DialogHeaderContainer>
        <DialogContentContainer>
          <DataTable
            isLoading={isLoading}
            data={data}
            columns={importInvoiceColumns}
            columnConfig={importInvoiceColumnConfig}
            defaultSorting={[{ id: "createdAt", desc: true }]}
            onRowClick={handleRowClick}
          />
        </DialogContentContainer>
      </DialogContent>
    </Dialog>
  );
};

export default ImportInvoice;
