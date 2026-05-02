"use client";

import type { MouseEvent, ReactNode } from "react";
import { cn } from "../lib/utils.ts";
import { Button } from "./button.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.tsx";

type Tone = "default" | "destructive";

type CommonProps = {
  readonly tooltip: string;
  readonly tone?: Tone;
};

type AsButtonProps = CommonProps & {
  readonly icon: ReactNode;
  readonly onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly disabled?: boolean;
  readonly asChild?: never;
  readonly children?: never;
};

type AsChildProps = CommonProps & {
  readonly asChild: true;
  readonly children: ReactNode;
  readonly icon?: never;
  readonly onClick?: never;
  readonly disabled?: never;
};

export type TooltipIconButtonProps = AsButtonProps | AsChildProps;

const TONE_CLASS: Record<Tone, string> = {
  default: "[&_svg]:text-primary",
  destructive: "[&_svg]:text-destructive",
};

export function TooltipIconButton(props: TooltipIconButtonProps) {
  const { tooltip, tone = "default" } = props;
  const className = cn("[&_svg]:h-4 [&_svg]:w-4", TONE_CLASS[tone]);

  let trigger: ReactNode;
  if ("asChild" in props && props.asChild) {
    trigger = (
      <Button
        asChild
        variant="ghost"
        size="icon"
        className={className}
        aria-label={tooltip}
        onClick={(event) => event.stopPropagation()}
      >
        {props.children}
      </Button>
    );
  } else {
    const button = (
      <Button
        variant="ghost"
        size="icon"
        className={className}
        aria-label={tooltip}
        disabled={props.disabled}
        onClick={(event) => {
          event.stopPropagation();
          props.onClick(event);
        }}
      >
        {props.icon}
      </Button>
    );
    // Disabled buttons swallow pointer events, so the Tooltip stops working
    // unless the trigger is wrapped in a span.
    trigger = props.disabled ? <span>{button}</span> : button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
