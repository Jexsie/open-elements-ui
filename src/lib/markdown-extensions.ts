import type { Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";

/**
 * Options for {@link createMarkdownExtensions}. The two fields capture the only
 * genuine differences between the editor and the read-only view.
 */
export interface MarkdownExtensionsOptions {
  /** Placeholder text shown while the document is empty. Editor only. */
  readonly placeholder?: string;
  /** Whether clicking a link opens it. `true` in the view, `false` in the editor. */
  readonly openLinksOnClick?: boolean;
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

  // Strip the creation paths while keeping the in-list editing shortcuts.
  // The `tight` attribute makes the Markdown serializer render task lists
  // tightly (no blank line between items), matching how tiptap-markdown already
  // treats bullet and ordered lists. Without it, prosemirror-markdown falls back
  // to a loose list and a multi-item checklist no longer round-trips byte-for-byte.
  // `rendered: false` keeps the attribute out of the DOM so it is not persisted.
  const TaskListNode = TaskList.extend({
    addKeyboardShortcuts: () => ({}),
    addAttributes() {
      return {
        ...this.parent?.(),
        tight: { default: true, rendered: false },
      };
    },
  });
  const TaskItemNode = TaskItem.extend({ addInputRules: () => [] });

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
    }),
    Placeholder.configure({ placeholder: options?.placeholder ?? "" }),
    Markdown,
  ];
}
