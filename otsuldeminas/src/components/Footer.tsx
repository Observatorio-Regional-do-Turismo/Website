

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="p-4 flex-shrink-0">
              {/* Logo em versão negativa (branca) devido ao fundo escuro, com área de respiro respeitada */}
              <img 
                src="/images/if-logo.svg" 
                alt="Logo do Instituto Federal" 
                className="h-16 w-auto md:h-20 object-contain brightness-0 invert opacity-90"
              />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-sm font-semibold text-slate-50 uppercase tracking-wider mb-1">
                Apoio e Realização
              </h3>
              <p className="text-base font-bold text-primary">
                Instituto Federal do Sul de Minas Gerais
              </p>
              <p className="text-sm text-slate-300 mt-0.5">
                Campus Poços de Caldas
              </p>
            </div>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-sm text-slate-300">
              &copy; {new Date().getFullYear()} Observatório de Turismo.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}