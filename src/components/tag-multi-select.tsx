"use client";

import { useEffect, useState } from "react";
import type { TagOption, TagMultiSelectProps, TagMultiSelectTranslations } from "../types";
import {
  Combobox,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "./combobox";

function isValidHex(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1A1A1A" : "#FFFFFF";
}

export function TagMultiSelect({ selectedIds, onChange, loadTags, translations }: TagMultiSelectProps) {
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
  const anchorRef = useComboboxAnchor();

  useEffect(() => {
    loadTags()
      .then((tags) => setTagOptions(tags))
      .catch(() => {});
  }, [loadTags]);

  const selectedOptions = tagOptions.filter((opt) => selectedIds.includes(opt.value));

  return (
    <Combobox
      multiple
      value={selectedOptions}
      onValueChange={(options: TagOption[]) => onChange(options.map((o) => o.value))}
    >
      <ComboboxChips ref={anchorRef}>
        {selectedOptions.map((opt) => {
          const bgColor = isValidHex(opt.color) ? opt.color : "#6B7280";
          const textColor = isValidHex(opt.color) ? getContrastColor(opt.color) : "#FFFFFF";
          return (
            <ComboboxChip
              key={opt.value}
              style={{ backgroundColor: bgColor, color: textColor }}
            >
              {opt.label}
            </ComboboxChip>
          );
        })}
        <ComboboxChipsInput placeholder={translations.placeholder} />
      </ComboboxChips>
      <ComboboxContent anchor={anchorRef}>
        {tagOptions.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">{translations.empty}</p>
        ) : (
          <ComboboxList>
            {tagOptions.map((opt) => (
              <ComboboxItem key={opt.value} value={opt}>
                <span
                  className="inline-block h-4 w-4 rounded-full shrink-0"
                  style={{ backgroundColor: isValidHex(opt.color) ? opt.color : "#6B7280" }}
                />
                {opt.label}
              </ComboboxItem>
            ))}
          </ComboboxList>
        )}
      </ComboboxContent>
    </Combobox>
  );
}

export type { TagMultiSelectProps, TagMultiSelectTranslations, TagOption };
