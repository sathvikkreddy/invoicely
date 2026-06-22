"use client";

import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { ZodCreateInvoiceSchema } from "@/zod-schemas/invoice/create-invoice";
import { getGstRatesForStateCodes } from "@/lib/invoice/gst-rates";
import type { Client } from "@invoicely/db/schema/client";
import { UseFormReturn } from "react-hook-form";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface ClientSuggestionsProps {
  children: React.ReactNode;
  clients: Client[];
  enabled: boolean;
  form: UseFormReturn<ZodCreateInvoiceSchema>;
  open: boolean;
  selectedGstin: string;
  setOpen: (open: boolean) => void;
}

const ClientSuggestions: React.FC<ClientSuggestionsProps> = ({
  children,
  clients,
  enabled,
  form,
  open,
  selectedGstin,
  setOpen,
}) => {
  const applyGstRatesToItems = (billingStateCode: string) => {
    const gstRates = getGstRatesForStateCodes(form.getValues("companyDetails.stateCode"), billingStateCode);
    const items = form.getValues("items");

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

  const applyClient = (client: Client) => {
    form.setValue(
      "billingClientDetails",
      {
        name: client.billingName,
        address: client.billingAddress,
        gstin: client.billingGstin,
        state: client.billingState,
        stateCode: client.billingStateCode,
        metadata: client.billingMetadata,
      },
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
    );
    form.setValue(
      "shippingClientDetails",
      {
        sameAsBilling: client.sameAsBilling,
        name: client.shippingName,
        address: client.shippingAddress,
        gstin: client.shippingGstin,
        state: client.shippingState,
        stateCode: client.shippingStateCode,
        metadata: client.shippingMetadata,
      },
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
    );
    applyGstRatesToItems(client.billingStateCode);
    setOpen(false);
  };

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Popover open={open && clients.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor className="w-full">{children}</PopoverAnchor>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-72 p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command>
          <CommandList>
            <CommandEmpty>No clients found.</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`${client.billingName} ${client.billingGstin}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onSelect={() => applyClient(client)}
                >
                  <CheckIcon
                    className={cn("size-4", selectedGstin === client.billingGstin ? "opacity-100" : "opacity-0")}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm">{client.billingName}</span>
                    <span className="text-muted-foreground truncate text-xs">{client.billingGstin}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export { ClientSuggestions };
