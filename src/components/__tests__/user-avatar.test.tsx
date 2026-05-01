import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { UserAvatar } from "../user-avatar.tsx";
import type { UserOption } from "../../types/index.ts";

afterEach(cleanup);

const userWithAvatar: UserOption = {
  id: "user-1",
  name: "Hendrik Ebbers",
  email: "hendrik@example.com",
  avatarUrl: "https://example.com/avatar.jpg",
};

const userWithoutAvatar: UserOption = {
  id: "user-2",
  name: "Hendrik Ebbers",
  email: "hendrik@example.com",
};

const singleNameUser: UserOption = {
  id: "user-3",
  name: "Admin",
  email: "admin@example.com",
};

describe("UserAvatar", () => {
  it("renders initials when no avatar URL", () => {
    const { container } = render(<UserAvatar user={userWithoutAvatar} />);
    expect(container.querySelector("span")?.textContent).toBe("HE");
  });

  it("renders single initial for single-name user", () => {
    const { container } = render(<UserAvatar user={singleNameUser} />);
    expect(container.querySelector("span")?.textContent).toBe("A");
  });

  it("renders avatar image when URL is provided", () => {
    const { container } = render(<UserAvatar user={userWithAvatar} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://example.com/avatar.jpg");
    expect(img?.getAttribute("alt")).toBe("Hendrik Ebbers");
  });

  it("renders small size by default", () => {
    const { container } = render(<UserAvatar user={userWithoutAvatar} size="sm" />);
    const el = container.querySelector("span");
    expect(el?.className).toContain("h-6");
    expect(el?.className).toContain("w-6");
  });

  it("renders medium size when specified", () => {
    const { container } = render(<UserAvatar user={userWithoutAvatar} size="md" />);
    const el = container.querySelector("span");
    expect(el?.className).toContain("h-8");
    expect(el?.className).toContain("w-8");
  });

  it("assigns deterministic color based on user id", () => {
    const { container: c1 } = render(<UserAvatar user={userWithoutAvatar} />);
    const class1 = c1.querySelector("span")?.className;
    cleanup();
    const { container: c2 } = render(<UserAvatar user={userWithoutAvatar} />);
    const class2 = c2.querySelector("span")?.className;
    expect(class1).toBe(class2);
  });
});
