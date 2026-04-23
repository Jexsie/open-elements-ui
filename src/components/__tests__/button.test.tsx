import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "../button";

describe("Button", () => {
  it("renders with children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    render(<Button>Default</Button>);
    const button = screen.getByText("Default");
    expect(button).toHaveAttribute("data-variant", "default");
    expect(button).toHaveAttribute("data-size", "default");
  });

  it("applies destructive variant", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByText("Delete");
    expect(button).toHaveAttribute("data-variant", "destructive");
  });

  it("applies custom className", () => {
    render(<Button className="my-custom-class">Custom</Button>);
    const button = screen.getByText("Custom");
    expect(button.className).toContain("my-custom-class");
  });

  it("renders as button element by default", () => {
    render(<Button>Normal</Button>);
    const button = screen.getByText("Normal");
    expect(button.tagName).toBe("BUTTON");
  });

  it("sets data-slot attribute", () => {
    render(<Button>Slot</Button>);
    const button = screen.getByText("Slot");
    expect(button).toHaveAttribute("data-slot", "button");
  });
});
