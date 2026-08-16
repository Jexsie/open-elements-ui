import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup, waitFor, fireEvent } from "@testing-library/react";
import type { Editor } from "@tiptap/core";
import { MarkdownView } from "../markdown-view.tsx";

afterEach(cleanup);

async function renderView(content: string, onChange?: (md: string) => void | Promise<void>) {
  const result = render(<MarkdownView content={content} onChange={onChange} />);
  await waitFor(() => expect(result.container.querySelector(".ProseMirror")).toBeTruthy());
  return result;
}

function checkboxes(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll<HTMLInputElement>("input[type=checkbox]"));
}

/** Toggle a checkbox to `to` and fire the change event the node view listens for. */
function toggle(input: HTMLInputElement, to: boolean): void {
  input.checked = to;
  fireEvent.change(input);
}

function getEditor(container: HTMLElement): Editor {
  const dom = container.querySelector(".ProseMirror") as (HTMLElement & { editor?: Editor }) | null;
  if (!dom?.editor) throw new Error("editor not mounted");
  return dom.editor;
}

/** A promise whose settlement is controlled by the test. */
function deferred(): { promise: Promise<void>; resolve: () => void; reject: () => void } {
  let resolve!: () => void;
  let reject!: () => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = () => rej(new Error("save failed"));
  });
  return { promise, resolve, reject };
}

describe("MarkdownView — rendering (read-only)", () => {
  it("renders structural Markdown as structure, not plain paragraphs", async () => {
    const { container } = await renderView("# Title\n\n- a\n- b\n\n> quote");
    expect(container.querySelector("h1")).toBeTruthy();
    expect(container.querySelector("ul")).toBeTruthy();
    expect(container.querySelector("blockquote")).toBeTruthy();
  });

  it("reflects the stored checked state without an onChange prop", async () => {
    const { container } = await renderView("- [x] Done\n- [ ] Open");
    const boxes = checkboxes(container);
    expect(boxes).toHaveLength(2);
    expect(boxes[0].checked).toBe(true);
    expect(boxes[1].checked).toBe(false);
  });

  it("reverts a click and leaves the document unchanged without onChange", async () => {
    const { container } = await renderView("- [ ] Open item");
    const before = getEditor(container).storage.markdown.getMarkdown();
    toggle(checkboxes(container)[0], true);
    await waitFor(() => expect(checkboxes(container)[0].checked).toBe(false));
    expect(getEditor(container).storage.markdown.getMarkdown()).toBe(before);
  });

  it("suppresses the prose bullet on the task list", async () => {
    const { container } = await renderView("- [x] Done\n- [ ] Open");
    const list = container.querySelector('[data-type="taskList"]');
    expect(list?.classList.contains("list-none")).toBe(true);
    expect(list?.classList.contains("pl-0")).toBe(true);
  });
});

describe("MarkdownView — toggling with onChange", () => {
  it("reports the full updated Markdown when ticking", async () => {
    const onChange = vi.fn();
    const { container } = await renderView("- [ ] Call Anna\n- [ ] Send offer", onChange);
    toggle(checkboxes(container)[0], true);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange).toHaveBeenCalledWith("- [x] Call Anna\n- [ ] Send offer");
  });

  it("reports the full updated Markdown when unticking", async () => {
    const onChange = vi.fn();
    const { container } = await renderView("- [x] Call Anna", onChange);
    toggle(checkboxes(container)[0], false);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange).toHaveBeenCalledWith("- [ ] Call Anna");
  });

  it("flips the checkbox immediately, before the Promise settles", async () => {
    const gate = deferred();
    const { container } = await renderView("- [ ] Task", () => gate.promise);
    toggle(checkboxes(container)[0], true);
    await waitFor(() => expect(checkboxes(container)[0].checked).toBe(true));
    gate.resolve();
  });

  it("changes only the clicked item in a mixed document", async () => {
    const onChange = vi.fn();
    // A paragraph separates the bullet list from the task list: a bullet list
    // directly adjacent to a task list serializes with a phantom empty task
    // item (a pre-existing round-trip quirk unrelated to this spec).
    const content = "# Title\n\nSome text\n\n- one\n- two\n\nMore\n\n- [ ] a\n- [ ] b\n- [ ] c";
    const { container } = await renderView(content, onChange);
    const before = getEditor(container).storage.markdown.getMarkdown();
    // The three task checkboxes are the only ones in the document.
    toggle(checkboxes(container)[1], true);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    const reported = onChange.mock.calls[0][0] as string;
    expect(reported).not.toBe(before);
    expect(reported).toContain("- [x] b");
    expect(reported).toContain("- [ ] a");
    expect(reported).toContain("- [ ] c");
    expect(reported.match(/\[x\]/g)).toHaveLength(1);
    expect(reported).toContain("# Title");
    expect(reported).toContain("- one");
  });

  it("changes only the nested item, keeping indentation", async () => {
    const onChange = vi.fn();
    const { container } = await renderView("- [ ] parent\n  - [ ] child", onChange);
    toggle(checkboxes(container)[1], true);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(onChange).toHaveBeenCalledWith("- [ ] parent\n  - [x] child");
  });
});

describe("MarkdownView — busy state", () => {
  it("disables and mutes every checkbox while a save is pending", async () => {
    const gate = deferred();
    const { container } = await renderView("- [ ] a\n- [ ] b", () => gate.promise);
    toggle(checkboxes(container)[0], true);
    await waitFor(() => {
      const boxes = checkboxes(container);
      expect(boxes.every((b) => b.disabled)).toBe(true);
    });
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    gate.resolve();
  });

  it("ignores a second click during a pending save", async () => {
    const gate = deferred();
    const onChange = vi.fn(() => gate.promise);
    const { container } = await renderView("- [ ] a\n- [ ] b", onChange);
    toggle(checkboxes(container)[0], true);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    // Second click while busy.
    toggle(checkboxes(container)[1], true);
    await waitFor(() => expect(checkboxes(container)[1].checked).toBe(false));
    expect(onChange).toHaveBeenCalledTimes(1);
    gate.resolve();
  });

  it("re-enables interaction after the Promise resolves", async () => {
    const gate = deferred();
    const { container } = await renderView("- [ ] a\n- [ ] b", () => gate.promise);
    toggle(checkboxes(container)[0], true);
    await waitFor(() => expect(checkboxes(container).every((b) => b.disabled)).toBe(true));
    gate.resolve();
    await waitFor(() => expect(checkboxes(container).some((b) => b.disabled)).toBe(false));
    expect(checkboxes(container)[0].checked).toBe(true);
  });

  it("stays interactive when onChange returns void", async () => {
    const onChange = vi.fn(() => undefined);
    const { container } = await renderView("- [ ] a\n- [ ] b", onChange);
    toggle(checkboxes(container)[0], true);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(checkboxes(container).every((b) => b.disabled)).toBe(false);
    toggle(checkboxes(container)[1], true);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
  });
});

describe("MarkdownView — failure and rollback", () => {
  it("reverts the document when the save rejects", async () => {
    const gate = deferred();
    const { container } = await renderView("- [ ] Call Anna", () => gate.promise);
    toggle(checkboxes(container)[0], true);
    await waitFor(() => expect(checkboxes(container)[0].checked).toBe(true));
    gate.reject();
    await waitFor(() => expect(checkboxes(container)[0].checked).toBe(false));
    expect(getEditor(container).storage.markdown.getMarkdown()).toBe("- [ ] Call Anna");
  });

  it("re-enables interaction after a rejection", async () => {
    const first = deferred();
    const onChange = vi.fn(() => first.promise);
    const { container } = await renderView("- [ ] a", onChange);
    toggle(checkboxes(container)[0], true);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    first.reject();
    await waitFor(() => expect(checkboxes(container)[0].disabled).toBe(false));
    // A fresh click is accepted.
    toggle(checkboxes(container)[0], true);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
  });

  it("reverts only the failed change after a prior success", async () => {
    const gates = [deferred(), deferred()];
    let call = 0;
    const onChange = vi.fn(() => gates[call++].promise);
    const { container } = await renderView("- [ ] a\n- [ ] b", onChange);

    toggle(checkboxes(container)[0], true);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    gates[0].resolve();
    await waitFor(() => expect(checkboxes(container)[0].disabled).toBe(false));

    toggle(checkboxes(container)[1], true);
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
    gates[1].reject();
    // Reverts to the state after the first toggle: a checked, b unchecked.
    await waitFor(() =>
      expect(getEditor(container).storage.markdown.getMarkdown()).toBe("- [x] a\n- [ ] b"),
    );
  });
});

describe("MarkdownView — content prop interaction", () => {
  it("does not rebuild the document when content merely echoes the report", async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <MarkdownView content={"- [ ] a"} onChange={onChange} />,
    );
    await waitFor(() => expect(container.querySelector(".ProseMirror")).toBeTruthy());
    toggle(checkboxes(container)[0], true);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith("- [x] a"));
    const domBefore = container.querySelector(".ProseMirror");
    // Parent echoes exactly what was reported.
    rerender(<MarkdownView content={"- [x] a"} onChange={onChange} />);
    await waitFor(() => expect(checkboxes(container)[0].checked).toBe(true));
    // Same editor DOM node — not torn down and rebuilt.
    expect(container.querySelector(".ProseMirror")).toBe(domBefore);
  });

  it("replaces the document when content genuinely differs", async () => {
    const { container, rerender } = render(<MarkdownView content={"# First"} />);
    await waitFor(() => expect(container.querySelector(".ProseMirror")).toBeTruthy());
    const editor = getEditor(container);
    rerender(<MarkdownView content={"# Second"} />);
    await waitFor(() => expect(editor.storage.markdown.getMarkdown()).toBe("# Second"));
  });

  it("lets a content change during a pending save win over the rollback", async () => {
    const gate = deferred();
    const { container, rerender } = render(
      <MarkdownView content={"- [ ] a"} onChange={() => gate.promise} />,
    );
    await waitFor(() => expect(container.querySelector(".ProseMirror")).toBeTruthy());
    const editor = getEditor(container);
    toggle(checkboxes(container)[0], true);
    await waitFor(() => expect(checkboxes(container)[0].checked).toBe(true));
    // A genuinely different value arrives while the save is pending.
    rerender(<MarkdownView content={"- [ ] a\n- [ ] c"} onChange={() => gate.promise} />);
    await waitFor(() => expect(editor.storage.markdown.getMarkdown()).toBe("- [ ] a\n- [ ] c"));
    gate.reject();
    await waitFor(() => expect(editor.storage.markdown.getMarkdown()).toBe("- [ ] a\n- [ ] c"));
  });
});

describe("MarkdownView — edge cases", () => {
  it("never calls onChange for content without a task list", async () => {
    const onChange = vi.fn();
    const { container } = await renderView("# Heading\n\nJust text", onChange);
    expect(checkboxes(container)).toHaveLength(0);
    fireEvent.click(container.querySelector("h1") as HTMLElement);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders nothing interactive for empty content", async () => {
    const onChange = vi.fn();
    const { container } = await renderView("", onChange);
    expect(checkboxes(container)).toHaveLength(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps text non-editable", async () => {
    const onChange = vi.fn();
    const { container } = await renderView("Just a paragraph", onChange);
    const pm = container.querySelector(".ProseMirror") as HTMLElement;
    expect(pm.getAttribute("contenteditable")).toBe("false");
    expect(onChange).not.toHaveBeenCalled();
  });
});
