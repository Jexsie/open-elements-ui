"use client";

import type { TagDto } from "../types";

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1A1A1A" : "#FFFFFF";
}

function isValidHex(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

interface TagChipsProps {
  readonly tags: readonly TagDto[];
  readonly label?: string;
}

export function TagChips({ tags, label }: TagChipsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="mt-4">
      {label && (
        <h3 className="mb-2 text-sm font-medium text-oe-gray">{label}</h3>
      )}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const bgColor = isValidHex(tag.color) ? tag.color : "#6B7280";
          const textColor = isValidHex(tag.color) ? getContrastColor(tag.color) : "#FFFFFF";
          return (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: bgColor, color: textColor }}
            >
              {tag.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export type { TagChipsProps };
