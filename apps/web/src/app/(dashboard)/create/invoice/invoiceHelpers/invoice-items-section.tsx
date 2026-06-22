"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogContentContainer,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogHeaderContainer,
  DialogIcon,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createInvoiceItemSchema, ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { getGstRatesForStateCodes, type GstRates } from "@/lib/invoice/gst-rates";
import { useFieldArray, useForm, UseFormReturn, useWatch } from "react-hook-form";
import { CopyIcon, GripVerticalIcon, PencilIcon } from "lucide-react";
import { BoxIcon, BoxPlusIcon, TrashIcon } from "@/assets/icons";
import { FormInput } from "@/components/ui/form/form-input";
import { getInvoiceTotals } from "@/constants/pdf-helpers";
import { formatCurrencyText } from "@/constants/currency";
import { zodResolver } from "@hookform/resolvers/zod";
import FormRow from "@/components/ui/form/form-row";
import { Form } from "@/components/ui/form/form";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { Reorder } from "motion/react";

interface InvoiceItemsSectionProps {
  form: UseFormReturn<ZodCreateInvoiceSchema>;
}
type InvoiceItem = ZodCreateInvoiceSchema["items"][number];

const InvoiceItemsSection: React.FC<InvoiceItemsSectionProps> = ({ form }) => {
  const { fields, append, remove, update, move } = useFieldArray({
    control: form.control,
    name: "items",
  });
  const companyStateCode = useWatch({ control: form.control, name: "companyDetails.stateCode" });
  const billingStateCode = useWatch({ control: form.control, name: "billingClientDetails.stateCode" });
  const currency = useWatch({ control: form.control, name: "invoiceDetails.currency" });
  const watchedItems = useWatch({ control: form.control, name: "items" });
  const billingDetails = useWatch({ control: form.control, name: "invoiceDetails.billingDetails" });
  const gstRates = getGstRatesForStateCodes(companyStateCode, billingStateCode);
  const isSameState = gstRates.igstRate === 0;
  const totals = getInvoiceTotals({
    ...form.getValues(),
    invoiceDetails: {
      ...form.getValues("invoiceDetails"),
      billingDetails,
    },
    items: watchedItems,
  });

  const onReorder = (newIds: string[]) => {
    const oldIds = fields.map((field) => field.id);
    const reorder = getSingleMove(oldIds, newIds);
    if (reorder) move(reorder.from, reorder.to);
  };
  const duplicateItem = (item: InvoiceItem) => {
    append({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      units: item.units,
      unitPrice: item.unitPrice,
      hsnSac: item.hsnSac,
      cgstRate: item.cgstRate,
      sgstRate: item.sgstRate,
      igstRate: item.igstRate,
      metadata: item.metadata.map((metadata) => ({ ...metadata })),
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Rendering the items */}
      {fields.length > 0 && (
        <Reorder.Group
          axis="y"
          values={fields.map((field) => field.id)}
          onReorder={onReorder}
          className="flex flex-col gap-2"
        >
          {fields.map((field, index) => {
            const item = watchedItems[index] ?? field;

            return (
              <Reorder.Item
                value={field.id}
                key={field.id}
                className="bg-muted/50 flex w-full cursor-grab flex-row justify-between gap-2 rounded-md p-3 active:cursor-grabbing"
              >
                <div className="flex w-full flex-row gap-2">
                  <div className="text-muted-foreground grid h-full place-items-center">
                    <GripVerticalIcon className="size-4" />
                  </div>
                  <div className="bg-muted-foreground/20 grid aspect-square h-full place-items-center rounded-md">
                    <BoxIcon />
                  </div>
                  <div className="w-full">
                    <div className="line-clamp-1 text-sm font-medium">{item.name}</div>
                    <div className="text-muted-foreground line-clamp-1 text-xs">{item.description}</div>
                    {item.metadata.length > 0 && (
                      <div className="text-muted-foreground line-clamp-1 text-[10px]">
                        {item.metadata.map((metadata) => `${metadata.label}: ${metadata.value}`).join(" · ")}
                      </div>
                    )}
                    <div className="text-primary text-[10px] font-medium">
                      {formatCurrencyText(currency, item.unitPrice)}{" "}
                      <span className="text-muted-foreground">
                        x {item.quantity} {item.units}
                      </span>
                      {item.hsnSac ? <span className="text-muted-foreground"> · HSN/SAC {item.hsnSac}</span> : null}
                    </div>
                  </div>
                </div>
                <div className="flex flex-row gap-2">
                  <div className="flex flex-col items-end justify-between gap-1">
                    <div className="flex flex-row gap-1.5">
                      <HandleItemModal
                        type="edit"
                        append={append}
                        update={update}
                        editingIndex={index}
                        data={item}
                        gstRates={gstRates}
                        isSameState={isSameState}
                      >
                        <Button
                          type="button"
                          className="text-muted-foreground h-5.5 w-5.5 rounded"
                          variant="ghost"
                          size="icon"
                        >
                          <PencilIcon className="size-3" />
                        </Button>
                      </HandleItemModal>
                      <Button
                        type="button"
                        className="text-muted-foreground h-5.5 w-5.5 rounded"
                        variant="ghost"
                        size="icon"
                        onClick={() => duplicateItem(item)}
                      >
                        <CopyIcon className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        className="h-5.5 w-5.5 rounded"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <TrashIcon className="size-3" />
                      </Button>
                    </div>
                    <div className="flex flex-row items-center gap-1">
                      <p className="space-x-1 text-[10px] whitespace-nowrap">
                        <span>Total:</span>
                        <span>
                          {formatCurrencyText(currency, item.unitPrice * item.quantity)}
                          {totals.itemTotals[index]?.totalTax ? (
                            <span className="text-muted-foreground">
                              {" "}
                              + {formatCurrencyText(currency, totals.itemTotals[index].totalTax)} GST
                            </span>
                          ) : null}
                        </span>
                      </p>
                      {totals.itemTotals[index]?.totalTax ? (
                        <p className="text-muted-foreground text-right text-[10px] whitespace-nowrap">
                          {formatGstRateText(item)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      )}
      {/* Dialog for adding a new item */}
      <HandleItemModal type="add" append={append} update={update} gstRates={gstRates} isSameState={isSameState}>
        <Button type="button" className="w-full border-dashed" variant="outline">
          <BoxPlusIcon />
          Add Item
        </Button>
      </HandleItemModal>
    </div>
  );
};

export default InvoiceItemsSection;

// Derives a single move(from, to) from the old vs new id ordering produced by a drag.
const getSingleMove = (oldIds: string[], newIds: string[]): { from: number; to: number } | null => {
  let start = 0;
  while (start < oldIds.length && oldIds[start] === newIds[start]) start++;

  let end = oldIds.length - 1;
  while (end >= 0 && oldIds[end] === newIds[end]) end--;

  if (start > end) return null;

  // Forward move if the element at `start` slid down to `end`, otherwise backward.
  return oldIds[start] === newIds[end] ? { from: start, to: end } : { from: end, to: start };
};

interface AddItemModalProps {
  type: "add" | "edit";
  children: React.ReactNode;
  data?: InvoiceItem;
  editingIndex?: number | null;
  append: (data: InvoiceItem) => void;
  update: (index: number, data: InvoiceItem) => void;
  gstRates: GstRates;
  isSameState: boolean;
}

const HandleItemModal = ({
  type,
  append,
  update,
  editingIndex,
  data,
  children,
  gstRates,
  isSameState,
}: AddItemModalProps) => {
  const [open, setOpen] = useState(false);

  const invoiceItemForm = useForm<InvoiceItem>({
    resolver: zodResolver(createInvoiceItemSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: {
      name: data?.name || "",
      description: data?.description || "",
      quantity: data?.quantity || 1,
      units: data?.units || "Nos",
      unitPrice: data?.unitPrice || 1,
      hsnSac: data?.hsnSac || "",
      cgstRate: data?.cgstRate ?? gstRates.cgstRate,
      sgstRate: data?.sgstRate ?? gstRates.sgstRate,
      igstRate: data?.igstRate ?? gstRates.igstRate,
      metadata: data?.metadata || [],
    },
  });
  const {
    fields: metadataFields,
    append: appendMetadata,
    remove: removeMetadata,
  } = useFieldArray({
    control: invoiceItemForm.control,
    name: "metadata",
  });

  const onHandleSubmit = (data: InvoiceItem) => {
    if (type === "edit" && typeof editingIndex === "number") {
      update(editingIndex, data);
    } else {
      append(data);
    }

    // Clean up the form
    invoiceItemForm.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <Form {...invoiceItemForm}>
          <form onSubmit={invoiceItemForm.handleSubmit(onHandleSubmit)}>
            <DialogHeaderContainer>
              <DialogIcon>
                <BoxPlusIcon />
              </DialogIcon>
              <DialogHeader>
                <DialogTitle>Add Item</DialogTitle>
                <DialogDescription>Add an item to the invoice</DialogDescription>
              </DialogHeader>
            </DialogHeaderContainer>
            <DialogContentContainer>
              <FormInput label="Item Name" name="name" placeholder="Item Name" reactform={invoiceItemForm} />
              <FormInput
                label="Item Description"
                name="description"
                placeholder="Item Description"
                reactform={invoiceItemForm}
              />
              <FormInput label="HSN/SAC" name="hsnSac" placeholder="HSN/SAC" reactform={invoiceItemForm} />
              <FormRow>
                <FormInput
                  type="number"
                  label="Quantity"
                  name="quantity"
                  placeholder="Quantity"
                  reactform={invoiceItemForm}
                />
                <FormInput label="Units" name="units" placeholder="Nos" reactform={invoiceItemForm} />
                <FormInput
                  type="number"
                  label="Unit Price"
                  name="unitPrice"
                  placeholder="Unit Price"
                  reactform={invoiceItemForm}
                />
              </FormRow>
              <div className="flex flex-col gap-2">
                <div className="text-xs font-medium">Item Fields</div>
                {metadataFields.map((field, index) => (
                  <div className="flex flex-row items-start gap-2" key={field.id}>
                    <FormInput
                      name={`metadata.${index}.label`}
                      placeholder="Size"
                      reactform={invoiceItemForm}
                      fieldClassName="w-[30%]"
                    />
                    <FormInput name={`metadata.${index}.value`} placeholder="24 x 34" reactform={invoiceItemForm} />
                    <Button
                      className="mb-0.5"
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => removeMetadata(index)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  className="w-full border-dashed"
                  variant="outline"
                  onClick={() => appendMetadata({ label: "", value: "" })}
                >
                  Add Item Field
                </Button>
              </div>
              <div className="text-muted-foreground text-xs">
                {isSameState
                  ? "Same-state invoice: CGST and SGST usually apply."
                  : "Inter-state invoice: IGST usually applies."}
              </div>
              <FormRow>
                <FormInput
                  type="number"
                  label="CGST %"
                  name="cgstRate"
                  placeholder="0"
                  reactform={invoiceItemForm}
                  step="0.01"
                />
                <FormInput
                  type="number"
                  label="SGST %"
                  name="sgstRate"
                  placeholder="0"
                  reactform={invoiceItemForm}
                  step="0.01"
                />
                <FormInput
                  type="number"
                  label="IGST %"
                  name="igstRate"
                  placeholder="0"
                  reactform={invoiceItemForm}
                  step="0.01"
                />
              </FormRow>
            </DialogContentContainer>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Add Item</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const formatGstRateText = (item: InvoiceItem) => {
  const rates = [
    item.cgstRate > 0 ? `${item.cgstRate}%` : null,
    item.sgstRate > 0 ? `${item.sgstRate}%` : null,
    item.igstRate > 0 ? `${item.igstRate}%` : null,
  ].filter(Boolean);

  return rates.length > 0 ? rates.join(" + ") : "No GST";
};
