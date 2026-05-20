"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.tsx";
import {
  TranslateDialog,
  type TranslateDialogTranslations,
  type TranslateResult,
} from "./translate-dialog.tsx";

export interface TranslateButtonTranslations {
  /** Tooltip / aria-label for the button. */
  readonly button: string;
  readonly dialog: TranslateDialogTranslations;
}

export interface TranslateButtonProps {
  readonly text: string | null | undefined;
  /** Visual size of the icon — "sm" (h-3.5 w-3.5), "md" (h-4 w-4, default). */
  readonly size?: "sm" | "md";
  /**
   * Whether the backend translation feature is configured. `null` means the
   * config probe is still in flight — the button hides until the answer is
   * known to avoid a flash. The app owns this concern (it hits its own
   * feature-toggle endpoint) and passes the resolved value as a prop.
   */
  readonly configured: boolean | null;
  readonly onTranslate: (text: string, targetLanguage: string) => Promise<TranslateResult>;
  readonly translations: TranslateButtonTranslations;
}

/**
 * Translate icon button next to a piece of text. Returns `null` when the
 * text is empty / whitespace / null, while the configuration probe is still
 * in flight (`configured === null`), or when the backend feature is not
 * configured. Clicking opens a {@link TranslateDialog} with the given text.
 */
export function TranslateButton({
  text,
  size = "md",
  configured,
  onTranslate,
  translations: T,
}: TranslateButtonProps) {
  const [open, setOpen] = useState(false);

  if (!text || text.trim().length === 0) {
    return null;
  }
  if (configured !== true) {
    return null;
  }

  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-oe-gray-light hover:text-oe-dark shrink-0 ml-2"
            aria-label={T.button}
            data-testid="translate-button"
          >
            <Languages className={iconClass} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{T.button}</TooltipContent>
      </Tooltip>
      <TranslateDialog
        open={open}
        onOpenChange={setOpen}
        sourceText={text}
        onTranslate={onTranslate}
        translations={T.dialog}
      />
    </>
  );
}
