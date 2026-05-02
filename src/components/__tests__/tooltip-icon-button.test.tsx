import { describe, it, expect, afterEach, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Pencil, Trash2 } from "lucide-react";
import { TooltipIconButton } from "../tooltip-icon-button.tsx";
import { TooltipProvider } from "../tooltip.tsx";

function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

afterEach(() => {
  cleanup();
});

describe("TooltipIconButton", () => {
  it("renders the icon", () => {
    const { container } = renderWithTooltip(
      <TooltipIconButton icon={<Pencil />} tooltip="Edit" onClick={() => {}} />,
    );
    expect(container.querySelector("svg.lucide-pencil")).toBeInTheDocument();
  });

  it("uses the tooltip string as the button's accessible name", () => {
    renderWithTooltip(
      <TooltipIconButton icon={<Pencil />} tooltip="Edit user" onClick={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Edit user" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    renderWithTooltip(<TooltipIconButton icon={<Pencil />} tooltip="Edit" onClick={handleClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("stops click propagation so parent handlers do not fire", () => {
    const parentHandler = vi.fn();
    renderWithTooltip(
      <div onClick={parentHandler}>
        <TooltipIconButton icon={<Pencil />} tooltip="Edit" onClick={() => {}} />
      </div>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(parentHandler).not.toHaveBeenCalled();
  });

  it("applies the destructive tone class", () => {
    renderWithTooltip(
      <TooltipIconButton
        icon={<Trash2 />}
        tooltip="Delete"
        tone="destructive"
        onClick={() => {}}
      />,
    );
    expect(screen.getByRole("button").className).toContain("text-destructive");
  });

  it("applies the default (primary) tone class when tone is omitted", () => {
    renderWithTooltip(<TooltipIconButton icon={<Pencil />} tooltip="Edit" onClick={() => {}} />);
    expect(screen.getByRole("button").className).toContain("text-primary");
  });

  it("disables the button when disabled is true and does not fire onClick", () => {
    const handleClick = vi.fn();
    renderWithTooltip(
      <TooltipIconButton
        icon={<Trash2 />}
        tooltip="Cannot delete"
        disabled
        onClick={handleClick}
      />,
    );
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders the asChild element instead of a button when asChild is set", () => {
    const { container } = renderWithTooltip(
      <TooltipIconButton tooltip="Edit tag" asChild>
        <a href="/tags/123/edit">
          <Pencil />
        </a>
      </TooltipIconButton>,
    );
    const anchor = container.querySelector("a");
    expect(anchor).toHaveAttribute("href", "/tags/123/edit");
    expect(anchor).toHaveAttribute("aria-label", "Edit tag");
    expect(anchor?.querySelector("svg.lucide-pencil")).toBeInTheDocument();
  });
});
