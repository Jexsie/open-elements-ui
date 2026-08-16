import type { Extensions, NodeWithPos } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import type { MarkdownToolbarAction } from "../types/index.ts";

/** The ProseMirror document node type, re-derived without a direct `@tiptap/pm` dependency. */
type ProseMirrorNode = NodeWithPos["node"];

/**
 * Options for {@link createMarkdownExtensions}.
 */
export interface MarkdownExtensionsOptions {
  /** Placeholder text shown while the document is empty. Editor only. */
  readonly placeholder?: string;
  /** Whether clicking a link opens it. `true` in the view, `false` in the editor. */
  readonly openLinksOnClick?: boolean;
  /**
   * Actions the user may *create*. Only `"taskList"` is honoured here — its
   * keyboard shortcut and input rule are opened when it is present and stripped
   * when it is not. All other actions are gated at the toolbar button only, so
   * they need no schema-level handling. Omitted or empty → task-list creation
   * stays closed. This never affects what the schema can parse or serialize.
   */
  readonly allowedActions?: readonly MarkdownToolbarAction[];
  /**
   * Invoked when a task-list checkbox is toggled while the editor is read-only.
   * Return `true` to accept the toggle (the caller is responsible for applying
   * it to the document) or `false` to revert the checkbox. Used by
   * `MarkdownView` to make checklists interactive; omit for a read-only view.
   */
  readonly onReadOnlyChecked?: (node: ProseMirrorNode, checked: boolean) => boolean;
}

/**
 * Builds the TipTap extension set shared by `MarkdownEditor`, `MarkdownView`
 * and the round-trip tests.
 *
 * The schema intentionally covers everything Markdown can express and TipTap
 * can model with the StarterKit plus task lists, so stored content round-trips
 * untouched. Two marks are deliberately excluded:
 *
 * - `underline` — Markdown has no representation for it, so enabling it would
 *   reintroduce the data-loss bug this configuration exists to prevent.
 * - a separate `Link` extension — StarterKit already ships `link`, so it is
 *   configured through StarterKit rather than registered twice.
 *
 * Task lists render but cannot be created: the `Mod-Shift-9` shortcut and the
 * `[ ] ` input rule are stripped. Editing shortcuts inside an existing task
 * list (Enter, Tab, Shift-Tab) are kept.
 */
export function createMarkdownExtensions(options?: MarkdownExtensionsOptions): Extensions {
  const openLinksOnClick = options?.openLinksOnClick ?? false;
  const taskListAllowed = (options?.allowedActions ?? []).includes("taskList");

  // The `tight` attribute makes the Markdown serializer render task lists
  // tightly (no blank line between items), matching how tiptap-markdown already
  // treats bullet and ordered lists. Without it, prosemirror-markdown falls back
  // to a loose list and a multi-item checklist no longer round-trips byte-for-byte.
  // `rendered: false` keeps the attribute out of the DOM so it is not persisted.
  // It is applied whether or not task-list *creation* is allowed, because a
  // stored task list must always round-trip.
  const TaskListWithTight = TaskList.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        tight: { default: true, rendered: false },
      };
    },
  });

  // Gate task-list *creation* on the allowlist: when it is not offered, strip the
  // `Mod-Shift-9` shortcut and the `[ ] ` input rule so a checklist cannot be
  // created by any means. In-list editing shortcuts (Enter/Tab/Shift-Tab) are
  // always kept so a stored list stays editable.
  const TaskListNode = taskListAllowed
    ? TaskListWithTight
    : TaskListWithTight.extend({ addKeyboardShortcuts: () => ({}) });
  const TaskItemNode = taskListAllowed ? TaskItem : TaskItem.extend({ addInputRules: () => [] });

  return [
    StarterKit.configure({
      underline: false,
      link: {
        openOnClick: openLinksOnClick,
        HTMLAttributes: openLinksOnClick
          ? {
              class: "text-blue-600 underline",
              target: "_blank",
              rel: "noopener noreferrer",
            }
          : { class: "text-blue-600 underline" },
      },
    }),
    // `list-none pl-0` suppresses the `prose` bullet so a checkbox does not also
    // get a list marker; `flex items-start gap-2` aligns the box with its label.
    TaskListNode.configure({ HTMLAttributes: { class: "list-none pl-0" } }),
    TaskItemNode.configure({
      nested: true,
      HTMLAttributes: { class: "flex items-start gap-2" },
      onReadOnlyChecked: options?.onReadOnlyChecked,
    }),
    Placeholder.configure({ placeholder: options?.placeholder ?? "" }),
    Markdown,
  ];
}
