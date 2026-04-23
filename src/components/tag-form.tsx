"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import type { TagDto } from "../types";

const PALETTE_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#EAB308",
  "#84CC16", "#22C55E", "#14B8A6", "#06B6D4",
  "#3B82F6", "#6366F1", "#A855F7", "#EC4899",
];

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1A1A1A" : "#FFFFFF";
}

interface TagFormTranslations {
  readonly title: string;
  readonly name: string;
  readonly nameRequired: string;
  readonly namePlaceholder: string;
  readonly nameConflict: string;
  readonly description: string;
  readonly descriptionPlaceholder: string;
  readonly color: string;
  readonly colorRequired: string;
  readonly colorInvalid: string;
  readonly colorPlaceholder: string;
  readonly save: string;
  readonly cancel: string;
}

interface TagFormProps {
  readonly tag?: TagDto;
  readonly onSave: (data: { name: string; description: string | null; color: string }) => Promise<void>;
  readonly onCancel: () => void;
  readonly translations: TagFormTranslations;
}

export function TagForm({ tag, onSave, onCancel, translations: t }: TagFormProps) {
  const [name, setName] = useState(tag?.name ?? "");
  const [description, setDescription] = useState(tag?.description ?? "");
  const [color, setColor] = useState(tag?.color ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; color?: string }>({});

  function validate(): boolean {
    const newErrors: { name?: string; color?: string } = {};
    if (!name.trim()) {
      newErrors.name = t.nameRequired;
    }
    if (!color.trim()) {
      newErrors.color = t.colorRequired;
    } else if (!HEX_REGEX.test(color)) {
      newErrors.color = t.colorInvalid;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() || null, color });
    } catch (err) {
      if (err instanceof Error && err.message === "CONFLICT") {
        setErrors({ name: t.nameConflict });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-heading text-2xl font-bold text-oe-dark">
        {t.title}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t.name} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: undefined })); }}
                placeholder={t.namePlaceholder}
              />
              {errors.name && <p className="text-sm text-oe-red">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t.description}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.descriptionPlaceholder}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{t.color} *</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PALETTE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all",
                      color.toUpperCase() === c.toUpperCase()
                        ? "border-oe-dark scale-110"
                        : "border-transparent hover:border-oe-gray-light",
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => { setColor(c); setErrors((prev) => ({ ...prev, color: undefined })); }}
                  >
                    {color.toUpperCase() === c.toUpperCase() && (
                      <Check className="h-4 w-4" style={{ color: getContrastColor(c) }} />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Input
                  id="color"
                  value={color}
                  onChange={(e) => { setColor(e.target.value); setErrors((prev) => ({ ...prev, color: undefined })); }}
                  placeholder={t.colorPlaceholder}
                  className="max-w-40"
                />
                {HEX_REGEX.test(color) && (
                  <span
                    className="inline-block h-8 w-8 rounded-full border border-oe-gray-light"
                    style={{ backgroundColor: color }}
                  />
                )}
              </div>
              {errors.color && <p className="text-sm text-oe-red">{errors.color}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-oe-green hover:bg-oe-green/90 text-white"
              >
                {t.save}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                {t.cancel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export type { TagFormProps, TagFormTranslations };
