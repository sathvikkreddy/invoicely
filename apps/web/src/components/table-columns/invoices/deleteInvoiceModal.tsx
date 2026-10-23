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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { deleteInvoiceAction } from "@/actions/invoice-actions";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@/assets/icons";
import { toast } from "sonner";

const DeleteInvoiceModal = ({ invoiceId }: { invoiceId: string }) => {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteInvoiceAction({ id: invoiceId });

      if (!result.success) {
        toast.error("Failed to delete invoice", { description: result.error.message });
        return;
      }

      toast.success("Invoice deleted successfully", { description: result.data.message });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isPending && setOpen(nextOpen)}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
          <TrashIcon />
          <span>Delete Invoice</span>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent hideCloseButton={isPending}>
        <DialogHeaderContainer>
          <DialogIcon>
            <TrashIcon />
          </DialogIcon>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
        </DialogHeaderContainer>
        <DialogContentContainer>
          <Alert variant="destructive">
            <AlertTitle>Proceed with caution!</AlertTitle>
            <AlertDescription>
              This permanently removes the invoice and all of its associated details from your account.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-1.5">
            <Label>Invoice ID</Label>
            <Input disabled value={invoiceId} />
          </div>
        </DialogContentContainer>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteInvoiceModal;
