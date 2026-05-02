"use client";

import { Button } from "./button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select.tsx";

export type PaginationTranslations = {
  readonly perPage: string;
  readonly previous: string;
  readonly next: string;
  readonly totalOne: string;
  readonly totalOther: string;
};

type TablePaginationProps = {
  readonly page: number;
  readonly pageSize: number;
  readonly totalElements: number;
  readonly totalPages: number;
  readonly pageSizeOptions: readonly number[];
  readonly storageKey: string;
  readonly translations: PaginationTranslations;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (size: number) => void;
};

export function TablePagination({
  page,
  pageSize,
  totalElements,
  totalPages,
  pageSizeOptions,
  storageKey,
  translations,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalTemplate = totalElements === 1 ? translations.totalOne : translations.totalOther;
  const totalLabel = totalTemplate.replace("{count}", String(totalElements));

  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            const n = Number(v);
            onPageSizeChange(n);
            localStorage.setItem(storageKey, v);
            onPageChange(0);
          }}
        >
          <SelectTrigger className="w-[80px] h-8 text-sm" aria-label={translations.perPage}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{translations.perPage}</span>
        <span className="text-sm text-muted-foreground">· {totalLabel}</span>
      </div>
      {totalPages > 1 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            {translations.previous}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          >
            {translations.next}
          </Button>
        </div>
      )}
    </div>
  );
}
