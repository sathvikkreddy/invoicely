import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EyeScannerIcon, FileDownloadIcon, ImageSparkleIcon, InboxArrowDownIcon } from "@/assets/icons";
import { InvoiceDownloadManagerInstance } from "@/global/instances/invoice/invoice-download-manager";
import { EditInvoicePageSchema } from "@/zod-schemas/invoice/edit-invoice-page";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { saveInvoiceToDatabase } from "@/lib/invoice/save-invoice";
import { editInvoice } from "@/lib/invoice/edit-invoice";
import InvoiceErrorsModal from "./invoice-errors-modal";
import { useQueryClient } from "@tanstack/react-query";
import { useAnalytics } from "@/hooks/use-analytics";
import InvoiceTabSwitch from "./invoice-tab-switch";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { AnalyticsEventGroup } from "@/types";
import ImportInvoice from "./import-invoice";
import { useParams } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { AuthUser } from "@/types/auth";
import { PrinterIcon } from "lucide-react";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

type InvoiceOptionsProps = "view-pdf" | "print-pdf" | "download-pdf" | "download-png" | "save-invoice-to-database";
type Params = {
  type?: string;
  id?: string;
};

const InvoiceOptions = ({ form }: { form: UseFormReturn<ZodCreateInvoiceSchema> }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const params = useParams() satisfies Params;
  const user = useUser();
  const analytics = useAnalytics();

  const handleDropDownAction = useCallback(async (action: InvoiceOptionsProps) => {
    const isValid = await form.trigger(undefined, { shouldFocus: true });

    if (!isValid) {
      toast.error("Fix invoice errors before continuing.", {
        description: "Required fields, invalid formats, or missing items must be resolved first.",
      });
      return;
    }

    const formValues = form.getValues();
    await InvoiceDownloadManagerInstance.initialize(formValues);

    const { data } = EditInvoicePageSchema.safeParse({
      type: params.type,
      id: params.id,
    });

    // track the action
    analytics.capture("download-invoice-action", {
      elementGroup: "create-invoice-page" satisfies AnalyticsEventGroup,
    });

    switch (action) {
      case "save-invoice-to-database":
        SaveInvoiceToDatabase({ formValues, user, id: data?.id });
        break;
      case "view-pdf":
        InvoiceDownloadManagerInstance.previewPdf();
        break;
      case "print-pdf":
        InvoiceDownloadManagerInstance.printPdf();
        break;
      case "download-pdf":
        InvoiceDownloadManagerInstance.downloadPdf();
        SaveInvoiceToDatabase({ formValues, user, id: data?.id });
        break;
      case "download-png":
        InvoiceDownloadManagerInstance.downloadPng();
        SaveInvoiceToDatabase({ formValues, user, id: data?.id });
        break;
      default:
        break;
    }

    // Invalidate Queries
    queryClient.invalidateQueries({
      queryKey: trpc.invoice.list.queryKey(),
    });
  }, [analytics, form, params.id, params.type, queryClient, trpc.invoice.list, user]);

  useEffect(() => {
    const handlePrintShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        handleDropDownAction("print-pdf");
      }
    };

    window.addEventListener("keydown", handlePrintShortcut);
    return () => window.removeEventListener("keydown", handlePrintShortcut);
  }, [handleDropDownAction]);

  return (
    <div className="flex h-12 shrink-0 flex-row items-center justify-between gap-2 border-b px-2">
      <div className="flex flex-row items-center gap-2">
        <InvoiceErrorsModal />
        <ImportInvoice form={form} />
      </div>
      <div className="flex flex-row items-center gap-2">
        <InvoiceTabSwitch />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default">
              <InboxArrowDownIcon />
              Download
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
            <DropdownMenuItem onClick={() => handleDropDownAction("print-pdf")}>
              <PrinterIcon />
              <span>Print</span>
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

const SaveInvoiceToDatabase = ({
  formValues,
  user,
  id,
}: {
  formValues: ZodCreateInvoiceSchema;
  user: AuthUser | undefined;
  id?: string;
}) => {
  if (id) {
    // Edit the old invoice
    editInvoice(formValues, user, id);
  } else {
    saveInvoiceToDatabase(formValues, user);
  }
};
