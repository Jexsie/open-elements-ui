import "@testing-library/jest-dom/vitest";

// jsdom does not implement layout. ProseMirror's scrollIntoView (triggered by
// focus/selection commands) reads client rects from DOM nodes — including Text
// nodes, which jsdom does not give getClientRects/getBoundingClientRect. Provide
// empty stubs so editor commands do not crash under jsdom. Purely additive: only
// methods that are missing are defined.
const emptyRect = (): DOMRect => ({
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  toJSON: () => ({}),
});
const emptyRectList = (): DOMRectList =>
  Object.assign([] as DOMRect[], { item: () => null }) as unknown as DOMRectList;

type Measurable = {
  getClientRects?: () => DOMRectList;
  getBoundingClientRect?: () => DOMRect;
};
for (const proto of [Node.prototype, Range.prototype]) {
  const measurable = proto as unknown as Measurable;
  if (!measurable.getClientRects) measurable.getClientRects = emptyRectList;
  if (!measurable.getBoundingClientRect) measurable.getBoundingClientRect = emptyRect;
}
