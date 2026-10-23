"use client";

import { uploadImageAction } from "@/actions/asset-actions";
import ImageInput from "@/components/ui/image/image-input";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

const UploadLogoAsset = ({ disableIcon = false }: { disableIcon?: boolean }) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleBase64Change(base64: string | undefined) {
    if (!base64) return;

    startTransition(async () => {
      const result = await uploadImageAction({ type: "logo", base64 });
      if (!result.success) {
        toast.error("Failed to upload image", { description: result.error.message });
        return;
      }

      toast.success("Image uploaded", { description: result.data.message });
      router.refresh();
    });
  }

  return (
    <ImageInput
      isLoading={isPending}
      allowPreview={false}
      onBase64Change={handleBase64Change}
      maxSizeMB={0.4}
      disableIcon={disableIcon}
    />
  );
};

export default UploadLogoAsset;
