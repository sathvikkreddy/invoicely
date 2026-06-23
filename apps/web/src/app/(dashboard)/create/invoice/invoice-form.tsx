"use client";

import InvoiceFieldKeyStringValuesSection from "./invoiceHelpers/invoice-field-key-string-value-section";
import InvoiceFieldKeyNumberValuesSection from "./invoiceHelpers/invoice-field-key-number-value-section";
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form/form";
import SheetImageSelectorTrigger from "@/components/ui/image/sheet-image-selector-trigger";
import { InvoiceImageSelectorSheet } from "./invoiceHelpers/invoice-image-selector-sheet";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { InvoiceTemplateSelector } from "./invoiceHelpers/invoice-templates";
import { FormColorPicker } from "@/components/ui/form/form-color-picker";
import InvoiceItemsSection from "./invoiceHelpers/invoice-items-section";
import { ClientSuggestions } from "./invoiceHelpers/client-suggestions";
import { FormDatePicker } from "@/components/ui/form/form-date-picker";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/constants/issues";
import { InvoiceFontSelector } from "./invoiceHelpers/invoice-fonts";
import { getGstRatesForStateCodes } from "@/lib/invoice/gst-rates";
import { getAllImages } from "@/lib/indexdb-queries/getAllImages";
import { FormTextarea } from "@/components/ui/form/form-textarea";
import { FormSelect } from "@/components/ui/form/form-select";
import { currenciesWithSymbols } from "@/constants/currency";
import { FormInput } from "@/components/ui/form/form-input";
import { UseFormReturn, useWatch } from "react-hook-form";
import FormRow from "@/components/ui/form/form-row";
import { SelectItem } from "@/components/ui/select";
import { useResizeObserver } from "@mantine/hooks";
import React, { useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/client-auth";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import { SaveIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InvoiceFormProps {
  form: UseFormReturn<ZodCreateInvoiceSchema>;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ form }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [resizeRef, container] = useResizeObserver();
  const [billingNameSuggestionsOpen, setBillingNameSuggestionsOpen] = useState(false);
  const [billingGstinSuggestionsOpen, setBillingGstinSuggestionsOpen] = useState(false);

  const { data: session } = useSession();
  const sameAsBilling = useWatch({ control: form.control, name: "shippingClientDetails.sameAsBilling" });
  const billingName = useWatch({ control: form.control, name: "billingClientDetails.name" });
  const billingGstin = useWatch({ control: form.control, name: "billingClientDetails.gstin" });
  const billingAddress = useWatch({ control: form.control, name: "billingClientDetails.address" });
  const companyLogo = useWatch({ control: form.control, name: "companyDetails.logo" });
  const companySignature = useWatch({ control: form.control, name: "companyDetails.signature" });
  const invoiceTemplate = useWatch({ control: form.control, name: "invoiceDetails.theme.template" });

  const copyBillingToShipping = () => {
    form.setValue(
      "shippingClientDetails",
      {
        ...form.getValues("billingClientDetails"),
        sameAsBilling: true,
      },
      {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: true,
      },
    );
  };
  const applyGstRatesToItems = (companyStateCode: string, billingStateCode: string) => {
    const gstRates = getGstRatesForStateCodes(companyStateCode, billingStateCode);
    const items = form.getValues("items");
    const hasMismatchedRates = items.some(
      (item) =>
        item.cgstRate !== gstRates.cgstRate ||
        item.sgstRate !== gstRates.sgstRate ||
        item.igstRate !== gstRates.igstRate,
    );

    if (!hasMismatchedRates) return;

    form.setValue(
      "items",
      items.map((item) => ({
        ...item,
        cgstRate: gstRates.cgstRate,
        sgstRate: gstRates.sgstRate,
        igstRate: gstRates.igstRate,
      })),
      {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: true,
      },
    );
  };
  const getClientSuggestions = (search: string) => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return clients.data ?? [];

    return (clients.data ?? []).filter(
      (client) =>
        client.billingName.toLowerCase().includes(normalizedSearch) ||
        client.billingGstin.toLowerCase().includes(normalizedSearch),
    );
  };
  const handleSaveClient = async () => {
    const billingIsValid = await form.trigger(["billingClientDetails", "shippingClientDetails"], { shouldFocus: true });
    if (!billingIsValid) return;

    const billingClient = form.getValues("billingClientDetails");
    const shippingClient = form.getValues("shippingClientDetails.sameAsBilling")
      ? {
          ...billingClient,
          sameAsBilling: true,
        }
      : form.getValues("shippingClientDetails");

    saveClient.mutate({
      billingName: billingClient.name,
      billingAddress: billingClient.address,
      billingGstin: billingClient.gstin,
      billingState: billingClient.state,
      billingStateCode: billingClient.stateCode,
      billingMetadata: billingClient.metadata,
      sameAsBilling: shippingClient.sameAsBilling,
      shippingName: shippingClient.name,
      shippingAddress: shippingClient.address,
      shippingGstin: shippingClient.gstin,
      shippingState: shippingClient.state,
      shippingStateCode: shippingClient.stateCode,
      shippingMetadata: shippingClient.metadata,
    });
  };

  // fetching images from indexedDB
  const idbImages = useQuery({
    queryKey: ["idb-images"],
    queryFn: () => getAllImages(),
  });
  // Fetching Server Images
  const serverImages = useQuery({
    ...trpc.cloudflare.listImages.queryOptions(),
    enabled: !!session?.user,
  });
  const clients = useQuery({
    ...trpc.client.list.queryOptions(),
    enabled: !!session?.user,
  });
  const invoices = useQuery({
    ...trpc.invoice.list.queryOptions(),
    enabled: !!session?.user,
  });
  const itemSuggestions = useMemo(() => {
    const normalizedBillingGstin = billingGstin.trim().toLowerCase();
    const normalizedBillingName = billingName.trim().toLowerCase();
    const normalizedBillingAddress = billingAddress.trim().toLowerCase();

    if (!session?.user || (!normalizedBillingGstin && !normalizedBillingName)) return [];

    const matchingItems = (invoices.data ?? [])
      .filter((invoice) => {
        const invoiceBillingClient = invoice.invoiceFields.billingClientDetails;
        const invoiceBillingGstin = invoiceBillingClient.gstin.trim().toLowerCase();

        if (normalizedBillingGstin && invoiceBillingGstin) {
          return invoiceBillingGstin === normalizedBillingGstin;
        }

        return (
          invoiceBillingClient.name.trim().toLowerCase() === normalizedBillingName &&
          invoiceBillingClient.address.trim().toLowerCase() === normalizedBillingAddress
        );
      })
      .flatMap((invoice) => invoice.invoiceFields.items);

    return Array.from(
      new Map(
        matchingItems.map((item) => [`${item.name}|${item.description1}|${item.description2}|${item.unitPrice}`, item]),
      ).values(),
    );
  }, [billingAddress, billingGstin, billingName, invoices.data, session?.user]);
  const saveClient = useMutation({
    ...trpc.client.upsert.mutationOptions(),
    onSuccess: () => {
      toast.success(SUCCESS_MESSAGES.TOAST_DEFAULT_TITLE, { description: SUCCESS_MESSAGES.CLIENT_SAVED });
      queryClient.invalidateQueries({ queryKey: trpc.client.list.queryKey() });
    },
    onError: () => {
      toast.error(ERROR_MESSAGES.DEFAULT, {
        description: ERROR_MESSAGES.DATABASE_ERROR,
      });
    },
  });

  return (
    <div className="scroll-bar-hidden flex h-full flex-col overflow-y-scroll">
      <Form {...form}>
        <form>
          <div className="flex h-14 flex-row items-center justify-between border-b px-4">
            <span className="text-sm font-medium">Invoice Template</span>
            <div className="flex flex-row items-center gap-2">
              <InvoiceFontSelector form={form} />
              <InvoiceTemplateSelector form={form} />
            </div>
          </div>
          <Accordion
            type="single"
            collapsible
            defaultValue="billing-client-details"
            className="w-full divide-y border-b"
          >
            {/* Company Details */}
            <AccordionItem value="company-details">
              <AccordionTrigger>Company Details</AccordionTrigger>
              <AccordionContent ref={resizeRef} className={cn(container.width > 1200 ? "flex-row gap-4" : "flex-col")}>
                <div className={cn(container.width > 1200 ? "w-fit" : "w-full [&>*]:w-full", "flex flex-row gap-4")}>
                  <InvoiceImageSelectorSheet
                    type="logo"
                    isLoading={idbImages.isLoading || serverImages.isLoading}
                    idbImages={idbImages.data || []}
                    serverImages={serverImages.data?.images || []}
                    user={session?.user}
                    onUrlChange={(url) => {
                      form.setValue("companyDetails.logo", url);
                    }}
                    onBase64Change={(base64) => {
                      form.setValue("companyDetails.logoBase64", base64);
                    }}
                  >
                    <SheetImageSelectorTrigger
                      type="logo"
                      previewUrl={companyLogo ?? undefined}
                      onRemove={() => {
                        form.setValue("companyDetails.logo", "");
                        form.setValue("companyDetails.logoBase64", undefined);
                      }}
                      label="Company Logo"
                    />
                  </InvoiceImageSelectorSheet>
                  <InvoiceImageSelectorSheet
                    type="signature"
                    isLoading={idbImages.isLoading || serverImages.isLoading}
                    idbImages={idbImages.data || []}
                    serverImages={serverImages.data?.images || []}
                    user={session?.user}
                    onUrlChange={(url) => {
                      form.setValue("companyDetails.signature", url);
                    }}
                    onBase64Change={(base64) => {
                      form.setValue("companyDetails.signatureBase64", base64);
                    }}
                  >
                    <SheetImageSelectorTrigger
                      type="signature"
                      previewUrl={companySignature ?? undefined}
                      onRemove={() => {
                        form.setValue("companyDetails.signature", "");
                        form.setValue("companyDetails.signatureBase64", undefined);
                      }}
                      label="Company Signature"
                    />
                  </InvoiceImageSelectorSheet>
                </div>
                <div className="flex w-full flex-col gap-2">
                  <FormInput
                    name="companyDetails.name"
                    label="Company Name"
                    reactform={form}
                    placeholder="John Doe ltd."
                    description="Name of your company"
                  />
                  <FormTextarea
                    className="h-20"
                    name="companyDetails.address"
                    label="Company Address"
                    reactform={form}
                    placeholder="123 Business St, City, Country"
                  />
                  <FormRow>
                    <FormInput name="companyDetails.gstin" label="GSTIN" reactform={form} placeholder="GSTIN" />
                    <FormInput name="companyDetails.state" label="State" reactform={form} placeholder="State" />
                    <FormInput
                      name="companyDetails.stateCode"
                      label="State Code"
                      reactform={form}
                      placeholder="State code"
                      onChange={(event) =>
                        applyGstRatesToItems(
                          event.currentTarget.value,
                          form.getValues("billingClientDetails.stateCode"),
                        )
                      }
                    />
                  </FormRow>
                  <InvoiceFieldKeyStringValuesSection
                    reactform={form}
                    name="companyDetails.metadata"
                    label="Company Fields"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            {/* Billing Client Details */}
            <AccordionItem value="billing-client-details">
              <AccordionTrigger>Billing Client Details</AccordionTrigger>
              <AccordionContent>
                <ClientSuggestions
                  clients={getClientSuggestions(billingName)}
                  enabled={!!session?.user}
                  form={form}
                  open={billingNameSuggestionsOpen}
                  selectedGstin={billingGstin}
                  setOpen={setBillingNameSuggestionsOpen}
                >
                  <FormInput
                    name="billingClientDetails.name"
                    label="Billing Client Name"
                    reactform={form}
                    placeholder="John Doe"
                    onFocus={() => setBillingNameSuggestionsOpen(true)}
                    onChange={() => setBillingNameSuggestionsOpen(true)}
                  />
                </ClientSuggestions>
                <FormTextarea
                  className="h-20"
                  name="billingClientDetails.address"
                  label="Billing Address"
                  reactform={form}
                  placeholder="456 Client St, City, Country"
                />
                <FormRow>
                  <ClientSuggestions
                    clients={getClientSuggestions(billingGstin)}
                    enabled={!!session?.user}
                    form={form}
                    open={billingGstinSuggestionsOpen}
                    selectedGstin={billingGstin}
                    setOpen={setBillingGstinSuggestionsOpen}
                  >
                    <FormInput
                      name="billingClientDetails.gstin"
                      label="GSTIN"
                      reactform={form}
                      placeholder="GSTIN"
                      onFocus={() => setBillingGstinSuggestionsOpen(true)}
                      onChange={() => setBillingGstinSuggestionsOpen(true)}
                    />
                  </ClientSuggestions>
                  <FormInput name="billingClientDetails.state" label="State" reactform={form} placeholder="State" />
                  <FormInput
                    name="billingClientDetails.stateCode"
                    label="State Code"
                    reactform={form}
                    placeholder="State code"
                    onChange={(event) =>
                      applyGstRatesToItems(form.getValues("companyDetails.stateCode"), event.currentTarget.value)
                    }
                  />
                </FormRow>
                <InvoiceFieldKeyStringValuesSection
                  reactform={form}
                  name="billingClientDetails.metadata"
                  label="Billing Client Fields"
                />
                {session?.user && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveClient}
                    disabled={saveClient.isPending}
                    className="w-full"
                  >
                    <SaveIcon />
                    Save Client
                  </Button>
                )}
              </AccordionContent>
            </AccordionItem>
            {/* Shipping Client Details */}
            <AccordionItem value="shipping-client-details">
              <AccordionTrigger>Shipping Client Details</AccordionTrigger>
              <AccordionContent>
                <FormField
                  control={form.control}
                  name="shippingClientDetails.sameAsBilling"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                      <FormLabel>Same as billing</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) copyBillingToShipping();
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {!sameAsBilling && (
                  <>
                    <FormInput
                      name="shippingClientDetails.name"
                      label="Shipping Client Name"
                      reactform={form}
                      placeholder="John Doe"
                    />
                    <FormTextarea
                      className="h-20"
                      name="shippingClientDetails.address"
                      label="Shipping Address"
                      reactform={form}
                      placeholder="456 Shipping St, City, Country"
                    />
                    <FormRow>
                      <FormInput
                        name="shippingClientDetails.gstin"
                        label="GSTIN"
                        reactform={form}
                        placeholder="GSTIN"
                      />
                      <FormInput
                        name="shippingClientDetails.state"
                        label="State"
                        reactform={form}
                        placeholder="State"
                      />
                      <FormInput
                        name="shippingClientDetails.stateCode"
                        label="State Code"
                        reactform={form}
                        placeholder="State code"
                      />
                    </FormRow>
                    <InvoiceFieldKeyStringValuesSection
                      reactform={form}
                      name="shippingClientDetails.metadata"
                      label="Shipping Client Fields"
                    />
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
            {/* Invoice Details */}
            <AccordionItem value="invoice-details">
              <AccordionTrigger>Invoice Details</AccordionTrigger>
              <AccordionContent>
                <FormRow>
                  <FormSelect
                    name="invoiceDetails.currency"
                    description="Currency code for the invoice"
                    defaultValue="USD"
                    label="Currency"
                    reactform={form}
                  >
                    {Object.entries(currenciesWithSymbols).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        <span>{key}</span>
                        <Badge className="bg-primary/15 text-primary rounded" variant="default">
                          {value}
                        </Badge>
                      </SelectItem>
                    ))}
                  </FormSelect>
                  {invoiceTemplate !== "vercel" && (
                    <>
                      <FormSelect
                        name="invoiceDetails.theme.mode"
                        description="Dark mode for the invoice"
                        defaultValue="dark"
                        label="Dark Mode"
                        reactform={form}
                      >
                        <SelectItem value="dark">
                          <span>Dark</span>
                        </SelectItem>
                        <SelectItem value="light">
                          <span>Light</span>
                        </SelectItem>
                      </FormSelect>
                      <FormColorPicker
                        name="invoiceDetails.theme.baseColor"
                        label="Theme Color"
                        reactform={form}
                        description="Works in white mode only"
                      />
                    </>
                  )}
                </FormRow>
                <FormRow>
                  <FormInput
                    name="invoiceDetails.prefix"
                    label="Invoice Prefix"
                    reactform={form}
                    placeholder="INV-"
                    description="Prefix for invoice number"
                    isOptional={true}
                  />
                  <FormInput
                    name="invoiceDetails.serialNumber"
                    label="Serial Number"
                    reactform={form}
                    placeholder="0001"
                    description="Invoice serial number"
                  />
                </FormRow>
                <FormRow>
                  <FormDatePicker
                    name="invoiceDetails.date"
                    label="Invoice Date"
                    reactform={form}
                    description="Date when invoice is issued"
                  />
                  <FormDatePicker
                    name="invoiceDetails.dueDate"
                    label="Due Date"
                    reactform={form}
                    description="Date when payment is due"
                  />
                </FormRow>
                <FormInput
                  name="invoiceDetails.paymentTerms"
                  label="Payment Terms"
                  reactform={form}
                  placeholder="50% of total amount upfront"
                  description="Terms of payment"
                  isOptional={true}
                />
                <FormRow>
                  <FormInput
                    name="invoiceDetails.poNumber"
                    label="PO Number"
                    reactform={form}
                    placeholder="PO number"
                    isOptional={true}
                  />
                  <FormInput
                    name="invoiceDetails.eWaybillNumber"
                    label="E-waybill Number"
                    reactform={form}
                    placeholder="E-waybill number"
                    isOptional={true}
                  />
                </FormRow>
                <InvoiceFieldKeyNumberValuesSection
                  reactform={form}
                  name="invoiceDetails.billingDetails"
                  label="Billing Details"
                />
              </AccordionContent>
            </AccordionItem>
            {/* Invoice Items */}
            <AccordionItem value="invoice-items">
              <AccordionTrigger>Invoice Items</AccordionTrigger>
              <AccordionContent>
                <InvoiceItemsSection form={form} itemSuggestions={itemSuggestions} />
              </AccordionContent>
            </AccordionItem>
            {/* Additional Information */}
            <AccordionItem value="additional-info">
              <AccordionTrigger>Additional Information</AccordionTrigger>
              <AccordionContent>
                <FormTextarea
                  name="metadata.notes"
                  label="Notes"
                  reactform={form}
                  placeholder="Notes - any relevant information not already covered"
                  description="Additional notes for the invoice"
                  isOptional={true}
                />
                <FormTextarea
                  name="metadata.terms"
                  label="Terms"
                  reactform={form}
                  placeholder="Terms & Conditions - late fees, payment methods, delivery terms, etc."
                  description="Terms and conditions for the invoice"
                  isOptional={true}
                />
                <InvoiceFieldKeyStringValuesSection
                  reactform={form}
                  name="metadata.paymentInformation"
                  label="Payment Information"
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>
      </Form>
    </div>
  );
};

export default InvoiceForm;
