import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { ClassicPDF, DefaultPDF, VercelPDF } from "@/components/pdf";
import { FormSelect } from "@/components/ui/form/form-select";
import { FileTextIcon, TriangleIcon } from "lucide-react";
import { SelectItem } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { BoxIcon } from "@/assets/icons";

export type PdfTemplateName = "classic" | "default" | "vercel" | undefined;

interface PdfTemplate {
  name: PdfTemplateName;
  label: string;
  component: React.ComponentType<{ data: ZodCreateInvoiceSchema }>;
  icon: React.ReactNode;
}

// Available Template Array
export const availablePdfTemplates: PdfTemplate[] = [
  {
    name: "classic",
    label: "Classic",
    component: ClassicPDF,
    icon: <FileTextIcon className="size-4" />,
  },
  {
    name: "default",
    label: "Default",
    component: DefaultPDF,
    icon: <BoxIcon />,
  },
  {
    name: "vercel",
    label: "Vercel",
    component: VercelPDF,
    icon: <TriangleIcon stroke="none" fill="currentColor" />,
  },
];

export const InvoiceTemplateSelector = ({ form }: { form: UseFormReturn<ZodCreateInvoiceSchema> }) => {
  return (
    <FormSelect
      name="invoiceDetails.theme.template"
      reactform={form}
      defaultValue="classic"
      placeholder="Select template"
      alingContent="end"
      className="min-w-34"
    >
      {availablePdfTemplates.map((template) => {
        // if the template is undefined, don't render it
        if (!template.name) return null;

        return (
          <SelectItem key={template.name} value={template.name}>
            <div className="flex flex-row items-center gap-2">{template.icon}</div>
            <span>{template.label}</span>
          </SelectItem>
        );
      })}
    </FormSelect>
  );
};
