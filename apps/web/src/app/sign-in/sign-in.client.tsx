"use client";

import LogoIcon from "@/components/assets/logo-icon";
import { Button } from "@/components/ui/button";
import { clientAuth } from "@/lib/client-auth";
import { useState } from "react";
import Image from "next/image";

interface SignInCardProps {
  callbackUrl: string;
}

function SignInCard({ callbackUrl }: SignInCardProps) {
  const [status, setStatus] = useState<"idle" | "pending" | "error">("idle");

  async function handleSignIn() {
    setStatus("pending");

    try {
      const { error } = await clientAuth.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });

      if (error) setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="bg-muted/20 flex min-h-dvh items-center justify-center p-4">
      <section className="bg-background flex w-full max-w-sm flex-col items-center gap-5 rounded-xl border p-8 text-center shadow-sm">
        <LogoIcon />
        <div>
          <h1 className="instrument-serif text-3xl font-semibold">Sign in to Invoicely</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your invoices, saved details, logos, and signatures are securely stored with your account.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-auto w-full p-0"
          disabled={status === "pending"}
          aria-busy={status === "pending"}
          onClick={handleSignIn}
        >
          <Image
            className="w-full dark:hidden"
            src="/social/google-login-btn-light.svg"
            alt="Sign in with Google"
            width={200}
            height={40}
            priority
          />
          <Image
            className="hidden w-full dark:block"
            src="/social/google-login-btn-dark.svg"
            alt="Sign in with Google"
            width={200}
            height={40}
            priority
          />
        </Button>
        {status === "error" ? (
          <p role="alert" className="text-destructive text-sm">
            Couldn&apos;t start Google sign-in. Please try again.
          </p>
        ) : null}
      </section>
    </main>
  );
}

export { SignInCard };
