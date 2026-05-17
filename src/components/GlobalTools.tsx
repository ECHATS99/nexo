
import { useState, useEffect } from "react";
import { Globe, Moon, Sun, RefreshCw } from "lucide-react";
import { cn } from "../lib/utils.ts";

export const languages = [
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "ar", name: "العربية", flag: "🇦🇪" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
  { code: "ln", name: "Lingala", flag: "🇨🇩" },
];

export function GlobalTools({ onRefresh }: { onRefresh?: () => void }) {
  const [theme, setTheme] = useState(localStorage.getItem("nexo-theme") || "dark");
  const [lang, setLang] = useState(localStorage.getItem("nexo-lang") || "fr");
  const [showLang, setShowLang] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("nexo-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const changeLang = (code: string) => {
    setLang(code);
    localStorage.setItem("nexo-lang", code);
    setShowLang(false);
    // On language change we must reload to apply translations if used, 
    // but for simple theme/refresh we dont need it
    window.location.reload(); 
  };

  return (
    <div className="flex items-center gap-2">
      {onRefresh && (
        <button 
          onClick={handleRefresh}
          className={cn(
            "p-2 bg-white/5 dark:bg-white/5 bg-gray-100 rounded-xl text-gray-500 dark:text-white/60 hover:text-brand hover:bg-gray-200 dark:hover:bg-white/10 transition-all",
            isRefreshing && "animate-spin text-brand"
          )}
        >
          <RefreshCw size={18} />
        </button>
      )}
      
      <button 
        onClick={toggleTheme}
        className="p-2 bg-white/5 dark:bg-white/5 bg-gray-100 rounded-xl text-gray-500 dark:text-white/60 hover:text-brand hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="relative">
        <button 
          onClick={() => setShowLang(!showLang)}
          className="flex items-center gap-1.5 p-2 bg-white/5 dark:bg-white/5 bg-gray-100 rounded-xl text-gray-500 dark:text-white/60 hover:text-brand hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
        >
          <Globe size={18} />
          <span className="text-[10px] font-black uppercase tracking-tight">{lang}</span>
        </button>

        {showLang && (
          <div className="absolute right-0 mt-2 w-48 max-h-64 overflow-y-auto bg-bg/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 z-[100] shadow-2xl flex flex-col gap-1 scrollbar-hide animate-fade-in">
            {languages.map((l) => (
              <button 
                key={l.code}
                onClick={() => changeLang(l.code)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                  lang === l.code ? "bg-brand text-white" : "text-white/60 hover:bg-white/5"
                )}
              >
                <span>{l.flag}</span>
                <span>{l.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
