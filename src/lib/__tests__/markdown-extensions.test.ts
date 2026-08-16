import { describe, it, expect, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import { createMarkdownExtensions } from "../markdown-extensions.ts";

/**
 * Serialize `input` through a real editor built from the shared factory and
 * return the Markdown the document produces. This is exactly the pipeline the
 * components use, so what these tests verify is what ships.
 */
function roundTrip(input: string): string {
  const editor = new Editor({ extensions: createMarkdownExtensions(), content: input });
  const markdown = editor.storage.markdown.getMarkdown();
  editor.destroy();
  return markdown;
}

let editors: Editor[] = [];

afterEach(() => {
  editors.forEach((e) => e.destroy());
  editors = [];
});

describe("createMarkdownExtensions — round-trip", () => {
  it("keeps a task list unchanged, including the [x] and [ ] markers", () => {
    const input = "- [x] Write the press release\n- [ ] Send invitations";
    expect(roundTrip(input)).toBe(input);
  });

  it("keeps a bullet list unchanged", () => {
    const input = "- Milk\n- Bread";
    expect(roundTrip(input)).toBe(input);
  });

  it("keeps an ordered list unchanged", () => {
    const input = "1. First\n2. Second";
    expect(roundTrip(input)).toBe(input);
  });

  it("keeps headings at every level H1–H6", () => {
    const input = "# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6";
    expect(roundTrip(input)).toBe(input);
  });

  it("keeps a blockquote, a fenced code block with a language tag, and a rule", () => {
    const input = "> A wise quote\n\n```js\nconst x = 1;\n```\n\n---";
    const out = roundTrip(input);
    expect(out).toBe(input);
    expect(out).toContain("> A wise quote");
    expect(out).toContain("```js\nconst x = 1;\n```");
    expect(out).toContain("---");
  });

  it("keeps a nested task list, preserving indentation and nesting level", () => {
    const input = "- [ ] parent\n  - [ ] child";
    expect(roundTrip(input)).toBe(input);
  });

  it("keeps marks inside blocks — bold and links survive", () => {
    const input = "- [x] Call **Anna** about [the offer](https://example.com)";
    expect(roundTrip(input)).toBe(input);
  });

  it("keeps both kinds of items in a mixed list", () => {
    const out = roundTrip("- [x] Done\n- Just an item");
    // A checklist item and a plain item cannot share one node, so the serializer
    // splits them; byte-identity is not promised, but nothing may be dropped.
    expect(out).toContain("- [x] Done");
    expect(out).toContain("- Just an item");
  });

  it("does not grow a trailing paragraph after a code block", () => {
    const input = "intro\n\n```js\nconst y = 2;\n```";
    expect(roundTrip(input)).toBe(input);
  });

  it("does not grow a trailing paragraph after a horizontal rule", () => {
    const input = "intro\n\n---";
    expect(roundTrip(input)).toBe(input);
  });

  it("produces empty Markdown for empty content", () => {
    expect(roundTrip("")).toBe("");
  });

  it("keeps an unchecked-only task list and does not normalise the marker", () => {
    const input = "- [ ] Open item";
    const out = roundTrip(input);
    expect(out).toBe(input);
    expect(out).not.toContain("[x]");
  });

  it("leaves plain text byte-identical", () => {
    const input = "Just a plain paragraph with no markdown.";
    expect(roundTrip(input)).toBe(input);
  });

  it("shows the placeholder when one is configured and the document is empty", () => {
    const editor = new Editor({
      extensions: createMarkdownExtensions({ placeholder: "Type here..." }),
      content: "",
    });
    editors.push(editor);
    const placeholderExt = editor.extensionManager.extensions.find((e) => e.name === "placeholder");
    expect(placeholderExt?.options.placeholder).toBe("Type here...");
  });
});

describe("createMarkdownExtensions — marks Markdown cannot express", () => {
  it("does not register underline, so the command is unavailable", () => {
    const editor = new Editor({ extensions: createMarkdownExtensions(), content: "hello" });
    editors.push(editor);
    const hasUnderline = editor.extensionManager.extensions.some((e) => e.name === "underline");
    expect(hasUnderline).toBe(false);
    // The mark is absent from the schema, so no command can apply it —
    // attempting to resolve the mark type throws rather than mutating the doc.
    expect(editor.schema.marks.underline).toBeUndefined();
    editor.commands.selectAll();
    expect(() => editor.chain().setMark("underline").run()).toThrow();
  });
});
