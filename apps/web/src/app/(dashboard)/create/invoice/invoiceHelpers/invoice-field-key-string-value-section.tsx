"use client";

import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { FormInput } from "@/components/ui/form/form-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TrashIcon } from "@/assets/icons";
import { cn } from "@/lib/utils";
import React from "react";

interface InvoiceFieldKeyStringValuesSectionProps {
  reactform: UseFormReturn<ZodCreateInvoiceSchema>;
  name: "companyDetails.metadata" | "billingClientDetails.metadata" | "shippingClientDetails.metadata" | "metadata.paymentInformation";
  className?: string;
  label?: string | undefined;
  description?: string | undefined;
  isOptional?: boolean;
}

const InvoiceFieldKeyStringValuesSection: React.FC<InvoiceFieldKeyStringValuesSectionProps> = ({
  reactform,
  name,
  className,
  label,
}) => {
  const { fields, append, remove } = useFieldArray({
    control: reactform.control,
    name,
  });

  const addNewField = () => {
    append({
      label: "",
      value: "",
    });
  };

  return (
    <div className={cn(className, "flex flex-col gap-2")}>
      <div className="flex flex-row items-center gap-2">
        <Label>{label ?? "Fields"}</Label>
      </div>
      {fields.map((field, index) => (
        <div className="flex flex-row items-end gap-2" key={field.id}>
          <FormInput
            name={`${name}.${index}.label`}
            reactform={reactform}
            label="Label"
            placeholder="Label"
            description="Enter the label for the field"
          />
          <FormInput
            name={`${name}.${index}.value`}
            reactform={reactform}
            label="Value"
            placeholder="Value"
            description="Enter the value for the field"
          />
          <Button className="mb-4.5" variant="destructive" size="icon" onClick={() => remove(index)} type="button">
            <TrashIcon />
          </Button>
        </div>
      ))}
      <Button className="w-full border-dashed" variant="outline" onClick={addNewField} type="button">
        Add New Field
      </Button>
    </div>
  );
};

export default InvoiceFieldKeyStringValuesSection;
