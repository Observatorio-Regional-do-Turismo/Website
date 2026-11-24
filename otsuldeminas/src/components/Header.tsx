import type { ReactNode } from "react";

interface HeaderProps {
  title?: ReactNode;
  subtitle?: string;
  badge?: string;
}

const DEFAULT_HERO_IMAGE = "/images/hero-padrao.jpg";

export function Header({
  title,
  subtitle = "Instituto Federal — Campus Poços de Caldas",
  badge,
}: HeaderProps = {}) {
  return (
    <header className="relative bg-slate-900 shadow-xl print:bg-white print:shadow-none print:border-b print:border-slate-200">
      <div className="absolute inset-0 overflow-hidden print:hidden">
        <img
          src={DEFAULT_HERO_IMAGE}
          alt="Observatório Regional do Turismo"
          className="w-full h-full object-cover object-[center_65%] opacity-80 brightness-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/55 to-slate-900/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
      </div>

      <div className="relative px-4 sm:px-6 lg:px-8 py-16 md:py-24 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          {badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 border border-white/15">
              {badge}
            </div>
          )}
          <div className="flex items-center gap-3.5 mb-3">
            <div className="flex flex-col gap-1 shrink-0" aria-hidden="true">
              <div className="h-5 w-2 md:h-7 md:w-3 bg-primary rounded-t-full shadow-lg shadow-primary/20" />
              <div className="h-5 w-2 md:h-7 md:w-3 bg-accent rounded-b-full shadow-lg shadow-accent/20" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white uppercase drop-shadow-lg print:text-slate-900 print:drop-shadow-none">
              {title || (
                <>
                  Observatório Regional do <span className="text-[#359830]">Turismo</span>
                </>
              )}
            </h1>
          </div>
          {subtitle && (
            <p className="text-slate-200 text-base sm:text-lg md:text-xl font-medium ml-5 drop-shadow-sm tracking-wide print:text-slate-600 print:drop-shadow-none max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
