import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ExternalLinkButton } from "../external-link-button.tsx";

const openSpy = vi.fn();

beforeEach(() => {
  openSpy.mockClear();
  vi.spyOn(window, "open").mockImplementation(openSpy);
});

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

describe("ExternalLinkButton", () => {
  it("renders the external-link icon", () => {
    const { container } = render(<ExternalLinkButton href="https://example.com" />);
    expect(container.querySelector("svg.lucide-external-link")).toBeInTheDocument();
  });

  it("opens the URL in a new tab with noopener,noreferrer on click", () => {
    render(<ExternalLinkButton href="https://example.com" />);
    fireEvent.click(screen.getByRole("button"));
    expect(openSpy).toHaveBeenCalledWith("https://example.com", "_blank", "noopener,noreferrer");
  });
});
