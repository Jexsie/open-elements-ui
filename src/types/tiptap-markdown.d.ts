import type { MarkdownStorage } from "tiptap-markdown";

// Augment tiptap's Storage interface so editor.storage.markdown is typed.
// See https://tiptap.dev/docs/editor/extensions/custom-extensions/extend-existing#storage
declare module "@tiptap/core" {
  interface Storage {
    markdown: MarkdownStorage;
  }
}

export {};
