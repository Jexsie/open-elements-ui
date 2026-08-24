import { waitFor } from "storybook/test";

/**
 * Wait for the TipTap document to appear.
 *
 * Both Markdown components mount with `immediatelyRender: false`, so the first
 * paint contains neither the toolbar nor the document — the existing vitest
 * suites wait for `.ProseMirror` for the same reason. A play function that
 * starts asserting straight away sees an empty canvas.
 */
export function waitForEditor(canvasElement: HTMLElement): Promise<HTMLElement> {
  return waitFor(() => {
    const editor = canvasElement.querySelector<HTMLElement>(".ProseMirror");
    if (!editor) throw new Error("The editor has not mounted yet");
    return editor;
  });
}
