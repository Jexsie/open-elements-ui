"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import type { MarkdownViewProps } from "../types/index.ts";

export function MarkdownView({ content }: MarkdownViewProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: { class: "text-blue-600 underline", target: "_blank", rel: "noopener noreferrer" },
      }),
      Markdown,
    ],
    content,
    immediatelyRender: false,
    editable: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none",
      },
    },
  });

  return <EditorContent editor={editor} />;
}
