"use client";

import type { MouseEvent, ReactNode } from "react";
import { cn } from "../lib/utils.ts";

type Tone = "default" | "success";

type ActionIconButtonProps = {
  readonly onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly children: ReactNode;
  readonly title?: string;
  readonly tone?: Tone;
};

const TONE_CLASS: Record<Tone, string> = {
  default: "text-muted-foreground hover:text-foreground [@media(pointer:coarse)]:text-foreground",
  success: "text-primary",
};

export function ActionIconButton({
  onClick,
  children,
  title,
  tone = "default",
}: ActionIconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(event) => {
        event.stopPropagation();
        onClick(event);
      }}
      className={cn("transition-colors [&_svg]:h-3.5 [&_svg]:w-3.5", TONE_CLASS[tone])}
    >
      {children}
    </button>
  );
}
