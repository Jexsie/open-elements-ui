"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import type { NodeWithPos } from "@tiptap/core";
import { cn } from "../lib/utils.ts";
import { createMarkdownExtensions } from "../lib/markdown-extensions.ts";
import type { MarkdownViewProps } from "../types/index.ts";

/** The ProseMirror document node type, without a direct `@tiptap/pm` dependency. */
type ProseMirrorNode = NodeWithPos["node"];

/**
 * Resolve the document position of the task item whose checkbox was just
 * toggled to `checked`.
 *
 * The `node` handed to `onReadOnlyChecked` cannot be trusted for this: the
 * extension-list node view is reused across updates, so its closure keeps the
 * node from creation and goes stale after the first toggle. Instead we locate
 * the clicked item by DOM: at the moment of the click exactly one `<li>` has a
 * live checkbox that disagrees with its `data-checked` attribute (the document
 * has not been updated yet). DOM order matches document order, so its index
 * among the task-item `<li>`s maps directly to the nth `taskItem` node.
 */
function positionOfToggled(editor: Editor, checked: boolean): number {
  const items = Array.from(
    editor.view.dom.querySelectorAll<HTMLElement>("li[data-checked]"),
  );
  const clickedIndex = items.findIndex((li) => {
    const input = li.querySelector<HTMLInputElement>("input[type=checkbox]");
    return input != null && input.checked === checked && li.dataset.checked !== String(checked);
  });
  if (clickedIndex === -1) return -1;

  let seen = 0;
  let position = -1;
  editor.state.doc.descendants((node, pos) => {
    if (position !== -1) return false; // already found — stop searching
    if (node.type.name === "taskItem") {
      if (seen === clickedIndex) {
        position = pos;
        return false;
      }
      seen += 1;
    }
    return true;
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
    (_node: ProseMirrorNode, checked: boolean): boolean => {
      const editor = editorRef.current;
      // Swallow the click (node view reverts it) when there is no consumer to
      // report to, or while a save is already in flight.
      if (!editor || !onChangeRef.current || busyRef.current) return false;

      const position = positionOfToggled(editor, checked);
      if (position === -1) return false;

      // Apply the toggle to the document ourselves — the read-only node view
      // does not touch the document, only the DOM checkbox.
      const current = editor.state.doc.nodeAt(position);
      editor.view.dispatch(
        editor.state.tr.setNodeMarkup(position, undefined, { ...current?.attrs, checked }),
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
