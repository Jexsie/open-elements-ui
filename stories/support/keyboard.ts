/**
 * The key `Mod-` resolves to in the browser running the story.
 *
 * TipTap registers the task-list shortcut as `Mod-Shift-9`, and
 * prosemirror-keymap expands `Mod-` to Meta on Apple platforms and Ctrl
 * everywhere else using this exact test on `navigator.platform`. A play
 * function has to send the same key the keymap is listening for, so the
 * detection is mirrored rather than guessed — and only one modifier is sent,
 * because `toggleTaskList` applied twice is a no-op.
 */
export const MOD_KEY: "Meta" | "Control" = /Mac|iP(hone|[oa]d)/.test(navigator.platform)
  ? "Meta"
  : "Control";

/** `userEvent.keyboard` sequence for `Mod-Shift-9`. */
export const MOD_SHIFT_9 = `{${MOD_KEY}>}{Shift>}9{/Shift}{/${MOD_KEY}}`;

/**
 * `userEvent` sequence that types a literal `[ ] `, the input rule for a task
 * item. `[` opens a key-descriptor in the keyboard DSL, so it is escaped by
 * doubling.
 */
export const TASK_ITEM_INPUT_RULE = "[[ ] ";
