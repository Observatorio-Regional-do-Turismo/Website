import { CalendarDays } from "lucide-react";
import { Header } from "@/components/Header";

export default async function CityAgendaPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const cityName = decodeURIComponent(city);

  return (
    <div className="flex flex-col flex-1">
      <Header
        badge="Agenda Municipal"
        title={`Agenda: ${cityName}`}
        subtitle="Programação de eventos turísticos e culturais do município."
      />
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <CalendarDays className="h-16 w-16 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-3 capitalize">
          Calendário em preparação
        </h2>
        <p className="text-base sm:text-lg text-slate-600 max-w-lg">
          Em breve você terá acesso a um calendário detalhado com todos os eventos turísticos
          específicos desta cidade.
        </p>
      </div>
    </div>
  );
}
