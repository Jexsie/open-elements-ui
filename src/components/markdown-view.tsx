"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { createMarkdownExtensions } from "../lib/markdown-extensions.ts";
import type { MarkdownViewProps } from "../types/index.ts";

export function MarkdownView({ content }: MarkdownViewProps) {
  const editor = useEditor({
    extensions: createMarkdownExtensions({ openLinksOnClick: true }),
    content,
    immediatelyRender: false,
    editable: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none",
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return <EditorContent editor={editor} />;
}
