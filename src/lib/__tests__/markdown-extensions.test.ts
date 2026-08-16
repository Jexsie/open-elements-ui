import { describe, it, expect, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Markdown } from "tiptap-markdown";
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

/** Mount a real editor attached to the DOM so keyboard handling is active. */
function mountEditor(content: string, extensions = createMarkdownExtensions()): Editor {
  const element = document.createElement("div");
  document.body.appendChild(element);
  const editor = new Editor({ element, extensions, content });
  editors.push(editor);
  return editor;
}

function pressKey(editor: Editor, init: KeyboardEventInit): void {
  editor.view.dom.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }),
  );
}

/** Simulate typing the trailing space of "[ ] " so a task-item input rule would fire. */
function typeSpaceAfterBracket(editor: Editor): void {
  editor.commands.setContent("<p>[ ]</p>");
  editor.commands.focus("end");
  const { from } = editor.state.selection;
  editor.view.someProp("handleTextInput", (handler) =>
    handler(editor.view, from, from, " ", () => editor.state.tr),
  );
}

function hasTaskList(editor: Editor): boolean {
  return (editor.getJSON().content ?? []).some((node) => node.type === "taskList");
}

/**
 * Dispatch the task-list creation shortcut (`Mod-Shift-9`). jsdom is treated as a
 * non-Mac platform by prosemirror-keymap, so `Mod` resolves to Ctrl — sending
 * both metaKey and ctrlKey would fail to match the binding.
 */
function pressTaskListShortcut(editor: Editor): void {
  editor.commands.focus();
  pressKey(editor, { key: "9", code: "Digit9", ctrlKey: true, shiftKey: true });
}

describe("createMarkdownExtensions — task list creation stays closed", () => {
  it("does nothing when Mod-Shift-9 is pressed", () => {
    const editor = mountEditor("<p></p>");
    pressTaskListShortcut(editor);
    expect(hasTaskList(editor)).toBe(false);
  });

  it("does nothing when the user types '[ ] ' — the literal text remains", () => {
    const editor = mountEditor("<p></p>");
    typeSpaceAfterBracket(editor);
    expect(hasTaskList(editor)).toBe(false);
    expect(editor.getText()).toContain("[ ]");
  });

  it("guard: the same '[ ] ' input DOES create a task list with the default TaskItem", () => {
    // Proves the simulated input rule genuinely fires, so the stripped-rule
    // assertion above cannot silently pass if the trigger stops working.
    const editor = mountEditor("<p></p>", [
      StarterKit.configure({ underline: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Markdown,
    ]);
    typeSpaceAfterBracket(editor);
    expect(hasTaskList(editor)).toBe(true);
  });
});

describe("createMarkdownExtensions — editing an existing task list", () => {
  it("splits a task item into a new unchecked item on Enter", () => {
    const editor = mountEditor("- [x] Done");
    editor.commands.focus("end");
    pressKey(editor, { key: "Enter", code: "Enter" });
    const md = editor.storage.markdown.getMarkdown();
    expect(md).toContain("- [x] Done");
    expect(md.split("\n").some((line) => line.startsWith("- [ ]"))).toBe(true);
  });

  it("lifts a nested item one level on Shift-Tab", () => {
    const editor = mountEditor("- [ ] parent\n  - [ ] child");
    editor.commands.focus("end");
    pressKey(editor, { key: "Tab", code: "Tab", shiftKey: true });
    expect(editor.storage.markdown.getMarkdown()).toBe("- [ ] parent\n- [ ] child");
  });
});

describe("createMarkdownExtensions — task list creation gate follows allowedActions", () => {
  it("keeps creation closed when taskList is not among the allowed actions", () => {
    const shortcutEditor = mountEditor(
      "<p></p>",
      createMarkdownExtensions({ allowedActions: ["bold", "italic"] }),
    );
    pressTaskListShortcut(shortcutEditor);
    expect(hasTaskList(shortcutEditor)).toBe(false);

    const ruleEditor = mountEditor(
      "<p></p>",
      createMarkdownExtensions({ allowedActions: ["bold", "italic"] }),
    );
    typeSpaceAfterBracket(ruleEditor);
    expect(hasTaskList(ruleEditor)).toBe(false);
  });

  it("opens the keyboard shortcut when taskList is allowed", () => {
    const editor = mountEditor("<p></p>", createMarkdownExtensions({ allowedActions: ["taskList"] }));
    pressTaskListShortcut(editor);
    expect(hasTaskList(editor)).toBe(true);
  });

  it("opens the '[ ] ' input rule when taskList is allowed", () => {
    const editor = mountEditor("<p></p>", createMarkdownExtensions({ allowedActions: ["taskList"] }));
    typeSpaceAfterBracket(editor);
    expect(hasTaskList(editor)).toBe(true);
  });

  it("keeps a stored task list editable even when creation is gated", () => {
    const editor = mountEditor("- [x] Done", createMarkdownExtensions({ allowedActions: [] }));
    editor.commands.focus("end");
    pressKey(editor, { key: "Enter", code: "Enter" });
    const md = editor.storage.markdown.getMarkdown();
    expect(md).toContain("- [x] Done");
    expect(md.split("\n").some((line) => line.startsWith("- [ ]"))).toBe(true);
  });

  it("round-trips a stored task list unchanged when creation is gated", () => {
    const editor = new Editor({
      extensions: createMarkdownExtensions({ allowedActions: [] }),
      content: "- [x] Done",
    });
    editors.push(editor);
    expect(editor.storage.markdown.getMarkdown()).toBe("- [x] Done");
  });
});

describe("createMarkdownExtensions — marks stay reachable regardless of allowedActions", () => {
  it("applies bold via Mod-b even when only italic is offered", () => {
    const editor = mountEditor(
      "<p>hello</p>",
      createMarkdownExtensions({ allowedActions: ["italic"] }),
    );
    editor.commands.selectAll();
    pressKey(editor, { key: "b", code: "KeyB", ctrlKey: true });
    expect(editor.storage.markdown.getMarkdown()).toBe("**hello**");
  });

  it("completes the **bold** input rule even when only italic is offered", () => {
    // `<p>...</p>` is parsed as literal HTML text, so the incomplete `**bold*`
    // survives to the document and the closing `*` triggers the bold input rule.
    const editor = mountEditor(
      "<p>**bold*</p>",
      createMarkdownExtensions({ allowedActions: ["italic"] }),
    );
    editor.commands.focus("end");
    const { from } = editor.state.selection;
    editor.view.someProp("handleTextInput", (handler) =>
      handler(editor.view, from, from, "*", () => editor.state.tr),
    );
    expect(editor.storage.markdown.getMarkdown()).toBe("**bold**");
  });
});
