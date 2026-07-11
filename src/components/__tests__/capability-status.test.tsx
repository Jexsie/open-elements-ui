import { describe, it, expect, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CapabilityStatus } from "../capability-status.tsx";
import { TooltipProvider } from "../tooltip.tsx";

function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>);
}

afterEach(() => {
  cleanup();
});

describe("CapabilityStatus", () => {
  it("renders a green indicator and the available text when available", () => {
    const { container } = renderWithTooltip(
      <CapabilityStatus
        available
        label="HEIC image decoding"
        availableText="Available"
        unavailableText="Not available"
      />,
    );

    expect(screen.getByText("HEIC image decoding")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();

    const icon = container.querySelector("svg.lucide-circle-check");
    expect(icon).toBeInTheDocument();
    expect(icon?.getAttribute("class")).toContain("text-oe-green");
  });

  it("renders a red warning indicator and the unavailable text when not available", () => {
    const { container } = renderWithTooltip(
      <CapabilityStatus
        available={false}
        label="HEIC image decoding"
        availableText="Available"
        unavailableText="Not available"
        hint="HEIC uploads will be rejected with 415 — check Dockerfile"
      />,
    );

    expect(screen.getByText("Not available")).toBeInTheDocument();

    const icon = container.querySelector("svg.lucide-triangle-alert");
    expect(icon).toBeInTheDocument();
    expect(icon?.getAttribute("class")).toContain("text-oe-red");
  });

  it("exposes the hint as a tooltip when a hint is provided", async () => {
    renderWithTooltip(
      <CapabilityStatus
        available={false}
        label="HEIC image decoding"
        availableText="Available"
        unavailableText="Not available"
        hint="HEIC uploads will be rejected with 415 — check Dockerfile"
      />,
    );

    const trigger = screen.getByRole("note");
    fireEvent.focus(trigger);

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("HEIC uploads will be rejected with 415 — check Dockerfile");
  });

  it("renders without a tooltip trigger and does not error when no hint is provided", () => {
    renderWithTooltip(
      <CapabilityStatus
        available
        label="HEIC image decoding"
        availableText="Available"
        unavailableText="Not available"
      />,
    );

    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(screen.getByText("HEIC image decoding")).toBeInTheDocument();
  });
});
