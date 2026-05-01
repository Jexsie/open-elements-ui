import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

// Mock TipTap before importing the component
vi.mock("@tiptap/react", () => ({
  useEditor: () => null,
  EditorContent: () => <div data-testid="editor-content" />,
}));
vi.mock("@tiptap/starter-kit", () => ({ default: { configure: () => ({}) } }));
vi.mock("@tiptap/extension-link", () => ({ default: { configure: () => ({}) } }));
vi.mock("@tiptap/extension-placeholder", () => ({ default: { configure: () => ({}) } }));
vi.mock("tiptap-markdown", () => ({ Markdown: {} }));

import { MarkdownEditor } from "../markdown-editor.tsx";

afterEach(cleanup);

describe("MarkdownEditor", () => {
  it("mounts without error", () => {
    const { container } = render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(container).toBeTruthy();
  });

  it("renders editor content area", () => {
    const { container } = render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(container.querySelector("[data-testid='editor-content']")).toBeTruthy();
  });

  it("accepts placeholder prop without error", () => {
    const { container } = render(
      <MarkdownEditor value="" onChange={() => {}} placeholder="Type here..." />,
    );
    expect(container).toBeTruthy();
  });
});
