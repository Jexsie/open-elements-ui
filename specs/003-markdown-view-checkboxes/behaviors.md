# Behaviors: Markdown view checkboxes

## Without `onChange`

### Clicking a checkbox reverts it

- **Given** a `MarkdownView` rendering `- [ ] Open item` and no `onChange` prop
- **When** the reader clicks the checkbox
- **Then** the checkbox returns to unchecked
- **And** the document is unchanged

### Checkboxes still reflect their stored state

- **Given** a `MarkdownView` with no `onChange` prop
- **When** it renders `- [x] Done\n- [ ] Open`
- **Then** the first checkbox is checked and the second is not

## Toggling with `onChange`

### Ticking reports the full updated Markdown

- **Given** a `MarkdownView` rendering `- [ ] Call Anna\n- [ ] Send offer` with an `onChange` spy
- **When** the reader ticks the first item
- **Then** `onChange` is called once with `- [x] Call Anna\n- [ ] Send offer`

### Unticking reports the full updated Markdown

- **Given** a `MarkdownView` rendering `- [x] Call Anna` with an `onChange` spy
- **When** the reader unticks the item
- **Then** `onChange` is called once with `- [ ] Call Anna`

### The checkbox flips immediately

- **Given** a `MarkdownView` whose `onChange` returns a Promise that has not settled
- **When** the reader ticks an item
- **Then** the checkbox is shown as checked before the Promise settles

### Only the clicked item changes

- **Given** a `MarkdownView` rendering a document with a heading, a paragraph, a bullet list and a task list of three items
- **When** the reader ticks the second task item
- **Then** the Markdown passed to `onChange` is byte-identical to the original except for that one `[ ]` becoming `[x]`

### Ticking a nested item changes only that item

- **Given** a `MarkdownView` rendering a task list whose second item is nested under the first
- **When** the reader ticks the nested item
- **Then** the reported Markdown keeps the indentation and changes only the nested item's marker

## Busy state

### A pending save disables all checkboxes

- **Given** a `MarkdownView` whose `onChange` returns an unsettled Promise
- **When** the reader ticks an item
- **Then** every checkbox in the view is rendered as disabled and visually muted

### A click during a pending save is ignored

- **Given** a `MarkdownView` with a pending save
- **When** the reader clicks a different checkbox
- **Then** that checkbox does not change state
- **And** `onChange` is not called a second time

### Resolving re-enables interaction

- **Given** a `MarkdownView` with a pending save
- **When** the Promise resolves
- **Then** all checkboxes become interactive again
- **And** the document keeps the toggled state

### A void return means no busy state

- **Given** a `MarkdownView` whose `onChange` returns nothing
- **When** the reader ticks an item
- **Then** the checkboxes remain interactive immediately afterwards
- **And** a second item can be ticked right away

## Failure and rollback

### A rejected save reverts the document

- **Given** a `MarkdownView` rendering `- [ ] Call Anna` whose `onChange` returns a Promise that rejects
- **When** the reader ticks the item and the Promise rejects
- **Then** the checkbox returns to unchecked
- **And** the document matches the Markdown last confirmed

### A rejected save re-enables interaction

- **Given** a `MarkdownView` whose save has just been rejected
- **When** the reader clicks a checkbox again
- **Then** the click is accepted and `onChange` is called

### A rejection after a successful save reverts only the failed change

- **Given** a `MarkdownView` where a first toggle resolved successfully and a second toggle is pending
- **When** the second Promise rejects
- **Then** the document reverts to the state after the first toggle, not to the original content

## Interaction with the `content` prop

### An echoed `content` does not rebuild the document

- **Given** a `MarkdownView` that has just reported new Markdown through `onChange`
- **When** the parent passes exactly that Markdown back as `content`
- **Then** the document is not replaced

### A genuinely different `content` replaces the document

- **Given** a mounted `MarkdownView`
- **When** the parent passes `content` that differs from the currently rendered Markdown
- **Then** the document is replaced with the new content

### A `content` change during a pending save wins

- **Given** a `MarkdownView` with a pending save
- **When** the parent passes different `content` and the pending Promise then rejects
- **Then** the document shows the newly passed content
- **And** the rollback does not restore the pre-toggle state

## Edge cases

### A view without task lists is unaffected

- **Given** a `MarkdownView` with an `onChange` prop rendering content that contains no task list
- **When** the reader interacts with the rendered text
- **Then** `onChange` is never called

### Empty content renders nothing interactive

- **Given** a `MarkdownView` with an `onChange` prop and empty `content`
- **When** it renders
- **Then** no checkbox is present and `onChange` is not called

### Text remains non-editable

- **Given** a `MarkdownView` with an `onChange` prop
- **When** the reader clicks into a paragraph and types
- **Then** the document is unchanged and `onChange` is not called
