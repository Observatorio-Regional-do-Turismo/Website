import { GraduationCap } from "lucide-react";
import { Header } from "@/components/Header";

export default function CursosPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header
        badge="Capacitação Regional"
        title="Cursos & Qualificação"
        subtitle="Formação profissional e capacitações voltadas ao setor turístico."
      />
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <GraduationCap className="h-16 w-16 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-3">Em desenvolvimento</h2>
        <p className="text-base sm:text-lg text-slate-600 max-w-lg">
          Em breve você encontrará todas as capacitações e cursos profissionalizantes voltados ao
          turismo regional.
        </p>
      </div>
    </div>
  );
}
