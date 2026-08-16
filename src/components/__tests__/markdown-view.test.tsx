import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, waitFor, fireEvent } from "@testing-library/react";
import { MarkdownView } from "../markdown-view.tsx";

afterEach(cleanup);

async function renderView(content: string) {
  const result = render(<MarkdownView content={content} />);
  await waitFor(() => expect(result.container.querySelector(".ProseMirror")).toBeTruthy());
  return result;
}

describe("MarkdownView — rendering", () => {
  it("renders structural Markdown as structure, not plain paragraphs", async () => {
    const { container } = await renderView("# Title\n\n- a\n- b\n\n> quote");
    expect(container.querySelector("h1")).toBeTruthy();
    expect(container.querySelector("ul")).toBeTruthy();
    expect(container.querySelector("blockquote")).toBeTruthy();
  });

  it("renders a task list as checkboxes reflecting their state", async () => {
    const { container } = await renderView("- [x] Done\n- [ ] Open");
    const checkboxes = container.querySelectorAll<HTMLInputElement>("input[type=checkbox]");
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(false);
  });

  it("does not change a checkbox when it is clicked", async () => {
    const { container } = await renderView("- [x] Done\n- [ ] Open");
    const checkboxes = container.querySelectorAll<HTMLInputElement>("input[type=checkbox]");
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    await waitFor(() => {
      const after = container.querySelectorAll<HTMLInputElement>("input[type=checkbox]");
      expect(after[0].checked).toBe(true);
      expect(after[1].checked).toBe(false);
    });
  });

  it("suppresses the prose bullet on the task list", async () => {
    const { container } = await renderView("- [x] Done\n- [ ] Open");
    const list = container.querySelector('[data-type="taskList"]');
    expect(list?.classList.contains("list-none")).toBe(true);
    expect(list?.classList.contains("pl-0")).toBe(true);
  });
});
