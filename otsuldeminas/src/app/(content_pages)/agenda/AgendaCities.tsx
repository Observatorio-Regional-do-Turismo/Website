import Link from "next/link"

export default function AgendaCities(){
  return <section className="flex flex-col gap-4">
    <h2 className="font-semibold text-6xl">Cidades da Região</h2>
    <div className="flex flex-wrap justify-between px-12 gap-x-6 gap-y-4">
      {Array.from({ length: 9 }).map((_, idx) => <AgendaCityContainer key={idx} />)}
    </div>
  </section>
}

function AgendaCityContainer(){
  return <Link
    href={"/agenda/pocos_de_caldas"}
    className="cursor-pointer bg-[url('assets/pocos_de_caldas.jpg')] basis-1/3 max-w-[calc(33.333%-1.5rem)] h-[220px] bg-cover bg-center"
  >
  <div className="flex justify-center items-center w-full h-full bg-highlight/45">
    <p className="font-bold text-background text-2xl">Poços de Caldas</p>
  </div>
</Link>
}