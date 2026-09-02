import { Map, BarChart3, FileText } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative w-full py-24 sm:py-32 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <img src="/images/sul_de_minas_bg.jpg" alt="Turismo no Sul de Minas" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900/90"></div>
        </div>
        <div className="relative z-10 text-center max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-site-surface sm:text-5xl md:text-6xl drop-shadow-md">
            Bem-vindo ao <span className="text-primary">Observatório Suldeminas</span>
          </h1>
          <div className="mx-auto my-4 h-1 w-20 rounded-full bg-accent" aria-hidden="true" />
          <p className="text-xl text-slate-300 leading-relaxed drop-shadow-sm">
            Navegue pelas principais áreas para acessar indicadores de turismo,
            mapas interativos e relatórios detalhados da Região Sul de Minas Gerais.
          </p>
        </div>
      </section>

      {/* Sobre Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-slate-800">Sobre o Observatório</h2>
        <div className="mx-auto my-3 h-1 w-16 rounded-full bg-accent" aria-hidden="true" />
        <div className="space-y-4 text-lg text-slate-600 leading-relaxed text-justify md:text-center">
          <p>
            O Observatório tem como principais objetivos o monitoramento em rede da atividade turística na região, o incentivo à inovação, à inteligência de mercado e o fomento à pesquisa acadêmica em turismo. Isso será feito por meio do levantamento de pesquisas, dados, números e elaboração de indicadores, entre outras ações que visam o desenvolvimento sustentável do setor.
          </p>
          <p>
            O Observatório também conta com o Programa de Capacitação Regional, voltado para a qualificação dos profissionais do turismo, e a criação de um Selo de Qualidade, que reconhecerá as melhores práticas no setor.
          </p>
        </div>
      </div>

      {/* Cards Section */}
      <div className="max-w-7xl mx-auto px-4 pb-16 pt-4 sm:px-6 lg:px-8">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card 1 */}
        <div className="bg-site-surface p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/30 transition-all group">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
            <BarChart3 className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            Visão Geral
          </h2>
          <p className="text-slate-600 mb-6">
            Acesse o dashboard principal com as métricas mais importantes e a evolução do setor.
          </p>
          <Link 
            href="/dashboard"
            className="text-primary font-medium flex items-center gap-2 hover:underline"
          >
            Acessar Dashboard &rarr;
          </Link>
        </div>

        {/* Card 2 */}
        <div className="bg-site-surface p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/30 transition-all group">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
            <Map className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            Mapa Interativo
          </h2>
          <p className="text-slate-600 mb-6">
            Explore a região geograficamente e visualize a distribuição dos estabelecimentos por cidade.
          </p>
          <Link 
            href="#"
            className="text-primary font-medium flex items-center gap-2 hover:underline"
          >
            Explorar Mapa &rarr;
          </Link>
        </div>

        {/* Card 3 */}
        <div className="bg-site-surface p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/30 transition-all group">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            Relatórios
          </h2>
          <p className="text-slate-600 mb-6">
            Baixe estudos detalhados e cruzamento de dados sobre o turismo do Sul de Minas.
          </p>
          <Link 
            href="#"
            className="text-primary font-medium flex items-center gap-2 hover:underline"
          >
            Ver Relatórios &rarr;
          </Link>
        </div>
      </div>
    </div>
    </div>
  );
}
