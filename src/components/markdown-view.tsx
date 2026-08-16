"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import type { NodeWithPos } from "@tiptap/core";
import { cn } from "../lib/utils.ts";
import { createMarkdownExtensions } from "../lib/markdown-extensions.ts";
import type { MarkdownViewProps } from "../types/index.ts";

/** The ProseMirror document node type, without a direct `@tiptap/pm` dependency. */
type ProseMirrorNode = NodeWithPos["node"];

/** Resolve a node's document position by identity and return -1 if it is gone. */
function positionOf(editor: Editor, target: ProseMirrorNode): number {
  let position = -1;
  editor.state.doc.descendants((node, pos) => {
    if (node === target) {
      position = pos;
      return false;
    }
    return position === -1;
  });
  return position;
}

export function MarkdownView({ content, onChange }: MarkdownViewProps) {
  const [busy, setBusy] = useState(false);

  // Refs let the stable onReadOnlyChecked callback read the latest values
  // without being recreated (which would require rebuilding the editor).
  const busyRef = useRef(false);
  const lastConfirmedRef = useRef(content);
  const editorRef = useRef<Editor | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setBusy2 = useCallback((value: boolean) => {
    busyRef.current = value;
    setBusy(value);
  }, []);

  const handleReadOnlyChecked = useCallback(
    (node: ProseMirrorNode, checked: boolean): boolean => {
      const editor = editorRef.current;
      // Swallow the click (node view reverts it) when there is no consumer to
      // report to, or while a save is already in flight.
      if (!editor || !onChangeRef.current || busyRef.current) return false;

      const position = positionOf(editor, node);
      if (position === -1) return false;

      // Apply the toggle to the document ourselves — the read-only node view
      // does not touch the document, only the DOM checkbox.
      editor.view.dispatch(
        editor.state.tr.setNodeMarkup(position, undefined, { ...node.attrs, checked }),
      );

      const markdown = editor.storage.markdown.getMarkdown();
      const result = onChangeRef.current(markdown);

      if (result instanceof Promise) {
        setBusy2(true);
        result
          .then(() => {
            lastConfirmedRef.current = markdown;
            setBusy2(false);
          })
          .catch(() => {
            editor.commands.setContent(lastConfirmedRef.current);
            setBusy2(false);
          });
      } else {
        lastConfirmedRef.current = markdown;
      }
      return true;
    },
    [setBusy2],
  );

  const editor = useEditor({
    extensions: createMarkdownExtensions({
      openLinksOnClick: true,
      onReadOnlyChecked: handleReadOnlyChecked,
    }),
    content,
    immediatelyRender: false,
    editable: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none",
      },
    },
  });
  editorRef.current = editor;

  // Guarded sync: only rebuild when `content` genuinely differs from what the
  // document already holds, so an echo of what we just reported is a no-op. A
  // genuinely new value also becomes the confirmed baseline, so a later
  // rejection does not roll back to a stale document.
  useEffect(() => {
    if (!editor) return;
    const current = editor.storage.markdown.getMarkdown();
    if (content !== current) {
      editor.commands.setContent(content);
      lastConfirmedRef.current = content;
    }
  }, [content, editor]);

  // Reflect the busy state on the actual checkboxes. Re-applied whenever the
  // document may have been rebuilt (busy toggled, content changed), because
  // node views recreate the input elements on every transaction.
  useEffect(() => {
    if (!editor) return;
    const inputs = editor.view.dom.querySelectorAll<HTMLInputElement>("input[type=checkbox]");
    inputs.forEach((input) => {
      input.disabled = busy;
    });
  }, [busy, editor, content]);

  return (
    <div
      aria-busy={busy}
      className={cn(
        busy &&
          "[&_input[type=checkbox]]:cursor-not-allowed [&_input[type=checkbox]]:opacity-50",
      )}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
