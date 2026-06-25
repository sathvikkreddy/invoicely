import { PdfTemplateName } from "@/app/(dashboard)/create/invoice/invoiceHelpers/invoice-templates";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { ClassicPDF, DefaultPDF, VercelPDF } from "@/components/pdf";
import { pdf } from "@react-pdf/renderer";

interface CreatePdfBlobProps {
  template: PdfTemplateName;
  invoiceData: ZodCreateInvoiceSchema;
}

export const createPdfBlob = async ({ invoiceData, template }: CreatePdfBlobProps) => {
  const Template = getPdfTemplate(template);

  const pdfDocument = <Template data={invoiceData} />;
  const blob = await pdf(pdfDocument).toBlob();

  return blob;
};

const getPdfTemplate = (template: CreatePdfBlobProps["template"]) => {
  // if there is no template, fallback to classic
  if (!template) {
    return ClassicPDF;
  }

  // else return the specified tempalte
  switch (template) {
    case "classic":
      return ClassicPDF;
    case "vercel":
      return VercelPDF;
    default:
      return DefaultPDF;
  }
};
