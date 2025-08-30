import AgendaCalendar from "../AgendaCalendar";

export default function CityAgenda(){
  return <>
    <section className="flex flex-col gap-4">
      <h2 className="font-semibold text-6xl">Calendário</h2>
      <div className="px-12 flex flex-col gap-4">
        <AgendaCalendar />
      </div>
    </section>
  </>
}