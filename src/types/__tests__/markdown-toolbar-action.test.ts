import { describe, it, expect } from "vitest";
import type {
  MarkdownToolbarAction,
  MarkdownEditorProps,
  MarkdownViewProps,
} from "../index.ts";

/**
 * These assertions are enforced by `tsc` (the runtime bodies are trivial). A
 * regression in the types fails `pnpm typecheck`, not just this test run.
 */
describe("MarkdownToolbarAction", () => {
  it("does not accept 'unlink' — Unlink is rendered as part of 'link'", () => {
    const props: MarkdownEditorProps = {
      value: "",
      onChange: () => {},
      // @ts-expect-error "unlink" is not a MarkdownToolbarAction.
      toolbar: ["unlink"],
    };
    void props;
    expect(true).toBe(true);
  });

  it("accepts the declared actions", () => {
    const actions: readonly MarkdownToolbarAction[] = ["bold", "taskList", "horizontalRule"];
    expect(actions).toHaveLength(3);
  });
});

describe("MarkdownViewProps", () => {
  it("is still exactly a readonly content string", () => {
    type Expected = { readonly content: string };
    type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
    // Fails to compile if MarkdownViewProps gains, loses or changes a field.
    const unchanged: Equal<MarkdownViewProps, Expected> = true;
    expect(unchanged).toBe(true);
  });
});
