# TODO

## Bullet list adjacent to a task list grows a phantom empty task item

When Markdown places a bullet list directly before a task list (`- one\n- two\n\n- [ ] a`), the schema round-trip inserts a spurious empty task item (`- [ ] `) between them. Separating the two lists with a paragraph avoids it. This breaks the byte-identical round-trip guarantee from spec `001-markdown-schema-roundtrip` for that specific adjacency.

**Context:** Surfaced while writing the "only the clicked item changes" test for spec `003-markdown-view-checkboxes`; the test was adjusted to separate the lists. Root cause is in the `tiptap-markdown` / markdown-it parse of adjacent bullet+task lists, not in spec 003, so it was left for a dedicated fix. Not yet reproduced in a spec 001 round-trip test.

**Prerequisite:** none — can be investigated against `createMarkdownExtensions` directly.
