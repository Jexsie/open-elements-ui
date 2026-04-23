"use client";

import { cn } from "../lib/utils";
import { useLanguage } from "../i18n/language-context";

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => setLanguage("de")}
        className={cn(
          "transition-colors",
          language === "de"
            ? "text-oe-green font-bold"
            : "text-oe-white/70 hover:text-oe-white cursor-pointer",
        )}
      >
        DE
      </button>
      <span className="text-oe-white/30">|</span>
      <button
        onClick={() => setLanguage("en")}
        className={cn(
          "transition-colors",
          language === "en"
            ? "text-oe-green font-bold"
            : "text-oe-white/70 hover:text-oe-white cursor-pointer",
        )}
      >
        EN
      </button>
    </div>
  );
}
