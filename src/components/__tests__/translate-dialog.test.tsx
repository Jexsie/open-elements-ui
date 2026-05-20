import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent, act } from "@testing-library/react";
import { TranslateDialog, type TranslateResult } from "../translate-dialog.tsx";
import { LanguageProvider } from "../../i18n/language-context.tsx";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const T = {
  title: "Translation",
  loading: "Translating…",
  error: "Translation failed",
  copy: "Copy",
  copied: "Copied!",
  close: "Close",
} as const;

const dummyTranslations = { de: {}, en: {} } as const;

function renderDialog(props: {
  readonly open: boolean;
  readonly sourceText?: string;
  readonly onTranslate?: (text: string, lang: string) => Promise<TranslateResult>;
  readonly onOpenChange?: (open: boolean) => void;
  readonly language?: "de" | "en";
}) {
  const onTranslate =
    props.onTranslate ?? vi.fn().mockResolvedValue({ translatedText: "Hello" });
  const onOpenChange = props.onOpenChange ?? vi.fn();
  const utils = render(
    <LanguageProvider translations={dummyTranslations} defaultLanguage={props.language ?? "en"}>
      <TranslateDialog
        open={props.open}
        onOpenChange={onOpenChange}
        sourceText={props.sourceText ?? "Hallo"}
        onTranslate={onTranslate}
        translations={T}
      />
    </LanguageProvider>,
  );
  return { ...utils, onTranslate, onOpenChange };
}

describe("TranslateDialog", () => {
  it("calls onTranslate once with the current language and renders the result", async () => {
    const onTranslate = vi.fn().mockResolvedValue({ translatedText: "Hello world" });
    renderDialog({ open: true, sourceText: "Hallo Welt", onTranslate, language: "en" });
    expect(onTranslate).toHaveBeenCalledTimes(1);
    expect(onTranslate).toHaveBeenCalledWith("Hallo Welt", "en");
    expect(screen.getByTestId("translate-dialog-loading")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("translate-dialog-result")).toHaveTextContent("Hello world");
    });
  });

  it("uses 'de' as target when the language provider is set to de", () => {
    const onTranslate = vi.fn().mockResolvedValue({ translatedText: "x" });
    renderDialog({ open: true, onTranslate, language: "de" });
    expect(onTranslate).toHaveBeenCalledWith("Hallo", "de");
  });

  it("uses 'en' as target for any non-de language", () => {
    const onTranslate = vi.fn().mockResolvedValue({ translatedText: "x" });
    renderDialog({ open: true, onTranslate, language: "en" });
    expect(onTranslate).toHaveBeenCalledWith("Hallo", "en");
  });

  it("renders the error message when onTranslate rejects", async () => {
    const onTranslate = vi.fn().mockRejectedValue(new Error("boom"));
    renderDialog({ open: true, onTranslate });
    await waitFor(() => {
      expect(screen.getByTestId("translate-dialog-error")).toHaveTextContent(T.error);
    });
    expect(screen.getByTestId("translate-dialog-copy")).toBeDisabled();
  });

  it("does not call onTranslate when open is false", () => {
    const onTranslate = vi.fn();
    renderDialog({ open: false, onTranslate });
    expect(onTranslate).not.toHaveBeenCalled();
    expect(screen.queryByTestId("translate-dialog-loading")).toBeNull();
  });

  it("copies to clipboard and flips the label to 'copied'", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const onTranslate = vi.fn().mockResolvedValue({ translatedText: "Hello" });
    renderDialog({ open: true, onTranslate });

    await waitFor(() => {
      expect(screen.getByTestId("translate-dialog-result")).toBeInTheDocument();
    });

    const copyBtn = screen.getByTestId("translate-dialog-copy");
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(writeText).toHaveBeenCalledWith("Hello");
    await waitFor(() => {
      expect(copyBtn).toHaveTextContent(T.copied);
    });
  });
});
