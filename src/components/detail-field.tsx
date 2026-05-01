"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Mail, Phone } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip.tsx";

interface DetailFieldTranslations {
  readonly copy: string;
  readonly copied: string;
  readonly open: string;
  readonly email: string;
  readonly call: string;
}

const defaultTranslations: DetailFieldTranslations = {
  copy: "Copy",
  copied: "Copied",
  open: "Open",
  email: "Email",
  call: "Call",
};

interface DetailFieldProps {
  readonly label: string;
  readonly value: string | null;
  readonly copyable?: boolean;
  readonly linkable?: boolean;
  readonly mailable?: boolean;
  readonly callable?: boolean;
  readonly multiline?: boolean;
  readonly children?: React.ReactNode;
  readonly translations?: DetailFieldTranslations;
}

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
}

export function DetailField({
  label,
  value,
  copyable,
  linkable,
  mailable,
  callable,
  multiline,
  children,
  translations = defaultTranslations,
}: DetailFieldProps) {
  const [copied, setCopied] = useState(false);

  const hasValue = value !== null && value !== "";
  const hasActions = hasValue && (copyable || linkable || mailable || callable);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenUrl = () => {
    if (!value) return;
    window.open(normalizeUrl(value), "_blank");
  };

  const handleMailto = () => {
    if (!value) return;
    window.location.href = `mailto:${value}`;
  };

  const handleTel = () => {
    if (!value) return;
    window.location.href = `tel:${value}`;
  };

  return (
    <div>
      <dt className="text-sm font-medium text-oe-gray-mid">{label}</dt>
      <dd className="mt-1 text-sm text-oe-black flex items-start gap-1">
        <span className={multiline ? "whitespace-pre-line" : ""}>
          {children ?? (hasValue ? value : "—")}
        </span>
        {hasActions && (
          <span className="inline-flex gap-0.5 shrink-0 mt-0.5">
            {copyable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-oe-gray-light hover:text-oe-dark [@media(pointer:coarse)]:text-oe-dark"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-oe-green" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{copied ? translations.copied : translations.copy}</TooltipContent>
              </Tooltip>
            )}
            {linkable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleOpenUrl}
                    className="text-oe-gray-light hover:text-oe-dark [@media(pointer:coarse)]:text-oe-dark"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{translations.open}</TooltipContent>
              </Tooltip>
            )}
            {mailable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleMailto}
                    className="text-oe-gray-light hover:text-oe-dark [@media(pointer:coarse)]:text-oe-dark"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{translations.email}</TooltipContent>
              </Tooltip>
            )}
            {callable && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleTel}
                    className="text-oe-gray-light hover:text-oe-dark [@media(pointer:coarse)]:text-oe-dark"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{translations.call}</TooltipContent>
              </Tooltip>
            )}
          </span>
        )}
      </dd>
    </div>
  );
}

export type { DetailFieldProps, DetailFieldTranslations };
