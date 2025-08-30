import AgendaCalendar from "./AgendaCalendar";
import AgendaFilter from "./AgendaFilter";

export default function Agenda() {
  return <>
    <section className="flex flex-col gap-4">
      <h2 className="font-semibold text-6xl">Calendário</h2>
      <div className="px-12 flex flex-col gap-4">
        <AgendaFilter />
        <AgendaCalendar />
      </div>
    </section>
  </>
}
