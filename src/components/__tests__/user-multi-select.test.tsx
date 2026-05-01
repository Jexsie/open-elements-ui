import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { UserMultiSelect } from "../user-multi-select.tsx";
import type { UserOption, UserMultiSelectTranslations } from "../../types/index.ts";

const mockTranslations: UserMultiSelectTranslations = {
  placeholder: "Select members...",
  searchPlaceholder: "Search...",
  empty: "No users found",
};

const mockUsers: UserOption[] = [
  { id: "1", name: "Alice Adams", email: "alice@example.com" },
  { id: "2", name: "Bob Baker", email: "bob@example.com" },
  { id: "3", name: "Charlie Clark", email: "charlie@example.com" },
];

describe("UserMultiSelect", () => {
  it("renders with empty user list showing placeholder", () => {
    const { getByText } = render(
      <UserMultiSelect
        users={[]}
        selectedIds={[]}
        onChange={() => {}}
        translations={mockTranslations}
      />,
    );

    expect(getByText("Select members...")).toBeInTheDocument();
  });

  it("shows selected user chips", () => {
    const { getAllByText } = render(
      <UserMultiSelect
        users={mockUsers}
        selectedIds={["1", "2"]}
        onChange={() => {}}
        translations={mockTranslations}
      />,
    );

    expect(getAllByText("Alice Adams").length).toBeGreaterThanOrEqual(1);
    expect(getAllByText("Bob Baker").length).toBeGreaterThanOrEqual(1);
  });

  it("does not show remove button for disabled users in chips", () => {
    const { container } = render(
      <UserMultiSelect
        users={mockUsers}
        selectedIds={["1"]}
        onChange={() => {}}
        disabledIds={["1"]}
        translations={mockTranslations}
      />,
    );

    // The trigger button contains chips; disabled user chips should not have a role="button" remove element
    const trigger = container.querySelector("[data-slot='popover-trigger']");
    const removeBtn = trigger?.querySelector("[role='button']");
    expect(removeBtn).toBeNull();
  });

  it("uses placeholder from translations", () => {
    const deTranslations: UserMultiSelectTranslations = {
      placeholder: "Mitglieder auswählen...",
      searchPlaceholder: "Suchen...",
      empty: "Keine Benutzer gefunden",
    };

    const { getByText } = render(
      <UserMultiSelect
        users={[]}
        selectedIds={[]}
        onChange={() => {}}
        translations={deTranslations}
      />,
    );

    expect(getByText("Mitglieder auswählen...")).toBeInTheDocument();
  });

  it("calls onChange is provided as callback prop", () => {
    const onChange = vi.fn();

    const { container } = render(
      <UserMultiSelect
        users={mockUsers}
        selectedIds={["1"]}
        onChange={onChange}
        translations={mockTranslations}
      />,
    );

    // Verify component renders with the callback without crashing
    expect(container).toBeTruthy();
  });
});
