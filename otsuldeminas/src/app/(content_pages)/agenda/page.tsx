import CityBlock from "./CityBlock";

export default function Agenda() {
  return <>
    <h1 className="font-semibold text-7xl">Agenda de Eventos</h1>
    <section className="flex flex-col gap-4">
      <h2 className="font-semibold text-6xl">Calendário</h2>
    </section>
    <section className="flex flex-col gap-4">
      <h2 className="font-semibold text-6xl">Cidades</h2>
      <div className="flex flex-wrap justify-between px-12 gap-x-6 gap-y-4">
        {Array.from({ length: 9 }).map(() => <CityBlock />)}
      </div>
    </section>
  </>
}
