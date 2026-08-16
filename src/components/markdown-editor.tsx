"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Unlink,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  SquareCode,
  Minus,
  type LucideIcon,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "../lib/utils.ts";
import { createMarkdownExtensions } from "../lib/markdown-extensions.ts";
import type { MarkdownEditorProps, MarkdownToolbarAction } from "../types/index.ts";

const DEFAULT_TOOLBAR: readonly MarkdownToolbarAction[] = ["bold", "italic"];

/** Opens a prompt to set, change or clear the link on the current selection. */
function editLink(editor: Editor): void {
  const previousUrl = (editor.getAttributes("link").href as string | undefined) ?? "";
  const url = window.prompt("URL", previousUrl);
  if (url === null) return;
  if (url === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
}

interface ActionSpec {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly isActive: (editor: Editor) => boolean;
  readonly run: (editor: Editor) => void;
}

/**
 * Single mapping from a toolbar action to its icon, accessible label, active-state
 * predicate and command. Adding an action later touches only this record.
 */
const ACTIONS: Record<MarkdownToolbarAction, ActionSpec> = {
  bold: {
    icon: Bold,
    label: "Bold",
    isActive: (e) => e.isActive("bold"),
    run: (e) => e.chain().focus().toggleBold().run(),
  },
  italic: {
    icon: Italic,
    label: "Italic",
    isActive: (e) => e.isActive("italic"),
    run: (e) => e.chain().focus().toggleItalic().run(),
  },
  strike: {
    icon: Strikethrough,
    label: "Strikethrough",
    isActive: (e) => e.isActive("strike"),
    run: (e) => e.chain().focus().toggleStrike().run(),
  },
  code: {
    icon: Code,
    label: "Code",
    isActive: (e) => e.isActive("code"),
    run: (e) => e.chain().focus().toggleCode().run(),
  },
  link: {
    icon: LinkIcon,
    label: "Link",
    isActive: (e) => e.isActive("link"),
    run: editLink,
  },
  h1: {
    icon: Heading1,
    label: "Heading 1",
    isActive: (e) => e.isActive("heading", { level: 1 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  h2: {
    icon: Heading2,
    label: "Heading 2",
    isActive: (e) => e.isActive("heading", { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  h3: {
    icon: Heading3,
    label: "Heading 3",
    isActive: (e) => e.isActive("heading", { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  bulletList: {
    icon: List,
    label: "Bullet list",
    isActive: (e) => e.isActive("bulletList"),
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  orderedList: {
    icon: ListOrdered,
    label: "Numbered list",
    isActive: (e) => e.isActive("orderedList"),
    run: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  taskList: {
    icon: ListChecks,
    label: "Task list",
    isActive: (e) => e.isActive("taskList"),
    run: (e) => e.chain().focus().toggleTaskList().run(),
  },
  blockquote: {
    icon: Quote,
    label: "Blockquote",
    isActive: (e) => e.isActive("blockquote"),
    run: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  codeBlock: {
    icon: SquareCode,
    label: "Code block",
    isActive: (e) => e.isActive("codeBlock"),
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  horizontalRule: {
    icon: Minus,
    label: "Horizontal rule",
    isActive: () => false,
    run: (e) => e.chain().focus().setHorizontalRule().run(),
  },
};

function ToolbarButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  readonly active?: boolean;
  readonly onClick: () => void;
  readonly icon: LucideIcon;
  readonly label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "rounded p-1.5 transition-colors",
        active
          ? "bg-oe-dark/10 text-oe-dark"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function Toolbar({
  editor,
  actions,
}: {
  readonly editor: Editor | null;
  readonly actions: readonly MarkdownToolbarAction[];
}) {
  if (!editor) return null;

  // Preserve declaration order, drop duplicates (first occurrence wins).
  const uniqueActions = actions.filter((action, index) => actions.indexOf(action) === index);
  if (uniqueActions.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 border-b px-2 py-1.5">
      {uniqueActions.map((action) => {
        const spec = ACTIONS[action];
        return (
          <span key={action} className="flex items-center gap-0.5">
            <ToolbarButton
              icon={spec.icon}
              label={spec.label}
              active={spec.isActive(editor)}
              onClick={() => spec.run(editor)}
            />
            {action === "link" && editor.isActive("link") && (
              <ToolbarButton
                icon={Unlink}
                label="Remove link"
                onClick={() => editor.chain().focus().unsetLink().run()}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}

export function MarkdownEditor({ value, onChange, placeholder, toolbar }: MarkdownEditorProps) {
  const actions = toolbar ?? DEFAULT_TOOLBAR;

  const editor = useEditor({
    extensions: createMarkdownExtensions({
      placeholder,
      openLinksOnClick: false,
      allowedActions: actions,
    }),
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.storage.markdown.getMarkdown());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none px-3 py-2 min-h-[120px] outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentMarkdown = editor.storage.markdown.getMarkdown();
    if (value !== currentMarkdown) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="bg-background rounded-md border">
      <Toolbar editor={editor} actions={actions} />
      <EditorContent editor={editor} />
    </div>
  );
}
