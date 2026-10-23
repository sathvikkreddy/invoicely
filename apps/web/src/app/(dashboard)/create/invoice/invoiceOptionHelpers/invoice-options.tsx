"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EyeScannerIcon, FileDownloadIcon, ImageSparkleIcon, InboxArrowDownIcon } from "@/assets/icons";
import { InvoiceDownloadManagerInstance } from "@/global/instances/invoice/invoice-download-manager";
import { createInvoiceAction, editInvoiceAction } from "@/actions/invoice-actions";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { serializeInvoiceFields } from "@/lib/invoice/serialize-invoice";
import InvoiceErrorsModal from "./invoice-errors-modal";
import { useAnalytics } from "@/hooks/use-analytics";
import InvoiceTabSwitch from "./invoice-tab-switch";
import { Invoice } from "@/types/common/invoice";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { AnalyticsEventGroup } from "@/types";
import ImportInvoice from "./import-invoice";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

type InvoiceOption = "view-pdf" | "download-pdf" | "download-png" | "save-invoice-to-database";

interface InvoiceOptionsProps {
  form: UseFormReturn<ZodCreateInvoiceSchema>;
  invoices: Invoice[];
  invoiceId?: string;
}

const InvoiceOptions = ({ form, invoices, invoiceId }: InvoiceOptionsProps) => {
  const analytics = useAnalytics();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const saveInvoice = async (formValues: ZodCreateInvoiceSchema) => {
    const serializedInvoice = serializeInvoiceFields(formValues);
    const result = invoiceId
      ? await editInvoiceAction({ id: invoiceId, invoice: serializedInvoice })
      : await createInvoiceAction(serializedInvoice);

    if (!result.success) {
      toast.error("Could not save invoice", { description: result.error.message });
      return;
    }

    toast.success(invoiceId ? "Invoice updated" : "Invoice saved", {
      description: result.data.message,
    });

    if (!invoiceId && "invoiceId" in result.data) {
      router.push(`/edit/${result.data.invoiceId}`);
      return;
    }

    router.refresh();
  };

  const handleDropDownAction = async (action: InvoiceOption) => {
    const formValues = form.getValues();
    await InvoiceDownloadManagerInstance.initialize(formValues);

    analytics.capture("download-invoice-action", {
      elementGroup: "create-invoice-page" satisfies AnalyticsEventGroup,
    });

    switch (action) {
      case "save-invoice-to-database":
        startTransition(() => void saveInvoice(formValues));
        break;
      case "view-pdf":
        InvoiceDownloadManagerInstance.previewPdf();
        break;
      case "download-pdf":
        InvoiceDownloadManagerInstance.downloadPdf();
        startTransition(() => void saveInvoice(formValues));
        break;
      case "download-png":
        InvoiceDownloadManagerInstance.downloadPng();
        startTransition(() => void saveInvoice(formValues));
        break;
    }
  };

  return (
    <div className="flex h-12 shrink-0 flex-row items-center justify-between gap-2 border-b px-2">
      <div className="flex flex-row items-center gap-2">
        <InvoiceErrorsModal />
        <ImportInvoice form={form} invoices={invoices} />
      </div>
      <div className="flex flex-row items-center gap-2">
        <InvoiceTabSwitch />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" disabled={isPending}>
              <InboxArrowDownIcon />
              {isPending ? "Saving…" : "Download"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleDropDownAction("save-invoice-to-database")}>
              <InboxArrowDownIcon />
              <span>Save Invoice</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDropDownAction("view-pdf")}>
              <EyeScannerIcon />
              <span>View PDF</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDropDownAction("download-pdf")}>
              <FileDownloadIcon />
              <span>Download PDF</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDropDownAction("download-png")}>
              <ImageSparkleIcon />
              <span>Download PNG</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default InvoiceOptions;
