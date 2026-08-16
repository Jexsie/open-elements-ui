import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, waitFor, within } from "@testing-library/react";
import type { Editor } from "@tiptap/core";
import type { MarkdownToolbarAction } from "../../types/index.ts";
import { MarkdownEditor } from "../markdown-editor.tsx";

afterEach(cleanup);

/** Accessible names of the toolbar buttons, in DOM order. */
function toolbarButtonNames(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("button[aria-label]")).map(
    (b) => b.getAttribute("aria-label") ?? "",
  );
}

function dispatchKey(editor: Editor, init: KeyboardEventInit): void {
  editor.view.dom.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }),
  );
}

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

describe("MarkdownEditor — toolbar rendering", () => {
  it("renders exactly the declared actions and nothing else", async () => {
    const { container } = render(
      <MarkdownEditor value={"x"} onChange={() => {}} toolbar={["bold", "taskList", "link"]} />,
    );
    await waitForEditor(container);
    expect(toolbarButtonNames(container)).toEqual(["Bold", "Task list", "Link"]);
  });

  it("renders the buttons in the order of the array", async () => {
    const { container } = render(
      <MarkdownEditor value={"x"} onChange={() => {}} toolbar={["link", "bold"]} />,
    );
    await waitForEditor(container);
    expect(toolbarButtonNames(container)).toEqual(["Link", "Bold"]);
  });

  it("defaults to exactly Bold and Italic when the prop is omitted", async () => {
    const { container } = render(<MarkdownEditor value={"plain"} onChange={() => {}} />);
    await waitForEditor(container);
    expect(toolbarButtonNames(container)).toEqual(["Bold", "Italic"]);
  });

  it("renders no toolbar element for an empty array", async () => {
    const { container } = render(<MarkdownEditor value={"x"} onChange={() => {}} toolbar={[]} />);
    await waitForEditor(container);
    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(container.querySelector(".border-b")).toBeNull();
  });

  it("renders a duplicated action only once", async () => {
    const { container } = render(
      <MarkdownEditor value={"x"} onChange={() => {}} toolbar={["bold", "bold"]} />,
    );
    await waitForEditor(container);
    expect(toolbarButtonNames(container)).toEqual(["Bold"]);
  });
});

describe("MarkdownEditor — executing actions", () => {
  it("transforms the current block with a heading action", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <MarkdownEditor value={"Title"} onChange={onChange} toolbar={["h2"]} />,
    );
    const editor = await waitForEditor(container);
    editor.commands.focus("end");
    within(container).getByRole("button", { name: "Heading 2" }).click();
    await waitFor(() => expect(onChange.mock.calls.at(-1)?.[0]).toBe("## Title"));
  });

  it("wraps the current block with a list action", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <MarkdownEditor value={"Call Anna"} onChange={onChange} toolbar={["taskList"]} />,
    );
    const editor = await waitForEditor(container);
    editor.commands.focus("end");
    within(container).getByRole("button", { name: "Task list" }).click();
    await waitFor(() => expect(onChange.mock.calls.at(-1)?.[0]).toBe("- [ ] Call Anna"));
  });

  it("marks an active action as pressed", async () => {
    const { container } = render(
      <MarkdownEditor value={"**bold**"} onChange={() => {}} toolbar={["bold"]} />,
    );
    const editor = await waitForEditor(container);
    // Set the selection without focus(): focus() scrolls into view, which needs
    // getClientRects — unavailable in jsdom. The toolbar still re-renders on the
    // selection transaction.
    editor.commands.setTextSelection(3);
    await waitFor(() => {
      const bold = within(container).getByRole("button", { name: "Bold" });
      expect(bold.getAttribute("aria-pressed")).toBe("true");
    });
  });

  it("shows a contextual Unlink button only while the cursor is in a link", async () => {
    const { container } = render(
      <MarkdownEditor
        value={"[the offer](https://example.com) and text"}
        onChange={() => {}}
        toolbar={["link"]}
      />,
    );
    const editor = await waitForEditor(container);

    editor.commands.setTextSelection(3);
    await waitFor(() => expect(toolbarButtonNames(container)).toContain("Remove link"));

    // Move the cursor out of the link (to the end of the plain text).
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);
    await waitFor(() => expect(toolbarButtonNames(container)).not.toContain("Remove link"));
  });
});

describe("MarkdownEditor — marks are gated at the button only", () => {
  it("still bolds via Mod-b when the Bold button is absent", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <MarkdownEditor value={"hello"} onChange={onChange} toolbar={["italic"]} />,
    );
    const editor = await waitForEditor(container);
    expect(toolbarButtonNames(container)).toEqual(["Italic"]);
    editor.commands.selectAll();
    dispatchKey(editor, { key: "b", code: "KeyB", ctrlKey: true });
    await waitFor(() => expect(onChange.mock.calls.at(-1)?.[0]).toBe("**hello**"));
  });

  // The typing/input-rule variant is verified at the extension level
  // (markdown-extensions.test.ts) where literal content can be injected without
  // the component's markdown parsing rewriting the incomplete `**bold*` on load.
});

describe("MarkdownEditor — accessibility", () => {
  it("gives every button a matching aria-label and title", async () => {
    const ALL: readonly MarkdownToolbarAction[] = [
      "bold",
      "italic",
      "strike",
      "code",
      "link",
      "h1",
      "h2",
      "h3",
      "bulletList",
      "orderedList",
      "taskList",
      "blockquote",
      "codeBlock",
      "horizontalRule",
    ];
    const { container } = render(<MarkdownEditor value={"x"} onChange={() => {}} toolbar={ALL} />);
    await waitForEditor(container);
    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons).toHaveLength(ALL.length);
    for (const button of buttons) {
      const label = button.getAttribute("aria-label");
      expect(label).toBeTruthy();
      expect(button.getAttribute("title")).toBe(label);
      expect(within(container).getByRole("button", { name: label as string })).toBe(button);
    }
  });
});

describe("MarkdownEditor — rendering is independent of the toolbar", () => {
  it("renders undeclared constructs as structure", async () => {
    const { container } = render(
      <MarkdownEditor
        value={"# Heading\n\n> quote\n\n- [ ] task"}
        onChange={() => {}}
        toolbar={["bold"]}
      />,
    );
    await waitForEditor(container);
    expect(container.querySelector("h1")).toBeTruthy();
    expect(container.querySelector("blockquote")).toBeTruthy();
    expect(container.querySelector("input[type=checkbox]")).toBeTruthy();
  });
});
