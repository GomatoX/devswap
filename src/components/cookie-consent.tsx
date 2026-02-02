"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "devswap-cookie-consent";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="mx-auto max-w-3xl rounded-lg border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-4 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            We use cookies to improve your experience and analyze site usage.{" "}
            <a
              href="/privacy"
              className="text-primary underline hover:no-underline"
            >
              Privacy Policy
            </a>
          </p>
          <Button size="sm" onClick={handleAccept} className="shrink-0">
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
