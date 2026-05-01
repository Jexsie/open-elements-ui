import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

// Mock TipTap before importing the component
vi.mock("@tiptap/react", () => ({
  useEditor: () => null,
  EditorContent: () => <div data-testid="editor-content" />,
}));
vi.mock("@tiptap/starter-kit", () => ({ default: { configure: () => ({}) } }));
vi.mock("@tiptap/extension-link", () => ({ default: { configure: () => ({}) } }));
vi.mock("tiptap-markdown", () => ({ Markdown: {} }));

import { MarkdownView } from "../markdown-view.tsx";

afterEach(cleanup);

describe("MarkdownView", () => {
  it("mounts without error", () => {
    const { container } = render(<MarkdownView content="" />);
    expect(container).toBeTruthy();
  });

  it("renders editor content area", () => {
    const { container } = render(<MarkdownView content="Hello world" />);
    expect(container.querySelector("[data-testid='editor-content']")).toBeTruthy();
  });

  it("accepts markdown content without error", () => {
    const { container } = render(
      <MarkdownView content="Hello **bold** and *italic*" />,
    );
    expect(container).toBeTruthy();
  });
});
