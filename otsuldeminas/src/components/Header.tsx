interface HeaderProps {
  imageSrc?: string;
  imageAlt?: string;
  title?: React.ReactNode;
  subtitle?: string;
  badge?: string;
  imagePosition?: string;
}

export function Header({
  imageSrc = "/images/cidades-hero.jpg",
  imageAlt = "Pontos turísticos e paisagens do Sul de Minas Gerais",
  title,
  subtitle = "do Sul de Minas Gerais • Instituto Federal",
  badge,
  imagePosition = "object-[center_40%]",
}: HeaderProps = {}) {
  return (
    <header className="relative bg-slate-900 shadow-xl print:bg-white print:shadow-none print:border-b print:border-slate-200">
      <div className="absolute inset-0 overflow-hidden print:hidden">
        <img
          src={imageSrc}
          alt={imageAlt}
          className={`w-full h-full object-cover ${imagePosition} opacity-85 brightness-105`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-900/45 to-slate-900/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
      </div>

      <div className="relative px-4 py-20 md:py-28 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-4xl">
            {badge && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
                {badge}
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex flex-col gap-1">
                <div className="h-5 w-2 md:h-7 md:w-3 bg-primary rounded-t-full shadow-lg shadow-primary/20"></div>
                <div className="h-5 w-2 md:h-7 md:w-3 bg-accent rounded-b-full shadow-lg shadow-accent/20"></div>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white uppercase drop-shadow-lg print:text-slate-900 print:drop-shadow-none">
                {title || (
                  <>
                    Observatório de <span className="text-accent">Turismo</span>
                  </>
                )}
              </h1>
            </div>
            {subtitle && (
              <p className="text-slate-300 text-lg md:text-2xl font-medium ml-5 drop-shadow-sm tracking-wide print:text-slate-600 print:drop-shadow-none">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}