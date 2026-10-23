"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import UploadSignatureAsset from "@/app/(dashboard)/assets/upload-signature.asset";
import UploadLogoAsset from "@/app/(dashboard)/assets/upload-logo-asset";
import { getImagesWithKey } from "@/lib/manage-assets/getImagesWithKey";
import type { InvoiceImageType } from "@/types/common/invoice";
import EmptySection from "@/components/ui/icon-placeholder";
import { R2_PUBLIC_URL } from "@/constants";
import { useState } from "react";
import Image from "next/image";

interface InvoiceImageSelectorSheetProps {
  children: React.ReactNode;
  type: InvoiceImageType;
  isLoading?: boolean;
  images: string[];
  onUrlChange: (url: string) => void;
}

export const InvoiceImageSelectorSheet = ({
  children,
  type,
  isLoading = false,
  images,
  onUrlChange,
}: InvoiceImageSelectorSheetProps) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const matchingImages = getImagesWithKey(images, type);

  function handleImageSelect(image: string) {
    onUrlChange(`${R2_PUBLIC_URL}/${image}`);
    setSheetOpen(false);
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger>{children}</SheetTrigger>
      <SheetContent className="scroll-bar-hidden w-[90%] !max-w-lg overflow-y-scroll">
        <SheetHeader className="hidden flex-col gap-0">
          <SheetTitle>Select {type}</SheetTitle>
          <SheetDescription>Select an image from your account</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <EmptySection title="Loading..." description="Please wait while we load the images." />
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            <div>
              <div className="instrument-serif text-xl font-bold">Saved {type}s</div>
              <p className="text-muted-foreground text-xs">Choose a {type} stored in your account.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {type === "logo" ? <UploadLogoAsset disableIcon /> : <UploadSignatureAsset disableIcon />}
              {matchingImages.map((image) => (
                <button
                  type="button"
                  key={image}
                  className="bg-border/30 relative cursor-pointer rounded-md"
                  onClick={() => handleImageSelect(image)}
                >
                  <Image
                    src={`${R2_PUBLIC_URL}/${image}`}
                    alt={`Saved ${type}`}
                    width={200}
                    height={200}
                    className="aspect-square w-full rounded-md border object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
