"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface HealthStatusTranslations {
  readonly title: string;
  readonly statusUp: string;
  readonly statusDown: string;
}

interface HealthStatusProps {
  readonly healthy: boolean;
  readonly translations: HealthStatusTranslations;
}

export function HealthStatus({ healthy, translations }: HealthStatusProps) {
  const statusText = healthy ? translations.statusUp : translations.statusDown;

  return (
    <Card className="border-oe-gray-light">
      <CardHeader>
        <CardTitle className="font-heading text-lg text-oe-dark">{translations.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <span
            className={`inline-block h-4 w-4 rounded-full ${healthy ? "bg-oe-green" : "bg-oe-red"}`}
            aria-label={statusText}
          />
          <span className="text-base font-medium">{statusText}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export type { HealthStatusProps, HealthStatusTranslations };
