import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { MarkdownEditor } from "../src/index.ts";
import type { MarkdownEditorProps, MarkdownToolbarAction } from "../src/index.ts";
import { Panel, SplitLayout } from "./support/panel.tsx";
import { MOD_SHIFT_9, TASK_ITEM_INPUT_RULE } from "./support/keyboard.ts";
import { waitForEditor } from "./support/editor.ts";

/** Every action the toolbar can offer, in the order the type declares them. */
const TOOLBAR_ACTIONS: readonly MarkdownToolbarAction[] = [
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

/**
 * The accessible name each action must expose. Pinned here rather than read
 * from the component, so a play function fails when a label silently changes.
 */
const ACCESSIBLE_NAMES: Record<MarkdownToolbarAction, string> = {
  bold: "Bold",
  italic: "Italic",
  strike: "Strikethrough",
  code: "Code",
  link: "Link",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  bulletList: "Bullet list",
  orderedList: "Numbered list",
  taskList: "Task list",
  blockquote: "Blockquote",
  codeBlock: "Code block",
  horizontalRule: "Horizontal rule",
};

/**
 * Holds the document and shows what `onChange` reports, so the Markdown the
 * editor serializes is visible while typing. The editor is fed back its own
 * output; its guarded sync makes that a no-op rather than a re-mount.
 */
function EditorWithSource({ value, onChange, placeholder, toolbar }: MarkdownEditorProps) {
  const [markdown, setMarkdown] = useState(value);

  // Re-seed when the story's initial value changes from the Controls panel.
  const [seed, setSeed] = useState(value);
  if (seed !== value) {
    setSeed(value);
    setMarkdown(value);
  }

  return (
    <SplitLayout>
      <MarkdownEditor
        value={markdown}
        placeholder={placeholder}
        toolbar={toolbar}
        onChange={(next) => {
          setMarkdown(next);
          onChange(next);
        }}
      />
      <Panel title="Serialized Markdown" testId="serialized-markdown">
        {markdown}
      </Panel>
    </SplitLayout>
  );
}

const meta: Meta<typeof MarkdownEditor> = {
  title: "Markdown/MarkdownEditor",
  component: MarkdownEditor,
  render: (args) => <EditorWithSource {...args} />,
  args: {
    value: "",
    placeholder: "Write something…",
    onChange: fn(),
  },
  argTypes: {
    toolbar: {
      control: "check",
      options: TOOLBAR_ACTIONS,
      description:
        "Actions offered in the toolbar, in render order. Unset falls back to Bold and Italic; " +
        "an empty array renders no toolbar at all.",
    },
    value: {
      control: "text",
      description: "Initial document. Editing is owned by the story from then on.",
    },
    onChange: { table: { disable: true } },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A Markdown editor whose toolbar is composed per usage (spec 002). The toolbar gates " +
          "only what the user can *create* — the schema still parses and serializes every " +
          "construct Markdown can express (spec 001).",
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/** Accessible names of the toolbar buttons, in render order. */
function toolbarNames(canvasElement: HTMLElement): string[] {
  return Array.from(canvasElement.querySelectorAll("button")).map(
    (button) => button.getAttribute("aria-label") ?? "",
  );
}

/**
 * Task items carry `data-checked` rather than a `data-type`, which is also how
 * `markdown-view.tsx` locates them.
 */
function taskItemCount(canvasElement: HTMLElement): number {
  return canvasElement.querySelectorAll("li[data-checked]").length;
}

async function focusEditor(canvasElement: HTMLElement): Promise<HTMLElement> {
  const editor = await waitForEditor(canvasElement);
  await userEvent.click(editor);
  return editor;
}

export const Default: Story = {
  name: "Default toolbar",
  play: async ({ canvasElement }) => {
    await waitForEditor(canvasElement);
    await expect(toolbarNames(canvasElement)).toEqual(["Bold", "Italic"]);
  },
};

export const DeclaredToolbar: Story = {
  name: "Declared toolbar",
  args: {
    toolbar: ["h1", "h2", "bulletList", "taskList", "link"],
    value: "## Meeting notes\n\nAgenda below.",
  },
  play: async ({ canvasElement }) => {
    await waitForEditor(canvasElement);
    // Declaration order is render order, and nothing else is offered.
    await expect(toolbarNames(canvasElement)).toEqual([
      "Heading 1",
      "Heading 2",
      "Bullet list",
      "Task list",
      "Link",
    ]);
  },
};

export const NoToolbar: Story = {
  name: "No toolbar",
  args: { toolbar: [], value: "Just a plain field." },
  play: async ({ canvasElement }) => {
    // The document is there; the toolbar is not.
    await waitForEditor(canvasElement);
    await expect(canvasElement.querySelectorAll("button")).toHaveLength(0);
  },
};

export const AllActions: Story = {
  name: "All actions (accessible names)",
  args: { toolbar: TOOLBAR_ACTIONS },
  parameters: {
    docs: {
      description: {
        story:
          "Fourteen icon-only buttons. The a11y addon checks them for accessible names; the play " +
          "function pins the names themselves.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await waitForEditor(canvasElement);
    const canvas = within(canvasElement);
    for (const action of TOOLBAR_ACTIONS) {
      await expect(canvas.getByRole("button", { name: ACCESSIBLE_NAMES[action] })).toBeVisible();
    }
    await expect(toolbarNames(canvasElement)).toHaveLength(TOOLBAR_ACTIONS.length);
  },
};

export const RichContentMinimalToolbar: Story = {
  name: "Rich content, one action",
  args: {
    toolbar: ["bold"],
    value:
      "# Release notes\n\n> Ships next week.\n\n- [ ] Draft the changelog\n- [x] Tag the release",
  },
  parameters: {
    docs: {
      description: {
        story:
          "The toolbar offers Bold alone, yet the heading, blockquote and task list all render: " +
          "the allowlist gates authoring, not the schema.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await waitForEditor(canvasElement);
    await expect(toolbarNames(canvasElement)).toEqual(["Bold"]);
    await expect(canvasElement.querySelector("h1")).not.toBeNull();
    await expect(canvasElement.querySelector("blockquote")).not.toBeNull();
    await expect(taskItemCount(canvasElement)).toBe(2);
  },
};

export const TaskListGateClosed: Story = {
  name: "Task list gate — closed",
  args: { toolbar: ["bold", "italic"] },
  parameters: {
    docs: {
      description: {
        story:
          'Without `"taskList"` on the allowlist neither the `Mod-Shift-9` shortcut nor the ' +
          "`[ ] ` input rule can create a checklist.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await focusEditor(canvasElement);

    await userEvent.keyboard(MOD_SHIFT_9);
    await expect(taskItemCount(canvasElement)).toBe(0);

    await userEvent.keyboard(TASK_ITEM_INPUT_RULE);
    await expect(taskItemCount(canvasElement)).toBe(0);
  },
};

export const TaskListGateOpen: Story = {
  name: "Task list gate — open",
  args: { toolbar: ["bold", "italic", "taskList"] },
  parameters: {
    docs: {
      description: {
        story: "The same two inputs, with the action declared. Both create a checklist.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await focusEditor(canvasElement);

    await userEvent.keyboard(MOD_SHIFT_9);
    await expect(taskItemCount(canvasElement)).toBe(1);

    // Toggle back to a paragraph so the input rule is tested on a clean document.
    await userEvent.keyboard(MOD_SHIFT_9);
    await expect(taskItemCount(canvasElement)).toBe(0);

    await userEvent.keyboard(TASK_ITEM_INPUT_RULE);
    await expect(taskItemCount(canvasElement)).toBe(1);
  },
};

export const RoundTrip: Story = {
  name: "Round trip",
  args: {
    toolbar: TOOLBAR_ACTIONS,
    value: [
      "# Round trip",
      "",
      "Text with **bold**, `code` and a [link](https://open-elements.com).",
      "",
      "## Lists",
      "",
      "1. First",
      "2. Second",
      "",
      "Then a bullet list:",
      "",
      "- Bullet",
      "- Another",
      "",
      "> A quotation.",
      "",
      "```ts",
      "const answer = 42;",
      "```",
      "",
      "---",
      "",
      "Remaining work:",
      "",
      "- [ ] Open task",
      "- [x] Finished task",
    ].join("\n"),
  },
  parameters: {
    docs: {
      description: {
        story:
          "Everything the schema supports, with the serialized Markdown alongside. Edit on the " +
          "left and watch the right-hand panel: what the editor reports is what a consumer stores.",
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    await waitForEditor(canvasElement);
    const canvas = within(canvasElement);
    const panel = canvas.getByTestId("serialized-markdown");

    // The panel is seeded from the prop, so until the editor reports something
    // it shows the raw input rather than a serialization.
    await expect(panel.textContent).toBe(args.value);

    // One keystroke re-serializes the whole document. Anything the schema
    // failed to model would vanish here — spec 001's promise, checked against a
    // real browser's contenteditable rather than jsdom.
    await userEvent.click(canvas.getByRole("heading", { name: "Lists" }));
    await userEvent.keyboard("!");
    await waitFor(() => expect(panel.textContent).not.toBe(args.value));

    // Wherever the caret landed, the document differs from the original by
    // exactly the one character that was typed. The document contains no other
    // "!", so removing the first occurrence must restore it byte for byte.
    await expect((panel.textContent ?? "").replace("!", "")).toBe(args.value);
    await expect(args.onChange).toHaveBeenCalled();
  },
};
