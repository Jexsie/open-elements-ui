"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { Button } from "./button.tsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog.tsx";
import { useLanguage } from "../i18n/language-context.tsx";

export interface TranslateResult {
  readonly translatedText: string;
}

export interface TranslateDialogTranslations {
  readonly title: string;
  readonly loading: string;
  readonly error: string;
  readonly copy: string;
  readonly copied: string;
  readonly close: string;
}

export interface TranslateDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly sourceText: string;
  readonly onTranslate: (text: string, targetLanguage: string) => Promise<TranslateResult>;
  readonly translations: TranslateDialogTranslations;
}

/**
 * Prop-driven translate dialog. When `open` flips to true, calls
 * `onTranslate(sourceText, targetLanguage)` where `targetLanguage` is `"de"`
 * if the active `useLanguage()` language is `"de"`, else `"en"`. Renders a
 * loading state during the in-flight request, an error message on rejection,
 * the translated text on success, and a copy button that flashes a
 * "copied" confirmation for ~2 seconds.
 */
export function TranslateDialog({
  open,
  onOpenChange,
  sourceText,
  onTranslate,
  translations: T,
}: TranslateDialogProps) {
  const { language } = useLanguage();
  const targetLanguage = language === "de" ? "de" : "en";

  const [loading, setLoading] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setLoading(true);
    setTranslated(null);
    setError(false);
    setCopied(false);
    let cancelled = false;
    onTranslate(sourceText, targetLanguage)
      .then((result) => {
        if (!cancelled) {
          setTranslated(result.translatedText);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, sourceText, targetLanguage, onTranslate]);

  const handleCopy = async () => {
    if (!translated) return;
    try {
      await navigator.clipboard.writeText(translated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available; ignore.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">{T.title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-[80px] py-2">
          {loading && (
            <div
              className="flex items-center gap-2 text-sm text-oe-gray-mid"
              data-testid="translate-dialog-loading"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              {T.loading}
            </div>
          )}
          {!loading && error && (
            <p className="text-sm text-oe-red" data-testid="translate-dialog-error">
              {T.error}
            </p>
          )}
          {!loading && !error && translated && (
            <p
              className="text-sm text-oe-black whitespace-pre-line break-words"
              data-testid="translate-dialog-result"
            >
              {translated}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={loading || error || !translated}
            data-testid="translate-dialog-copy"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                {T.copied}
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                {T.copy}
              </>
            )}
          </Button>
          <Button onClick={() => onOpenChange(false)}>{T.close}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
