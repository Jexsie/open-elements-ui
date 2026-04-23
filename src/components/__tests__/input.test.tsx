import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "../input";

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
  });

  it("applies data-slot attribute", () => {
    render(<Input placeholder="test" />);
    const input = screen.getByPlaceholderText("test");
    expect(input).toHaveAttribute("data-slot", "input");
  });

  it("accepts type prop", () => {
    render(<Input type="email" placeholder="email" />);
    const input = screen.getByPlaceholderText("email");
    expect(input).toHaveAttribute("type", "email");
  });

  it("applies custom className", () => {
    render(<Input className="custom-class" placeholder="custom" />);
    const input = screen.getByPlaceholderText("custom");
    expect(input.className).toContain("custom-class");
  });
});
