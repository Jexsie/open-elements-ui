import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CopyToClipboardButton } from "../copy-to-clipboard-button.tsx";

const writeText = vi.fn();
Object.assign(navigator, { clipboard: { writeText } });

beforeEach(() => {
  vi.useFakeTimers();
  writeText.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("CopyToClipboardButton", () => {
  it("renders the copy icon initially", () => {
    const { container } = render(<CopyToClipboardButton value="hello" />);
    expect(container.querySelector("svg.lucide-copy")).toBeInTheDocument();
    expect(container.querySelector("svg.lucide-check")).toBeNull();
  });

  it("writes the value to the clipboard when clicked", () => {
    render(<CopyToClipboardButton value="hello@example.com" />);
    fireEvent.click(screen.getByRole("button"));
    expect(writeText).toHaveBeenCalledWith("hello@example.com");
  });

  it("swaps to the check icon after clicking", () => {
    const { container } = render(<CopyToClipboardButton value="x" />);
    fireEvent.click(screen.getByRole("button"));
    expect(container.querySelector("svg.lucide-check")).toBeInTheDocument();
    expect(container.querySelector("svg.lucide-copy")).toBeNull();
  });

  it("reverts to the copy icon after the timeout", () => {
    const { container } = render(<CopyToClipboardButton value="x" />);
    fireEvent.click(screen.getByRole("button"));
    expect(container.querySelector("svg.lucide-check")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(container.querySelector("svg.lucide-copy")).toBeInTheDocument();
    expect(container.querySelector("svg.lucide-check")).toBeNull();
  });
});
