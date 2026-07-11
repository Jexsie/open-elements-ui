"use client";

import { CircleCheck, TriangleAlert } from "lucide-react";
import { Card, CardContent } from "./card.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.tsx";

interface CapabilityStatusProps {
  readonly available: boolean;
  readonly label: string;
  readonly availableText: string;
  readonly unavailableText: string;
  readonly hint?: string;
}

export function CapabilityStatus({
  available,
  label,
  availableText,
  unavailableText,
  hint,
}: CapabilityStatusProps) {
  const statusText = available ? availableText : unavailableText;
  const Icon = available ? CircleCheck : TriangleAlert;

  const row = (
    <div className="flex items-center gap-3">
      <Icon
        className={`h-5 w-5 shrink-0 ${available ? "text-oe-green" : "text-oe-red"}`}
        aria-hidden="true"
      />
      <div className="flex flex-col">
        <span className="text-base font-medium text-oe-dark">{label}</span>
        <span className="text-sm text-oe-gray-mid">{statusText}</span>
      </div>
    </div>
  );

  return (
    <Card className="border-oe-gray-light">
      <CardContent>
        {hint ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                tabIndex={0}
                role="note"
                aria-label={`${label}: ${statusText}. ${hint}`}
                className="cursor-help outline-none"
              >
                {row}
              </div>
            </TooltipTrigger>
            <TooltipContent>{hint}</TooltipContent>
          </Tooltip>
        ) : (
          row
        )}
      </CardContent>
    </Card>
  );
}

export type { CapabilityStatusProps };
