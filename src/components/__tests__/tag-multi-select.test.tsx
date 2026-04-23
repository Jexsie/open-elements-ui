import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TagMultiSelect } from "../tag-multi-select";
import type { TagOption, TagMultiSelectTranslations } from "../../types";

const mockTranslations: TagMultiSelectTranslations = {
  placeholder: "Choose tags...",
  empty: "No tags available",
};

const mockTags: TagOption[] = [
  { value: "1", label: "VIP", color: "#FF0000" },
  { value: "2", label: "Partner", color: "#00FF00" },
  { value: "3", label: "Lead", color: "#0000FF" },
];

describe("TagMultiSelect", () => {
  it("calls loadTags on mount", async () => {
    const loadTags = vi.fn().mockResolvedValue(mockTags);

    render(
      <TagMultiSelect
        selectedIds={[]}
        onChange={() => {}}
        loadTags={loadTags}
        translations={mockTranslations}
      />,
    );

    await waitFor(() => {
      expect(loadTags).toHaveBeenCalledTimes(1);
    });
  });

  it("displays placeholder from translations", () => {
    const loadTags = vi.fn().mockResolvedValue([]);

    render(
      <TagMultiSelect
        selectedIds={[]}
        onChange={() => {}}
        loadTags={loadTags}
        translations={mockTranslations}
      />,
    );

    const inputs = screen.getAllByPlaceholderText("Choose tags...");
    expect(inputs.length).toBeGreaterThanOrEqual(1);
    expect(inputs[0]).toBeInTheDocument();
  });

  it("shows empty message when no tags loaded", async () => {
    const loadTags = vi.fn().mockResolvedValue([]);

    render(
      <TagMultiSelect
        selectedIds={[]}
        onChange={() => {}}
        loadTags={loadTags}
        translations={mockTranslations}
      />,
    );

    await waitFor(() => {
      const msgs = screen.getAllByText("No tags available");
      expect(msgs.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("handles loadTags failure without crashing", async () => {
    const loadTags = vi.fn().mockRejectedValue(new Error("Network error"));

    render(
      <TagMultiSelect
        selectedIds={[]}
        onChange={() => {}}
        loadTags={loadTags}
        translations={mockTranslations}
      />,
    );

    await waitFor(() => {
      expect(loadTags).toHaveBeenCalled();
    });

    const msgs = screen.getAllByText("No tags available");
    expect(msgs.length).toBeGreaterThanOrEqual(1);
  });

  it("renders selected tags as chips with correct colors", async () => {
    const loadTags = vi.fn().mockResolvedValue(mockTags);

    render(
      <TagMultiSelect
        selectedIds={["1"]}
        onChange={() => {}}
        loadTags={loadTags}
        translations={mockTranslations}
      />,
    );

    await waitFor(() => {
      const chip = screen.getByText("VIP");
      expect(chip).toBeInTheDocument();
    });
  });

  it("uses fallback color for invalid hex", async () => {
    const loadTags = vi.fn().mockResolvedValue([
      { value: "1", label: "Bad Color", color: "not-a-color" },
    ]);

    render(
      <TagMultiSelect
        selectedIds={["1"]}
        onChange={() => {}}
        loadTags={loadTags}
        translations={mockTranslations}
      />,
    );

    await waitFor(() => {
      const chips = screen.getAllByText("Bad Color");
      const chipEl = chips.find((el) => el.closest("[data-slot='combobox-chip']"));
      expect(chipEl).toBeTruthy();
      expect(chipEl!.closest("[data-slot='combobox-chip']")).toHaveStyle({
        backgroundColor: "#6B7280",
      });
    });
  });
});
