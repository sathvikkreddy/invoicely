"use client";

import SignatureInputModal from "@/components/ui/image/signature-input-modal";
import { uploadImageAction } from "@/actions/asset-actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

const UploadSignatureAsset = ({ disableIcon = false }: { disableIcon?: boolean }) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleBase64Change(base64: string | undefined) {
    if (!base64) return;

    startTransition(async () => {
      const result = await uploadImageAction({ type: "signature", base64 });
      if (!result.success) {
        toast.error("Failed to upload image", { description: result.error.message });
        return;
      }

      toast.success("Image uploaded", { description: result.data.message });
      router.refresh();
    });
  }

  return (
    <SignatureInputModal
      isLoading={isPending}
      onBase64Change={handleBase64Change}
      maxSizeMB={0.15}
      disableIcon={disableIcon}
    />
  );
};

export default UploadSignatureAsset;
