"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ImageSparkleIcon, SignatureIcon, TrashIcon, IdBadgeIcon } from "@/assets/icons";
import type { ZodDefaultDetailsSchema } from "@/zod-schemas/invoice/default-details";
import { getImagesWithKey } from "@/lib/manage-assets/getImagesWithKey";
import UploadSignatureAsset from "./upload-signature.asset";
import { deleteImageAction } from "@/actions/asset-actions";
import { DefaultDetails } from "./default-details";
import UploadLogoAsset from "./upload-logo-asset";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { R2_PUBLIC_URL } from "@/constants";
import { useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import React from "react";

interface ImageType {
  key: "logo" | "signature";
  icon: React.ReactNode;
  title: "Logos" | "Signatures";
  description: string;
}

const typeOfImages: ImageType[] = [
  {
    key: "logo",
    icon: <ImageSparkleIcon />,
    title: "Logos",
    description: "Manage the logos available to your invoices.",
  },
  {
    key: "signature",
    icon: <SignatureIcon />,
    title: "Signatures",
    description: "Manage the signatures available to your invoices.",
  },
];

interface AssetsPageProps {
  images: string[];
  defaultDetails: ZodDefaultDetailsSchema | null;
}

const AssetsPage = ({ images, defaultDetails }: AssetsPageProps) => {
  const [isDeleting, startTransition] = useTransition();
  const router = useRouter();

  function handleDeleteImage(key: string) {
    startTransition(async () => {
      const result = await deleteImageAction({ key });
      if (!result.success) {
        toast.error("Failed to delete image", { description: result.error.message });
        return;
      }

      toast.success("Image deleted", { description: result.data.message });
      router.refresh();
    });
  }

  return (
    <div>
      <Accordion
        type="multiple"
        defaultValue={[typeOfImages[0].key, typeOfImages[1].key, "details"]}
        className="w-full divide-y border-b"
      >
        <AccordionItem value="details">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <IdBadgeIcon />
              <span>Default Details</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div>
              <div className="instrument-serif text-xl font-bold">Default Details</div>
              <p className="text-muted-foreground text-xs">
                Save your company and client details once to pre-fill every new invoice in your account.
              </p>
            </div>
            <div className="mt-4">
              <DefaultDetails savedDetails={defaultDetails} />
            </div>
          </AccordionContent>
        </AccordionItem>
        {typeOfImages.map((type) => (
          <AccordionItem key={type.key} value={type.key}>
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                {type.icon}
                <span>{type.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div>
                <div className="instrument-serif text-xl font-bold">{type.title}</div>
                <p className="text-muted-foreground text-xs">
                  {type.description} New uploads are saved to your account.
                </p>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-5">
                {type.key === "logo" ? <UploadLogoAsset /> : <UploadSignatureAsset />}
                {getImagesWithKey(images, type.key).map((image) => (
                  <div key={image} className="bg-border/30 relative rounded-md">
                    <Button
                      disabled={isDeleting}
                      variant="ghost"
                      size="xs"
                      className="absolute top-2 right-2 !px-0.5 text-red-500 hover:!bg-red-500 hover:!text-white"
                      onClick={() => handleDeleteImage(image)}
                      aria-label={`Delete ${type.key}`}
                    >
                      <TrashIcon />
                    </Button>
                    <Image
                      src={`${R2_PUBLIC_URL}/${image}`}
                      alt={`${type.key} asset`}
                      width={200}
                      height={200}
                      className="aspect-square w-full rounded-md object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default AssetsPage;
