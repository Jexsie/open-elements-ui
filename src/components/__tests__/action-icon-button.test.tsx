import { describe, it, expect, afterEach, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ActionIconButton } from "../action-icon-button.tsx";

afterEach(() => {
  cleanup();
});

describe("ActionIconButton", () => {
  it("renders children inside the button", () => {
    render(
      <ActionIconButton onClick={() => {}}>
        <svg data-testid="icon" />
      </ActionIconButton>,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(
      <ActionIconButton onClick={handleClick}>
        <svg />
      </ActionIconButton>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("stops propagation so parent click handlers do not fire", () => {
    const parentHandler = vi.fn();
    render(
      <div onClick={parentHandler}>
        <ActionIconButton onClick={() => {}}>
          <svg />
        </ActionIconButton>
      </div>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(parentHandler).not.toHaveBeenCalled();
  });

  it("sets title and aria-label when title is provided", () => {
    render(
      <ActionIconButton onClick={() => {}} title="Edit">
        <svg />
      </ActionIconButton>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("title", "Edit");
    expect(button).toHaveAttribute("aria-label", "Edit");
  });

  it("applies success tone class when tone is 'success'", () => {
    render(
      <ActionIconButton onClick={() => {}} tone="success">
        <svg />
      </ActionIconButton>,
    );
    expect(screen.getByRole("button").className).toContain("text-primary");
  });
});
