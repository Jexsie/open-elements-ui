# Behaviors: Markdown toolbar actions

## Rendering the declared actions

### The toolbar renders exactly what was declared

- **Given** a `MarkdownEditor` with `toolbar={["bold", "taskList", "link"]}`
- **When** the toolbar renders
- **Then** it contains exactly three buttons — Bold, Task list and Link
- **And** no Italic, Strikethrough or heading button is present

### Order follows the array

- **Given** a `MarkdownEditor` with `toolbar={["link", "bold"]}`
- **When** the toolbar renders
- **Then** the Link button precedes the Bold button in the DOM

### Omitting the prop yields the default

- **Given** a `MarkdownEditor` rendered without a `toolbar` prop
- **When** the toolbar renders
- **Then** it contains exactly Bold and Italic
- **And** neither Strikethrough nor Link is offered

### An empty array renders no toolbar

- **Given** a `MarkdownEditor` with `toolbar={[]}`
- **When** the component renders
- **Then** no toolbar element exists in the DOM
- **And** no empty bordered strip is left above the text area

### A duplicate entry renders once

- **Given** a `MarkdownEditor` with `toolbar={["bold", "bold"]}`
- **When** the toolbar renders
- **Then** exactly one Bold button is present

## Executing actions

### A block action transforms the current block

- **Given** a `MarkdownEditor` with `toolbar={["h2"]}` and the cursor in a paragraph containing `Title`
- **When** the user activates the H2 button
- **Then** the block becomes a level-2 heading
- **And** `onChange` reports `## Title`

### A list action wraps the current block

- **Given** a `MarkdownEditor` with `toolbar={["taskList"]}` and the cursor in a paragraph containing `Call Anna`
- **When** the user activates the Task list button
- **Then** `onChange` reports `- [ ] Call Anna`

### An active action is marked as active

- **Given** a `MarkdownEditor` with `toolbar={["bold"]}` and the cursor inside bold text
- **When** the toolbar renders
- **Then** the Bold button is shown in its active state

### Link keeps its contextual Unlink button

- **Given** a `MarkdownEditor` with `toolbar={["link"]}`
- **When** the cursor is placed inside an existing link
- **Then** an Unlink button appears next to the Link button
- **And** it disappears when the cursor leaves the link

### Unlink cannot be declared on its own

- **Given** the `MarkdownToolbarAction` type
- **When** a consumer writes `toolbar={["unlink"]}`
- **Then** the code does not typecheck, because Unlink is part of `"link"`

## Task list creation gate

### Without `taskList`, the keyboard shortcut does nothing

- **Given** a `MarkdownEditor` with `toolbar={["bold", "italic"]}` and the cursor in an empty paragraph
- **When** the user presses `Mod-Shift-9`
- **Then** no task list is created

### Without `taskList`, the input rule does nothing

- **Given** a `MarkdownEditor` with `toolbar={["bold", "italic"]}` and the cursor at the start of an empty paragraph
- **When** the user types `[ ] `
- **Then** the literal text `[ ] ` remains

### With `taskList`, the keyboard shortcut works

- **Given** a `MarkdownEditor` with `toolbar={["taskList"]}` and the cursor in a paragraph
- **When** the user presses `Mod-Shift-9`
- **Then** the paragraph becomes a task item

### With `taskList`, the input rule works

- **Given** a `MarkdownEditor` with `toolbar={["taskList"]}` and the cursor at the start of an empty paragraph
- **When** the user types `[ ] `
- **Then** an unchecked task item is created

### Existing task lists remain editable without the action

- **Given** a `MarkdownEditor` with `toolbar={["bold"]}` loaded with `- [x] Done`, cursor at the end of the item
- **When** the user presses `Enter`
- **Then** a new task item is created below it, because `Enter` edits an existing list rather than creating one

### Existing task lists still round-trip without the action

- **Given** a `MarkdownEditor` with `toolbar={[]}` loaded with `- [x] Done`
- **When** the user edits an unrelated paragraph
- **Then** `onChange` reports Markdown in which `- [x] Done` is unchanged

## Marks are gated at the button only

### Bold stays reachable by shortcut without the button

- **Given** a `MarkdownEditor` with `toolbar={["italic"]}` and a text selection
- **When** the user presses `Mod-b`
- **Then** the selection becomes bold
- **And** `onChange` reports the text wrapped in `**`

### Bold stays reachable by typing without the button

- **Given** a `MarkdownEditor` with `toolbar={["italic"]}`
- **When** the user types `**bold**`
- **Then** the bold mark is applied

## Accessibility

### Every button has an accessible name

- **Given** a `MarkdownEditor` with all fourteen actions declared
- **When** the toolbar renders
- **Then** every button carries both an `aria-label` and a `title` with the same text
- **And** each button can be found by its accessible name

## Rendering is independent of the toolbar

### Undeclared constructs still render

- **Given** a `MarkdownEditor` with `toolbar={["bold"]}`
- **When** it is loaded with a heading, a blockquote and a task list
- **Then** all three render as their respective structures rather than as plain text

### MarkdownView is unaffected

- **Given** the `MarkdownViewProps` type
- **When** it is compared against the previous release
- **Then** it is unchanged, since the view has no toolbar
