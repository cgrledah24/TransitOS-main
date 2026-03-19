import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Globe, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function LanguageSelector() {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const options = [
    { value: "en" as const, label: t.english, flag: "🇺🇸" },
    { value: "es" as const, label: t.spanish, flag: "🇲🇽" },
  ];

  const current = options.find((o) => o.value === lang)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-foreground"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{current.flag} {current.label}</span>
        <span className="sm:hidden">{current.flag}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[150px] overflow-hidden rounded-xl border border-white/10 bg-card/90 shadow-xl backdrop-blur-xl">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setLang(opt.value); setOpen(false); }}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/10",
                lang === opt.value ? "text-primary font-semibold" : "text-foreground"
              )}
            >
              <span>{opt.flag}</span>
              <span>{opt.label}</span>
              {lang === opt.value && <Check className="ml-auto h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
