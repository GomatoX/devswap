"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "@uploadthing/react";
import { generateClientDropzoneAccept } from "uploadthing/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";

type FileUploadProps = {
  endpoint: "developerPhoto" | "developerCV";
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: Error) => void;
  accept?: string;
  label?: string;
};

export function FileUpload({
  endpoint,
  onUploadComplete,
  onUploadError,
  label = "Upload file",
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload, routeConfig } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      const url = res?.[0]?.ufsUrl || res?.[0]?.url;
      if (url) {
        onUploadComplete(url);
      }
    },
    onUploadError: (error) => {
      setIsUploading(false);
      onUploadError?.(error);
    },
    onUploadBegin: () => {
      setIsUploading(true);
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        startUpload(acceptedFiles);
      }
    },
    [startUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: routeConfig
      ? generateClientDropzoneAccept(Object.keys(routeConfig))
      : undefined,
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
        ${isUploading ? "pointer-events-none opacity-50" : ""}
      `}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Uploading...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {isDragActive ? "Drop here" : label}
          </span>
        </div>
      )}
    </div>
  );
}

// Simple button variant
export function FileUploadButton({
  endpoint,
  onUploadComplete,
  onUploadError,
  label = "Upload",
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing(endpoint);

  const handleClick = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      endpoint === "developerPhoto" ? "image/*" : ".pdf,.doc,.docx";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const res = await startUpload([file]);
        console.log("Upload response:", res);
        const url = res?.[0]?.ufsUrl || res?.[0]?.url;
        if (url) {
          onUploadComplete(url);
        } else {
          console.error("No URL in response:", res);
          onUploadError?.(new Error("Upload failed - no URL returned"));
        }
      } catch (error) {
        console.error("Upload error:", error);
        onUploadError?.(error as Error);
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isUploading}
    >
      {isUploading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Uploading...
        </>
      ) : (
        <>
          <Upload className="h-4 w-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );
}
