import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import type { Editor } from "@tiptap/core";
import { MarkdownEditor } from "../markdown-editor.tsx";

afterEach(cleanup);

/** The rendered ProseMirror element carries a back-reference to the live editor. */
function getEditor(container: HTMLElement): Editor {
  const dom = container.querySelector(".ProseMirror") as (HTMLElement & { editor?: Editor }) | null;
  if (!dom?.editor) throw new Error("editor not mounted yet");
  return dom.editor;
}

async function waitForEditor(container: HTMLElement): Promise<Editor> {
  await waitFor(() => expect(container.querySelector(".ProseMirror")).toBeTruthy());
  return getEditor(container);
}

describe("MarkdownEditor — no corruption on open", () => {
  it("does not call onChange when opened with content it used to strip", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <MarkdownEditor value={"- [x] Write the press release"} onChange={onChange} />,
    );
    await waitForEditor(container);
    // Give the sync effect a chance to run before asserting nothing fired.
    await waitFor(() => {
      expect(getEditor(container).storage.markdown.getMarkdown()).toBe(
        "- [x] Write the press release",
      );
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reports the full document, task list intact, when the paragraph is edited", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <MarkdownEditor value={"- [x] Task\n\nHello"} onChange={onChange} />,
    );
    const editor = await waitForEditor(container);
    onChange.mockClear();

    // Type a character at the end of the paragraph — same onUpdate path as a keystroke.
    editor.chain().focus("end").insertContent("X").run();

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const reported = onChange.mock.calls.at(-1)?.[0] as string;
    expect(reported).toContain("- [x] Task");
    expect(reported).toContain("HelloX");
  });

  it("replaces the document when the parent passes a different value", async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <MarkdownEditor value={"# First"} onChange={onChange} />,
    );
    const editor = await waitForEditor(container);
    await waitFor(() => expect(editor.storage.markdown.getMarkdown()).toBe("# First"));

    rerender(<MarkdownEditor value={"# Second"} onChange={onChange} />);
    await waitFor(() => expect(editor.storage.markdown.getMarkdown()).toBe("# Second"));
  });
});

describe("MarkdownEditor — toolbar", () => {
  it("offers exactly Bold, Italic, Strikethrough and Link by default", async () => {
    const { container } = render(<MarkdownEditor value={"plain"} onChange={() => {}} />);
    await waitForEditor(container);
    const titles = Array.from(container.querySelectorAll("button[title]")).map((b) =>
      b.getAttribute("title"),
    );
    expect(titles).toEqual(["Bold", "Italic", "Strikethrough", "Link"]);
    expect(titles).not.toContain("Remove link");
  });

  it("adds Unlink only while the cursor sits in a link", async () => {
    const { container } = render(
      <MarkdownEditor value={"[the offer](https://example.com)"} onChange={() => {}} />,
    );
    const editor = await waitForEditor(container);
    // Move the selection into the link text.
    editor.chain().focus().setTextSelection(3).run();
    await waitFor(() => {
      const titles = Array.from(container.querySelectorAll("button[title]")).map((b) =>
        b.getAttribute("title"),
      );
      expect(titles).toContain("Remove link");
    });
  });
});
