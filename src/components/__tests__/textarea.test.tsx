import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Textarea } from "../textarea";

describe("Textarea", () => {
  it("renders a textarea element", () => {
    render(<Textarea placeholder="Write here" />);
    expect(screen.getByPlaceholderText("Write here")).toBeInTheDocument();
  });

  it("applies data-slot attribute", () => {
    render(<Textarea placeholder="test" />);
    const textarea = screen.getByPlaceholderText("test");
    expect(textarea).toHaveAttribute("data-slot", "textarea");
  });

  it("applies custom className", () => {
    render(<Textarea className="custom-class" placeholder="custom" />);
    const textarea = screen.getByPlaceholderText("custom");
    expect(textarea.className).toContain("custom-class");
  });
});
