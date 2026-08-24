import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { MarkdownView } from "../src/index.ts";
import { Panel, SplitLayout } from "./support/panel.tsx";
import { useMockSave } from "./support/use-mock-save.ts";
import { waitForEditor } from "./support/editor.ts";

const CHECKLIST = [
  "Onboarding for the new hire:",
  "",
  "- [ ] Order the laptop",
  "- [x] Create the accounts",
  "- [ ] Book the intro call",
].join("\n");

const RICH_DOCUMENT = [
  "# Typography",
  "",
  "A paragraph with **bold**, `code` and a [link](https://open-elements.com).",
  "",
  "## Blocks",
  "",
  "> A blockquote, indented and rule-marked by the typography plugin.",
  "",
  "```ts",
  "const answer = 42;",
  "```",
  "",
  "1. First",
  "2. Second",
  "",
  "Remaining work:",
  "",
  "- [ ] Open task",
  "- [x] Finished task",
].join("\n");

interface ViewStoryProps {
  readonly content: string;
  /** Passed to the mock save; how long persistence appears to take. */
  readonly latencyMs: number;
  /** Passed to the mock save; arms exactly one rejection. */
  readonly failNext: boolean;
}

/** Frames a story so the component's own surroundings do not distort spacing. */
function Frame({ children }: { readonly children: ReactNode }) {
  return <div className="bg-card rounded-md border p-4">{children}</div>;
}

/**
 * `MarkdownView` wired to the mock save, with every attempt and its outcome
 * listed alongside so the optimistic flip, the pending window and a rollback
 * are all observable without a backend.
 */
function ViewWithSave({ content, latencyMs, failNext }: ViewStoryProps) {
  const { save, attempts } = useMockSave({ latencyMs, failNext });

  return (
    <SplitLayout>
      <Frame>
        <MarkdownView content={content} onChange={save} />
      </Frame>
      <Panel title="Save attempts" testId="save-log">
        {attempts.length === 0
          ? "No save reported yet."
          : attempts.map((attempt) => `[${attempt.status}]\n${attempt.markdown}`).join("\n\n")}
      </Panel>
    </SplitLayout>
  );
}

const meta: Meta<ViewStoryProps> = {
  title: "Markdown/MarkdownView",
  component: MarkdownView,
  render: (args) => <ViewWithSave {...args} />,
  args: {
    content: CHECKLIST,
    latencyMs: 600,
    failNext: false,
  },
  argTypes: {
    content: { control: "text", description: "The Markdown document to render." },
    latencyMs: {
      control: { type: "range", min: 0, max: 4000, step: 100 },
      description: "How long the mock save takes to settle.",
    },
    failNext: {
      control: "boolean",
      description:
        "Arm one rejection. The next save fails and rolls the document back; the one after " +
        "that succeeds again.",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A read-only Markdown renderer whose task-list checkboxes stay interactive (spec 003). " +
          "`onChange` receives the complete updated Markdown; returning a Promise buys the " +
          "optimistic flip, the disabled-while-pending state and the rollback on rejection.",
      },
    },
  },
};

export default meta;

type Story = StoryObj<ViewStoryProps>;

function checkboxes(canvasElement: HTMLElement): HTMLInputElement[] {
  return Array.from(canvasElement.querySelectorAll<HTMLInputElement>("input[type=checkbox]"));
}

/** Wait for the document, then for its checkboxes to be rendered by the node views. */
async function waitForCheckboxes(canvasElement: HTMLElement, count: number): Promise<void> {
  await waitForEditor(canvasElement);
  await waitFor(() => expect(checkboxes(canvasElement)).toHaveLength(count));
}

function busyRegion(canvasElement: HTMLElement): HTMLElement {
  const region = canvasElement.querySelector<HTMLElement>("[aria-busy]");
  if (!region) throw new Error("MarkdownView root not found");
  return region;
}

export const Checklist: Story = {
  name: "Interactive checklist",
  args: { latencyMs: 1200 },
  parameters: {
    docs: {
      description: {
        story:
          "Tick a box: it flips at once, the list locks until the save settles, and the reported " +
          "Markdown appears on the right with exactly one marker changed.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await waitForCheckboxes(canvasElement, 3);
    const boxes = checkboxes(canvasElement);
    await expect(boxes.map((box) => box.checked)).toEqual([false, true, false]);

    await userEvent.click(boxes[0]);

    // Optimistic: ticked well inside the 1200 ms the save takes, and the
    // attempt reporting it is still in flight. The bounded timeout is what
    // makes this an assertion about the flip being immediate.
    const log = within(canvasElement).getByTestId("save-log");
    await waitFor(() => expect(checkboxes(canvasElement)[0].checked).toBe(true), {
      timeout: 400,
    });
    await expect(log.textContent).toContain("[pending]");

    // Exactly one marker moved; the rest of the document came back untouched.
    await waitFor(() => expect(log.textContent).toContain("- [x] Order the laptop"));
    await expect(log.textContent).toContain("- [x] Create the accounts");
    await expect(log.textContent).toContain("- [ ] Book the intro call");

    // The save log and the busy state are separate renders, so wait for the
    // list to unlock rather than assuming it happens in the same tick.
    await waitFor(() => expect(log.textContent).toContain("[saved]"), { timeout: 4000 });
    await waitFor(() => expect(checkboxes(canvasElement).every((box) => !box.disabled)).toBe(true));
    await expect(checkboxes(canvasElement)[0].checked).toBe(true);
  },
};

export const PendingSaveLocksTheList: Story = {
  name: "Pending save locks the list",
  args: { latencyMs: 2500 },
  parameters: {
    docs: {
      description: {
        story:
          "A deliberately slow save. Every checkbox is disabled and muted while it is in " +
          "flight, and a click on another item is ignored rather than queued.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await waitForCheckboxes(canvasElement, 3);
    await userEvent.click(checkboxes(canvasElement)[0]);

    await waitFor(() => expect(busyRegion(canvasElement)).toHaveAttribute("aria-busy", "true"));
    await expect(checkboxes(canvasElement).every((box) => box.disabled)).toBe(true);

    // A second click during the pending window changes nothing.
    await userEvent.click(checkboxes(canvasElement)[2]);
    await expect(checkboxes(canvasElement)[2].checked).toBe(false);

    await waitFor(() => expect(busyRegion(canvasElement)).toHaveAttribute("aria-busy", "false"), {
      timeout: 6000,
    });
    await expect(checkboxes(canvasElement).map((box) => box.checked)).toEqual([true, true, false]);
  },
};

export const FailingSaveRollsBack: Story = {
  name: "Failing save rolls back",
  args: { failNext: true, latencyMs: 800 },
  parameters: {
    docs: {
      description: {
        story:
          "One rejection is armed. The box flips optimistically, then returns to its previous " +
          "state when the save rejects — and the list becomes interactive again so the reader " +
          "can retry.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await waitForCheckboxes(canvasElement, 3);
    await userEvent.click(checkboxes(canvasElement)[0]);
    await expect(checkboxes(canvasElement)[0].checked).toBe(true);

    const log = within(canvasElement).getByTestId("save-log");
    await waitFor(() => expect(log.textContent).toContain("[failed]"), { timeout: 4000 });

    await waitFor(() => expect(checkboxes(canvasElement)[0].checked).toBe(false));
    await expect(checkboxes(canvasElement).map((box) => box.checked)).toEqual([false, true, false]);
    await waitFor(() => expect(checkboxes(canvasElement).every((box) => !box.disabled)).toBe(true));
  },
};

export const ReadOnly: Story = {
  name: "Read-only (no onChange)",
  render: ({ content }) => (
    <Frame>
      <MarkdownView content={content} />
    </Frame>
  ),
  argTypes: {
    latencyMs: { table: { disable: true } },
    failNext: { table: { disable: true } },
  },
  parameters: {
    docs: {
      description: {
        story: "Without an `onChange` consumer the checkboxes are inert: a click reverts itself.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await waitForCheckboxes(canvasElement, 3);
    const before = checkboxes(canvasElement).map((box) => box.checked);
    await userEvent.click(checkboxes(canvasElement)[0]);
    await waitFor(() =>
      expect(checkboxes(canvasElement).map((box) => box.checked)).toEqual(before),
    );
  },
};

export const Typography: Story = {
  name: "Typography and brand tokens",
  args: { content: RICH_DOCUMENT },
  parameters: {
    docs: {
      description: {
        story:
          "The story that proves the styling pipeline. `MarkdownView` hardcodes `prose prose-sm`, " +
          "and task lists rely on `list-none pl-0` to suppress the bullet next to a checkbox — " +
          "all of it shipped as source text that only becomes CSS once something scans `src/`. " +
          "The assertions read computed styles, so an unconfigured content path fails here " +
          "instead of in a consuming app.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    await waitForEditor(canvasElement);

    // `prose` is applied to the document itself, not the wrapper.
    const prose = canvasElement.querySelector<HTMLElement>(".prose");
    await expect(prose).not.toBeNull();

    // @tailwindcss/typography is loaded: it gives blockquotes a leading rule
    // and italics. The plugin uses the logical property, so read that one.
    const quote = canvasElement.querySelector<HTMLElement>("blockquote");
    await expect(quote).not.toBeNull();
    const quoteStyle = getComputedStyle(quote!);
    await expect(parseFloat(quoteStyle.borderInlineStartWidth)).toBeGreaterThan(0);
    await expect(quoteStyle.fontStyle).toBe("italic");

    // `list-none` resolved, so a checkbox does not also carry a prose bullet.
    const taskList = canvasElement.querySelector<HTMLElement>('[data-type="taskList"]');
    await expect(taskList).not.toBeNull();
    await expect(getComputedStyle(taskList!).listStyleType).toBe("none");

    // The ordered list beside it keeps its markers, so the rule above is scoped.
    const ordered = canvasElement.querySelector<HTMLElement>("ol");
    await expect(ordered).not.toBeNull();
    await expect(getComputedStyle(ordered!).listStyleType).not.toBe("none");

    // brand.css reached the compiled stylesheet. `oe-dark` specifically,
    // because Tailwind only emits theme variables something actually
    // references — and the editor's active toolbar button does.
    const brandColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-oe-dark")
      .trim();
    await expect(brandColor.toLowerCase()).toBe("#020144");
  },
};
