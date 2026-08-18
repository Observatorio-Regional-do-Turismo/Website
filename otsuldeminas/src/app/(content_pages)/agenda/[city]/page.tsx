import { CalendarDays } from "lucide-react";

export default function CityAgendaPage({ params }: { params: { city: string } }) {
  const cityName = decodeURIComponent(params.city);
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-primary/10 p-6 rounded-full mb-6">
        <CalendarDays className="h-16 w-16 text-primary" />
      </div>
      <h1 className="text-4xl font-bold text-slate-800 mb-4 capitalize">Agenda: {cityName}</h1>
      <p className="text-lg text-slate-600 max-w-lg">
        Esta funcionalidade está sendo desenvolvida. Em breve você terá acesso a um calendário detalhado com todos os eventos turísticos específicos desta cidade.
      </p>
    </div>
  );
}