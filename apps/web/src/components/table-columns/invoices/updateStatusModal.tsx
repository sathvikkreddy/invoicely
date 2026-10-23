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
import {
  FileAlertIcon,
  FileBanIcon,
  FileCheckIcon,
  FileRefreshIcon,
  HourglassStartIcon,
  PriorityMediumIcon,
} from "@/assets/icons";
import { updateInvoiceStatusAction } from "@/actions/invoice-actions";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { invoiceStatusEnum } from "@invoicely/db/schema/invoice";
import { FormSelect } from "@/components/ui/form/form-select";
import { zodResolver } from "@hookform/resolvers/zod";
import { SelectItem } from "@/components/ui/select";
import { Form } from "@/components/ui/form/form";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const invoiceStatusSchema = z.object({
  status: z.enum(invoiceStatusEnum.enumValues),
});

type InvoiceStatusSchema = z.infer<typeof invoiceStatusSchema>;

interface UpdateStatusModalProps {
  invoiceId: string;
  currentStatus: InvoiceStatusSchema["status"];
}

const UpdateStatusModal = ({ invoiceId, currentStatus }: UpdateStatusModalProps) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const form = useForm<InvoiceStatusSchema>({
    resolver: zodResolver(invoiceStatusSchema),
    defaultValues: { status: currentStatus },
  });

  function onSubmit(data: InvoiceStatusSchema) {
    startTransition(async () => {
      const result = await updateInvoiceStatusAction({ id: invoiceId, status: data.status });

      if (!result.success) {
        toast.error("Failed to update status", { description: result.error.message });
        return;
      }

      toast.success("Status updated successfully", { description: result.data.message });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isPending && setOpen(nextOpen)}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
          <PriorityMediumIcon />
          <span>Update Status</span>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent hideCloseButton={isPending}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeaderContainer>
              <DialogIcon>
                <PriorityMediumIcon />
              </DialogIcon>
              <DialogHeader>
                <DialogTitle>Update Invoice Status</DialogTitle>
                <DialogDescription>Choose the current payment status for this invoice.</DialogDescription>
              </DialogHeader>
            </DialogHeaderContainer>
            <DialogContentContainer>
              <div className="flex flex-col gap-1.5">
                <Label>Invoice ID</Label>
                <Input disabled value={invoiceId} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Change Status</Label>
                <FormSelect name="status" reactform={form}>
                  <SelectItem value="pending">
                    <HourglassStartIcon /> Pending
                  </SelectItem>
                  <SelectItem value="success">
                    <FileCheckIcon /> Success
                  </SelectItem>
                  <SelectItem value="error">
                    <FileBanIcon /> Error
                  </SelectItem>
                  <SelectItem value="expired">
                    <FileAlertIcon /> Expired
                  </SelectItem>
                  <SelectItem value="refunded">
                    <FileRefreshIcon /> Refunded
                  </SelectItem>
                </FormSelect>
              </div>
            </DialogContentContainer>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateStatusModal;
