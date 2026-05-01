"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "./button.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.tsx";
import { cn } from "../lib/utils.ts";
import { UserAvatar } from "./user-avatar.tsx";
import type { UserMultiSelectProps } from "../types/index.ts";

export function UserMultiSelect({
  users,
  selectedIds,
  onChange,
  disabledIds = [],
  translations,
}: UserMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const toggle = (id: string) => {
    if (disabledIds.includes(id)) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedUsers = users.filter((u) => selectedIds.includes(u.id));
  const filteredUsers = search
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-auto min-h-[40px] w-full justify-between"
          type="button"
        >
          <div className="flex flex-wrap gap-1.5 overflow-hidden">
            {selectedUsers.length > 0 ? (
              selectedUsers.map((user) => {
                const isDisabled = disabledIds.includes(user.id);
                return (
                  <span
                    key={user.id}
                    className="bg-muted inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2 pl-1 text-xs font-medium"
                  >
                    <UserAvatar user={user} size="sm" />
                    <span className="max-w-[120px] truncate">{user.name}</span>
                    {!isDisabled && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          toggle(user.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            e.preventDefault();
                            toggle(user.id);
                          }
                        }}
                        className="text-muted-foreground hover:text-foreground ml-0.5 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                  </span>
                );
              })
            ) : (
              <span className="text-muted-foreground">{translations.placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="border-b p-2">
          <input
            type="text"
            placeholder={translations.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="placeholder:text-muted-foreground w-full rounded-md border-0 bg-transparent px-2 py-1.5 text-sm outline-none"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {filteredUsers.map((user) => {
            const isSelected = selectedIds.includes(user.id);
            const isDisabled = disabledIds.includes(user.id);
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => toggle(user.id)}
                disabled={isDisabled}
                className={cn(
                  "hover:bg-accent flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm",
                  isDisabled && "cursor-not-allowed opacity-60",
                )}
              >
                <Check
                  className={cn("h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
                />
                <UserAvatar user={user} size="md" />
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                </div>
              </button>
            );
          })}
          {filteredUsers.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-sm">
              {translations.empty}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
