import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { TranslateButton } from "../translate-button.tsx";
import { LanguageProvider } from "../../i18n/language-context.tsx";
import { TooltipProvider } from "../tooltip.tsx";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const T = {
  button: "Translate",
  dialog: {
    title: "Translation",
    loading: "Translating…",
    error: "Translation failed",
    copy: "Copy",
    copied: "Copied!",
    close: "Close",
  },
} as const;

const dummyTranslations = { de: {}, en: {} } as const;

function renderButton(props: {
  readonly text: string | null | undefined;
  readonly configured: boolean | null;
  readonly size?: "sm" | "md";
}) {
  const onTranslate = vi.fn().mockResolvedValue({ translatedText: "Hello" });
  const utils = render(
    <LanguageProvider translations={dummyTranslations} defaultLanguage="en">
      <TooltipProvider>
        <TranslateButton
          text={props.text}
          size={props.size}
          configured={props.configured}
          onTranslate={onTranslate}
          translations={T}
        />
      </TooltipProvider>
    </LanguageProvider>,
  );
  return { ...utils, onTranslate };
}

describe("TranslateButton", () => {
  it("renders null when text is empty", () => {
    renderButton({ text: "", configured: true });
    expect(screen.queryByTestId("translate-button")).toBeNull();
  });

  it("renders null when text is whitespace", () => {
    renderButton({ text: "   ", configured: true });
    expect(screen.queryByTestId("translate-button")).toBeNull();
  });

  it("renders null when text is null", () => {
    renderButton({ text: null, configured: true });
    expect(screen.queryByTestId("translate-button")).toBeNull();
  });

  it("renders null while configured is still null (probe in flight)", () => {
    renderButton({ text: "something", configured: null });
    expect(screen.queryByTestId("translate-button")).toBeNull();
  });

  it("renders null when configured is false", () => {
    renderButton({ text: "something", configured: false });
    expect(screen.queryByTestId("translate-button")).toBeNull();
  });

  it("renders the button when text is non-empty and configured is true", () => {
    renderButton({ text: "something", configured: true });
    const button = screen.getByTestId("translate-button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", T.button);
  });

  it("uses size='sm' classes when size is 'sm'", () => {
    renderButton({ text: "x", configured: true, size: "sm" });
    const icon = screen.getByTestId("translate-button").querySelector("svg");
    expect(icon).toHaveClass("h-3.5", "w-3.5");
  });

  it("uses size='md' (default) classes when size is omitted", () => {
    renderButton({ text: "x", configured: true });
    const icon = screen.getByTestId("translate-button").querySelector("svg");
    expect(icon).toHaveClass("h-4", "w-4");
  });

  it("opens the dialog on click with sourceText equal to the button text", () => {
    const { onTranslate } = renderButton({ text: "Hallo", configured: true });
    fireEvent.click(screen.getByTestId("translate-button"));
    expect(onTranslate).toHaveBeenCalledWith("Hallo", "en");
  });
});
