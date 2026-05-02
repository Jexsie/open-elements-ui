"use client";

import { ExternalLink } from "lucide-react";
import { ActionIconButton } from "./action-icon-button.tsx";

type ExternalLinkButtonProps = {
  readonly href: string;
  readonly title?: string;
};

export function ExternalLinkButton({ href, title }: ExternalLinkButtonProps) {
  return (
    <ActionIconButton
      onClick={() => {
        window.open(href, "_blank", "noopener,noreferrer");
      }}
      title={title}
    >
      <ExternalLink />
    </ActionIconButton>
  );
}
