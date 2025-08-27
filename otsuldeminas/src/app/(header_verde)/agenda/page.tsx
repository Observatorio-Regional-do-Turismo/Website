
const City = <article
  className="bg-[url('assets/pocos_de_caldas.jpg')] basis-1/3 max-w-[calc(33.333%-1.5rem)] h-[220px] bg-cover bg-center"
>
  <div className="flex justify-center items-center w-full h-full bg-[#d49add97]">
    <p className="font-bold text-white text-2xl">Poços de Caldas</p>
  </div>
</article>

export default function Agenda() {
  return <>
    <h1 className="font-semibold text-7xl mb-8">Agenda de Eventos</h1>
    <h2 className="font-semibold text-6xl">Calendário</h2>
    <section className="flex flex-col gap-4">
      <h2 className="font-semibold text-6xl">Cidades</h2>
      <div className="flex flex-wrap justify-between px-12 gap-x-6 gap-y-4">
        {Array.from({ length: 9 }).map(() => City)}
      </div>
    </section>
  </>
}
