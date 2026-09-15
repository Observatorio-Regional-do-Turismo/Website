export function Header() {
  return <header className="relative bg-slate-900 shadow-xl print:bg-white print:shadow-none print:border-b print:border-slate-200">
    <div className="absolute inset-0 overflow-hidden print:hidden">
      <img
        src="/images/cidades-hero.jpg"
        alt="Pontos turísticos e paisagens do Sul de Minas Gerais"
        className="w-full h-full object-cover object-[center_40%] opacity-85 brightness-105"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-900/45 to-slate-900/20"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
    </div>

    <div className="relative px-4 py-20 md:py-28 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex flex-col gap-1">
              <div className="h-5 w-2 md:h-7 md:w-3 bg-primary rounded-t-full shadow-lg shadow-primary/20"></div>
              <div className="h-5 w-2 md:h-7 md:w-3 bg-accent rounded-b-full shadow-lg shadow-accent/20"></div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white uppercase drop-shadow-lg print:text-slate-900 print:drop-shadow-none">
              Observatório de <span className="text-accent">Turismo</span>
            </h1>
          </div>
          <p className="text-slate-300 text-lg md:text-2xl font-medium ml-5 drop-shadow-sm tracking-wide print:text-slate-600 print:drop-shadow-none">
            do Sul de Minas Gerais • Instituto Federal
          </p>
        </div>
      </div>
    </div>
  </header>
}