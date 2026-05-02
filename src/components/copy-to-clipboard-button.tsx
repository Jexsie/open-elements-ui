"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { ActionIconButton } from "./action-icon-button.tsx";

type CopyToClipboardButtonProps = {
  readonly value: string;
  readonly title?: string;
};

const COPIED_RESET_MS = 2000;

export function CopyToClipboardButton({ value, title }: CopyToClipboardButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_RESET_MS);
  };

  return (
    <ActionIconButton onClick={handleClick} title={title} tone={copied ? "success" : "default"}>
      {copied ? <Check /> : <Copy />}
    </ActionIconButton>
  );
}
